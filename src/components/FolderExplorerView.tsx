import React, { useState } from 'react';
import {
  FolderTree,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Code
} from 'lucide-react';
import { WorkspaceFile } from '../types';

interface FolderExplorerViewProps {
  files: WorkspaceFile[];
  darkMode: boolean;
}

export const FolderExplorerView: React.FC<FolderExplorerViewProps> = ({
  files,
  darkMode,
}) => {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'f-root': true,
    'f-architecture': true,
    'f-src': true,
  });
  const [selectedFile, setSelectedFile] = useState<WorkspaceFile | null>(
    files[0]?.children?.[0]?.children?.[0] || null
  );
  const [copied, setCopied] = useState<boolean>(false);

  const toggleFolder = (id: string) => {
    setOpenFolders((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderTree = (item: WorkspaceFile, depth = 0) => {
    const isOpen = openFolders[item.id];
    const isFolder = item.type === 'folder';

    return (
      <div key={item.id} style={{ paddingLeft: `${depth * 12}px` }}>
        <div
          onClick={() => {
            if (isFolder) toggleFolder(item.id);
            else setSelectedFile(item);
          }}
          className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer text-xs font-mono transition-colors ${
            selectedFile?.id === item.id
              ? 'bg-indigo-600/20 text-indigo-400 font-bold border border-indigo-500/30'
              : darkMode
              ? 'hover:bg-slate-800 text-slate-300'
              : 'hover:bg-slate-100 text-slate-700'
          }`}
        >
          {isFolder ? (
            <>
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              )}
              {isOpen ? (
                <FolderOpen className="w-4 h-4 text-amber-400" />
              ) : (
                <Folder className="w-4 h-4 text-amber-400" />
              )}
            </>
          ) : (
            <>
              <span className="w-3.5 h-3.5" />
              {item.name.endsWith('.md') ? (
                <FileText className="w-4 h-4 text-blue-400" />
              ) : (
                <FileCode className="w-4 h-4 text-indigo-400" />
              )}
            </>
          )}

          <span className="truncate">{item.name}</span>
          {item.size && <span className="ml-auto text-[10px] text-slate-500">{item.size}</span>}
        </div>

        {isFolder && isOpen && item.children && (
          <div className="space-y-0.5 mt-0.5">
            {item.children.map((child) => renderTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className={`p-5 rounded-2xl border grid grid-cols-1 lg:grid-cols-3 gap-6 ${
        darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        {/* Left Column: File Tree Explorer */}
        <div className="space-y-2 lg:border-r lg:pr-6 border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <FolderTree className="w-4 h-4 text-indigo-500" />
            <h3 className="text-xs font-bold font-mono">Workspace Directory Tree</h3>
          </div>

          <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
            {files.map((file) => renderTree(file, 0))}
          </div>
        </div>

        {/* Right Column: Code / Spec Viewer */}
        <div className="lg:col-span-2 flex flex-col justify-between h-[520px]">
          {selectedFile && selectedFile.type === 'file' ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-indigo-400" />
                  <span className="font-bold font-mono text-xs">{selectedFile.path}</span>
                </div>

                <button
                  onClick={() => handleCopy(selectedFile.content || '')}
                  className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-mono flex items-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Content'}</span>
                </button>
              </div>

              <div className={`flex-1 mt-3 p-4 rounded-xl border font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-y-auto ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}>
                {selectedFile.content}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs font-mono">
              <FolderOpen className="w-10 h-10 mb-2 opacity-50 text-amber-400" />
              <span>Select a file from the workspace tree to view its content.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
