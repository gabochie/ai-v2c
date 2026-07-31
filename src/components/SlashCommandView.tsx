import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Copy,
  Check,
  Sparkles,
  Command,
  RefreshCw,
  Code2
} from 'lucide-react';
import { SlashCommand } from '../types';

interface SlashCommandViewProps {
  commands: SlashCommand[];
  onExecuteCommand: (commandPrompt: string) => void;
  darkMode: boolean;
}

export const SlashCommandView: React.FC<SlashCommandViewProps> = ({
  commands,
  onExecuteCommand,
  darkMode,
}) => {
  const [selectedCommand, setSelectedCommand] = useState<SlashCommand>(commands[0]);
  const [customInput, setCustomInput] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [outputResult, setOutputResult] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleRunCommand = async () => {
    if (!customInput.trim() || isExecuting) return;

    const fullPrompt = `${selectedCommand.template}\n${customInput.trim()}`;
    setIsExecuting(true);
    setOutputResult('Executing slash command via Gemini AI Engine...');

    try {
      const response = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentRole: 'Slash Command Engine',
          systemPrompt: 'You are an automated AI Engineering Slash Command Processor. Respond directly with clean markdown output, formatted code blocks, and crisp explanations.',
          prompt: fullPrompt,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.details || data.error);

      setOutputResult(data.reply || 'Execution complete.');
    } catch (err: unknown) {
      const error = err as Error;
      setOutputResult(`⚠️ Slash Command Error: ${error.message || 'Failed to process command.'}`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyResult = () => {
    navigator.clipboard.writeText(outputResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Command Selector Cards */}
      <div>
        <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Terminal className="w-4 h-4 text-indigo-500" />
          Slash Command Library ({commands.length} Core Commands)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {commands.map((cmd) => {
            const isSelected = selectedCommand.command === cmd.command;
            return (
              <div
                key={cmd.command}
                onClick={() => {
                  setSelectedCommand(cmd);
                  setOutputResult('');
                }}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/10'
                    : darkMode
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-indigo-400">{cmd.command}</span>
                  <span className="text-[10px] font-mono text-slate-500">{cmd.category}</span>
                </div>
                <h4 className="font-bold text-xs">{cmd.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cmd.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Terminal Execution Box */}
      <div className={`p-5 rounded-2xl border font-mono space-y-4 ${
        darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-xs text-slate-400 ml-2">Terminal Execution Mode</span>
          </div>

          <span className="text-xs font-bold text-indigo-400">{selectedCommand.command}</span>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">
            Command Payload Input ({selectedCommand.exampleUsage})
          </label>
          <textarea
            rows={4}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Paste code snippet, architectural specification, or requirements here..."
            className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            Executes {selectedCommand.title} via Gemini AI.
          </p>

          <button
            onClick={handleRunCommand}
            disabled={isExecuting || !customInput.trim()}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Execute {selectedCommand.command}</span>
          </button>
        </div>

        {/* Output Console Box */}
        {outputResult && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">Command Output Result:</span>
              <button
                onClick={handleCopyResult}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Output'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-[350px] overflow-y-auto">
              {outputResult}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
