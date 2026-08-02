import { AIProviderRequest, AIProviderResponse, AIProviderService } from "./provider";
import { SecretManagerService } from "../utils/secretManager";
import { OpenClawClient } from "../openclaw/client";

export class AIRouter {
  private static readonly MODEL_CODER = process.env.OLLAMA_MODEL_CODER || "qwen2.5-coder:7b";
  private static readonly MODEL_GENERAL = process.env.OLLAMA_MODEL_GENERAL || "llama3.2:latest";

  /**
   * Intelligently routes chat requests based on taskType and fallback chain
   */
  public static async routeAndExecute(req: AIProviderRequest): Promise<AIProviderResponse> {
    const taskType = req.taskType || "general";

    // 1. OpenClaw sandboxed agent hub (highest priority when configured)
    if (OpenClawClient.isConfigured()) {
      try {
        const openclaw = await AIProviderService.callOpenClaw(req);
        openclaw.providerUsed = "openclaw";
        return openclaw;
      } catch (openclawErr: any) {
        console.warn(`[AI Router] OpenClaw unavailable, falling back: ${openclawErr.message}`);
      }
    }

    // 2. Determine Preferred Provider Strategy
    const prefersLocal = ["wordpress_plugin", "php", "javascript"].includes(taskType);

    // If local model preferred, try Ollama first
    if (prefersLocal) {
      try {
        const localModel = taskType === "php" || taskType === "wordpress_plugin" ? this.MODEL_CODER : this.MODEL_GENERAL;
        const reply = await AIProviderService.callOllama(req, localModel);
        return {
          reply,
          providerUsed: "ollama",
          modelUsed: localModel,
          tokensEstimated: Math.ceil((req.prompt.length + reply.length) / 4),
        };
      } catch (ollamaErr: any) {
        console.warn(`[AI Router] Local Ollama fallback triggered: ${ollamaErr.message}`);
      }
    }

    // 2. Try Gemini API as primary/fallback
    const geminiKey = SecretManagerService.getSecret("GEMINI_API_KEY", true) || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const modelUsed = req.model || "gemini-3.6-flash";
        const reply = await AIProviderService.callGemini(req, geminiKey);
        return {
          reply,
          providerUsed: "gemini",
          modelUsed,
          tokensEstimated: Math.ceil((req.prompt.length + reply.length) / 4),
        };
      } catch (geminiErr: any) {
        console.warn(`[AI Router] Gemini API error: ${geminiErr.message}`);
      }
    }

    // 3. Fallback attempt to local Ollama if Gemini failed
    try {
      const reply = await AIProviderService.callOllama(req, this.MODEL_GENERAL);
      return {
        reply,
        providerUsed: "ollama",
        modelUsed: this.MODEL_GENERAL,
        tokensEstimated: Math.ceil((req.prompt.length + reply.length) / 4),
      };
    } catch (finalErr: any) {
      return {
        reply: `[AI System Standby] Both local LLM endpoint and cloud AI key are offline or unconfigured. Prompt received: "${(req.prompt || "").substring(0, 80)}..."`,
        providerUsed: "ollama",
        modelUsed: "none",
        tokensEstimated: 0,
      };
    }
  }
}
