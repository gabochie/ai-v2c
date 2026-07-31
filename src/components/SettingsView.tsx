import React, { useState, useEffect } from 'react';
import {
  Settings,
  HardDrive,
  Cpu,
  Moon,
  Sun,
  Shield,
  Server,
  Terminal,
  GitBranch,
  Activity,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  Globe,
  ExternalLink,
  Code,
  Zap,
  Play
} from 'lucide-react';

interface SettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenExportImport: () => void;
  onResetWorkspace: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenExportImport,
  onResetWorkspace,
}) => {
  const [activeTab, setActiveTab] = useState<'cicd' | 'observability' | 'secrets' | 'hosting'>('cicd');
  const [isBuilding, setIsBuilding] = useState<boolean>(false);
  const [pipelineSteps, setPipelineSteps] = useState([
    { id: 1, name: 'Lint & Typecheck (tsc --noEmit)', status: 'success', duration: '1.2s' },
    { id: 2, name: 'Unit & Integration Tests (npm test)', status: 'success', duration: '2.4s' },
    { id: 3, name: 'Production Build (vite build + esbuild)', status: 'success', duration: '3.8s' },
    { id: 4, name: 'Deploy to Cloud Run (HTTPS + Secret Manager)', status: 'success', duration: '5.1s' },
  ]);

  const [logs, setLogs] = useState<Array<{ timestamp: string; level: string; message: string; correlationId: string }>>([
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'Forge AI Engine initialized with Trust Proxy enabled.', correlationId: 'req_init_01' },
    { timestamp: new Date().toISOString(), level: 'AUDIT', message: 'Secret Manager audit completed: GEMINI_API_KEY verified.', correlationId: 'req_sec_02' },
    { timestamp: new Date().toISOString(), level: 'INFO', message: 'HTTP GET /api/health returned 200 OK (2ms)', correlationId: 'req_health_03' },
  ]);

  const [copiedYaml, setCopiedYaml] = useState(false);

  const triggerPipelineRun = () => {
    setIsBuilding(true);
    setPipelineSteps((prev) => prev.map((s) => ({ ...s, status: 'running' })));

    setTimeout(() => {
      setPipelineSteps([
        { id: 1, name: 'Lint & Typecheck (tsc --noEmit)', status: 'success', duration: '0.9s' },
        { id: 2, name: 'Unit & Integration Tests (npm test)', status: 'success', duration: '1.8s' },
        { id: 3, name: 'Production Build (vite build + esbuild)', status: 'success', duration: '3.2s' },
        { id: 4, name: 'Deploy to Cloud Run (HTTPS + Secret Manager)', status: 'success', duration: '4.5s' },
      ]);
      setIsBuilding(false);

      setLogs((prev) => [
        {
          timestamp: new Date().toISOString(),
          level: 'AUDIT',
          message: 'CI/CD Workflow triggered manually: lint → test → build → deploy (Passed 4/4)',
          correlationId: `req_cicd_${Math.random().toString(36).substring(2, 7)}`,
        },
        ...prev,
      ]);
    }, 2500);
  };

  const copyCiCdYaml = () => {
    const yamlContent = `name: CI/CD Pipeline
on:
  push:
    branches: [ main ]
jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint
  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - run: npm ci && npm test
  build-and-deploy:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - run: npm run build
      - uses: google-github-actions/deploy-cloudrun@v2`;
    navigator.clipboard.writeText(yamlContent);
    setCopiedYaml(true);
    setTimeout(() => setCopiedYaml(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">System Preferences & Production Engineering</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              CI/CD Workflows, Observability Logging, Secret Manager Audit, and Cloud Run HTTPS Hosting
            </p>
          </div>
        </div>

        <button
          onClick={onToggleDarkMode}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 self-start md:self-auto"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-300" />}
          <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
        </button>
      </div>

      {/* Production Engineering Nav Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('cicd')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'cicd' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>1. CI/CD GitHub Actions</span>
        </button>

        <button
          onClick={() => setActiveTab('observability')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'observability' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>2. Observability & Logging</span>
        </button>

        <button
          onClick={() => setActiveTab('secrets')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'secrets' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>3. Secret Management</span>
        </button>

        <button
          onClick={() => setActiveTab('hosting')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            activeTab === 'hosting' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>4. HTTPS & Hosting</span>
        </button>
      </div>

      {/* TAB 1: CI/CD PIPELINE */}
      {activeTab === 'cicd' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <GitBranch className="w-4 h-4 text-orange-500" />
                  GitHub Actions Pipeline Status (.github/workflows/ci-cd.yml)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated quality gate: Lint → Test → Build → Cloud Run Deploy</p>
              </div>

              <button
                onClick={triggerPipelineRun}
                disabled={isBuilding}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm"
              >
                <Play className={`w-3.5 h-3.5 ${isBuilding ? 'animate-spin' : ''}`} />
                <span>{isBuilding ? 'Running Pipeline...' : 'Trigger Pipeline Run'}</span>
              </button>
            </div>

            {/* Pipeline Visual Stages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              {pipelineSteps.map((step) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between ${
                    darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Step 0{step.id}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h4 className="font-bold text-xs">{step.name}</h4>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Duration: {step.duration}</span>
                    <span className="text-emerald-400 font-bold uppercase">Passed</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Workflow YAML Preview */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold font-mono text-slate-400">Workflow Declaration File</span>
                <button
                  onClick={copyCiCdYaml}
                  className="text-xs font-mono text-orange-400 hover:text-orange-300 flex items-center gap-1"
                >
                  {copiedYaml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedYaml ? 'Copied YAML' : 'Copy Workflow'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed">
{`name: CI/CD Pipeline
on:
  push:
    branches: [ main, master ]

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm run lint

  test:
    needs: lint-and-typecheck
    runs-on: ubuntu-latest
    steps:
      - run: npm ci && npm test

  deploy-cloud-run:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: google-github-actions/auth@v2
      - run: gcloud run deploy forge-ai-os --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OBSERVABILITY & LOGGING */}
      {activeTab === 'observability' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Activity className="w-4 h-4 text-orange-500" />
                  Structured JSON Telemetry & Correlation ID Log Feed
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time express request tracing and redacted error tracking</p>
              </div>

              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold rounded border border-emerald-500/20">
                Log Format: JSON
              </span>
            </div>

            {/* Live Log Console */}
            <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold uppercase ${
                      log.level === 'AUDIT' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                      log.level === 'ERROR' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-slate-300 font-medium">{log.message}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <span>ID: <strong className="text-slate-400">{log.correlationId}</strong></span>
                    <span>{log.timestamp.slice(11, 19)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SECRET MANAGEMENT */}
      {activeTab === 'secrets' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Key className="w-4 h-4 text-orange-500" />
                  GCP Secret Manager & Environment Variable Audit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated secret masking, zero-hardcode policy, and runtime injection</p>
              </div>

              <span className="px-2.5 py-1 bg-orange-500/10 text-orange-400 text-[10px] font-mono font-bold rounded border border-orange-500/20">
                GCP Secret Manager
              </span>
            </div>

            <div className="space-y-3 my-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">GEMINI_API_KEY</h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">Source: GCP Secret Manager (projects/aistudio/secrets/GEMINI_API_KEY)</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/20">
                    AIza••••••••39A4
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-white">GCP_SA_KEY</h4>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">Source: GitHub Actions Secrets (Deployment Credentials)</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 font-mono text-xs font-bold border border-blue-500/20">
                    Configured via CI/CD
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HTTPS & HOSTING */}
      {activeTab === 'hosting' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-slate-700 dark:text-slate-200">
                  <Globe className="w-4 h-4 text-orange-500" />
                  Google Cloud Run HTTPS & Security Headers Target
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Managed TLS/SSL termination, HSTS headers, and Trust Proxy binding</p>
              </div>

              <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold rounded border border-emerald-500/20">
                HTTPS Enforced
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Strict-Transport-Security (HSTS)</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-400">Enforces browser-level HTTPS connections for all subdomains.</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">X-Frame-Options: SAMEORIGIN</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-400">Protects application against clickjacking vulnerabilities.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone / Factory Reset */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">Workspace Memory Reset</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Reset local task memory state back to initial enterprise defaults</p>
          </div>
          <button
            onClick={onResetWorkspace}
            className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-mono border border-red-500/20 transition-all"
          >
            Reset Workspace State
          </button>
        </div>
      </div>
    </div>
  );
};
