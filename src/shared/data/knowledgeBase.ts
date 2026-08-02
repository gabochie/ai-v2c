import { KnowledgeArticle } from '../types';

export const KNOWLEDGE_BASE: KnowledgeArticle[] = [
  {
    id: 'adr-001',
    title: 'ADR-001: Adoption of Server-Side Gemini API Architecture',
    category: 'ADR',
    summary: 'Decision to proxy all Gemini AI operations through server-side endpoints to protect API secrets and enforce rate governance.',
    author: 'Atlas Prime (CTO)',
    lastUpdated: '2026-07-30',
    tags: ['ADR', 'Gemini API', 'Security', 'Architecture'],
    content: `# ADR 001: Server-Side Gemini API Gateway

## Status
**ACCEPTED** (2026-07-30)

## Context
The AI Engineering OS requires continuous AI interactions with multiple specialized agents (CEO, CTO, Architect, Security, QA). Exposing API keys in client-side bundles poses critical security risks.

## Decision
All LLM interactions will be routed through server-side Express routes (\`/api/agent/chat\`) using the official \`@google/genai\` SDK.

## Consequences
- Zero API key exposure to browser DevTools.
- Centralized audit logging, cost tracking, and rate limiting.
- Allows server-side system instruction injection per agent role.`
  },
  {
    id: 'adr-002',
    title: 'ADR-002: Local Persistence Engine with Hybrid Export/Import',
    category: 'ADR',
    summary: 'Decision to combine client-side localStorage auto-sync with structured JSON import/export for zero-friction offline availability.',
    author: 'Helios (Principal Architect)',
    lastUpdated: '2026-07-30',
    tags: ['ADR', 'Storage', 'LocalStorage', 'Offline-First'],
    content: `# ADR 002: Client State Persistence Strategy

## Status
**ACCEPTED** (2026-07-30)

## Context
Engineers need rapid responsiveness without waiting for cloud sync delays while retaining full data ownership over tasks, custom prompts, and notes.

## Decision
Implement a LocalStorage state engine with reactive auto-saving, state validation, and full JSON export/import backup functionality.

## Benefits
- Instant load times (<10ms)
- Total user privacy and cloud lock-in immunity
- Easy backup and team project migration via single-file JSON export`
  },
  {
    id: 'guide-001',
    title: 'Enterprise TypeScript & Clean Code Architecture Standard',
    category: 'Code Standards',
    summary: 'Official coding standards: strict type declarations, functional immutability, error handling, and Tailwind CSS utility rules.',
    author: 'Nexus Tech Lead',
    lastUpdated: '2026-07-28',
    tags: ['TypeScript', 'Clean Code', 'Standards', 'Tailwind'],
    content: `# Enterprise TypeScript Coding Standard

1. **Strict Type Safety**: Never use \`any\`. Prefer discriminated unions for complex states.
2. **Immutability**: Treat React state as strictly immutable. Use functional update forms.
3. **Component Decomposition**: Keep individual JSX components under 250 lines. Extract sub-components into modular files.
4. **Tailwind Design System**: Maintain mathematically consistent spacing (padding, gaps) and contrast ratios for accessibility.`
  },
  {
    id: 'sec-001',
    title: 'DevSecOps & OWASP Top 10 Security Protocol',
    category: 'Security Policy',
    summary: 'Mandatory threat modeling checklist, input sanitization rules, and CORS configuration for web services.',
    author: 'Aegis Shield (Security Lead)',
    lastUpdated: '2026-07-29',
    tags: ['OWASP', 'DevSecOps', 'Sanitizer', 'Security'],
    content: `# Security Protocol & Audit Requirements

- **Input Validation**: Validate all incoming payloads with Zod schemas or strict regex before processing.
- **Header Security**: Always enforce CSP, X-Frame-Options: DENY, and Strict-Transport-Security.
- **Authentication**: Store JWTs in HttpOnly SameSite=Strict cookies. Avoid LocalStorage for access tokens.`
  },
  {
    id: 'playbook-001',
    title: 'CI/CD Deployment & Zero-Downtime Release Playbook',
    category: 'Deployment Playbook',
    summary: 'Step-by-step procedures for automated container builds, health probe configuration, and Cloud Run deployments.',
    author: 'Aether Ops (DevOps Lead)',
    lastUpdated: '2026-07-25',
    tags: ['Docker', 'DevOps', 'CI/CD', 'Cloud Run'],
    content: `# Zero-Downtime Deployment Protocol

1. **Container Build**: Multi-stage Docker build producing an unprivileged Alpine image.
2. **Health Check Probe**: Verify \`/api/health\` responds within 2 seconds.
3. **Traffic Shifting**: Deploy new revision, route 10% traffic for smoke tests, then scale to 100%.`
  }
];
