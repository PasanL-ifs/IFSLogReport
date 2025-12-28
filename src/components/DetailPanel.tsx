import { useState } from 'react';
import { Copy, AlertCircle, Clock, Code, Layers, FileText, ChevronDown, FileCode } from 'lucide-react';
import { useLogStore } from '../stores/logStore';
import { format } from 'date-fns';
import type { NestedExceptionInfo } from '../types';

function StackTraceView({ stackTrace }: { stackTrace: string[] }) {
  return (
    <div className="space-y-1">
      {stackTrace.map((line, idx) => {
        // Parse: "at Namespace.Class.Method(params)"
        const match = line.match(/at\s+([\w.`<>]+)\.(\w+)\((.*)\)/);
        
        if (match) {
          const [, namespace, method, params] = match;
          const parts = namespace.split('.');
          const className = parts.pop();
          const ns = parts.join('.');
          
          return (
            <div key={idx} className="font-mono text-xs leading-relaxed">
              <span className="text-[var(--text-secondary)]">at </span>
              {ns && <span className="text-[var(--text-secondary)]">{ns}.</span>}
              <span className="text-pink-400">{className}</span>
              <span className="text-[var(--text-secondary)]">.</span>
              <span className="text-cyan-400">{method}</span>
              <span className="text-[var(--text-secondary)]">(</span>
              <span className="text-green-400">{params}</span>
              <span className="text-[var(--text-secondary)]">)</span>
            </div>
          );
        }
        
        // Handle special lines like "--- End of stack trace from previous location ---"
        if (line.includes('---')) {
          return (
            <div key={idx} className="font-mono text-xs text-amber-400/70 italic">
              {line}
            </div>
          );
        }
        
        return (
          <div key={idx} className="font-mono text-xs text-[var(--text-secondary)]">
            {line}
          </div>
        );
      })}
    </div>
  );
}

function NestedExceptionsView({ exceptions }: { exceptions: NestedExceptionInfo[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);
  
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-[var(--text-primary)] mb-2">
        Exception Chain ({exceptions.length} exceptions)
      </div>
      {exceptions.map((ex, idx) => (
        <div key={idx} className="bg-[var(--bg-secondary)] rounded-lg border border-red-500/20 overflow-hidden">
          <button
            onClick={() => setExpanded(expanded === idx ? null : idx)}
            className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)]">#{idx + 1}</span>
              <span className="text-sm text-red-400 font-medium">
                {ex.type.replace('System.', '').replace('Ifs.Cloud.Client.Exceptions.', '')}
              </span>
            </div>
            <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${expanded === idx ? 'rotate-180' : ''}`} />
          </button>
          
          {expanded === idx && (
            <div className="px-3 pb-3 border-t border-[var(--border-color)]">
              <div className="mt-2">
                <div className="text-xs text-[var(--text-secondary)] mb-1">Message:</div>
                <div className="text-sm text-[var(--text-primary)] bg-[var(--bg-panel)] p-2 rounded font-mono break-all">
                  {ex.message}
                </div>
              </div>
              {ex.stackTrace.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-[var(--text-secondary)] mb-1">Stack Trace ({ex.stackTrace.length} frames):</div>
                  <div className="max-h-48 overflow-auto bg-[var(--bg-panel)] p-2 rounded">
                    <StackTraceView stackTrace={ex.stackTrace} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function RawContentView({ content }: { content: string }) {
  const [showRaw, setShowRaw] = useState(false);
  const lineCount = content.split('\n').length;
  
  return (
    <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)] overflow-hidden">
      <button
        onClick={() => setShowRaw(!showRaw)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Raw Content</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">{lineCount} lines</span>
          <ChevronDown className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${showRaw ? 'rotate-180' : ''}`} />
        </div>
      </button>
      
      {showRaw && (
        <div className="border-t border-[var(--border-color)]">
          <div className="flex justify-end px-2 py-1 border-b border-[var(--border-color)]">
            <button
              onClick={() => navigator.clipboard.writeText(content)}
              className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              title="Copy raw content"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-[var(--text-primary)] whitespace-pre-wrap overflow-auto max-h-64 bg-[var(--bg-secondary)]">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}

function JsonView({ json }: { json: string }) {
  try {
    const parsed = JSON.parse(json);
    const formatted = JSON.stringify(parsed, null, 2);
    
    // Simple syntax highlighting
    const highlighted = formatted
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
      .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>');
    
    return (
      <pre 
        className="font-mono text-xs leading-relaxed whitespace-pre-wrap"
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    );
  } catch {
    return <pre className="font-mono text-xs text-[var(--text-secondary)]">{json}</pre>;
  }
}

export function DetailPanel() {
  const { selectedEntryId, entries } = useLogStore();
  
  const selectedEntry = entries.find(e => e.id === selectedEntryId);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!selectedEntry) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)]">
        <div className="text-center text-[var(--text-secondary)]">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select a log entry to view details</p>
          <p className="text-xs mt-2 opacity-70">
            Use <kbd className="px-1.5 py-0.5 bg-[var(--bg-hover)] rounded text-xs">↑</kbd> <kbd className="px-1.5 py-0.5 bg-[var(--bg-hover)] rounded text-xs">↓</kbd> to navigate
          </p>
          <p className="text-xs mt-1 opacity-70">
            Press <kbd className="px-1.5 py-0.5 bg-[var(--bg-hover)] rounded text-xs">E</kbd> for next error, <kbd className="px-1.5 py-0.5 bg-[var(--bg-hover)] rounded text-xs">W</kbd> for next warning
          </p>
        </div>
      </div>
    );
  }

  const levelColors = {
    E: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', label: 'Error' },
    W: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', label: 'Warning' },
    I: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', label: 'Info' },
  };

  const levelStyle = levelColors[selectedEntry.level];

  // Extract JSON from the raw content
  const jsonMatch = selectedEntry.rawContent.match(/(\{"SourceContext":[^}]+\})/);
  const metadata = jsonMatch ? jsonMatch[1] : null;

  return (
    <div className="flex-1 flex flex-col gap-3 overflow-hidden animate-slide-in">
      {/* Header */}
      <div className={`p-3 rounded-xl border ${levelStyle.bg} ${levelStyle.border}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${levelStyle.bg} ${levelStyle.text}`}>
              {levelStyle.label}
            </span>
            <span className="text-xs text-[var(--text-secondary)]">
              Line {selectedEntry.lineNumber}
              {selectedEntry.lineCount > 1 && ` (+${selectedEntry.lineCount - 1} lines)`}
            </span>
            {selectedEntry.parseStatus !== 'parsed' && (
              <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded" title={selectedEntry.parseError}>
                {selectedEntry.parseStatus}
              </span>
            )}
          </div>
          <button
            onClick={() => copyToClipboard(selectedEntry.rawContent)}
            className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            title="Copy raw log"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="text-[var(--text-primary)] font-mono">
              {format(selectedEntry.timestamp, 'MMM d, yyyy HH:mm:ss a')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="text-[var(--accent)]" title={selectedEntry.sourceContext}>
              {selectedEntry.className}
            </span>
          </div>
        </div>
      </div>

      {/* Exception Info (for errors) */}
      {selectedEntry.exceptionType && (
        <div className="p-3 bg-[var(--bg-panel)] rounded-xl border border-red-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {selectedEntry.exceptionType}
            </span>
          </div>
          {selectedEntry.exceptionMessage && (
            <p className="text-sm text-[var(--text-primary)] bg-[var(--bg-secondary)] p-2 rounded font-mono break-all">
              {selectedEntry.exceptionMessage}
            </p>
          )}
        </div>
      )}

      {/* Nested Exceptions */}
      {selectedEntry.nestedExceptions && selectedEntry.nestedExceptions.length > 1 && (
        <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)] p-3">
          <NestedExceptionsView exceptions={selectedEntry.nestedExceptions} />
        </div>
      )}

      {/* Stack Trace (for primary exception) */}
      {selectedEntry.stackTrace && selectedEntry.stackTrace.length > 0 && !selectedEntry.nestedExceptions && (
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-[var(--text-secondary)]" />
              <span className="text-sm font-medium text-[var(--text-primary)]">Stack Trace</span>
              <span className="text-xs text-[var(--text-secondary)]">
                ({selectedEntry.stackTrace.length} frames)
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(selectedEntry.stackTrace!.join('\n'))}
              className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              title="Copy stack trace"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3">
            <StackTraceView stackTrace={selectedEntry.stackTrace} />
          </div>
        </div>
      )}

      {/* Message (for non-errors or errors without parsed exception) */}
      {(selectedEntry.level !== 'E' || !selectedEntry.exceptionType) && (
        <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
            <span className="text-sm font-medium text-[var(--text-primary)]">Message</span>
            <button
              onClick={() => copyToClipboard(selectedEntry.message)}
              className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              title="Copy message"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3 max-h-32 overflow-auto">
            <p className="text-sm text-[var(--text-primary)] font-mono whitespace-pre-wrap break-all">
              {selectedEntry.message}
            </p>
          </div>
        </div>
      )}

      {/* Metadata JSON */}
      {metadata && (
        <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)] overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)]">
            <span className="text-sm font-medium text-[var(--text-primary)]">Metadata</span>
            <button
              onClick={() => copyToClipboard(metadata)}
              className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              title="Copy metadata"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="p-3">
            <JsonView json={metadata} />
          </div>
        </div>
      )}

      {/* Raw Content View */}
      <RawContentView content={selectedEntry.rawContent} />
    </div>
  );
}
