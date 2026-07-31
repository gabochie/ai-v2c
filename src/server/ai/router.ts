import { AIProviderRequest, AIProviderResponse, AIProviderService } from "./provider";
import { SecretManagerService } from "../../utils/secretManager";

export class AIRouter {
  /**
   * Intelligently routes chat requests based on taskType and fallback chain
   */
  public static async routeAndExecute(req: AIProviderRequest): Promise<AIProviderResponse> {
    const taskType = req.taskType || "general";

    // 1. Determine Preferred Provider Strategy
    const prefersLocal = ["wordpress_plugin", "php", "javascript"].includes(taskType);

    // If local model preferred, try Ollama first
    if (prefersLocal) {
      try {
        const localModel = taskType === "php" || taskType === "wordpress_plugin" ? "qwen2.5-coder:7b" : "llama3.2:latest";
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
      const reply = await AIProviderService.callOllama(req, "llama3.2:latest");
      return {
        reply,
        providerUsed: "ollama",
        modelUsed: "llama3.2:latest",
        tokensEstimated: Math.ceil((req.prompt.length + reply.length) / 4),
      };
    } catch (finalErr: any) {
      return {
        reply: `[AI System Standby] Both local LLM endpoint and cloud AI key are offline or unconfigured. Prompt received: "${req.prompt.substring(0, 80)}..."`,
        providerUsed: "ollama",
        modelUsed: "none",
        tokensEstimated: 0,
      };
    }
  }
}
