/**
 * OpenClaw gateway client.
 *
 * Talks to a local OpenClaw gateway over its OpenAI-compatible endpoint
 * (`/v1/chat/completions`). The gateway forwards to a hosted/ or local model
 * (e.g. Ollama) and runs the request inside an ephemeral sandboxed agent,
 * so command execution that the agent performs is network-isolated and
 * runs in a container with all capabilities dropped.
 */

export interface OpenClawMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenClawRunResult {
  text: string;
  providerUsed: "openclaw";
  modelUsed: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

const DEFAULT_URL = "http://127.0.0.1:18789";
const MODEL_SELECTOR = process.env.OPENCLAW_MODEL || "openclaw";

export class OpenClawClient {
  private static get baseUrl(): string {
    return (process.env.OPENCLAW_GATEWAY_URL || DEFAULT_URL).replace(/\/+$/, "");
  }

  private static get token(): string | undefined {
    return process.env.OPENCLAW_GATEWAY_TOKEN || undefined;
  }

  /** True when a gateway URL AND token are configured. */
  public static isConfigured(): boolean {
    return Boolean(process.env.OPENCLAW_GATEWAY_URL && process.env.OPENCLAW_GATEWAY_TOKEN);
  }

  /**
   * Run a chat/completion through the OpenClaw agent.
   */
  public static async chat(messages: OpenClawMessage[], temperature = 0.7, timeoutMs = 180000): Promise<OpenClawRunResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: MODEL_SELECTOR,
          messages,
          temperature,
        }),
      });
      clearTimeout(timer);

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(`OpenClaw HTTP ${res.status}: ${bodyText.slice(0, 300)}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      const usage = data.usage || {};
      return {
        text,
        providerUsed: "openclaw",
        modelUsed: data.model || MODEL_SELECTOR,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error(`OpenClaw timed out after ${timeoutMs}ms`);
      }
      throw new Error(`OpenClaw unreachable (${err.message})`);
    }
  }

  /**
   * Run a shell command inside the OpenClaw sandboxed agent.
   *
   * Because exec-over-HTTP is not exposed in older gateway builds, this drives
   * the agent to execute the command and return strictly the raw stdout.
   * On failure an error result is returned rather than throwing.
   */
  static async runSandboxedCommand(command: string, timeoutMs = 180000): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const messages: OpenClawMessage[] = [
      {
        role: "system",
        content:
          "You are a sandboxed command executor. Run the requested shell command, then reply with ONLY the raw stdout of the command, unmodified. If the command fails, reply with a single line starting `EXIT_CODE=<n>` followed by the raw stderr.",
      },
      { role: "user", content: command },
    ];
    try {
      const result = await this.chat(messages, 0.2, timeoutMs);
      const text = result.text.trim();
      const failedMatch = text.match(/^EXIT_CODE=(\d+)/i);
      if (failedMatch) {
        return {
          stdout: "",
          stderr: text.replace(/^EXIT_CODE=\d+\s*/i, "").trim(),
          exitCode: Number(failedMatch[1]) || 1,
        };
      }
      return { stdout: text, stderr: "", exitCode: 0 };
    } catch (err: any) {
      return { stdout: "", stderr: err.message || "Sandboxed execution failed", exitCode: 1 };
    }
  }
}