import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Initialize Gemini API client lazily / safely
  let aiClient: GoogleGenAI | null = null;
  function getGeminiAI() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
        throw new Error("GEMINI_API_KEY environment variable is missing or unconfigured.");
      }
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Agent Chat Endpoint
  app.post("/api/agent/chat", async (req, res) => {
    try {
      const { systemPrompt, prompt, model, history } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required." });
      }

      const selectedModel = model || "gemini-3.6-flash";
      const ai = getGeminiAI();

      // Format conversation contents if history is provided
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
          systemInstruction: systemPrompt || "You are an expert AI Engineering Assistant specializing in software architecture, code optimization, and project execution.",
          temperature: 0.7,
        },
      });

      const replyText = response.text || "No response generated.";
      return res.json({ reply: replyText });
    } catch (error: unknown) {
      const err = error as Error;
      console.error("Gemini API Error:", err.message);
      return res.status(500).json({
        error: "AI Agent Execution Error",
        details: err.message || "Failed to generate AI response. Please check your GEMINI_API_KEY.",
      });
    }
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
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Engineering OS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
