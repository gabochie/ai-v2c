import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

import { logger } from "./src/utils/logger";
import { SecretManagerService } from "./src/utils/secretManager";
import { getDb, initDatabase, logAudit } from "./src/server/db";
import { AIRouter } from "./src/server/ai/router";
import { FilesystemManager } from "./src/server/fs";
import { ToolRegistry } from "./src/server/tools";
import { ProjectFactory } from "./src/server/wp/factory";
import { AgentOrchestrator } from "./src/server/orchestrator/run";
import { AutonomyPipelineEngine } from "./src/server/pipeline";
import { LocalRAGSearchEngine } from "./src/server/rag";
import { AuthService } from "./src/server/security/auth";
import { EncryptedBackupService } from "./src/server/security/backup";
import { runEnterpriseTestSuite } from "./src/server/tests/suite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite Database with WAL mode & Seed Data
  try {
    await initDatabase();
    logger.info("[DB] SQLite database initialized successfully in WAL mode.");
  } catch (err) {
    logger.error("[DB] Failed to initialize SQLite database", err as Error);
  }

  // Cloud Run & Proxy Trust
  app.set("trust proxy", 1);

  // Security Headers Middleware
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

  // Rate Limiter
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: { error: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use("/api/", apiLimiter);

  // Request Body Parsing
  app.use(express.json({ limit: "15mb" }));

  // Correlation ID & Logging
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const correlationId = (req.headers["x-correlation-id"] as string) || `req_${Math.random().toString(36).substring(2, 9)}`;
    res.setHeader("X-Correlation-ID", correlationId);

    res.on("finish", () => {
      logger.info("HTTP Request Completed", {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
        correlationId,
      });
    });

    next();
  });

  // Health check endpoint
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "forge-ai-engine",
      version: "2.4.0",
      architecture: "enterprise-agentic-wordpress",
      dbMode: "SQLite (WAL)",
      timestamp: new Date().toISOString(),
    });
  });

  // Authentication login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { username, password } = req.body;
    const session = await AuthService.authenticateUser(username || "admin", password || "admin123");
    if (session) {
      return res.json({ status: "authenticated", user: session });
    }
    res.status(401).json({ error: "Invalid username or password" });
  });

  // --- DATABASE ENTITY API ROUTES ---
  app.get("/api/tasks", async (_req: Request, res: Response) => {
    const db = getDb();
    const rows = (await db.execute("SELECT * FROM tasks;")).rows;
    const tasks = rows.map((r) => ({
      ...r,
      tags: JSON.parse(String(r.tags || "[]")),
      dependencies: JSON.parse(String(r.dependencies || "[]")),
      checklist: JSON.parse(String(r.checklist || "[]")),
    }));
    res.json(tasks);
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    const db = getDb();
    const t = req.body;
    await db.execute({
      sql: `INSERT INTO tasks (id, title, description, status, priority, difficulty, estimatedHours, actualHours, assignedAgentId, sprintId, tags, dependencies, notes, checklist, dueDate, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      args: [
        t.id,
        t.title,
        t.description || "",
        t.status,
        t.priority,
        t.difficulty,
        t.estimatedHours || 0,
        t.actualHours || 0,
        t.assignedAgentId || "",
        t.sprintId || "",
        JSON.stringify(t.tags || []),
        JSON.stringify(t.dependencies || []),
        t.notes || "",
        JSON.stringify(t.checklist || []),
        t.dueDate || null,
        t.createdAt || new Date().toISOString(),
        t.updatedAt || new Date().toISOString(),
      ],
    });
    await logAudit("user", "CREATE_TASK", "task", t.id, { title: t.title });
    res.json({ status: "created", task: t });
  });

  app.put("/api/tasks/:id", async (req: Request, res: Response) => {
    const db = getDb();
    const id = req.params.id;
    const t = req.body;
    await db.execute({
      sql: `UPDATE tasks SET title=?, description=?, status=?, priority=?, difficulty=?, estimatedHours=?, actualHours=?, assignedAgentId=?, sprintId=?, tags=?, dependencies=?, notes=?, checklist=?, dueDate=?, updatedAt=? WHERE id=?;`,
      args: [
        t.title,
        t.description || "",
        t.status,
        t.priority,
        t.difficulty,
        t.estimatedHours || 0,
        t.actualHours || 0,
        t.assignedAgentId || "",
        t.sprintId || "",
        JSON.stringify(t.tags || []),
        JSON.stringify(t.dependencies || []),
        t.notes || "",
        JSON.stringify(t.checklist || []),
        t.dueDate || null,
        new Date().toISOString(),
        id,
      ],
    });
    await logAudit("user", "UPDATE_TASK", "task", id, { status: t.status });
    res.json({ status: "updated", id });
  });

  app.get("/api/sprints", async (_req: Request, res: Response) => {
    const db = getDb();
    const rows = (await db.execute("SELECT * FROM sprints;")).rows;
    res.json(rows);
  });

  app.get("/api/agents", async (_req: Request, res: Response) => {
    const db = getDb();
    const rows = (await db.execute("SELECT * FROM agents;")).rows;
    const agents = rows.map((r) => ({
      ...r,
      capabilities: JSON.parse(String(r.capabilities || "[]")),
    }));
    res.json(agents);
  });

  app.get("/api/prompts", async (_req: Request, res: Response) => {
    const db = getDb();
    const rows = (await db.execute("SELECT * FROM prompts;")).rows;
    const prompts = rows.map((r) => ({
      ...r,
      tags: JSON.parse(String(r.tags || "[]")),
      parameters: JSON.parse(String(r.parameters || "[]")),
    }));
    res.json(prompts);
  });

  app.get("/api/knowledge", async (_req: Request, res: Response) => {
    const db = getDb();
    const rows = (await db.execute("SELECT * FROM knowledge_articles;")).rows;
    const articles = rows.map((r) => ({
      ...r,
      tags: JSON.parse(String(r.tags || "[]")),
    }));
    res.json(articles);
  });

  app.get("/api/audit-logs", async (_req: Request, res: Response) => {
    const db = getDb();
    const rows = (await db.execute("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT 50;")).rows;
    res.json(rows);
  });

  // --- LOCAL AI ROUTER & CHAT ENDPOINT ---
  app.post("/api/ai/chat", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await AIRouter.routeAndExecute(req.body);
      res.json(response);
    } catch (err) {
      next(err);
    }
  });

  // Legacy Agent Chat Endpoint
  app.post("/api/agent/chat", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const response = await AIRouter.routeAndExecute({
        systemPrompt: req.body.systemPrompt,
        prompt: req.body.prompt,
        history: req.body.history,
        taskType: "general",
      });
      res.json({ reply: response.reply });
    } catch (err) {
      next(err);
    }
  });

  // --- FILESYSTEM API ENDPOINTS ---
  app.get("/api/fs/list", (req: Request, res: Response) => {
    const subPath = (req.query.path as string) || "";
    try {
      const items = FilesystemManager.listDirectory(subPath);
      res.json({ path: subPath, items });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/fs/read", (req: Request, res: Response) => {
    const { path: filePath } = req.body;
    try {
      const content = FilesystemManager.readFile(filePath);
      res.json({ path: filePath, content });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/fs/write", async (req: Request, res: Response) => {
    const { path: filePath, content } = req.body;
    try {
      FilesystemManager.writeFile(filePath, content);
      await logAudit("user", "WRITE_FILE", "file", filePath);
      res.json({ status: "success", path: filePath });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/fs/delete", async (req: Request, res: Response) => {
    const { path: filePath } = req.body;
    try {
      FilesystemManager.deleteFile(filePath);
      await logAudit("user", "DELETE_FILE", "file", filePath);
      res.json({ status: "deleted", path: filePath });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/tools/exec", async (req: Request, res: Response) => {
    const { command } = req.body;
    try {
      const result = await ToolRegistry.runCommand(command);
      await logAudit("user", "EXEC_TOOL", "command", command, { exitCode: result.exitCode });
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- WORDPRESS PROJECT FACTORY API ---
  app.post("/api/wp/scaffold", async (req: Request, res: Response) => {
    try {
      const result = await ProjectFactory.buildProject(req.body);
      await logAudit("user", "BUILD_WP_PROJECT", "wp_project", req.body.name, { type: req.body.type });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- AGENT ORCHESTRATION RUNS API ---
  app.post("/api/agents/run", async (req: Request, res: Response) => {
    const { agentId, agentName, goal, projectType } = req.body;
    const run = await AgentOrchestrator.createAndExecuteRun(agentId, agentName, goal, projectType);
    res.json(run);
  });

  app.get("/api/agents/runs", async (_req: Request, res: Response) => {
    const runs = await AgentOrchestrator.getAllRuns();
    res.json(runs);
  });

  app.get("/api/agents/runs/:id", async (req: Request, res: Response) => {
    const run = await AgentOrchestrator.getRun(req.params.id);
    if (!run) return res.status(404).json({ error: "Run not found" });
    res.json(run);
  });

  // --- AUTONOMY PIPELINE API ---
  app.post("/api/pipeline/start", async (req: Request, res: Response) => {
    const { projectName, projectType } = req.body;
    const pipeline = await AutonomyPipelineEngine.startPipeline(projectName, projectType);
    res.json(pipeline);
  });

  app.get("/api/pipeline/all", (_req: Request, res: Response) => {
    res.json(AutonomyPipelineEngine.getAllPipelines());
  });

  app.get("/api/pipeline/status/:id", (req: Request, res: Response) => {
    const pipe = AutonomyPipelineEngine.getPipeline(req.params.id);
    if (!pipe) return res.status(404).json({ error: "Pipeline run not found" });
    res.json(pipe);
  });

  app.post("/api/pipeline/:runId/approve", async (req: Request, res: Response) => {
    try {
      const updated = await AutonomyPipelineEngine.approveStage(req.params.runId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/pipeline/:runId/reject", async (req: Request, res: Response) => {
    try {
      const updated = await AutonomyPipelineEngine.rejectStage(req.params.runId, req.body.reason);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- RAG SEMANTIC SEARCH API ---
  app.get("/api/search/semantic", async (req: Request, res: Response) => {
    const q = (req.query.q as string) || "";
    const results = await LocalRAGSearchEngine.searchSemantic(q);
    res.json(results);
  });

  // --- ENCRYPTED BACKUP API ---
  app.post("/api/backup/export", async (req: Request, res: Response) => {
    const secretKey = req.body.secretKey || "ForgeDesktopPasscode2026";
    const backup = await EncryptedBackupService.exportBackup(secretKey);
    res.json(backup);
  });

  app.post("/api/backup/import", async (req: Request, res: Response) => {
    const { encryptedData, iv, tag, secretKey } = req.body;
    try {
      const success = await EncryptedBackupService.importBackup(encryptedData, iv, tag, secretKey || "ForgeDesktopPasscode2026");
      res.json({ success });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- AUTOMATED TEST SUITE API ---
  app.get("/api/tests/run", async (_req: Request, res: Response) => {
    const report = await runEnterpriseTestSuite();
    res.json(report);
  });

  // Centralized Error Handling
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(`API Error in ${req.method} ${req.path}`, err, { path: req.path });
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message || "An unexpected system error occurred.",
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
    logger.info(`Forge AI Engine Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error("Failed to boot Forge AI Engine Server", err);
});
