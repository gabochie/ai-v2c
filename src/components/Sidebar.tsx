import React from 'react';
import {
  LayoutDashboard,
  Kanban,
  Bot,
  Sparkles,
  BookOpen,
  FolderTree,
  Terminal,
  Settings,
  Sun,
  Moon,
  Download,
  Upload,
  Cpu,
  Layers
} from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenExportImport: () => void;
  activeTaskCount: number;
  completedTaskCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  darkMode,
  onToggleDarkMode,
  onOpenExportImport,
  activeTaskCount,
  completedTaskCount,
}) => {
  const navItems = [
    { id: 'dashboard' as ViewMode, label: 'Executive Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'sprints' as ViewMode, label: 'Sprint Planner', icon: Kanban, badge: activeTaskCount > 0 ? `${activeTaskCount}` : null },
    { id: 'agents' as ViewMode, label: 'AI Agent Library', icon: Bot, badge: '10' },
    { id: 'prompts' as ViewMode, label: 'Prompt Library (200+)', icon: Sparkles, badge: '200+' },
    { id: 'knowledge' as ViewMode, label: 'Knowledge Base & ADRs', icon: BookOpen, badge: null },
    { id: 'explorer' as ViewMode, label: 'Folder Explorer', icon: FolderTree, badge: null },
    { id: 'commands' as ViewMode, label: 'Slash Commands', icon: Terminal, badge: '8' },
    { id: 'settings' as ViewMode, label: 'System Preferences', icon: Settings, badge: null },
  ];

  return (
    <aside className={`w-64 border-r flex flex-col justify-between select-none transition-colors duration-200 z-20 shrink-0 ${
      darkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-200'
    }`}>
      {/* OS Header Logo - Professional Polish Style */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-white text-base shadow-md shadow-orange-500/20">
              F
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight leading-none text-white flex items-center gap-1">
                FORGE <span className="text-orange-500">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-wider uppercase font-bold">Build Pro v2.4</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
            ENT
          </span>
        </div>

        {/* Navigation Section */}
        <nav className="p-4 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            System Modules
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold border-l-4 border-orange-500 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer & License Card */}
      <div className="p-4 border-t border-slate-800 space-y-3 bg-slate-950/40">
        {/* Sprint Progress Box */}
        <div className="p-3 rounded-lg bg-slate-800 border border-slate-700/60 text-[11px] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Active License</span>
            <span className="text-orange-400 font-bold font-mono text-[10px]">Enterprise</span>
          </div>
          <p className="text-xs font-semibold text-white">Forge Build Pro Engine</p>
          
          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Sprint Velocity</span>
              <span className="text-orange-400 font-bold">
                {activeTaskCount + completedTaskCount > 0
                  ? `${Math.round((completedTaskCount / (activeTaskCount + completedTaskCount)) * 100)}%`
                  : '0%'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-300"
                style={{
                  width: `${
                    activeTaskCount + completedTaskCount > 0
                      ? (completedTaskCount / (activeTaskCount + completedTaskCount)) * 100
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onToggleDarkMode}
            className={`p-2 rounded-md text-xs flex items-center justify-center transition-colors border ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700'
                : 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-700'
            }`}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            onClick={onOpenExportImport}
            className="flex-1 px-3 py-2 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Sync Data</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            System Online
          </span>
          <span>Auto-Saved</span>
        </div>
      </div>
    </aside>
  );
};
