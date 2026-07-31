import React, { useState } from 'react';
import {
  Kanban,
  Plus,
  Filter,
  Search,
  AlertTriangle,
  Clock,
  User,
  Tag,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { Task, TaskStatus, TaskDifficulty, TaskPriority, Sprint, Agent } from '../types';

interface SprintPlannerViewProps {
  tasks: Task[];
  sprints: Sprint[];
  agents: Agent[];
  activeSprintId: string;
  onSelectSprint: (sprintId: string) => void;
  onSelectTask: (task: Task) => void;
  onUpdateTaskStatus: (taskId: string, newStatus: TaskStatus) => void;
  onNewTaskClick: () => void;
  onNewSprintClick: () => void;
  searchQuery: string;
  darkMode: boolean;
}

export const SprintPlannerView: React.FC<SprintPlannerViewProps> = ({
  tasks,
  sprints,
  agents,
  activeSprintId,
  onSelectSprint,
  onSelectTask,
  onUpdateTaskStatus,
  onNewTaskClick,
  onNewSprintClick,
  searchQuery,
  darkMode,
}) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('all');

  const currentSprint = sprints.find((s) => s.id === activeSprintId) || sprints[0];

  // Filter tasks for current sprint and search/filter criteria
  const filteredTasks = tasks.filter((t) => {
    if (t.sprintId !== activeSprintId && t.status !== 'backlog') return false;
    if (selectedDifficulty !== 'all' && t.difficulty !== selectedDifficulty) return false;
    if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;
    if (selectedAgentId !== 'all' && t.assignedAgentId !== selectedAgentId) return false;
    if (
      searchQuery &&
      !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'backlog', label: 'Backlog', color: 'border-slate-500/30 text-slate-400' },
    { id: 'todo', label: 'To Do', color: 'border-amber-500/30 text-amber-500' },
    { id: 'in_progress', label: 'In Progress', color: 'border-indigo-500/30 text-indigo-500' },
    { id: 'review', label: 'Code Review', color: 'border-purple-500/30 text-purple-500' },
    { id: 'completed', label: 'Completed', color: 'border-emerald-500/30 text-emerald-500' },
  ];

  const getDifficultyBadge = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
      case 'Junior':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Mid':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Senior':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Architect':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'Principal':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'Low':
        return 'text-slate-400 bg-slate-800/40';
      case 'Medium':
        return 'text-blue-400 bg-blue-500/10';
      case 'High':
        return 'text-amber-400 bg-amber-500/10';
      case 'Critical':
        return 'text-red-400 bg-red-500/10 font-bold';
    }
  };

  const shiftStatus = (currentStatus: TaskStatus, direction: 'next' | 'prev'): TaskStatus => {
    const order: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'completed'];
    const idx = order.indexOf(currentStatus);
    if (direction === 'next' && idx < order.length - 1) return order[idx + 1];
    if (direction === 'prev' && idx > 0) return order[idx - 1];
    return currentStatus;
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Sprint Header & Filter Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Sprint Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <select
              value={activeSprintId}
              onChange={(e) => onSelectSprint(e.target.value)}
              className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onNewSprintClick}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Sprint</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <Filter className="w-4 h-4 text-slate-400" />

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg border outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">All Difficulties</option>
            <option value="Junior">Junior</option>
            <option value="Mid">Mid</option>
            <option value="Senior">Senior</option>
            <option value="Architect">Architect</option>
            <option value="Principal">Principal</option>
          </select>

          {/* Priority Filter */}
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg border outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          {/* Agent Filter */}
          <select
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
            className={`px-2.5 py-1.5 rounded-lg border outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">All Assigned Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.avatar} {a.name}
              </option>
            ))}
          </select>

          <button
            onClick={onNewTaskClick}
            className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Kanban Board 5 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start">
        {columns.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className={`p-3 rounded-2xl border flex flex-col gap-3 min-h-[650px] transition-colors ${
                darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-100/70 border-slate-200'
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-2 py-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    col.id === 'completed' ? 'bg-emerald-500' :
                    col.id === 'in_progress' ? 'bg-indigo-500' :
                    col.id === 'review' ? 'bg-purple-500' :
                    col.id === 'todo' ? 'bg-amber-500' : 'bg-slate-500'
                  }`} />
                  <h3 className="font-bold text-xs tracking-tight">{col.label}</h3>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-600'
                }`}>
                  {columnTasks.length}
                </span>
              </div>

              {/* Task Cards Stack */}
              <div className="space-y-3 flex-1">
                {columnTasks.length === 0 ? (
                  <div className={`p-4 rounded-xl border border-dashed text-center ${
                    darkMode ? 'border-slate-800 text-slate-600' : 'border-slate-300 text-slate-400'
                  }`}>
                    <p className="text-[11px] font-mono">No tasks in {col.label}</p>
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const assignedAgent = agents.find((a) => a.id === task.assignedAgentId);

                    // Check for blocked dependencies
                    const isBlocked = task.dependencies && task.dependencies.length > 0 &&
                      task.dependencies.some((depId) => {
                        const parent = tasks.find((t) => t.id === depId);
                        return parent && parent.status !== 'completed';
                      });

                    return (
                      <div
                        key={task.id}
                        className={`p-3.5 rounded-xl border transition-all duration-200 hover:shadow-lg hover:border-indigo-500/50 group relative ${
                          darkMode ? 'bg-slate-800/90 border-slate-700/80 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        {/* Card Header: Difficulty & Priority */}
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getDifficultyBadge(task.difficulty)}`}>
                            {task.difficulty}
                          </span>

                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${
                              task.priority === 'Critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-extrabold animate-pulse'
                                : getPriorityBadge(task.priority)
                            }`}>
                              {task.priority === 'Critical' ? '🚨 Critical' : task.priority}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <h4
                          onClick={() => onSelectTask(task)}
                          className="font-bold text-xs leading-snug cursor-pointer group-hover:text-indigo-400 transition-colors line-clamp-2"
                        >
                          {task.title}
                        </h4>

                        {/* Description Preview */}
                        {task.description && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Blocked Warning Badge */}
                        {isBlocked && (
                          <div className="mt-2 flex items-center gap-1.5 p-1.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px]">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Prerequisite tasks pending</span>
                          </div>
                        )}

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap mt-2">
                            {task.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-700/30 text-slate-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Due Date Badge */}
                        {task.dueDate && (
                          <div className={`mt-2 flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border w-fit ${
                            (new Date(task.dueDate).getTime() - Date.now()) <= 24 * 3600 * 1000
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold'
                              : 'bg-slate-700/20 text-slate-400 border-slate-700/30'
                          }`}>
                            <Calendar className="w-3 h-3 text-orange-400" />
                            <span>Due: {task.dueDate}</span>
                            {(new Date(task.dueDate).getTime() - Date.now()) <= 24 * 3600 * 1000 && (
                              <span className="text-[9px] text-amber-400 font-extrabold ml-0.5 font-mono">(&lt;24h)</span>
                            )}
                          </div>
                        )}

                        {/* Footer: Hours, Agent Avatar & Shift Controls */}
                        <div className="mt-3 pt-2.5 border-t border-slate-700/30 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              {task.estimatedHours}h
                            </span>
                            {assignedAgent && (
                              <span className="flex items-center gap-1 text-[10px]" title={assignedAgent.role}>
                                <span>{assignedAgent.avatar}</span>
                              </span>
                            )}
                          </div>

                          {/* Shift Buttons */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            {col.id !== 'backlog' && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, shiftStatus(task.status, 'prev'))}
                                className="p-1 rounded bg-slate-700/50 hover:bg-slate-700 text-slate-300"
                                title="Move Back"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {col.id !== 'completed' && (
                              <button
                                onClick={() => onUpdateTaskStatus(task.id, shiftStatus(task.status, 'next'))}
                                className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                                title="Advance Task Status"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
