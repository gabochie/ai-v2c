/**
 * Hermes gateway client.
 *
 * Talks to the local Hermes agent gateway over its OpenAI-compatible endpoint
 * (`/v1/chat/completions` on port 8642). The gateway runs agent tool-use in a
 * controlled terminal backend backed by the local Ollama model.
 */

export interface HermesMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface HermesRunResult {
  text: string;
  providerUsed: "hermes";
  modelUsed: string;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
}

const DEFAULT_URL = "http://127.0.0.1:8642";
const DEFAULT_MODEL = "qwen2.5-coder:1.5b";

export class HermesClient {
  private static get baseUrl(): string {
    return (process.env.HERMES_GATEWAY_URL || DEFAULT_URL).replace(/\/+$/, "");
  }

  private static get token(): string | undefined {
    return process.env.HERMES_API_KEY || undefined;
  }

  /** True when the Hermes API server URL AND key are configured. */
  public static isConfigured(): boolean {
    return Boolean(process.env.HERMES_GATEWAY_URL && process.env.HERMES_API_KEY);
  }

  /**
   * Run a chat/completion through the Hermes agent gateway.
   */
  public static async chat(messages: HermesMessage[], temperature = 0.7, timeoutMs = 60000): Promise<HermesRunResult> {
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
          model: process.env.HERMES_MODEL || DEFAULT_MODEL,
          messages,
          temperature,
        }),
      });
      clearTimeout(timer);

      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        throw new Error(`Hermes HTTP ${res.status}: ${bodyText.slice(0, 300)}`);
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      const usage = data.usage || {};
      return {
        text,
        providerUsed: "hermes",
        modelUsed: data.model || process.env.HERMES_MODEL || DEFAULT_MODEL,
        usage: {
          promptTokens: usage.prompt_tokens,
          completionTokens: usage.completion_tokens,
          totalTokens: usage.total_tokens,
        },
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new Error(`Hermes timed out after ${timeoutMs}ms`);
      }
      throw new Error(`Hermes unreachable (${err.message})`);
    }
  }
}
