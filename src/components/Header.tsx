import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, Clock, Sparkles, Filter, X } from 'lucide-react';
import { ViewMode, Sprint } from '../types';

interface HeaderProps {
  currentView: ViewMode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNewTaskClick: () => void;
  activeSprint: Sprint | null;
  darkMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  searchQuery,
  onSearchChange,
  onNewTaskClick,
  activeSprint,
  darkMode,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const viewTitles: Record<ViewMode, { title: string; subtitle: string }> = {
    dashboard: {
      title: 'Executive Dashboard & Telemetry',
      subtitle: 'Real-time engineering progress, velocity metrics, and system bottlenecks',
    },
    sprints: {
      title: 'Sprint Planner & Kanban Workspace',
      subtitle: 'Manage active sprints, task dependencies, difficulty estimates, and backlogs',
    },
    agents: {
      title: 'AI Agent Ecosystem',
      subtitle: '10+ specialized personas (CEO, CTO, WP Architect, DevSecOps, QA)',
    },
    prompts: {
      title: 'Prompt Library (200+ Templates)',
      subtitle: 'Production-ready system prompts, code refactoring templates, and architectural specs',
    },
    knowledge: {
      title: 'Knowledge Base & Architecture Decision Records',
      subtitle: 'ADRs, security policies, coding standards, and deployment playbooks',
    },
    explorer: {
      title: 'Workspace Folder Explorer',
      subtitle: 'Browse project files, system architecture specs, and code snippets',
    },
    commands: {
      title: 'Slash Command Terminal',
      subtitle: 'Executable commands (/review, /refactor, /test, /audit, /plan, /schema)',
    },
    settings: {
      title: 'System Settings & Export',
      subtitle: 'Configure local storage persistence, theme themes, and JSON backup sync',
    },
  };

  const { title, subtitle } = viewTitles[currentView] || {
    title: 'AI Engineering OS',
    subtitle: 'Enterprise Workspace',
  };

  return (
    <header
      className={`h-16 px-6 border-b flex items-center justify-between gap-4 transition-colors duration-200 z-10 shrink-0 ${
        darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Title & View Context */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h2>
            {activeSprint && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded uppercase tracking-wider border border-emerald-300 dark:border-emerald-500/20">
                <Calendar className="w-3 h-3" />
                IN PROGRESS
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="flex items-center gap-3">
        {/* Global Search Bar */}
        <div className="relative w-44 sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search workspace..."
            className={`w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border outline-none transition-all ${
              darkMode
                ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* System Time Badge */}
        <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border ${
          darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
        }`}>
          <Clock className="w-3.5 h-3.5 text-orange-500" />
          <span>{timeString}</span>
        </div>

        {/* User Info Badge */}
        <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Lead Architect</p>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">Marcus Thorne</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-orange-500 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            MT
          </div>
        </div>

        {/* Create Task Button */}
        <button
          onClick={onNewTaskClick}
          className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>
    </header>
  );
};
