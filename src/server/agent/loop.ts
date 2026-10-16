import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";

const execFileAsync = promisify(execFile);

export interface AgentToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface AgentStep {
  turn: number;
  role: "assistant" | "tool";
  content?: string;
  toolCalls?: AgentToolCall[];
  toolName?: string;
  toolResult?: string;
}

export interface AgentResult {
  goal: string;
  workspace: string;
  model: string;
  status: "complete" | "max_iterations" | "error";
  steps: AgentStep[];
  finalAnswer?: string;
  error?: string;
  durationMs: number;
}

export interface AgentRunOptions {
  goal: string;
  workspace?: string;
  model?: string;
  systemPrompt?: string;
  maxIterations?: number;
  temperature?: number;
  /** 'ollama' (local, default) or 'gemini' (cloud, uses GEMINI_API_KEY). */
  provider?: "ollama" | "gemini";
}

const DEFAULT_ALLOWLIST = [
  "python", "python3", "pip", "pip3", "pytest", "node", "npx", "npm", "bun",
  "git", "tsc", "php", "composer", "wp",
  "rg", "grep", "find", "cat", "type", "ls", "dir", "pwd", "echo", "mkdir",
  "touch", "head", "tail", "wc", "sed", "awk", "tree", "du", "file", "unzip",
];

const BLOCKED_STRINGS = [
  "rm -rf /", "rm -rf c:", "del /f", "rd /s", "format ", "mkfs", "dd if=",
  "shutdown", "reg delete", "net user", "Remove-Item", "rd -recurse",
];

const TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "run_command",
      description:
        "Run a CLI command inside the agent workspace directory. Use for running tests, builds, git, pip, and inspecting the project. Shell metacharacters are NOT interpreted (safe exec), so prefer explicit subcommands over pipes. Commands are allowlisted; if a command is rejected, adapt your approach.",
      parameters: {
        type: "object",
        properties: {
          command: { type: "string", description: "The command and its arguments, space separated." },
        },
        required: ["command"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the full text content of a file inside the agent workspace.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path relative to the workspace root, e.g. 'src/server.py'." },
        },
        required: ["path"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Create or overwrite a file inside the agent workspace with the given content.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Path relative to the workspace root, e.g. 'src/server.py'." },
          content: { type: "string", description: "Full file content to write." },
        },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "List files and directories inside the agent workspace (optionally a subdirectory).",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string", description: "Subdirectory path relative to the workspace root. Defaults to the workspace root." },
        },
        required: [],
      },
    },
  },
];

export class AgentLoop {
  private static ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
  private static defaultModel = process.env.OLLAMA_AGENT_MODEL || "qwen2.5:3b";

  private static allowlist(): string[] {
    const custom = process.env.FORGE_AGENT_ALLOWLIST;
    return custom ? custom.split(",").map((s) => s.trim()).filter(Boolean) : DEFAULT_ALLOWLIST;
  }

  private static resolveSafePath(workspace: string, target: string): string {
    const root = path.resolve(workspace);
    const resolved = path.resolve(root, target);
    const relative = path.relative(root, resolved);
    const escaped = relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
    if (escaped) {
      throw new Error(`Security Violation: Path '${target}' escapes workspace boundary.`);
    }
    let probe = resolved;
    while (!fs.existsSync(probe)) {
      const parent = path.dirname(probe);
      if (parent === probe) break;
      probe = parent;
    }
    if (fs.existsSync(probe)) {
      const probeReal = fs.realpathSync(probe);
      const relReal = path.relative(root, probeReal);
      const realEscaped = relReal === ".." || relReal.startsWith(`..${path.sep}`) || path.isAbsolute(relReal);
      if (realEscaped) {
        throw new Error(`Security Violation: Path '${target}' resolves outside workspace boundary via symlink.`);
      }
    }
    return resolved;
  }

