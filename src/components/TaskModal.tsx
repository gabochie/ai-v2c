import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  Tag,
  Plus,
  Trash2,
  ListTodo,
  FileText,
  User,
  Calendar,
  Zap,
  CheckSquare,
  Square,
  Search,
  Check,
  Link as LinkIcon,
  Layers,
  ChevronDown
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskDifficulty, Sprint, Agent, ChecklistItem } from '../types';
import { NotificationService } from '../utils/notificationService';

interface TaskModalProps {
  task: Task | null;
  allTasks: Task[];
  sprints: Sprint[];
  agents: Agent[];
  onSave: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onClose: () => void;
  darkMode: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  allTasks,
  sprints,
  agents,
  onSave,
  onDelete,
  onClose,
  darkMode,
}) => {
  const isEditing = !!task;

  const [title, setTitle] = useState<string>(task?.title || '');
  const [description, setDescription] = useState<string>(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'Medium');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(task?.difficulty || 'Mid');
  const [estimatedHours, setEstimatedHours] = useState<number>(task?.estimatedHours || 4);
  const [actualHours, setActualHours] = useState<number>(task?.actualHours || 0);
  const [assignedAgentId, setAssignedAgentId] = useState<string>(task?.assignedAgentId || agents[0]?.id || '');
  const [sprintId, setSprintId] = useState<string>(task?.sprintId || sprints[0]?.id || '');
  const [tags, setTags] = useState<string[]>(task?.tags || ['Engineering']);
  const [newTag, setNewTag] = useState<string>('');
  const [dependencies, setDependencies] = useState<string[]>(task?.dependencies || []);
  const [dependencySearch, setDependencySearch] = useState<string>('');
  const [notes, setNotes] = useState<string>(task?.notes || '');
  const [dueDate, setDueDate] = useState<string>(
    task?.dueDate || new Date(Date.now() + 18 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task?.checklist || []);
  const [newChecklistText, setNewChecklistText] = useState<string>('');

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleToggleDependency = (depId: string) => {
    setDependencies((prev) =>
      prev.includes(depId) ? prev.filter((d) => d !== depId) : [...prev, depId]
    );
  };

  const handleRemoveDependency = (depId: string) => {
    setDependencies((prev) => prev.filter((d) => d !== depId));
  };

  const handleSelectAllFilteredDependencies = (filteredIds: string[]) => {
    setDependencies((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const handleClearAllDependencies = () => {
    setDependencies([]);
  };

  const handleAddChecklistItem = () => {
    if (newChecklistText.trim()) {
      setChecklist([
        ...checklist,
        { id: `c-${Date.now()}`, text: newChecklistText.trim(), done: false },
      ]);
      setNewChecklistText('');
    }
  };

  const handleToggleChecklistItem = (id: string) => {
    setChecklist(
      checklist.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleRemoveChecklistItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedTask: Task = {
      id: task?.id || `task-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      difficulty,
      estimatedHours: Number(estimatedHours) || 1,
      actualHours: Number(actualHours) || 0,
      assignedAgentId,
      sprintId,
      tags,
      dependencies,
      notes: notes.trim(),
      checklist,
      dueDate,
      createdAt: task?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Trigger local notification for Critical priority or Due date within 24 hours
    NotificationService.evaluateAndNotifyTask(updatedTask, true);

    onSave(updatedTask);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-3xl max-h-[90vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-colors ${
          darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">
                {isEditing ? 'Edit Task Details' : 'Create New Engineering Task'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {isEditing ? `Task ID: ${task.id}` : 'Add task to sprint or backlog'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Title & Description */}
          <div className="space-y-3">
            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Task Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Provision Redis Object Cache Middleware for WP"
                className={`w-full px-3.5 py-2.5 rounded-xl border outline-none transition-all font-medium ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed task functional requirements and objective..."
                className={`w-full px-3.5 py-2 rounded-xl border outline-none transition-all ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-100 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          {/* Grid Attributes: Status, Priority, Difficulty, Assigned Agent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status */}
            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Difficulty Level</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <option value="Junior">Junior (1 pt)</option>
                <option value="Mid">Mid (3 pts)</option>
                <option value="Senior">Senior (5 pts)</option>
                <option value="Architect">Architect (8 pts)</option>
                <option value="Principal">Principal (13 pts)</option>
              </select>
            </div>

            {/* Assigned Agent */}
            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Assigned AI Agent</label>
              <select
                value={assignedAgentId}
                onChange={(e) => setAssignedAgentId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.avatar} {agent.name} ({agent.role.split('(')[0]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Estimates, Sprint & Due Date Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Est. Hours</label>
              <input
                type="number"
                min={1}
                max={100}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Actual Hours</label>
              <input
                type="number"
                min={0}
                max={200}
                value={actualHours}
                onChange={(e) => setActualHours(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-orange-500" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-slate-400 font-mono font-medium mb-1">Sprint</label>
              <select
                value={sprintId}
                onChange={(e) => setSprintId(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-slate-400 font-mono font-medium mb-1">Tags & Categories</label>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono flex items-center gap-1.5"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag (e.g., Security, Docker)..."
                className={`flex-1 px-3 py-1.5 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                Add
              </button>
            </div>
          </div>

          {/* Prerequisites / Task Dependencies Multiselect UI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-slate-400 font-mono font-medium flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-orange-500" />
                <span>Prerequisites / Blocking Dependencies</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold border border-orange-500/20">
                  {dependencies.length} Selected
                </span>
                {dependencies.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllDependencies}
                    className="text-[10px] font-mono text-slate-400 hover:text-red-400 underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>

            {/* Selected Dependency Badges Chips */}
            {dependencies.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap p-2 rounded-xl bg-orange-500/5 border border-orange-500/20 max-h-24 overflow-y-auto">
                {dependencies.map((depId) => {
                  const depTask = allTasks.find((t) => t.id === depId);
                  if (!depTask) return null;
                  return (
                    <span
                      key={depId}
                      className="px-2.5 py-1 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs font-mono flex items-center gap-1.5 shadow-sm"
                    >
                      <Layers className="w-3 h-3 text-orange-500" />
                      <span className="max-w-[200px] truncate font-semibold text-slate-200">
                        {depTask.title}
                      </span>
                      <span className="text-[9px] px-1 py-0.2 rounded bg-slate-900/60 text-slate-300 font-bold">
                        {depTask.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependency(depId)}
                        className="hover:text-red-400 font-bold ml-0.5 text-slate-400 transition-colors"
                        title="Remove dependency"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Multiselect Dropdown & Search Container */}
            <div className={`p-3 rounded-xl border space-y-2.5 ${
              darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              {/* Filter Search Input + Bulk Select Button */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={dependencySearch}
                    onChange={(e) => setDependencySearch(e.target.value)}
                    placeholder="Search existing tasks to set dependency..."
                    className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                      darkMode
                        ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-orange-500'
                        : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-orange-500'
                    }`}
                  />
                </div>

                {(() => {
                  const filtered = allTasks
                    .filter((t) => t.id !== task?.id)
                    .filter((t) =>
                      t.title.toLowerCase().includes(dependencySearch.toLowerCase()) ||
                      t.id.toLowerCase().includes(dependencySearch.toLowerCase())
                    );
                  const filteredIds = filtered.map((t) => t.id);

                  return (
                    <button
                      type="button"
                      onClick={() => handleSelectAllFilteredDependencies(filteredIds)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono whitespace-nowrap"
                    >
                      Select {filtered.length}
                    </button>
                  );
                })()}
              </div>

              {/* Multiselect Options List */}
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1 divide-y divide-slate-700/20">
                {(() => {
                  const availableTasks = allTasks
                    .filter((t) => t.id !== task?.id)
                    .filter((t) =>
                      t.title.toLowerCase().includes(dependencySearch.toLowerCase()) ||
                      t.id.toLowerCase().includes(dependencySearch.toLowerCase())
                    );

                  if (availableTasks.length === 0) {
                    return (
                      <p className="text-[11px] text-slate-400 font-mono text-center py-3">
                        No matching tasks found for dependency selection.
                      </p>
                    );
                  }

                  return availableTasks.map((otherTask) => {
                    const isChecked = dependencies.includes(otherTask.id);
                    return (
                      <div
                        key={otherTask.id}
                        onClick={() => handleToggleDependency(otherTask.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-orange-500/10 border border-orange-500/30'
                            : darkMode
                            ? 'hover:bg-slate-700/40'
                            : 'hover:bg-slate-200/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded text-orange-500 focus:ring-0 cursor-pointer"
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 truncate text-xs">{otherTask.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{otherTask.id} • {otherTask.priority} Priority</p>
                          </div>
                        </div>

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold border ${
                          otherTask.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          otherTask.status === 'in_progress' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          'bg-slate-700/40 text-slate-300 border-slate-600'
                        }`}>
                          {otherTask.status}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Sub-Checklist Items */}
          <div>
            <label className="block text-slate-400 font-mono font-medium mb-1">Sub-Checklist</label>
            <div className="space-y-1.5 mb-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    darkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleChecklistItem(item.id)}
                    className="flex items-center gap-2 text-left"
                  >
                    {item.done ? (
                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    <span className={item.done ? 'line-through text-slate-400' : 'text-slate-200'}>
                      {item.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveChecklistItem(item.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newChecklistText}
                onChange={(e) => setNewChecklistText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddChecklistItem();
                  }
                }}
                placeholder="Add sub-task item..."
                className={`flex-1 px-3 py-1.5 rounded-xl border outline-none ${
                  darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
              <button
                type="button"
                onClick={handleAddChecklistItem}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                + Item
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-400 font-mono font-medium mb-1">
              Engineering Notes & Observations
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record technical decisions, code paths, test findings..."
              className={`w-full px-3.5 py-2 rounded-xl border outline-none font-mono text-xs ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                className="px-3.5 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-medium text-xs flex items-center gap-1.5 border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Task</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/20"
              >
                {isEditing ? 'Save Task Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
