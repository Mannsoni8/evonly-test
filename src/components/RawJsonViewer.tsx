import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Download, Search, Code2 } from 'lucide-react';

interface Props {
  data: unknown;
  title?: string;
  defaultExpanded?: boolean;
}

export const RawJsonViewer: React.FC<Props> = ({
  data,
  title = 'Raw Backend Response (JSON)',
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [copied, setCopied] = useState(false);
  const [filterText, setFilterText] = useState('');

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evolyn-response-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLines = React.useMemo(() => {
    if (!filterText.trim()) return jsonString;
    const lines = jsonString.split('\n');
    return lines
      .filter((line) => line.toLowerCase().includes(filterText.toLowerCase()))
      .join('\n');
  }, [jsonString, filterText]);

  return (
    <div className="border border-slate-200 rounded-xl bg-white shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 text-slate-100 select-none">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold hover:text-white transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-brand-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-brand-400" />
          )}
          <Code2 className="w-4 h-4 text-brand-400" />
          <span>{title}</span>
          <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">
            {jsonString.length} chars
          </span>
        </button>

        <div className="flex items-center gap-2">
          {isExpanded && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter JSON..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="pl-8 pr-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-400 w-36 sm:w-48"
              />
            </div>
          )}

          <button
            onClick={handleCopy}
            title="Copy raw JSON"
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handleDownload}
            title="Download JSON file"
            className="flex items-center gap-1 px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-slate-950 overflow-x-auto max-h-[500px]">
          <pre className="font-mono text-xs text-emerald-400 leading-relaxed whitespace-pre font-normal">
            {filteredLines}
          </pre>
        </div>
      )}
    </div>
  );
};
