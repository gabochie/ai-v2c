import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(1).max(200),
});

export const taskCreateSchema = z.object({
  id: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  status: z.enum(["backlog", "todo", "in_progress", "review", "completed"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  difficulty: z.enum(["Junior", "Mid", "Senior", "Architect", "Principal"]),
  estimatedHours: z.number().min(0).max(100000).optional(),
  actualHours: z.number().min(0).max(100000).optional(),
  assignedAgentId: z.string().max(100).optional(),
  sprintId: z.string().max(100).optional(),
  tags: z.array(z.string().max(100)).max(50).optional(),
  dependencies: z.array(z.string().max(100)).max(200).optional(),
  notes: z.string().max(20000).optional(),
  checklist: z.array(z.object({ id: z.string(), text: z.string().max(2000), done: z.boolean() })).max(500).optional(),
  dueDate: z.string().max(50).optional(),
  createdAt: z.string().max(50).optional(),
  updatedAt: z.string().max(50).optional(),
});

export const taskUpdateSchema = taskCreateSchema.omit({ id: true }).partial();

export const fsWriteSchema = z.object({
  path: z.string().min(1).max(1000),
  content: z.string().max(10 * 1024 * 1024),
});

export const fsReadSchema = z.object({
  path: z.string().min(1).max(1000),
});

export const fsDeleteSchema = z.object({
  path: z.string().min(1).max(1000),
});

export const toolsExecSchema = z.object({
  command: z.string().min(1).max(2000),
  sandbox: z.boolean().optional(),
});

export const agentRunSchema = z.object({
  goal: z.string().min(1).max(10000),
  workspace: z.string().max(1000).optional(),
  model: z.string().max(200).optional(),
  systemPrompt: z.string().max(20000).optional(),
  maxIterations: z.number().int().min(1).max(50).optional(),
  temperature: z.number().min(0).max(2).optional(),
  provider: z.enum(["ollama", "gemini"]).optional(),
});

export const wpScaffoldSchema = z.object({
  type: z.enum(["plugin", "block", "rest_api", "admin_settings", "woo_extension", "theme"]),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "slug must be lowercase alphanumeric + dashes"),
  description: z.string().max(5000).optional(),
  author: z.string().max(200).optional(),
  version: z.string().max(50).optional(),
  features: z.array(z.string().max(100)).max(50).optional(),
});

export const backupImportSchema = z.object({
  encryptedData: z.string().min(1).max(50 * 1024 * 1024),
  iv: z.string().min(1).max(1000),
  tag: z.string().min(1).max(1000),
  secretKey: z.string().max(1000).optional(),
});

export const pipelineStartSchema = z.object({
  projectName: z.string().min(1).max(200),
  projectType: z.enum(["plugin", "block", "rest_api", "admin_settings", "woo_extension", "theme"]).optional(),
});

export const agentsRunSchema = z.object({
  agentId: z.string().min(1).max(100),
  agentName: z.string().max(200).optional(),
  goal: z.string().min(1).max(10000),
  projectType: z.enum(["plugin", "block", "rest_api", "admin_settings", "woo_extension", "theme"]).optional(),
});
