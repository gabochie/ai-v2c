import { AIProviderRequest, AIProviderResponse, AIProviderService } from "./provider";
import { SecretManagerService } from "../utils/secretManager";
import { HermesClient } from "../hermes/client";
import { OpenClawClient } from "../openclaw/client";

export class AIRouter {
  private static get MODEL_CODER(): string {
    return process.env.OLLAMA_MODEL_CODER || "qwen2.5-coder:7b";
  }
  private static get MODEL_GENERAL(): string {
    return process.env.OLLAMA_MODEL_GENERAL || "llama3.2:latest";
  }

  /**
   * Intelligently routes chat requests based on taskType and fallback chain
   */
  public static async routeAndExecute(req: AIProviderRequest): Promise<AIProviderResponse> {
    const taskType = req.taskType || "general";

    // Explicit Hermes request -> sandboxed agent gateway
    if (req.provider === "hermes" && HermesClient.isConfigured()) {
      try {
        const hermes = await AIProviderService.callHermes(req);
        hermes.providerUsed = "hermes";
        return hermes;
      } catch (hermesErr: any) {
        console.warn(`[AI Router] Hermes unavailable for explicit request: ${hermesErr.message}`);
      }
    }

    // Explicit OpenClaw request -> go straight to the OpenClaw sandboxed agent
    if (req.provider === "openclaw" && OpenClawClient.isConfigured()) {
      try {
        const openclaw = await AIProviderService.callOpenClaw(req);
        openclaw.providerUsed = "openclaw";
        return openclaw;
      } catch (openclawErr: any) {
        console.warn(`[AI Router] OpenClaw unavailable for explicit request: ${openclawErr.message}`);
      }
    }

    // 1. Fast local path: direct Ollama (~0.5s) is the interactive-chat default for all task types.
    const prefersLocal = ["wordpress_plugin", "php", "javascript"].includes(taskType);
    const localModel = taskType === "php" || taskType === "wordpress_plugin" ? this.MODEL_CODER : this.MODEL_GENERAL;
    try {
      const reply = await AIProviderService.callOllama(req, localModel);
      return {
        reply,
        providerUsed: "ollama",
        modelUsed: localModel,
        tokensEstimated: Math.ceil((req.prompt.length + reply.length) / 4),
      };
    } catch (ollamaErr: any) {
      console.warn(`[AI Router] Local Ollama unavailable: ${ollamaErr.message}`);
    }

    // 2. Try Gemini API as cloud fallback
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

    // 3. Hermes agent gateway (fast local agentic, ~1s warm) before slow OpenClaw.
    if (HermesClient.isConfigured()) {
      try {
        const hermes = await AIProviderService.callHermes(req);
        hermes.providerUsed = "hermes";
        return hermes;
      } catch (hermesErr: any) {
        console.warn(`[AI Router] Hermes unavailable: ${hermesErr.message}`);
      }
    }

    // 4. OpenClaw last resort (slow agentic, ~150s on CPU) — only when all other paths are down.
    if (OpenClawClient.isConfigured()) {
      try {
        const openclaw = await AIProviderService.callOpenClaw(req);
        openclaw.providerUsed = "openclaw";
        return openclaw;
      } catch (openclawErr: any) {
        console.warn(`[AI Router] OpenClaw unavailable: ${openclawErr.message}`);
      }
    }

    // 5. Fully offline standby
    return {
      reply: `[AI System Standby] Both local LLM endpoint and cloud AI key are offline or unconfigured. Prompt received: "${(req.prompt || "").substring(0, 80)}..."`,
      providerUsed: "ollama",
      modelUsed: "none",
      tokensEstimated: 0,
    };
  }
}
