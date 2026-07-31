import { Sprint, Task } from '../types';

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 'sprint-1',
    name: 'Sprint 01: Core Architecture & Workspace Foundation',
    goal: 'Establish server-side Gemini gateway, desktop UI components, and state persistence engine.',
    startDate: '2026-07-28',
    endDate: '2026-08-10',
    status: 'active',
    totalPoints: 48,
    completedPoints: 32
  },
  {
    id: 'sprint-2',
    name: 'Sprint 02: Enterprise AI Agent Ecosystem & Prompt Engine',
    goal: 'Deploy 10+ specialized agents, interactive chat workspace, 200+ reusable prompt library, and slash commands.',
    startDate: '2026-08-11',
    endDate: '2026-08-24',
    status: 'planned',
    totalPoints: 56,
    completedPoints: 0
  },
  {
    id: 'sprint-3',
    name: 'Sprint 03: Knowledge Base, Folder Explorer & Analytics',
    goal: 'Integrate ADR repository, interactive folder tree, sprint velocity charts, and report generator.',
    startDate: '2026-08-25',
    endDate: '2026-09-07',
    status: 'planned',
    totalPoints: 40,
    completedPoints: 0
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-101',
    title: 'Provision Express + Gemini API Gateway Server',
    description: 'Set up server.ts with @google/genai SDK, user-agent telemetry headers, and proxy endpoint /api/agent/chat.',
    status: 'completed',
    priority: 'Critical',
    difficulty: 'Senior',
    estimatedHours: 8,
    actualHours: 6,
    assignedAgentId: 'agent-cto',
    sprintId: 'sprint-1',
    tags: ['Backend', 'Gemini API', 'Express', 'Security'],
    dependencies: [],
    notes: 'Server implementation verified with strict user agent headers and API key fallback handling.',
    checklist: [
      { id: 'c1', text: 'Configure Express server on port 3000', done: true },
      { id: 'c2', text: 'Initialize @google/genai SDK with process.env.GEMINI_API_KEY', done: true },
      { id: 'c3', text: 'Create /api/agent/chat endpoint for multi-agent system prompts', done: true },
      { id: 'c4', text: 'Add health check endpoint /api/health', done: true }
    ],
    createdAt: '2026-07-28T09:00:00Z',
    updatedAt: '2026-07-28T15:30:00Z'
  },
  {
    id: 'task-102',
    title: 'Implement LocalStorage State Persistence Engine',
    description: 'Build robust client-side storage hook with auto-save, JSON import/export, and schema validation.',
    status: 'completed',
    priority: 'High',
    difficulty: 'Mid',
    estimatedHours: 6,
    actualHours: 5,
    assignedAgentId: 'agent-fullstack',
    sprintId: 'sprint-1',
    tags: ['Frontend', 'LocalStorage', 'State Management'],
    dependencies: ['task-101'],
    notes: 'Auto-saves every change and allows zero-data-loss export/import.',
    checklist: [
      { id: 'c1', text: 'Create initial state definitions for tasks, prompts, and settings', done: true },
      { id: 'c2', text: 'Add debounced write to window.localStorage', done: true },
      { id: 'c3', text: 'Build JSON backup import/export validator', done: true }
    ],
    createdAt: '2026-07-28T11:00:00Z',
    updatedAt: '2026-07-29T10:15:00Z'
  },
  {
    id: 'task-103',
    title: 'Build Desktop OS Navigation & Header Interface',
    description: 'Craft responsive desktop sidebar navigation, view mode router, quick global search, and theme switcher.',
    status: 'in_progress',
    priority: 'High',
    difficulty: 'Mid',
    estimatedHours: 10,
    actualHours: 7,
    assignedAgentId: 'agent-fullstack',
    sprintId: 'sprint-1',
    tags: ['UI/UX', 'Tailwind', 'Layout'],
    dependencies: ['task-102'],
    notes: 'In progress: Implementing active tab indicators and keyboard shortcut triggers.',
    checklist: [
      { id: 'c1', text: 'Design sidebar layout with Lucide icons', done: true },
      { id: 'c2', text: 'Add global search filter input', done: true },
      { id: 'c3', text: 'Implement Light/Dark mode state toggle', done: true },
      { id: 'c4', text: 'Integrate active sprint status widget', done: false }
    ],
    createdAt: '2026-07-29T08:00:00Z',
    updatedAt: '2026-07-30T14:00:00Z'
  },
  {
    id: 'task-104',
    title: 'Interactive Executive Dashboard & Sprint Progress Analytics',
    description: 'Render live completion percentages, burn-down metric cards, difficulty breakdown, and agent workloads.',
    status: 'in_progress',
    priority: 'High',
    difficulty: 'Senior',
    estimatedHours: 12,
    actualHours: 8,
    assignedAgentId: 'agent-ceo',
    sprintId: 'sprint-1',
    tags: ['Dashboard', 'Recharts', 'Analytics', 'Metrics'],
    dependencies: ['task-103'],
    notes: 'Recharts integration in progress for difficulty distribution pie chart and task velocity bar chart.',
    checklist: [
      { id: 'c1', text: 'Calculate live task stats (Total, Done, In Progress, Hours)', done: true },
      { id: 'c2', text: 'Build Recharts bar and pie charts for visual telemetry', done: true },
      { id: 'c3', text: 'Create pending blocker alert feed', done: false }
    ],
    createdAt: '2026-07-29T13:00:00Z',
    updatedAt: '2026-07-30T16:20:00Z'
  },
  {
    id: 'task-105',
    title: 'Kanban Sprint Board & Dependency Visualizer',
    description: 'Build 5-column drag-and-drop style Kanban board with task cards, difficulty tags, and dependency warnings.',
    status: 'todo',
    priority: 'High',
    difficulty: 'Senior',
    estimatedHours: 14,
    actualHours: 0,
    assignedAgentId: 'agent-architect',
    sprintId: 'sprint-1',
    tags: ['Kanban', 'Sprint', 'Tasks', 'Dependencies'],
    dependencies: ['task-103'],
    notes: 'Task cards should highlight blocked dependencies in red if parent tasks are incomplete.',
    checklist: [
      { id: 'c1', text: 'Build 5 Kanban status columns (Backlog, To Do, In Progress, Review, Completed)', done: false },
      { id: 'c2', text: 'Create task detail modal editor with notes and checklist', done: false },
      { id: 'c3', text: 'Display task prerequisite warning flags', done: false }
    ],
    dueDate: new Date(Date.now() + 18 * 3600 * 1000).toISOString().split('T')[0],
    createdAt: '2026-07-30T09:00:00Z',
    updatedAt: '2026-07-30T09:00:00Z'
  },
  {
    id: 'task-106',
    title: 'Specialized AI Agent Lab & Interactive Chat Console',
    description: 'Connect 10+ AI personas (CEO, CTO, WP Architect, Security, QA) to real server-side Gemini API calls.',
    status: 'todo',
    priority: 'Critical',
    difficulty: 'Architect',
    estimatedHours: 16,
    actualHours: 0,
    assignedAgentId: 'agent-prompt',
    sprintId: 'sprint-2',
    tags: ['AI Agents', 'Gemini API', 'Chat Console'],
    dependencies: ['task-101', 'task-103'],
    notes: 'Users should be able to select any agent persona, view its capabilities, and chat in real-time.',
    dueDate: new Date(Date.now() + 12 * 3600 * 1000).toISOString().split('T')[0],
    checklist: [
      { id: 'c1', text: 'Render Agent card gallery with color badges and capabilities', done: false },
      { id: 'c2', text: 'Build Agent Chat Interface with streaming or async response', done: false },
      { id: 'c3', text: 'Allow direct task assignment from chat output', done: false }
    ],
    createdAt: '2026-07-30T10:00:00Z',
    updatedAt: '2026-07-30T10:00:00Z'
  },
  {
    id: 'task-107',
    title: '200+ Prompt Library Search & Parameter Substitution Engine',
    description: 'Category-indexed prompt library with variable parameters ({{Code}}, {{Framework}}), 1-click copy, and agent execution.',
    status: 'todo',
    priority: 'High',
    difficulty: 'Mid',
    estimatedHours: 10,
    actualHours: 0,
    assignedAgentId: 'agent-prompt',
    sprintId: 'sprint-2',
    tags: ['Prompts', 'AI', 'Search', 'Templates'],
    dependencies: ['task-106'],
    notes: 'Support instant variable filling modal and direct copy to clipboard.',
    checklist: [
      { id: 'c1', text: 'Index 200+ prompt templates across 10 engineering categories', done: false },
      { id: 'c2', text: 'Implement search bar and category pills filter', done: false },
      { id: 'c3', text: 'Build parameter replacement modal window', done: false }
    ],
    createdAt: '2026-07-30T11:00:00Z',
    updatedAt: '2026-07-30T11:00:00Z'
  },
  {
    id: 'task-108',
    title: 'Interactive Knowledge Base & ADR Repository Viewer',
    description: 'Document browser for Architecture Decision Records, OWASP security checklists, and deployment playbooks.',
    status: 'backlog',
    priority: 'Medium',
    difficulty: 'Junior',
    estimatedHours: 8,
    actualHours: 0,
    assignedAgentId: 'agent-architect',
    sprintId: 'sprint-3',
    tags: ['Docs', 'Knowledge Base', 'ADR', 'Markdown'],
    dependencies: ['task-103'],
    notes: 'Includes full markdown renderer with code highlighting aesthetics.',
    checklist: [
      { id: 'c1', text: 'List knowledge articles by category (ADR, Security, Deployment)', done: false },
      { id: 'c2', text: 'Render styled Markdown content view', done: false }
    ],
    createdAt: '2026-07-30T12:00:00Z',
    updatedAt: '2026-07-30T12:00:00Z'
  }
];
