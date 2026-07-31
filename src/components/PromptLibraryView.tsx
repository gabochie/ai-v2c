import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  Tag,
  Copy,
  Check,
  Zap,
  Filter,
  Play,
  X,
  Code2,
  FileCode,
  Layers
} from 'lucide-react';
import { PromptTemplate, TaskDifficulty } from '../types';

interface PromptLibraryViewProps {
  prompts: PromptTemplate[];
  onExecutePromptWithAgent: (promptText: string) => void;
  darkMode: boolean;
}

export const PromptLibraryView: React.FC<PromptLibraryViewProps> = ({
  prompts,
  onExecutePromptWithAgent,
  darkMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal state for parameter substitution
  const [activeParamPrompt, setActiveParamPrompt] = useState<PromptTemplate | null>(null);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});

  const categories = [
    'All',
    'Architecture',
    'Refactoring',
    'Debugging',
    'Security',
    'DevOps',
    'Testing',
    'Database',
    'Frontend',
    'System Design',
    'Documentation',
  ];

  const filteredPrompts = prompts.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'All' && p.difficulty !== selectedDifficulty) return false;
    if (
      searchQuery &&
      !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const handleCopyPrompt = (prompt: PromptTemplate) => {
    navigator.clipboard.writeText(prompt.promptText);
    setCopiedId(prompt.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenParamModal = (prompt: PromptTemplate) => {
    setActiveParamPrompt(prompt);
    const initialParams: Record<string, string> = {};
    prompt.parameters.forEach((param) => {
      initialParams[param] = '';
    });
    setParamValues(initialParams);
  };

  const handleParamChange = (paramName: string, value: string) => {
    setParamValues((prev) => ({ ...prev, [paramName]: value }));
  };

  const getSubstitutedPromptText = (): string => {
    if (!activeParamPrompt) return '';
    let result = activeParamPrompt.promptText;
    Object.keys(paramValues).forEach((key) => {
      const val = paramValues[key] || `[${key}]`;
      result = result.replaceAll(`{{${key}}}`, val);
    });
    return result;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Filter Bar & Search */}
      <div className={`p-5 rounded-2xl border space-y-4 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Reusable Prompt Repository ({prompts.length}+ Production Prompts)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Select category, inject custom variables, and execute directly with AI Agents
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts by keyword, tag, or topic..."
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        </div>

        {/* Category Pills Slider */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : darkMode
                  ? 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPrompts.slice(0, 48).map((prompt) => (
          <div
            key={prompt.id}
            className={`p-4 rounded-2xl border flex flex-col justify-between transition-all hover:border-indigo-500/50 hover:shadow-lg ${
              darkMode ? 'bg-slate-900/90 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div>
              {/* Header: Category & Difficulty */}
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {prompt.category}
                </span>

                <span className="text-[10px] font-mono text-slate-400">
                  {prompt.difficulty} Level
                </span>
              </div>

              {/* Title */}
              <h4 className="font-bold text-xs leading-snug">{prompt.title}</h4>

              {/* Description */}
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {prompt.description}
              </p>

              {/* Parameters Badge list */}
              {prompt.parameters.length > 0 && (
                <div className="mt-2.5 flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-mono text-slate-500">Variables:</span>
                  {prompt.parameters.map((param) => (
                    <span
                      key={param}
                      className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <button
                onClick={() => handleCopyPrompt(prompt)}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono text-[11px]"
              >
                {copiedId === prompt.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleOpenParamModal(prompt)}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] flex items-center gap-1 shadow-sm"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Fill & Execute</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Parameter Substitution Modal Window */}
      {activeParamPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div
            className={`w-full max-w-2xl max-h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs">{activeParamPrompt.title}</h3>
              </div>
              <button
                onClick={() => setActiveParamPrompt(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-400">{activeParamPrompt.description}</p>

              {/* Variable Inputs */}
              {activeParamPrompt.parameters.map((param) => (
                <div key={param}>
                  <label className="block text-slate-300 font-mono font-medium mb-1">
                    Value for <span className="text-amber-400 font-bold">{`{{${param}}}`}</span>
                  </label>
                  <textarea
                    rows={2}
                    value={paramValues[param] || ''}
                    onChange={(e) => handleParamChange(param, e.target.value)}
                    placeholder={`Provide input value for ${param}...`}
                    className={`w-full px-3 py-2 rounded-xl border outline-none font-mono text-xs ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              ))}

              {/* Substituted Prompt Output Preview */}
              <div>
                <label className="block text-slate-400 font-mono mb-1">
                  Generated Prompt Preview:
                </label>
                <div className={`p-3 rounded-xl border font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap ${
                  darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  {getSubstitutedPromptText()}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setActiveParamPrompt(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const text = getSubstitutedPromptText();
                  onExecutePromptWithAgent(text);
                  setActiveParamPrompt(null);
                }}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute in AI Agent Lab</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
