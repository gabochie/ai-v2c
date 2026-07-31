import { createClient, Client } from "@libsql/client";
import fs from "fs";
import path from "path";
import { INITIAL_TASKS, INITIAL_SPRINTS } from "../../data/initialTasks";
import { AGENT_LIBRARY } from "../../data/agentLibrary";
import { PROMPT_LIBRARY } from "../../data/promptLibrary";
import { KNOWLEDGE_ARTICLES } from "../../data/knowledgeBase";

let dbClient: Client | null = null;

export function getDb(): Client {
  if (!dbClient) {
    const dataDir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, "local.db");
    
    dbClient = createClient({
      url: `file:${dbPath}`,
    });
  }
  return dbClient;
}

export async function initDatabase(): Promise<void> {
  const db = getDb();

  // Enable WAL Mode
  try {
    await db.execute("PRAGMA journal_mode = WAL;");
  } catch (e) {
    console.warn("PRAGMA journal_mode=WAL notice:", e);
  }

  // Create Tables
  await db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      estimatedHours REAL NOT NULL,
      actualHours REAL NOT NULL,
      assignedAgentId TEXT,
      sprintId TEXT,
      tags TEXT,
      dependencies TEXT,
      notes TEXT,
      checklist TEXT,
      dueDate TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS sprints (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      goal TEXT,
      startDate TEXT,
      endDate TEXT,
      status TEXT NOT NULL,
      totalPoints INTEGER,
      completedPoints INTEGER
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT,
      title TEXT,
      specialty TEXT,
      avatar TEXT,
      color TEXT,
      badge TEXT,
      systemPrompt TEXT,
      description TEXT,
      capabilities TEXT,
      tools TEXT,
      outputFormat TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      tags TEXT,
      promptText TEXT,
      parameters TEXT,
      description TEXT,
      difficulty TEXT,
      usageCount INTEGER
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS knowledge_articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      summary TEXT,
      content TEXT,
      tags TEXT,
      author TEXT,
      lastUpdated TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id TEXT PRIMARY KEY,
      agentId TEXT NOT NULL,
      status TEXT NOT NULL,
      steps TEXT,
      artifacts TEXT,
      tokensUsed INTEGER DEFAULT 0,
      startedAt TEXT,
      completedAt TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      userId TEXT,
      action TEXT NOT NULL,
      entityType TEXT,
      entityId TEXT,
      details TEXT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  // Seed Default Admin User if empty
  const userCheck = await db.execute("SELECT COUNT(*) as count FROM users;");
  if (Number(userCheck.rows[0].count) === 0) {
    // Default password hash for 'admin123'
    await db.execute({
      sql: "INSERT INTO users (id, username, passwordHash, role, createdAt) VALUES (?, ?, ?, ?, ?);",
      args: ["usr_admin_1", "admin", "admin123_hash_scrypt_v1", "admin", new Date().toISOString()],
    });
  }

  // Seed tasks if empty
  const taskCheck = await db.execute("SELECT COUNT(*) as count FROM tasks;");
  if (Number(taskCheck.rows[0].count) === 0) {
    for (const task of INITIAL_TASKS) {
      await db.execute({
        sql: `INSERT INTO tasks (id, title, description, status, priority, difficulty, estimatedHours, actualHours, assignedAgentId, sprintId, tags, dependencies, notes, checklist, dueDate, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          task.id,
          task.title,
          task.description,
          task.status,
          task.priority,
          task.difficulty,
          task.estimatedHours,
          task.actualHours,
          task.assignedAgentId,
          task.sprintId,
          JSON.stringify(task.tags),
          JSON.stringify(task.dependencies),
          task.notes,
          JSON.stringify(task.checklist),
          task.dueDate || null,
          task.createdAt,
          task.updatedAt,
        ],
      });
    }
  }

  // Seed sprints if empty
  const sprintCheck = await db.execute("SELECT COUNT(*) as count FROM sprints;");
  if (Number(sprintCheck.rows[0].count) === 0) {
    for (const sprint of INITIAL_SPRINTS) {
      await db.execute({
        sql: `INSERT INTO sprints (id, name, goal, startDate, endDate, status, totalPoints, completedPoints)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          sprint.id,
          sprint.name,
          sprint.goal,
          sprint.startDate,
          sprint.endDate,
          sprint.status,
          sprint.totalPoints,
          sprint.completedPoints,
        ],
      });
    }
  }

  // Seed agents if empty
  const agentCheck = await db.execute("SELECT COUNT(*) as count FROM agents;");
  if (Number(agentCheck.rows[0].count) === 0) {
    for (const agent of AGENT_LIBRARY) {
      await db.execute({
        sql: `INSERT INTO agents (id, name, role, title, specialty, avatar, color, badge, systemPrompt, description, capabilities, tools, outputFormat)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          agent.id,
          agent.name,
          agent.role,
          agent.title,
          agent.specialty,
          agent.avatar,
          agent.color,
          agent.badge,
          agent.systemPrompt,
          agent.description,
          JSON.stringify(agent.capabilities),
          JSON.stringify(['write_file', 'read_file', 'run_command', 'git_commit']),
          'json',
        ],
      });
    }
  }

  // Seed prompts if empty
  const promptCheck = await db.execute("SELECT COUNT(*) as count FROM prompts;");
  if (Number(promptCheck.rows[0].count) === 0) {
    for (const prompt of PROMPT_LIBRARY) {
      await db.execute({
        sql: `INSERT INTO prompts (id, title, category, tags, promptText, parameters, description, difficulty, usageCount)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          prompt.id,
          prompt.title,
          prompt.category,
          JSON.stringify(prompt.tags),
          prompt.promptText,
          JSON.stringify(prompt.parameters),
          prompt.description,
          prompt.difficulty,
          prompt.usageCount,
        ],
      });
    }
  }

  // Seed knowledge articles if empty
  const articleCheck = await db.execute("SELECT COUNT(*) as count FROM knowledge_articles;");
  if (Number(articleCheck.rows[0].count) === 0) {
    for (const article of KNOWLEDGE_ARTICLES) {
      await db.execute({
        sql: `INSERT INTO knowledge_articles (id, title, category, summary, content, tags, author, lastUpdated)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          article.id,
          article.title,
          article.category,
          article.summary,
          article.content,
          JSON.stringify(article.tags),
          article.author,
          article.lastUpdated,
        ],
      });
    }
  }
}

export async function logAudit(userId: string, action: string, entityType: string, entityId: string, details?: any): Promise<void> {
  try {
    const db = getDb();
    const id = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();
    const detailsStr = details ? JSON.stringify(details) : null;

    await db.execute({
      sql: "INSERT INTO audit_log (id, timestamp, userId, action, entityType, entityId, details) VALUES (?, ?, ?, ?, ?, ?, ?);",
      args: [id, timestamp, userId, action, entityType, entityId, detailsStr],
    });

    // Also write to Git-backed audit directory (Phase 8)
    const auditDir = path.join(process.cwd(), "workspace", ".audit");
    if (!fs.existsSync(auditDir)) {
      fs.mkdirSync(auditDir, { recursive: true });
    }
    const auditFile = path.join(auditDir, `audit_${new Date().toISOString().split("T")[0]}.jsonl`);
    const line = JSON.stringify({ id, timestamp, userId, action, entityType, entityId, details }) + "\n";
    fs.appendFileSync(auditFile, line, "utf-8");
  } catch (e) {
    console.warn("Error logging audit event:", e);
  }
}
