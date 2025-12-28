import { FileUpload } from './components/FileUpload';
import { LogViewer } from './components/LogViewer';
import { StatsDashboard } from './components/StatsDashboard';
import { FilterPanel } from './components/FilterPanel';
import { DetailPanel } from './components/DetailPanel';
import { QuickNav } from './components/QuickNav';
import { useLogStore } from './stores/logStore';
import { FileText, Keyboard } from 'lucide-react';

function App() {
  const { fileInfo } = useLogStore();

  return (
    <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
              IFS Log Viewer
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">
              MAUI Application Log Analyzer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {fileInfo && <QuickNav />}
          
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Keyboard className="w-3.5 h-3.5" />
            <span><kbd className="px-1 py-0.5 bg-[var(--bg-panel)] rounded text-[10px]">E</kbd> Error</span>
            <span><kbd className="px-1 py-0.5 bg-[var(--bg-panel)] rounded text-[10px]">W</kbd> Warning</span>
            <span><kbd className="px-1 py-0.5 bg-[var(--bg-panel)] rounded text-[10px]">↑↓</kbd> Navigate</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Panel - Log Viewer */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border-color)]" style={{ flex: '0 0 60%' }}>
          {/* Log Viewer Header */}
          <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
            <span className="text-sm font-medium text-[var(--text-primary)]">Log Entries</span>
            {fileInfo && (
              <span className="text-xs text-[var(--text-secondary)]">
                {useLogStore.getState().filteredEntries.length.toLocaleString()} entries
              </span>
            )}
          </div>
          
          {/* Log Viewer or Upload */}
          {fileInfo ? (
            <LogViewer />
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-md">
                <FileUpload />
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Controls & Details */}
        <div className="flex flex-col overflow-hidden bg-[var(--bg-primary)]" style={{ flex: '0 0 40%' }}>
          <div className="flex-1 flex flex-col overflow-hidden p-4 gap-4">
            {/* File Upload (when file loaded) */}
            {fileInfo && <FileUpload />}
            
            {/* Stats Dashboard */}
            <StatsDashboard />
            
            {/* Filter Panel */}
            {fileInfo && (
              <div className="bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)] p-4">
                <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                  Filters
                </h2>
                <FilterPanel />
              </div>
            )}
            
            {/* Detail Panel */}
            {fileInfo && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <h2 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
                  Log Details
                </h2>
                <div className="flex-1 overflow-auto">
                  <DetailPanel />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-2 px-6 py-2 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] text-xs text-[var(--text-secondary)]">
        <span>IFS Log Viewer</span>
        <span>•</span>
        <span>Built for QA & Development Teams</span>
      </footer>
    </div>
  );
}

export default App;
