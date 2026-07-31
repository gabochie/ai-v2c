import React from 'react';
import { Settings, HardDrive, Cpu, Moon, Sun, RefreshCw, Shield, Server, Terminal } from 'lucide-react';

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
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className={`p-6 rounded-2xl border space-y-6 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base">AI Engineering OS - System Preferences</h3>
            <p className="text-xs text-slate-400">Configure theme, local persistence engine, and AI model parameters</p>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-slate-800 bg-slate-950/30">
          <div className="flex items-center gap-3">
            {darkMode ? <Moon className="w-5 h-5 text-amber-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            <div>
              <h4 className="font-bold text-xs">Visual Appearance Theme</h4>
              <p className="text-[11px] text-slate-400">Toggle between Dark Luxury and High-Contrast Light Mode</p>
            </div>
          </div>
          <button
            onClick={onToggleDarkMode}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/20"
          >
            {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>

        {/* AI Model Config Info */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-2">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <h4 className="font-bold text-xs">Gemini AI Engine Gateway Configuration</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All AI agent chat requests and slash command pipelines route through server-side Express handlers using the <code className="text-indigo-400 font-mono font-bold">@google/genai</code> SDK with model <code className="text-amber-400 font-mono font-bold">gemini-3.6-flash</code>.
          </p>
          <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Server Proxy Status: Active on Port 3000</span>
          </div>
        </div>

        {/* Local Persistence Config */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/30 space-y-2">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h4 className="font-bold text-xs">Local Persistence & Memory Storage</h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All tasks, sprint progress, custom prompt modifications, and notes are automatically saved to browser <code className="text-emerald-400 font-mono font-bold">localStorage</code> for instant offline access without cloud lock-in.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onOpenExportImport}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
            >
              Export / Backup Workspace State
            </button>
            <button
              onClick={onResetWorkspace}
              className="px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-mono border border-red-500/20"
            >
              Reset to Factory Default Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
