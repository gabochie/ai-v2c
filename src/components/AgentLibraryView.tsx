import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Shield,
  Code2,
  Terminal,
  RefreshCw,
  Plus,
  UserCheck,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import { Agent, Task } from '../types';

interface AgentLibraryViewProps {
  agents: Agent[];
  onAddTaskFromAgent: (title: string, description: string, agentId: string) => void;
  darkMode: boolean;
}

export const AgentLibraryView: React.FC<AgentLibraryViewProps> = ({
  agents,
  onAddTaskFromAgent,
  darkMode,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<Agent>(agents[0]);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>>([
    {
      role: 'assistant',
      content: `Hello! I am ${agents[0].name}, ${agents[0].role}. How can I assist with your engineering architecture or task planning today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setMessages([
      {
        role: 'assistant',
        content: `Switched agent persona to ${agent.name} (${agent.role}). ${agent.description}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputPrompt.trim() || isLoading) return;

    const userMessage = inputPrompt.trim();
    setInputPrompt('');

    const newHistory = [
      ...messages,
      {
        role: 'user' as const,
        content: userMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentRole: selectedAgent.role,
          systemPrompt: selectedAgent.systemPrompt,
          prompt: userMessage,
          history: newHistory.slice(0, -1), // previous history
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to reach AI Agent');
      }

      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: data.reply || 'No response returned.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: unknown) {
      const error = err as Error;
      setMessages([
        ...newHistory,
        {
          role: 'assistant',
          content: `⚠️ Agent Consultation Note: ${error.message || 'Error communicating with Gemini API.'}\n\nTip: Ensure GEMINI_API_KEY is configured in your project Secrets.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Gallery Grid of AI Personas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Bot className="w-4 h-4 text-indigo-500" />
            AI Engineering Agent Roster ({agents.length} Active Personas)
          </h3>
          <span className="text-xs font-mono text-slate-400">Powered by Gemini AI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {agents.map((agent) => {
            const isSelected = selectedAgent.id === agent.id;
            return (
              <div
                key={agent.id}
                onClick={() => handleSelectAgent(agent)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  isSelected
                    ? 'border-orange-500 ring-2 ring-orange-500/20 bg-slate-800 shadow-lg'
                    : darkMode
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{agent.avatar}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase bg-gradient-to-r ${agent.color} text-white`}>
                    {agent.badge}
                  </span>
                </div>

                <h4 className="font-bold text-xs leading-tight">{agent.name}</h4>
                <p className="text-[10px] text-indigo-400 font-mono mt-0.5">{agent.role}</p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                  {agent.specialty}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Agent Interactive Workspace Console */}
      <div className={`p-5 rounded-2xl border grid grid-cols-1 lg:grid-cols-3 gap-6 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Left Column: Selected Agent Bio & Capabilities */}
        <div className="space-y-4 lg:border-r lg:pr-6 border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-4xl p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              {selectedAgent.avatar}
            </span>
            <div>
              <h3 className="font-extrabold text-base tracking-tight">{selectedAgent.name}</h3>
              <p className="text-xs text-indigo-400 font-mono font-semibold">{selectedAgent.role}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{selectedAgent.title}</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{selectedAgent.description}</p>

          {/* Capabilities List */}
          <div>
            <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
              Core Capabilities
            </h5>
            <div className="space-y-1.5">
              {selectedAgent.capabilities.map((cap, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span>{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* System Prompt View */}
          <div className="pt-2">
            <h5 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              System Instruction Persona
            </h5>
            <div className={`p-3 rounded-xl border text-[11px] font-mono leading-relaxed max-h-36 overflow-y-auto ${
              darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              {selectedAgent.systemPrompt}
            </div>
          </div>
        </div>

        {/* Right Column: Live Chat Workspace */}
        <div className="lg:col-span-2 flex flex-col h-[520px]">
          {/* Chat Header */}
          <div className={`p-3 border-b flex items-center justify-between rounded-t-xl ${
            darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-100/60 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold">Consulting {selectedAgent.name}</span>
            </div>
            <button
              onClick={() => setMessages([])}
              className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Clear Console
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mb-1">
                  <span>{msg.role === 'user' ? 'You' : selectedAgent.name}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed relative group ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : darkMode
                      ? 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                  {msg.role === 'assistant' && (
                    <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleCopyMessage(msg.content, idx)}
                        className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Advice</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => onAddTaskFromAgent(`Advice from ${selectedAgent.name}`, msg.content.slice(0, 300), selectedAgent.id)}
                        className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Convert to Task</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono p-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>{selectedAgent.name} is formulating response via Gemini...</span>
              </div>
            )}
          </div>

          {/* Input Chat Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              placeholder={`Ask ${selectedAgent.name} for technical guidance, code review, or architecture blueprints...`}
              className={`flex-1 px-3.5 py-2.5 rounded-xl border text-xs outline-none transition-all ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
            <button
              type="submit"
              disabled={isLoading || !inputPrompt.trim()}
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
