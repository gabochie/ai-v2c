import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Bot,
  Zap,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  ShieldAlert,
  Kanban,
  Sparkles
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Task, Sprint, Agent, ViewMode } from '../types';

interface DashboardViewProps {
  tasks: Task[];
  sprints: Sprint[];
  agents: Agent[];
  onViewChange: (view: ViewMode) => void;
  onSelectTask: (task: Task) => void;
  onNewTaskClick: () => void;
  darkMode: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  sprints,
  agents,
  onViewChange,
  onSelectTask,
  onNewTaskClick,
  darkMode,
}) => {
  // Metric Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = tasks.filter((t) => t.status === 'todo').length;
  const backlogTasks = tasks.filter((t) => t.status === 'backlog').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedHours = tasks
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

  // Identify blocked tasks
  const blockedTasks = tasks.filter((t) => {
    if (t.status === 'completed' || !t.dependencies || t.dependencies.length === 0) return false;
    const parentTasks = tasks.filter((pt) => t.dependencies.includes(pt.id));
    return parentTasks.some((pt) => pt.status !== 'completed');
  });

  // Difficulty Distribution Chart Data
  const difficultyCounts: Record<string, number> = {
    Junior: 0,
    Mid: 0,
    Senior: 0,
    Architect: 0,
    Principal: 0,
  };
  tasks.forEach((t) => {
    if (difficultyCounts[t.difficulty] !== undefined) {
      difficultyCounts[t.difficulty]++;
    }
  });

  const difficultyData = Object.keys(difficultyCounts).map((key) => ({
    name: key,
    value: difficultyCounts[key],
  }));

  const DIFFICULTY_COLORS = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899'];

  // Status Breakdown Chart Data
  const statusData = [
    { name: 'Completed', count: completedTasks, color: '#10b981' },
    { name: 'In Progress', count: inProgressTasks, color: '#f97316' },
    { name: 'To Do', count: todoTasks, color: '#3b82f6' },
    { name: 'Backlog', count: backlogTasks, color: '#64748b' },
  ];

  const activeSprint = sprints.find((s) => s.status === 'active') || sprints[0];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Metric Cards - Professional Polish KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1: Timeline / Progress */}
        <div
          className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Project Progress</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-extrabold tracking-tight">{completionRate}%</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold">{completedTasks} / {totalTasks} Tasks</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-3 rounded-full overflow-hidden">
            <div className="bg-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${completionRate}%` }}></div>
          </div>
        </div>

        {/* Metric 2: Active Workload */}
        <div
          className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Active Engineering Labor</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-extrabold tracking-tight">{inProgressTasks} Tasks</span>
            <span className="text-slate-500 text-xs font-medium">{completedHours}h of {totalEstimatedHours}h</span>
          </div>
          <div className="flex gap-1 mt-3">
            <div className="h-2 flex-1 bg-slate-900 dark:bg-orange-500 rounded-sm"></div>
            <div className="h-2 flex-1 bg-slate-900 dark:bg-orange-500 rounded-sm"></div>
            <div className="h-2 flex-1 bg-slate-900 dark:bg-orange-500 rounded-sm"></div>
            <div className="h-2 flex-1 bg-slate-200 dark:bg-slate-800 rounded-sm"></div>
          </div>
        </div>

        {/* Metric 3: System Blockers */}
        <div
          className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Safety & Dependencies</p>
          <div className="flex items-end justify-between">
            <span className={`text-3xl font-extrabold tracking-tight ${blockedTasks.length > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
              {blockedTasks.length}
            </span>
            <span className="text-slate-500 text-xs font-medium">System Bottlenecks</span>
          </div>
          <p className={`text-xs font-bold mt-3 ${blockedTasks.length > 0 ? 'text-amber-500 underline cursor-pointer' : 'text-emerald-600'}`}>
            {blockedTasks.length > 0 ? 'Review Prerequisites' : '100% Dependency Clear'}
          </p>
        </div>

        {/* Metric 4: AI Agent Fleet */}
        <div
          className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">AI Agent Roster</p>
          <div className="flex items-end justify-between">
            <span className="text-3xl font-extrabold tracking-tight">{agents.length}</span>
            <span className="text-slate-500 text-xs font-medium">Active Personas</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 mt-3 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full w-[100%] rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Active Sprint Banner */}
      {activeSprint && (
        <div className={`p-6 rounded-xl border shadow-sm relative overflow-hidden ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-2.5 py-0.5 bg-orange-500 text-white text-xs font-bold rounded uppercase tracking-wider">
                  ACTIVE SPRINT
                </span>
                <span className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider">
                  {activeSprint.startDate} → {activeSprint.endDate}
                </span>
              </div>
              <h3 className="text-lg font-bold">{activeSprint.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{activeSprint.goal}</p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Sprint Velocity</p>
                <p className="text-xl font-extrabold text-orange-500 font-mono">
                  {activeSprint.completedPoints} / {activeSprint.totalPoints} pts
                </p>
              </div>
              <button
                onClick={() => onViewChange('sprints')}
                className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <span>OPEN SPRINT BOARD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Priority Task Table & Material / Activity Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Tasks Table - 2 Cols */}
        <div className={`lg:col-span-2 rounded-xl border shadow-sm flex flex-col ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm tracking-tight uppercase text-slate-700 dark:text-slate-200">Priority Engineering Task List</h3>
            <button onClick={() => onViewChange('sprints')} className="text-xs font-bold text-blue-600 hover:underline">
              View Schedule
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Task Name</th>
                  <th className="px-5 py-3">Difficulty</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tasks.slice(0, 6).map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-slate-100 max-w-xs truncate">
                      {task.title}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {task.difficulty}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`font-bold ${
                        task.priority === 'Critical' ? 'text-red-600 dark:text-red-400' :
                        task.priority === 'High' ? 'text-orange-600 dark:text-orange-400' : 'text-slate-600 dark:text-slate-400'
                      }`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        task.status === 'completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400' :
                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400' :
                        task.status === 'review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/10 dark:text-purple-400' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dark Slate Material Feed & System Telemetry - Professional Polish Style */}
        <div className="bg-slate-900 rounded-xl p-6 text-white border border-slate-800 shadow-md flex flex-col justify-between space-y-6">
          <div>
            <h3 className="font-bold text-sm tracking-wide uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              Agent Telemetry & Logs
            </h3>

            <div className="space-y-5">
              <div className="relative pl-5 border-l border-slate-700">
                <div className="absolute -left-1 top-0.5 w-2 h-2 rounded-full bg-blue-500"></div>
                <p className="text-[10px] text-slate-400 font-mono font-bold">08:42 AM • ARCHITECT AGENT</p>
                <p className="text-xs font-semibold text-slate-100 mt-0.5">ADR-004 Event-Driven Microservices Approved</p>
                <p className="text-[10px] text-slate-400">Architecture Decision Log Updated</p>
              </div>

              <div className="relative pl-5 border-l border-slate-700">
                <div className="absolute -left-1 top-0.5 w-2 h-2 rounded-full bg-orange-500"></div>
                <p className="text-[10px] text-slate-400 font-mono font-bold">09:15 AM • DEVSECOPS AGENT</p>
                <p className="text-xs font-semibold text-slate-100 mt-0.5">Security Audit Pipeline Complete</p>
                <p className="text-[10px] text-slate-400">0 Critical Vulnerabilities Detected</p>
              </div>

              <div className="relative pl-5 border-l border-slate-700">
                <div className="absolute -left-1 top-0.5 w-2 h-2 rounded-full bg-emerald-500"></div>
                <p className="text-[10px] text-slate-400 font-mono font-bold">10:00 AM • SPRINT SYSTEM</p>
                <p className="text-xs font-semibold text-slate-100 mt-0.5">Sprint 01 Progress at 78%</p>
                <p className="text-[10px] text-slate-400">On Track for Release Goal</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={onNewTaskClick}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20"
            >
              + ADD ENGINE TASK
            </button>
          </div>
        </div>
      </div>

      {/* Visual Telemetry Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Bar Chart */}
        <div className={`p-5 rounded-xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Status Distribution</h3>
            <span className="text-xs font-mono text-slate-400 font-bold">{totalTasks} Total Tasks</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <XAxis dataKey="name" stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} />
                <YAxis stroke={darkMode ? '#94a3b8' : '#64748b'} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty Level Distribution Pie Chart */}
        <div className={`p-5 rounded-xl border shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Difficulty Spectrum Breakdown</h3>
            <span className="text-xs font-mono text-slate-400 font-bold">Junior → Principal</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={difficultyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {difficultyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={DIFFICULTY_COLORS[index % DIFFICULTY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: darkMode ? '#0f172a' : '#ffffff',
                    borderColor: darkMode ? '#334155' : '#e2e8f0',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend formatter={(value) => <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
