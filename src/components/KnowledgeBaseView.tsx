import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Tag,
  FileText,
  User,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Plus,
  Copy,
  Check
} from 'lucide-react';
import { KnowledgeArticle } from '../types';

interface KnowledgeBaseViewProps {
  articles: KnowledgeArticle[];
  onAddTaskFromADR: (title: string, summary: string) => void;
  darkMode: boolean;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  articles,
  onAddTaskFromADR,
  darkMode,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(articles[0] || null);
  const [copied, setCopied] = useState<boolean>(false);

  const categories = [
    'All',
    'ADR',
    'Architecture Guide',
    'Security Policy',
    'Code Standards',
    'Deployment Playbook',
  ];

  const filteredArticles = articles.filter((article) => {
    if (selectedCategory !== 'All' && article.category !== selectedCategory) return false;
    if (
      searchQuery &&
      !article.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !article.summary.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !article.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Search & Category Filter */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold'
                  : darkMode
                  ? 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ADRs and guides..."
            className={`w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          />
        </div>
      </div>

      {/* Main Split Layout: Article List + Reader Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left List Pane */}
        <div className="space-y-3">
          {filteredArticles.map((article) => {
            const isSelected = activeArticle?.id === article.id;
            return (
              <div
                key={article.id}
                onClick={() => setActiveArticle(article)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/10'
                    : darkMode
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-indigo-500/20 text-indigo-400">
                    {article.category}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{article.lastUpdated}</span>
                </div>

                <h4 className="font-bold text-xs leading-snug">{article.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {article.summary}
                </p>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Author: {article.author}</span>
                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? 'text-indigo-400' : 'text-slate-600'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Article Viewer Pane */}
        <div className={`lg:col-span-2 p-6 rounded-2xl border min-h-[550px] flex flex-col justify-between ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {activeArticle ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-600 text-white">
                    {activeArticle.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Updated {activeArticle.lastUpdated} by {activeArticle.author}
                  </span>
                </div>

                <h2 className="text-lg font-extrabold tracking-tight mt-1">{activeArticle.title}</h2>
                <p className="text-xs text-slate-400 mt-1">{activeArticle.summary}</p>

                {/* Tags */}
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  {activeArticle.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Article Content Viewer */}
              <div className={`p-4 rounded-xl border font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {activeArticle.content}
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 flex items-center justify-between">
                <button
                  onClick={() => handleCopyContent(activeArticle.content)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-mono flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Document'}</span>
                </button>

                <button
                  onClick={() => onAddTaskFromADR(activeArticle.title, activeArticle.summary)}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Action Task from ADR</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
              <BookOpen className="w-10 h-10 mb-2 opacity-50" />
              <span>Select an article or ADR to read.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