  private static tokenizeCommand(cmd: string): string[] {
    const tokens: string[] = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(cmd)) !== null) {
      tokens.push(m[1] ?? m[2] ?? m[3]);
    }
    return tokens;
  }

  private static async executeTool(workspace: string, call: AgentToolCall): Promise<string> {
    try {
      const args = JSON.parse(call.arguments || "{}");
      switch (call.name) {
        case "run_command": {
          const command = String(args.command || "");
          const base = command.trim().split(/\s+/)[0];
          if (!this.allowlist().includes(base)) {
            return `ERROR: Command '${base}' is not in the agent allowlist.`;
          }
          const lowered = command.toLowerCase();
          if (BLOCKED_STRINGS.some((b) => lowered.includes(b))) {
            return `ERROR: Command rejected by safety blocklist.`;
          }
          const tokens = this.tokenizeCommand(command);
          const cwd = path.resolve(workspace);
          try {
            const { stdout, stderr } = await execFileAsync(tokens[0], tokens.slice(1), {
              cwd,
              timeout: 120000,
              maxBuffer: 8 * 1024 * 1024,
            });
            return (stdout || stderr || "(no output)").slice(0, 60000);
          } catch (err: any) {
            return `EXIT ${err.code ?? 1}:\n${(err.stdout || "")}\n${(err.stderr || err.message || "").slice(0, 30000)}`;
          }
        }
        case "read_file": {
          const p = String(args.path || "");
          const safe = this.resolveSafePath(workspace, p);
          if (!fs.existsSync(safe)) return `ERROR: File '${p}' not found.`;
          return fs.readFileSync(safe, "utf-8").slice(0, 60000);
        }
        case "write_file": {
          const p = String(args.path || "");
          const content = String(args.content ?? "");
          const safe = this.resolveSafePath(workspace, p);
          fs.mkdirSync(path.dirname(safe), { recursive: true });
          fs.writeFileSync(safe, content, "utf-8");
          return `OK: wrote ${fs.statSync(safe).size} bytes to ${p}`;
        }
        case "list_dir": {
          const p = String(args.path || "");
          const safe = this.resolveSafePath(workspace, p);
          if (!fs.existsSync(safe)) return `ERROR: '${p}' not found.`;
          const items = fs.readdirSync(safe, { withFileTypes: true });
          const lines = items
            .filter((i) => !i.name.startsWith("."))
            .map((i) => `${i.isDirectory() ? "[dir]" : "[file]"} ${i.name}`)
            .join("\n");
          return lines || "(empty directory)";
        }
        default:
          return `ERROR: Unknown tool '${call.name}'.`;
      }
    } catch (err: any) {
      return `ERROR: ${err.message}`;
    }
  }

  public static async run(opts: AgentRunOptions): Promise<AgentResult> {
    const started = Date.now();
    const workspace = path.resolve(opts.workspace || process.env.FORGE_AGENT_WORKSPACE || path.join(process.cwd(), "workspace"));
    if (!fs.existsSync(workspace)) {
      fs.mkdirSync(workspace, { recursive: true });
    }

    const providerRaw = opts.provider || process.env.FORGE_AGENT_PROVIDER || "ollama";
    const provider: "ollama" | "gemini" = providerRaw === "gemini" ? "gemini" : "ollama";
    const model = opts.model || (provider === "gemini" ? (process.env.FORGE_AGENT_GEMINI_MODEL || "gemini-3.5-flash") : this.defaultModel);    const maxIterations = opts.maxIterations ?? 30;
    const systemPrompt =
      opts.systemPrompt ||
      `You are a production-grade software engineering agent working autonomously inside the workspace at '${workspace}'.
You have tools to run commands, list directories, and read/write files.
Work step by step: explore the project, run tests to understand current state, implement changes, then verify by running the project's test suite.
When the requested goal is complete and verified, reply with a concise final summary of what you did and the verification results. Do not ask the user for permission mid-task; decide and act.`;

    const messages: Array<any> = [
      { role: "system", content: systemPrompt },
      { role: "user", content: opts.goal },
    ];
    const steps: AgentStep[] = [];
    let turn = 0;

    try {
      let response = await this.complete(provider, messages, undefined, model, opts.temperature ?? 0.3, systemPrompt);

      while (true) {
        const msg = response.message;
        const content = msg?.content ?? "";
        const toolCalls: AgentToolCall[] = Array.isArray(msg?.tool_calls) ? msg.tool_calls.map((tc: any) => ({
          id: tc.id || `call_${turn}_${Math.random().toString(36).slice(2, 8)}`,
          name: tc.function?.name || "",
          arguments: tc.function?.arguments || "{}",
        })) : [];

        steps.push({ turn, role: "assistant", content, toolCalls: toolCalls.length ? toolCalls : undefined });

        const hasTools = toolCalls.length > 0;
        if (!hasTools) {
          return {
            goal: opts.goal,
            workspace,
            model,
            status: "complete",
            steps,
            finalAnswer: content,
            durationMs: Date.now() - started,
          };
        }

        messages.push({ role: "assistant", content, tool_calls: msg.tool_calls, _geminiParts: msg._geminiParts });
        for (const call of toolCalls) {
          logger.info(`[Agent] turn ${turn} invoking ${call.name}`, { args: call.arguments });
          const result = await this.executeTool(workspace, call);
          steps.push({ turn, role: "tool", toolName: call.name, toolResult: result.slice(0, 4000) });
          messages.push({ role: "tool", tool_call_id: call.id, name: call.name, content: result.slice(0, 50000) });
        }

        turn += 1;
        if (turn >= maxIterations) {
          return {
            goal: opts.goal,
            workspace,
            model,
            status: "max_iterations",
            steps,
            finalAnswer: `Reached max iterations (${maxIterations}) without producing a final answer.`,
            durationMs: Date.now() - started,
          };
        }

        response = await this.complete(provider, messages, undefined, model, opts.temperature ?? 0.3, systemPrompt);
      }
    } catch (err: any) {
      return {
        goal: opts.goal,
        workspace,
        model,
        status: "error",
        steps,
        error: err.message,
        durationMs: Date.now() - started,
      };
    }
  }

  private static async complete(
    provider: "ollama" | "gemini",
    history: Array<any>,
    seed: Array<any> | undefined,
    model: string,
    temperature: number,
    systemPrompt: string,
  ): Promise<any> {
    return provider === "gemini" ? this.completeGemini(history, seed, model, temperature, systemPrompt) : this.completeOllama(history, seed, model, temperature);
  }

  private static async completeOllama(
    history: Array<any>,
    seed: Array<any> | undefined,
    model: string,
    temperature: number,
  ): Promise<any> {
    const url = `${this.ollamaHost}/v1/chat/completions`;
    const messages = seed ? seed : history;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages,
          temperature,
          stream: false,
          tools: TOOL_DEFINITIONS,
        }),
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Ollama HTTP ${res.status}: ${text.slice(0, 500)}`);
      }
      const data = await res.json();
      return data.choices?.[0] ?? { message: {} };
    } catch (err: any) {
      clearTimeout(timeout);
      throw err;
    }
  }

  private static geminiTools() {
    return [{
      functionDeclarations: TOOL_DEFINITIONS.map((t: any) => ({
        name: t.function.name,
        description: t.function.description,
        parameters: t.function.parameters,
      })),
    }];
  }

  private static toGeminiContents(history: Array<any>): Array<any> {
    const contents: Array<any> = [];
    for (const m of history) {
      if (m.role === "system") continue;
      if (m.role === "assistant") {
        if (m._geminiParts && m._geminiParts.length) {
          // Echo the model's raw parts verbatim so thought_signature is preserved.
          contents.push({ role: "model", parts: m._geminiParts });
        } else if (m.tool_calls && m.tool_calls.length) {
          const parts: Array<any> = [];
          if (m.content) parts.push({ text: m.content });
          for (const tc of m.tool_calls) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(tc.function?.arguments || "{}"); } catch { args = {}; }
            parts.push({ functionCall: { name: tc.function?.name || "", args } });
          }
          contents.push({ role: "model", parts });
        } else {
          contents.push({ role: "model", parts: [{ text: m.content || "" }] });
        }
      } else if (m.role === "tool") {
        contents.push({
          role: "user",
          parts: [{ functionResponse: { name: m.name, response: { result: m.content } } }],
        });
      } else {
        contents.push({ role: "user", parts: [{ text: m.content }] });
      }
    }
    return contents;
  }

  private static async completeGemini(
    history: Array<any>,
    seed: Array<any> | undefined,
    model: string,
    _temperature: number,
    systemPrompt: string,
  ): Promise<any> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured (required for provider 'gemini').");
    }
    const ai = new GoogleGenAI({ apiKey });
    const messages = seed ? seed : history;
    const contents = this.toGeminiContents(messages);

    const modelChain = (process.env.FORGE_AGENT_GEMINI_MODELS || "gemini-3.5-flash,gemini-3.6-flash,gemini-3.1-flash-lite")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const primaryIndex = Math.max(0, modelChain.indexOf(model));
    const orderedModels = modelChain.slice(primaryIndex).concat(modelChain.slice(0, primaryIndex));

    let lastErr: any = null;
    for (const candidateModel of orderedModels) {
      for (let attempt = 1; attempt <= 3; attempt += 1) {
        try {
          const requestPromise = ai.models.generateContent({
            model: candidateModel,
            contents,
            config: {
              systemInstruction: systemPrompt,
              tools: this.geminiTools(),
            },
          });

          const timeoutPromise = new Promise<never>((_resolve, reject) => {
            setTimeout(() => reject(new Error("Gemini request timed out after 600s")), 600000);
          });

          const response = await Promise.race([requestPromise, timeoutPromise]);

          const candidate = response.candidates?.[0];
          const parts = candidate?.content?.parts ?? [];
          const content = parts.filter((p: any) => p.text).map((p: any) => p.text).join("") || "";
          const toolCalls = parts
            .filter((p: any) => p.functionCall)
            .map((p: any) => ({
              id: p.functionCall.id || `call_${Math.random().toString(36).slice(2, 8)}`,
              function: { name: p.functionCall.name || "", arguments: JSON.stringify(p.functionCall.args || {}) },
            }));

          return { message: { content, tool_calls: toolCalls, _geminiParts: parts } };
        } catch (err: any) {
          lastErr = err;
          const raw = err?.message || "";
          const isQuota = raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED") || raw.includes("quota");
          const isTransient = raw.includes("503") || raw.includes("UNAVAILABLE") || raw.includes("500");
          if (!isQuota && !isTransient) {
            throw err;
          }
          const retryMatch = raw.match(/retry in ([\d.]+)s/i) || raw.match(/retryDelay":\s*"(\d+)s"/i);
          const suggestedMs = retryMatch ? Math.ceil(parseFloat(retryMatch[1] || retryMatch[2] || "10") * 1000) : 0;
          const delayMs = suggestedMs || Math.min(8000 * attempt, 30000);
          logger.warn(`[Agent] Gemini ${isQuota ? "quota" : "transient error"} on '${candidateModel}' (attempt ${attempt}), retrying in ${delayMs}ms`);
          await new Promise((r) => setTimeout(r, delayMs));
        }
      }
      logger.warn(`[Agent] Gemini quota exhausted on '${candidateModel}', trying next model in chain`);
    }
    throw lastErr || new Error("Gemini request failed after retries.");
  }
}
