export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'completed';
export type TaskDifficulty = 'Junior' | 'Mid' | 'Senior' | 'Architect' | 'Principal';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  difficulty: TaskDifficulty;
  estimatedHours: number;
  actualHours: number;
  assignedAgentId: string;
  sprintId: string;
  tags: string[];
  dependencies: string[]; // Task IDs that must be completed first
  notes: string;
  checklist: ChecklistItem[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
  totalPoints: number;
  completedPoints: number;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  title: string;
  specialty: string;
  avatar: string;
  color: string;
  badge: string;
  systemPrompt: string;
  description: string;
  capabilities: string[];
}

export interface PromptTemplate {
  id: string;
  title: string;
  category: 'Architecture' | 'Refactoring' | 'Debugging' | 'Security' | 'DevOps' | 'Testing' | 'Database' | 'Frontend' | 'System Design' | 'Documentation';
  tags: string[];
  promptText: string;
  parameters: string[];
  description: string;
  difficulty: TaskDifficulty;
  usageCount: number;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  category: 'ADR' | 'Architecture Guide' | 'Security Policy' | 'Code Standards' | 'Deployment Playbook' | 'AI Integration';
  summary: string;
  content: string;
  tags: string[];
  author: string;
  lastUpdated: string;
}

export interface SlashCommand {
  command: string;
  title: string;
  category: string;
  description: string;
  template: string;
  exampleUsage: string;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  size?: string;
  language?: string;
  children?: WorkspaceFile[];
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'task' | 'agent' | 'sprint' | 'export' | 'system';
  message: string;
  details?: string;
}

export type ViewMode =
  | 'dashboard'
  | 'sprints'
  | 'agents'
  | 'prompts'
  | 'knowledge'
  | 'explorer'
  | 'commands'
  | 'settings';
