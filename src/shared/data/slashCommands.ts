import { SlashCommand } from '../types';

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    command: '/review',
    title: 'Code Review & Security Audit',
    category: 'Engineering Quality',
    description: 'Performs a comprehensive code review checking type safety, logic bugs, performance bottlenecks, and security flaws.',
    template: 'Act as a Senior Tech Lead. Perform an in-depth code review on the following code snippet. Highlight: 1) Logic errors 2) Type safety issues 3) Performance bottlenecks 4) Security risks. Provide rewritten optimized code.\n\nCode:\n',
    exampleUsage: '/review function processPayment(user, amount) { ... }'
  },
  {
    command: '/refactor',
    title: 'Refactor for Clean Code & SOLID',
    category: 'Refactoring',
    description: 'Refactors code to adhere strictly to SOLID principles, DRY, clean component composition, and readability.',
    template: 'Refactor this code according to SOLID principles and TypeScript best practices. Eliminate code smells and improve readability.\n\nCode:\n',
    exampleUsage: '/refactor const items = data.map(x => x.val).filter(Boolean)...'
  },
  {
    command: '/test',
    title: 'Generate Unit & Integration Tests',
    category: 'QA Automation',
    description: 'Generates Vitest / Jest unit tests covering edge cases, happy paths, null values, and async error rejection.',
    template: 'Write a full Vitest test suite for this module. Include unit tests, edge cases, boundary testing, and mocked dependencies.\n\nCode:\n',
    exampleUsage: '/test export function formatCurrency(value, currency) { ... }'
  },
  {
    command: '/audit',
    title: 'OWASP Security Vulnerability Audit',
    category: 'Security',
    description: 'Scans code against OWASP Top 10 vulnerabilities (SQLi, XSS, CSRF, Auth flaws) and provides secure patches.',
    template: 'Perform an OWASP Top 10 Security Audit on this code. List detected vulnerabilities with severity ratings and supply fixed security patches.\n\nCode:\n',
    exampleUsage: '/audit app.post("/login", (req, res) => { ... })'
  },
  {
    command: '/plan',
    title: 'Sprint Task & Feature Breakdown',
    category: 'Planning',
    description: 'Breaks a high-level feature or user request into granular sub-tasks with estimated hours, difficulties, and dependencies.',
    template: 'Break down the following feature request into actionable engineering tasks. For each task specify: Title, Estimated Hours, Difficulty (Junior/Mid/Senior/Architect), and Dependencies.\n\nFeature Request:\n',
    exampleUsage: '/plan Build a multi-tenant OAuth authentication system with refresh tokens.'
  },
  {
    command: '/schema',
    title: 'Database Schema & Migration Spec',
    category: 'Database',
    description: 'Generates normalized SQL / Drizzle ORM schema definitions, foreign key constraints, and performance indexes.',
    template: 'Create a normalized Drizzle ORM PostgreSQL schema for the following business domain. Include tables, foreign keys, enums, and indexes.\n\nDomain Overview:\n',
    exampleUsage: '/schema E-commerce platform with multi-currency subscriptions and user roles.'
  },
  {
    command: '/api',
    title: 'RESTful API Specification',
    category: 'API Design',
    description: 'Creates OpenAPI / REST endpoint specifications with request validation schemas, status codes, and example JSON payloads.',
    template: 'Design a RESTful API specification for the following requirements. Detail endpoints, HTTP verbs, URL params, request body schema, and status responses.\n\nRequirements:\n',
    exampleUsage: '/api User management API with profile upload, role updates, and pagination.'
  },
  {
    command: '/document',
    title: 'Generate Technical JSDoc & README',
    category: 'Documentation',
    description: 'Generates complete JSDoc annotations, function parameters explanation, return types, and usage examples.',
    template: 'Generate comprehensive JSDoc documentation and usage markdown for the following module.\n\nCode:\n',
    exampleUsage: '/document class TokenBucketRateLimiter { ... }'
  }
];
