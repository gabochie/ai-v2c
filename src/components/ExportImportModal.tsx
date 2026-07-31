import React, { useState } from 'react';
import { Download, Upload, FileText, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { Task, Sprint, Agent, PromptTemplate, KnowledgeArticle } from '../types';

interface ExportImportModalProps {
  tasks: Task[];
  sprints: Sprint[];
  agents: Agent[];
  prompts: PromptTemplate[];
  articles: KnowledgeArticle[];
  onImportData: (data: { tasks?: Task[]; sprints?: Sprint[] }) => void;
  onResetWorkspace: () => void;
  onClose: () => void;
  darkMode: boolean;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  tasks,
  sprints,
  agents,
  prompts,
  articles,
  onImportData,
  onResetWorkspace,
  onClose,
  darkMode,
}) => {
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string>('');

  // Generate JSON backup file download
  const handleExportJson = () => {
    const data = {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      tasks,
      sprints,
      agents,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `ai-engineering-os-backup-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Generate Markdown Sprint Summary Report
  const handleExportMarkdownReport = () => {
    const completed = tasks.filter((t) => t.status === 'completed');
    const inProgress = tasks.filter((t) => t.status === 'in_progress');
    const todo = tasks.filter((t) => t.status === 'todo');

    let report = `# AI Engineering OS - Sprint Progress Report\n`;
    report += `Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n\n`;
    report += `## Summary Metrics\n`;
    report += `- Total Tasks: ${tasks.length}\n`;
    report += `- Completed: ${completed.length} (${Math.round((completed.length / (tasks.length || 1)) * 100)}%)\n`;
    report += `- In Progress: ${inProgress.length}\n`;
    report += `- To Do: ${todo.length}\n\n`;

    report += `## Completed Tasks\n`;
    completed.forEach((t) => {
      report += `- [x] **${t.title}** (${t.difficulty} Level, ${t.estimatedHours}h)\n`;
    });

    report += `\n## In Progress Tasks\n`;
    inProgress.forEach((t) => {
      report += `- [/] **${t.title}** (${t.difficulty} Level, Assigned: ${t.assignedAgentId})\n`;
    });

    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sprint-progress-report-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProcessImport = () => {
    try {
      if (!importJsonText.trim()) return;
      const parsed = JSON.parse(importJsonText);

      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        throw new Error("Invalid backup format. Missing 'tasks' array.");
      }

      onImportData({
        tasks: parsed.tasks,
        sprints: parsed.sprints || [],
      });

      setImportStatus('✅ Workspace restored successfully!');
      setTimeout(() => onClose(), 1200);
    } catch (err: unknown) {
      const error = err as Error;
      setImportStatus(`❌ Import Error: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-xl rounded-2xl border shadow-2xl p-6 space-y-6 ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-base">Export / Import Workspace State</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Buttons */}
        <div className="space-y-3">
          <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Export State & Reports</h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportJson}
              className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON Backup</span>
            </button>

            <button
              onClick={handleExportMarkdownReport}
              className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Export Markdown Report</span>
            </button>
          </div>
        </div>

        {/* Import State Section */}
        <div className="space-y-3 pt-3 border-t border-slate-800">
          <h4 className="text-xs font-mono font-bold uppercase text-slate-400">Import Workspace JSON</h4>

          <textarea
            rows={4}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder="Paste raw backup JSON text here..."
            className={`w-full p-3 rounded-xl border outline-none font-mono text-xs ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />

          {importStatus && <p className="text-xs font-mono font-semibold">{importStatus}</p>}

          <button
            onClick={handleProcessImport}
            disabled={!importJsonText.trim()}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700"
          >
            <Upload className="w-4 h-4 text-indigo-400" />
            <span>Restore Backup State</span>
          </button>
        </div>

        {/* Reset Workspace Danger Button */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onResetWorkspace}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-mono"
          >
            Reset Workspace to Defaults
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
