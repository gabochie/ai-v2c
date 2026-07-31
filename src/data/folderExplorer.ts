import { WorkspaceFile } from '../types';

export const INITIAL_WORKSPACE_FILES: WorkspaceFile[] = [
  {
    id: 'f-root',
    name: 'AI-Engineering-Workspace',
    path: '/',
    type: 'folder',
    children: [
      {
        id: 'f-architecture',
        name: 'architecture',
        path: '/architecture',
        type: 'folder',
        children: [
          {
            id: 'file-system-spec',
            name: 'system-spec.md',
            path: '/architecture/system-spec.md',
            type: 'file',
            language: 'markdown',
            size: '4.2 KB',
            content: `# AI Engineering OS Workspace Topology

## High-Level Component Layout
- **Frontend OS Core**: Single-page application built on React 19, TypeScript, motion/react, and Tailwind CSS v4.
- **Backend Service**: Server-side Express Gateway running on Port 3000 hosting Gemini 3.6 Flash endpoints.
- **Data Persistence Layer**: Reactive LocalStorage Engine with cross-session snapshot recovery and full JSON backup options.

## Core Design Principles
1. Instant feedback loop (<50ms UI transitions).
2. Desktop application ergonomics (Keyboard shortcuts, Sidebar drawer, Command palette).
3. Resilient fallback state handling.`
          },
          {
            id: 'file-adr-001',
            name: 'ADR-001-gemini-server.md',
            path: '/architecture/ADR-001-gemini-server.md',
            type: 'file',
            language: 'markdown',
            size: '2.1 KB',
            content: `# ADR-001: Server-Side Gemini API Proxy
Status: Accepted

All AI requests are funneled through Express server routes at /api/agent/chat to preserve secrets and enforce prompt guardrails.`
          }
        ]
      },
      {
        id: 'f-src',
        name: 'src',
        path: '/src',
        type: 'folder',
        children: [
          {
            id: 'file-server-ts',
            name: 'server.ts',
            path: '/server.ts',
            type: 'file',
            language: 'typescript',
            size: '3.1 KB',
            content: `// Express API Gateway with Gemini AI Integration
import express from 'express';
import { GoogleGenAI } from '@google/genai';

const app = express();
// Gemini API Proxy handling AI Agent conversations...`
          },
          {
            id: 'file-app-tsx',
            name: 'App.tsx',
            path: '/src/App.tsx',
            type: 'file',
            language: 'typescript',
            size: '1.8 KB',
            content: `// Primary Workspace Orchestrator Component
export default function App() { ... }`
          }
        ]
      },
      {
        id: 'f-docs',
        name: 'docs',
        path: '/docs',
        type: 'folder',
        children: [
          {
            id: 'file-prompt-guide',
            name: 'prompt-engineering-playbook.md',
            path: '/docs/prompt-engineering-playbook.md',
            type: 'file',
            language: 'markdown',
            size: '5.8 KB',
            content: `# AI Engineering Prompt Engineering Playbook

## System Prompt Structure
Every AI Agent requires:
1. Core persona definition
2. Bounded operational scope
3. Strict output formatting rules (JSON / Code block only)
4. Fallback execution strategy`
          }
        ]
      },
      {
        id: 'file-package-json',
        name: 'package.json',
        path: '/package.json',
        type: 'file',
        language: 'json',
        size: '1.2 KB',
        content: `{
  "name": "ai-engineering-operating-system",
  "version": "2.0.0",
  "private": true
}`
      }
    ]
  }
];
