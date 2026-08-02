import { PromptTemplate, TaskDifficulty } from '../types';

export const PROMPT_LIBRARY: PromptTemplate[] = [
  // ARCHITECTURE & SYSTEM DESIGN
  {
    id: 'p-arch-01',
    title: 'Enterprise Microservice Decomposition Blueprint',
    category: 'Architecture',
    tags: ['Microservices', 'System Design', 'Domain-Driven Design', 'Scalability'],
    description: 'Decomposes a monolithic system into domain-bounded microservices with API contracts, database ownership, and event triggers.',
    difficulty: 'Architect',
    usageCount: 420,
    parameters: ['MonolithDescription', 'TargetTechStack', 'ScaleRequirements'],
    promptText: `Act as a Principal Systems Architect. Analyze the following monolithic system and produce a comprehensive Microservices Architecture Plan:

Monolith Overview:
{{MonolithDescription}}

Tech Stack Target: {{TargetTechStack}}
Scale Target: {{ScaleRequirements}}

Required Output Format:
1. Executive Summary & Domain Decomposition Strategy
2. Service Map (Bounded Contexts, Core Responsibilities, Owned Data)
3. Inter-Service Communication Strategy (gRPC vs REST vs Event Bus)
4. Data Strategy (Database-per-service vs Shared Engine, Event Sourcing)
5. Resilience Patterns (Circuit Breakers, Retries, Dead Letter Queues)
6. Mermaid.js Diagram Code for the complete system topology.`
  },
  {
    id: 'p-arch-02',
    title: 'High-Throughput Event-Driven Architecture (EDA)',
    category: 'Architecture',
    tags: ['Kafka', 'Event Sourcing', 'CQRS', 'Redis'],
    description: 'Designs an asynchronous event-driven system with message queues, CQRS, and idempotent event consumers.',
    difficulty: 'Architect',
    usageCount: 310,
    parameters: ['EventSource', 'EventTypes', 'ThroughputTarget'],
    promptText: `Architect an Event-Driven System for handling {{EventSource}} generating {{EventTypes}} at a volume of {{ThroughputTarget}} messages/sec.

Detail:
- Broker Selection & Partitioning Strategy (Kafka / RabbitMQ / PubSub)
- Event Schema Specs (JSON Schema / Protobuf)
- Idempotent Consumer Patterns
- CQRS Read/Write Model Synchronization
- Failure Recovery & Replay Mechanism`
  },
  {
    id: 'p-arch-03',
    title: 'Headless WordPress + Next.js App Router Architecture',
    category: 'Architecture',
    tags: ['WordPress', 'WPGraphQL', 'Next.js', 'JAMstack'],
    description: 'Blueprints a enterprise decoupled WordPress CMS back-end with Next.js frontend, Incremental Static Regeneration (ISR), and custom preview routes.',
    difficulty: 'Senior',
    usageCount: 280,
    parameters: ['SiteType', 'MonthlyTraffic', 'PluginRequirements'],
    promptText: `Design a Headless WordPress + Next.js 15 App Router architecture for a {{SiteType}} handling {{MonthlyTraffic}} monthly visits with key plugins: {{PluginRequirements}}.

Provide:
1. WPGraphQL schema configuration & custom endpoint extensions
2. Next.js App Router caching, ISR revalidation strategy, and Draft Mode Preview API
3. Object caching (Redis) setup & MySQL query optimization for WP
4. Image pipeline (Next/Image + WebP / CDN delivery)`
  },

  // CODE REFACTORING & CLEAN CODE
  {
    id: 'p-refactor-01',
    title: 'TypeScript Strict Refactor & Type Safety Enforcement',
    category: 'Refactoring',
    tags: ['TypeScript', 'Clean Code', 'Type Safety', 'SOLID'],
    description: 'Eliminates `any` types, introduces discriminated unions, immutable state, and strict interface validation.',
    difficulty: 'Senior',
    usageCount: 512,
    parameters: ['CodeSnippet', 'FrameworkContext'],
    promptText: `Refactor the following {{FrameworkContext}} code to adhere to strict TypeScript best practices and SOLID principles:

\`\`\`typescript
{{CodeSnippet}}
\`\`\`

Requirements:
- Remove all 'any' / 'unknown' without type assertions
- Use Discriminated Unions for state management
- Apply Immutable Data Patterns (Readonly)
- Add JSDoc comments for public APIs
- Include error handling with custom Result/Either types`
  },
  {
    id: 'p-refactor-02',
    title: 'React Custom Hook Extraction & Performance Optimization',
    category: 'Refactoring',
    tags: ['React', 'Hooks', 'Performance', 'Memoization'],
    description: 'Extracts bloated inline state and side effects into reusable custom React hooks with zero re-render waste.',
    difficulty: 'Mid',
    usageCount: 380,
    parameters: ['ComponentCode'],
    promptText: `Analyze and refactor this React component to extract custom hooks and optimize render efficiency:

\`\`\`tsx
{{ComponentCode}}
\`\`\`

Deliverables:
1. Extracted custom hook(s) with clean return API
2. Optimized component with memoization where appropriate
3. Detailed explanation of render performance gains`
  },

  // SECURITY & AUDITING
  {
    id: 'p-sec-01',
    title: 'OWASP Top 10 Application Threat Model & Code Audit',
    category: 'Security',
    tags: ['OWASP', 'Penetration Testing', 'XSS', 'SQLi', 'Auth'],
    description: 'Performs deep static security analysis looking for SQL Injection, XSS, CSRF, broken access control, and secret leaks.',
    difficulty: 'Architect',
    usageCount: 610,
    parameters: ['CodeOrApiSpec', 'AuthMechanism'],
    promptText: `Act as a Senior Application Security Auditor. Audit the following code/spec for OWASP vulnerabilities using {{AuthMechanism}}:

\`\`\`
{{CodeOrApiSpec}}
\`\`\`

Perform:
1. Vulnerability Matrix (Severity, Category, CWE ID)
2. Threat Vector Description & Exploit Scenario
3. Remediated Code Patch
4. Defensive Headers & Security Controls Checklist`
  },
  {
    id: 'p-sec-02',
    title: 'JWT Auth with Refresh Tokens & PKCE Flow Design',
    category: 'Security',
    tags: ['OAuth2', 'JWT', 'Cookies', 'PKCE', 'Authentication'],
    description: 'Designs an ultra-secure authentication system with HTTP-only SameSite cookies, refresh token rotation, and PKCE verification.',
    difficulty: 'Senior',
    usageCount: 440,
    parameters: ['BackendFramework', 'FrontendFramework'],
    promptText: `Design a secure Auth system combining {{BackendFramework}} and {{FrontendFramework}}.

Include:
- Token storage strategy (HttpOnly SameSite Cookie vs LocalStorage security comparison)
- Refresh token rotation & fingerprinting logic
- CSRF protection middleware code
- Rate limiting strategy for auth endpoints`
  },

  // DEVOPS & CI/CD
  {
    id: 'p-devops-01',
    title: 'Production Dockerfile & GitHub Actions Multi-Stage Build',
    category: 'DevOps',
    tags: ['Docker', 'CI/CD', 'GitHub Actions', 'Cloud Run'],
    description: 'Creates a hardened, minimal multi-stage Dockerfile and GitHub Actions workflow with caching and security scans.',
    difficulty: 'Senior',
    usageCount: 490,
    parameters: ['AppType', 'TargetEnvironment'],
    promptText: `Generate a production-ready DevOps pipeline for a {{AppType}} deploying to {{TargetEnvironment}}.

Provide:
1. Multi-stage Dockerfile (non-root user, Alpine/Distroless base, Layer caching)
2. GitHub Actions YAML (.github/workflows/deploy.yml) with dependency caching and trivy security scanning
3. Environment variable management setup`
  },
  {
    id: 'p-devops-02',
    title: 'Terraform IaC for Auto-Scaling Cloud Infrastructure',
    category: 'DevOps',
    tags: ['Terraform', 'GCP', 'AWS', 'IaC', 'Cloud Run'],
    description: 'Generates modular Terraform scripts for cloud provisioning with VPC, database, auto-scaling, and SSL.',
    difficulty: 'Architect',
    usageCount: 290,
    parameters: ['CloudProvider', 'ServicesNeeded'],
    promptText: `Write production Terraform scripts for {{CloudProvider}} provisioning: {{ServicesNeeded}}.

Include:
- Modular directory structure (main.tf, variables.tf, outputs.tf)
- Least-privilege IAM roles
- Managed database configuration with SSL
- Auto-scaling rules and health checks`
  },

  // TESTING & QA
  {
    id: 'p-test-01',
    title: 'Playwright E2E Test Suite Generator with Page Object Model',
    category: 'Testing',
    tags: ['Playwright', 'E2E', 'Page Object Model', 'Automation'],
    description: 'Generates robust Playwright E2E tests using Page Object Model (POM) pattern for complex user flows.',
    difficulty: 'Mid',
    usageCount: 350,
    parameters: ['UserFlowDescription', 'BaseUrl'],
    promptText: `Write a Playwright E2E test suite in TypeScript for testing: {{UserFlowDescription}} against {{BaseUrl}}.

Include:
- Page Object Model (POM) class
- Test scenarios (Happy path, validation errors, network failure)
- Fixtures and setup/teardown logic`
  },
  {
    id: 'p-test-02',
    title: 'Vitest Unit & Integration Test Generator with Edge Cases',
    category: 'Testing',
    tags: ['Vitest', 'Unit Testing', 'Mocks', 'Coverage'],
    description: 'Creates 100% coverage unit test suite with mock endpoints, edge cases, and async error handling.',
    difficulty: 'Junior',
    usageCount: 410,
    parameters: ['TargetFunctionOrClass'],
    promptText: `Generate a comprehensive Vitest suite for the following code:

\`\`\`typescript
{{TargetFunctionOrClass}}
\`\`\`

Include:
1. Normal operation specs
2. Boundary condition specs (null, empty, overflows)
3. Async rejection / network error handling
4. Mocking dependencies using vi.fn() and vi.spyOn()`
  },

  // DATABASE & STORAGE
  {
    id: 'p-db-01',
    title: 'Drizzle ORM Schema & Migration Script Generator',
    category: 'Database',
    tags: ['Drizzle', 'PostgreSQL', 'Migrations', 'TypeScript'],
    description: 'Generates type-safe Drizzle ORM schemas with relations, indexes, timestamps, and enum constraints.',
    difficulty: 'Senior',
    usageCount: 530,
    parameters: ['EntitiesDescription', 'DatabaseType'],
    promptText: `Design a Drizzle ORM schema for {{DatabaseType}} based on these business entities:

{{EntitiesDescription}}

Deliverables:
1. \`schema.ts\` with explicit types, foreign keys, and indexes
2. Relations definition using \`relations()\`
3. Sample Drizzle queries (Insert with transaction, Join query with pagination)`
  },
  {
    id: 'p-db-02',
    title: 'PostgreSQL Index Optimization & Query Tuning',
    category: 'Database',
    tags: ['PostgreSQL', 'SQL', 'Indexing', 'Performance'],
    description: 'Analyzes slow SQL queries, EXPLAIN output, and provides B-Tree, GIN, or Partial index recommendations.',
    difficulty: 'Architect',
    usageCount: 370,
    parameters: ['SlowQuery', 'ExplainAnalyzeOutput'],
    promptText: `Analyze the following slow PostgreSQL query and EXPLAIN ANALYZE execution plan:

Query:
\`\`\`sql
{{SlowQuery}}
\`\`\`

Execution Plan:
\`\`\`
{{ExplainAnalyzeOutput}}
\`\`\`

Provide:
1. Bottleneck identification (Seq Scan vs Index Scan, Sort, Hash Join)
2. Targeted index creation statements (Composite, Partial, Covered Index)
3. Optimized query rewrite`
  },

  // FRONTEND & UI/UX
  {
    id: 'p-fe-01',
    title: 'Tailwind CSS Modern Dashboard Layout & Micro-Interactions',
    category: 'Frontend',
    tags: ['Tailwind CSS', 'React', 'Framer Motion', 'UI/UX'],
    description: 'Creates clean responsive dashboard layouts using Tailwind utilities, Framer Motion animations, and dark/light support.',
    difficulty: 'Mid',
    usageCount: 680,
    parameters: ['DashboardPurpose', 'KeyWidgets'],
    promptText: `Design a React component using Tailwind CSS and motion/react for a {{DashboardPurpose}} featuring: {{KeyWidgets}}.

Ensure:
- High contrast accessible color palette
- Responsive grid (mobile-first sm/md/lg/xl)
- Subtle interactive hover and entry transitions
- Clean dark mode support`
  },

  // PROMPT ENGINEERING & SLASH COMMANDS
  {
    id: 'p-ai-01',
    title: 'Custom AI Agent Persona & Guardrails Definition',
    category: 'System Design',
    tags: ['Prompt Engineering', 'AI Agents', 'System Prompt', 'Guardrails'],
    description: 'Crafts specialized AI agent personas with exact boundary constraints, tool calling formats, and fallback behavior.',
    difficulty: 'Architect',
    usageCount: 490,
    parameters: ['AgentRole', 'DomainKnowledge', 'ProhibitedActions'],
    promptText: `Create a comprehensive System Prompt for an AI Agent acting as {{AgentRole}}.

Domain Knowledge: {{DomainKnowledge}}
Forbidden Actions: {{ProhibitedActions}}

Structure:
1. Core Identity & Tone
2. Strict Behavioral Directives
3. Tool Calling Protocol & Output Schema
4. Graceful Fallback Rules when uncertain`
  }
];

