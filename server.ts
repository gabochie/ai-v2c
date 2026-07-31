import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { logger } from "./src/utils/logger";
import { SecretManagerService } from "./src/utils/secretManager";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Cloud Run HTTPS Trust Proxy
  app.set("trust proxy", 1);

  // Security Headers Middleware (HTTPS & Cloud Run hardening)
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
    }
    next();
  });

  // Request Body Parsing
  app.use(express.json({ limit: "10mb" }));

  // Structured Logging & Correlation ID Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const correlationId = (req.headers["x-correlation-id"] as string) || `req_${Math.random().toString(36).substring(2, 9)}`;
    res.setHeader("X-Correlation-ID", correlationId);

    res.on("finish", () => {
      const durationMs = Date.now() - start;
      logger.info("HTTP Request Completed", {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        correlationId,
        userAgent: req.headers["user-agent"],
      });
    });

    next();
  });

  // Lazy Initialization of Gemini AI Client via SecretManagerService
  let aiClient: GoogleGenAI | null = null;
  function getGeminiAI() {
    if (!aiClient) {
      const apiKey = SecretManagerService.getSecret("GEMINI_API_KEY", true);
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY secret is unconfigured or unavailable.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "forge-ai-engine/2.4",
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint with observability metadata
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "forge-ai-engine",
      version: "2.4.0",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      httpsEnabled: true,
    });
  });

  // Security & Secrets Audit Endpoint
  app.get("/api/security/audit", (_req: Request, res: Response) => {
    const secretsAudit = SecretManagerService.getAuditReport();
    res.json({
      timestamp: new Date().toISOString(),
      secrets: secretsAudit,
      securityHeaders: {
        hsts: process.env.NODE_ENV === "production",
        trustProxy: true,
        xssProtection: true,
        noSniff: true,
      },
      hostingTarget: "Google Cloud Run (HTTPS)",
    });
  });

  // Client Telemetry & Frontend Log Ingest Endpoint
  app.post("/api/telemetry", (req: Request, res: Response) => {
    const { level, message, context, error } = req.body;
    logger.info(`[CLIENT_TELEMETRY] ${message || "Frontend log event"}`, {
      clientLevel: level || "INFO",
      context,
      error,
    });
    res.json({ status: "ingested" });
  });

  // AI Agent Chat Endpoint
  app.post("/api/agent/chat", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { systemPrompt, prompt, model, history } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt parameter is required." });
      }

      const selectedModel = model || "gemini-3.6-flash";
      const ai = getGeminiAI();

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        history.forEach((msg: { role: string; content: string }) => {
          contents.push({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          });
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: prompt }],
      });

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction:
            systemPrompt ||
            "You are an expert AI Engineering Assistant specializing in software architecture, code optimization, and project execution.",
          temperature: 0.7,
        },
      });

      const replyText = response.text || "No response generated.";
      return res.json({ reply: replyText });
    } catch (error: unknown) {
      next(error);
    }
  });

  // Centralized Error Handling Middleware
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`API Error in ${req.method} ${req.path}`, err, {
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "An unexpected system error occurred.",
      timestamp: new Date().toISOString(),
    });
  });

  // Vite development middleware or Production static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`Forge AI Engine Server running on http://0.0.0.0:${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || "development",
    });
  });
}

startServer().catch((err) => {
  logger.error("Failed to boot Forge AI Engine Server", err);
});
