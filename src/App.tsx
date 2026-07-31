import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SprintPlannerView } from './components/SprintPlannerView';
import { AgentLibraryView } from './components/AgentLibraryView';
import { PromptLibraryView } from './components/PromptLibraryView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { FolderExplorerView } from './components/FolderExplorerView';
import { SlashCommandView } from './components/SlashCommandView';
import { SettingsView } from './components/SettingsView';
import { TaskModal } from './components/TaskModal';
import { ExportImportModal } from './components/ExportImportModal';

import { Task, Sprint, ViewMode, TaskStatus } from './types';
import { INITIAL_TASKS, INITIAL_SPRINTS } from './data/initialTasks';
import { AGENT_LIBRARY } from './data/agentLibrary';
import { getFullPromptLibrary } from './data/promptLibrary';
import { KNOWLEDGE_BASE } from './data/knowledgeBase';
import { SLASH_COMMANDS } from './data/slashCommands';
import { INITIAL_WORKSPACE_FILES } from './data/folderExplorer';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // LocalStorage state persistence initialization
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('ai_eng_os_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch (e) {
      return INITIAL_TASKS;
    }
  });

  const [sprints, setSprints] = useState<Sprint[]>(() => {
    try {
      const saved = localStorage.getItem('ai_eng_os_sprints');
      return saved ? JSON.parse(saved) : INITIAL_SPRINTS;
    } catch (e) {
      return INITIAL_SPRINTS;
    }
  });

  const [activeSprintId, setActiveSprintId] = useState<string>(
    sprints[0]?.id || 'sprint-1'
  );

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState<boolean>(false);

  // Auto-Save Effect
  useEffect(() => {
    try {
      localStorage.setItem('ai_eng_os_tasks', JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('ai_eng_os_sprints', JSON.stringify(sprints));
    } catch (e) {
      console.error('Failed to save sprints to localStorage', e);
    }
  }, [sprints]);

  // Dark Mode CSS class handling
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handlers
  const handleSaveTask = (savedTask: Task) => {
    setTasks((prev) => {
      const exists = prev.some((t) => t.id === savedTask.id);
      if (exists) {
        return prev.map((t) => (t.id === savedTask.id ? savedTask : t));
      }
      return [savedTask, ...prev];
    });
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t))
    );
  };

  const handleAddTaskFromAgentOrADR = (title: string, description: string, agentId?: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description,
      status: 'todo',
      priority: 'High',
      difficulty: 'Senior',
      estimatedHours: 6,
      actualHours: 0,
      assignedAgentId: agentId || AGENT_LIBRARY[0].id,
      sprintId: activeSprintId,
      tags: ['AI-Generated', 'Architecture'],
      dependencies: [],
      notes: description,
      checklist: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingTask(newTask);
    setIsTaskModalOpen(true);
  };

  const handleCreateNewSprint = () => {
    const newSprintNumber = sprints.length + 1;
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      name: `Sprint 0${newSprintNumber}: Strategic Scale & Optimization`,
      goal: 'Execute planned architecture tasks and AI agent recommendations.',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'planned',
      totalPoints: 40,
      completedPoints: 0,
    };
    setSprints([...sprints, newSprint]);
    setActiveSprintId(newSprint.id);
  };

  const handleResetWorkspace = () => {
    if (window.confirm('Reset workspace to initial factory default tasks?')) {
      localStorage.removeItem('ai_eng_os_tasks');
      localStorage.removeItem('ai_eng_os_sprints');
      setTasks(INITIAL_TASKS);
      setSprints(INITIAL_SPRINTS);
      setActiveSprintId(INITIAL_SPRINTS[0].id);
      setIsExportImportOpen(false);
    }
  };

  const activeSprint = sprints.find((s) => s.id === activeSprintId) || sprints[0];
  const activeTaskCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedTaskCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-200 ${
      darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Sidebar Component */}
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        activeTaskCount={activeTaskCount}
        completedTaskCount={completedTaskCount}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header Bar */}
        <Header
          currentView={currentView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNewTaskClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
          activeSprint={activeSprint}
          darkMode={darkMode}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              tasks={tasks}
              sprints={sprints}
              agents={AGENT_LIBRARY}
              onViewChange={setCurrentView}
              onSelectTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onNewTaskClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              darkMode={darkMode}
            />
          )}

          {currentView === 'sprints' && (
            <SprintPlannerView
              tasks={tasks}
              sprints={sprints}
              agents={AGENT_LIBRARY}
              activeSprintId={activeSprintId}
              onSelectSprint={setActiveSprintId}
              onSelectTask={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
              onUpdateTaskStatus={handleUpdateTaskStatus}
              onNewTaskClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              onNewSprintClick={handleCreateNewSprint}
              searchQuery={searchQuery}
              darkMode={darkMode}
            />
          )}

          {currentView === 'agents' && (
            <AgentLibraryView
              agents={AGENT_LIBRARY}
              onAddTaskFromAgent={(title, desc, agentId) =>
                handleAddTaskFromAgentOrADR(title, desc, agentId)
              }
              darkMode={darkMode}
            />
          )}

          {currentView === 'prompts' && (
            <PromptLibraryView
              prompts={getFullPromptLibrary()}
              onExecutePromptWithAgent={(promptText) => {
                setCurrentView('agents');
              }}
              darkMode={darkMode}
            />
          )}

          {currentView === 'knowledge' && (
            <KnowledgeBaseView
              articles={KNOWLEDGE_BASE}
              onAddTaskFromADR={(title, summary) =>
                handleAddTaskFromAgentOrADR(`Action from ${title}`, summary)
              }
              darkMode={darkMode}
            />
          )}

          {currentView === 'explorer' && (
            <FolderExplorerView
              files={INITIAL_WORKSPACE_FILES}
              darkMode={darkMode}
            />
          )}

          {currentView === 'commands' && (
            <SlashCommandView
              commands={SLASH_COMMANDS}
              onExecuteCommand={(promptText) => {
                setCurrentView('agents');
              }}
              darkMode={darkMode}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onOpenExportImport={() => setIsExportImportOpen(true)}
              onResetWorkspace={handleResetWorkspace}
            />
          )}
        </main>
      </div>

      {/* Task Modal Editor */}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          allTasks={tasks}
          sprints={sprints}
          agents={AGENT_LIBRARY}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          darkMode={darkMode}
        />
      )}

      {/* Export / Import Modal */}
      {isExportImportOpen && (
        <ExportImportModal
          tasks={tasks}
          sprints={sprints}
          agents={AGENT_LIBRARY}
          prompts={getFullPromptLibrary()}
          articles={KNOWLEDGE_BASE}
          onImportData={(data) => {
            if (data.tasks) setTasks(data.tasks);
            if (data.sprints && data.sprints.length > 0) setSprints(data.sprints);
          }}
          onResetWorkspace={handleResetWorkspace}
          onClose={() => setIsExportImportOpen(false)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}