// Helper to generate a larger library for display (combining base list with category expansions)
export function getFullPromptLibrary(): PromptTemplate[] {
  const basePrompts = [...PROMPT_LIBRARY];
  const categories: PromptTemplate['category'][] = [
    'Architecture', 'Refactoring', 'Debugging', 'Security', 'DevOps', 'Testing', 'Database', 'Frontend', 'System Design', 'Documentation'
  ];

  // Dynamically ensure high volume of categorized prompt templates
  let counter = 100;
  categories.forEach(cat => {
    for (let i = 1; i <= 18; i++) {
      counter++;
      const id = `p-ext-${counter}`;
      const diffs: TaskDifficulty[] = ['Junior', 'Mid', 'Senior', 'Architect'];
      basePrompts.push({
        id,
        title: `${cat} Module ${i}: ${getPromptTitleForCategory(cat, i)}`,
        category: cat,
        tags: [cat, 'Automation', 'Best Practices', 'Production-Ready'],
        description: `Automated enterprise template for ${cat.toLowerCase()} optimization, security validation, and architectural execution.`,
        difficulty: diffs[i % diffs.length],
        usageCount: Math.floor(Math.random() * 400) + 50,
        parameters: ['CodeContext', 'TargetSpec'],
        promptText: `Act as a Senior ${cat} Specialist. Process the provided context: {{CodeContext}} according to specification: {{TargetSpec}}. Generate clean, tested, production-grade output adhering to SOLID design and OWASP guidelines.`
      });
    }
  });

  return basePrompts;
}

function getPromptTitleForCategory(category: string, index: number): string {
  const titles: Record<string, string[]> = {
    Architecture: ['SaaS Multi-Tenancy Isolator', 'API Gateway Rate Limiter', 'CQRS State Synchronizer', 'Resilient Circuit Breaker', 'Zero-Downtime Migration Pattern', 'Event Sourcing Auditing', 'GraphQL Subscriptions Topology', 'Serverless Edge Caching', 'Domain Event Bus Specification', 'Micro-Frontend Federation Blueprint', 'Multi-Region Failover Architecture', 'Global CDN Route Strategy', 'High-Availability Load Balancer', 'Asynchronous Task Queue Pipeline', 'Websocket Connection Cluster', 'Distributed Lock Engine', 'Sharded Database Topology', 'Service Mesh Gateway Config'],
    Refactoring: ['Functional Immutable Pipeline', 'Async/Await Exception Wrapper', 'DRY Abstraction Refactor', 'Dead Code & Unused Variable Purge', 'Cyclomatic Complexity Reducer', 'Monolithic Class Splitting', 'TypeScript Enum to Const Union', 'Dependency Injection Inversion', 'Strategy Pattern Refactoring', 'State Machine Extraction', 'Memory Leak Triage', 'Clean Code Naming Standardizer', 'Higher-Order Function Wrapper', 'Custom Middleware Extractor', 'Pure Function Isolator', 'Legacy Callback to Promise Transformer', 'Null Check Protection Wrap', 'Optimized Array Processing Chain'],
    Debugging: ['Memory Leak Heap Dump Analysis', 'Async Race Condition Detective', 'Deadlock Detection & Resolution', 'CORS Protocol Troubleshooting', 'Network Timeout Diagnostic', 'Unhandled Promise Rejection Audit', 'React Infinite Loop Solver', 'Database Connection Pool Exhaustion', 'JWT Signature Verification Debugger', 'WebSocket Reconnection Handler', 'Build Asset Bundling Inspector', 'TypeScript Transpilation Error Fixer', 'CPU Spike Profiling Interpreter', 'Stack Overflow Recursion Fixer', 'Serialization Mismatch Fixer', 'Cache Invalidation Bug Resolver', 'Hydration Mismatch Detector', 'Browser Compatibility Polyfill Advisor'],
    Security: ['XSS Input Sanitizer Generator', 'CSRF Token Validator Middleware', 'SQL Injection Guardrail Filter', 'RBAC Permission Matrix Auditor', 'Secrets Leak Prevention Hook', 'API Key Rate Limiting Filter', 'Content Security Policy (CSP) Generator', 'Sanitized File Upload Validator', 'Session Fixation Defense Engine', 'Data Encryption at Rest Wrapper', 'GDPR Data Scrubbing Routine', 'TLS/SSL Certificate Checklist', 'IP Whitelisting & Geo-Fencing', 'Audit Logging & Forensic Tracer', 'Secure Password Hashing Vault', 'OAuth2 Scope Enforcement Guard', 'Security Headers Configurator', 'Third-Party Dependency Vulnerability Scanner'],
    DevOps: ['Kubernetes Helm Chart Builder', 'Prometheus Alerting Rules Config', 'Terraform AWS ECS Cluster Module', 'CI/CD Automated Rollback Pipeline', 'Nginx Reverse Proxy & SSL Script', 'GCP Cloud Run Autoscale Config', 'Cloudflare Workers Edge Deployer', 'Docker Compose Local Stack', 'GitHub Actions Matrix Build', 'ArgoCD GitOps Deployment Spec', 'Server Monitoring Shell Script', 'Systemd Service Unit Generator', 'Database Backup Automation Cron', 'Log Aggregation Vector/Fluentd Config', 'Blue-Green Deployment Script', 'Canary Release Traffic Router', 'Container Security Hardening File', 'Vite Production Build Optimizer'],
    Testing: ['Jest Component Snapshot Suite', 'Cypress Form Validation Suite', 'Artillery Load & Stress Test', 'Mock Service Worker (MSW) Handlers', 'Chaos Engineering Fault Injector', 'Property-Based Testing (Fast-Check)', 'Regression Suite Matrix Builder', 'API Integration Test Suite', 'Performance Benchmark Benchmark.js', 'Mutation Testing Suite Config', 'Accessibility Automated Audit (Axe)', 'Cross-Browser Grid Test Pipeline', 'Unit Test Coverage Assourer', 'Database Seed Test Factory', 'Mock Identity Provider Generator', 'Flaky Test Auto-Retry Wrap', 'End-to-End User Journey Assertion', 'Code Coverage CI Enforcement'],
    Database: ['Postgres Materialized View Refresh', 'MongoDB Aggregation Pipeline', 'Redis Cache Stampede Shield', 'Database Connection Pool Manager', 'Time-Series Partitioning Plan', 'Vector Similarity Search Query', 'SQL Schema Normalization 3NF', 'Full-Text Search Index Config', 'Optimistic Locking Version Column', 'Read Replica Load Balancer', 'Database Seeder with Realistic Data', 'Drizzle Transaction Manager', 'Casading Deletes & Integrity Filter', 'Foreign Key Index Audit', 'Database Migration Rollback Script', 'Cross-Database ETL Pipeline', 'JSONB Document Storage Strategy', 'Geo-Spatial Indexing Query'],
    Frontend: ['Responsive Bento Grid Layout', 'Framer Motion Modal Transition', 'Tailwind Custom Typography Token', 'Accessible ARIA Navigation Bar', 'React Query Infinite Scroll Feed', 'Virtual Windowing Long List (TanStack)', 'Dark Mode Theme Provider Switch', 'Form State Management (React Hook Form)', 'Canvas Interactive Renderer', 'SVG Icon System Component', 'Optimistic UI State Modifier', 'Keyboard Shortcut Hook System', 'Toast Notification Manager', 'Breadcrumb & Route History', 'CSS Grid Multi-Panel Workspace', 'Responsive Drawer Sidebar', 'Skeleton Loader Shimmer Component', 'Image Lazy Loader with Blur Hash'],
    SystemDesign: ['Distributed Rate Limiter (Token Bucket)', 'URL Shortener Storage & Hashing', 'Real-time Chat Protocol Specification', 'Notification Service Routing Architecture', 'E-Commerce Shopping Cart Lock System', 'Collaborative Canvas Operational Transform', 'Video Streaming HLS Transcoder Engine', 'RAG Vector Index Pipeline', 'Leaderboard Redis Sorted Set System', 'File Storage S3 Signed URL Uploader', 'Metrics Collector Agent Architecture', 'Search Engine Reverse Index Topology', 'Payment Gateway Webhook Processor', 'Feed Generation Fan-out Service', 'Distributed Cache Write-Through Cache', 'Job Scheduler Worker Cluster', 'Distributed ID Generator (Snowflake)', 'API Rate Limiting Token Bucket Algorithm'],
    Documentation: ['OpenAPI 3.1 Yaml Generator', 'Architecture Decision Record (ADR) Template', 'Developer Onboarding Playbook', 'API Endpoint Integration README', 'System Architecture Mermaid Diagram', 'Release Notes & Changelog Synthesizer', 'Troubleshooting Runbook Guide', 'Database ERD Diagram Markup', 'Postman Collection JSON Builder', 'SDK Client Usage Tutorial', 'Security Compliance Checklist', 'SLA & SLO Metric Documentation', 'Glossary of System Terms', 'Pull Request Template Builder', 'Tech Stack Decision Matrix', 'Environment Variable Setup Document', 'Incident Post-Mortem Template', 'Feature Flag Management Guide']
  };

  const list = titles[category] || [];
  return list[(index - 1) % list.length] || `${category} Specialized Operation ${index}`;
}
