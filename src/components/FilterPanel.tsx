import { useState } from 'react';
import { Search, AlertCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Filter, X, Eye, EyeOff } from 'lucide-react';
import { useLogStore } from '../stores/logStore';

export function FilterPanel() {
  const { 
    filters, 
    stats, 
    toggleLevel, 
    setSearchQuery,
    toggleSourceContext,
    toggleExceptionType,
    toggleShowUnparsed,
    filteredEntries,
  } = useLogStore();
  
  const [showSourceContexts, setShowSourceContexts] = useState(false);
  const [showExceptionTypes, setShowExceptionTypes] = useState(false);
  const [contextSearch, setContextSearch] = useState('');

  if (!stats) return null;

  const filteredContexts = stats.uniqueSourceContexts.filter(ctx =>
    ctx.toLowerCase().includes(contextSearch.toLowerCase())
  );

  const hasActiveFilters = 
    !filters.levels.I || 
    !filters.levels.W || 
    !filters.levels.E || 
    filters.searchQuery || 
    filters.sourceContexts.length > 0 ||
    filters.exceptionTypes.length > 0 ||
    !filters.showUnparsed;

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Search Box */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder="Search logs..."
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-all"
        />
        {filters.searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Level Toggles */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleLevel('E')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all
            ${filters.levels.E 
              ? 'bg-red-500/20 border-red-500/50 text-red-400' 
              : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-secondary)] opacity-50'
            }
          `}
        >
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm font-medium">E</span>
          <span className="text-xs opacity-70">({stats.errors})</span>
        </button>

        <button
          onClick={() => toggleLevel('W')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all
            ${filters.levels.W 
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' 
              : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-secondary)] opacity-50'
            }
          `}
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">W</span>
          <span className="text-xs opacity-70">({stats.warnings})</span>
        </button>

        <button
          onClick={() => toggleLevel('I')}
          className={`
            flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border transition-all
            ${filters.levels.I 
              ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
              : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-secondary)] opacity-50'
            }
          `}
        >
          <Info className="w-4 h-4" />
          <span className="text-sm font-medium">I</span>
          <span className="text-xs opacity-70">({stats.info})</span>
        </button>
      </div>

      {/* Filter Count & Unparsed Toggle */}
      <div className="flex items-center gap-2">
        {hasActiveFilters && (
          <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded-lg">
            <Filter className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-sm text-[var(--text-primary)]">
              Showing <span className="font-bold text-[var(--accent)]">{filteredEntries.length}</span> of {stats.total} entries
            </span>
          </div>
        )}
        
        {stats.unparsed > 0 && (
          <button
            onClick={toggleShowUnparsed}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
              ${filters.showUnparsed 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' 
                : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-secondary)]'
              }
            `}
            title={filters.showUnparsed ? 'Hide unparsed entries' : 'Show unparsed entries'}
          >
            {filters.showUnparsed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className="text-xs">{stats.unparsed}</span>
          </button>
        )}
      </div>

      {/* Source Context Filter */}
      <div className="bg-[var(--bg-panel)] rounded-lg border border-[var(--border-color)] overflow-hidden">
        <button
          onClick={() => setShowSourceContexts(!showSourceContexts)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
        >
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Source Context
            {filters.sourceContexts.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-[var(--accent)]/20 text-[var(--accent)] rounded">
                {filters.sourceContexts.length}
              </span>
            )}
          </span>
          {showSourceContexts ? (
            <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
          )}
        </button>
        
        {showSourceContexts && (
          <div className="border-t border-[var(--border-color)]">
            <div className="p-2">
              <input
                type="text"
                placeholder="Filter contexts..."
                value={contextSearch}
                onChange={(e) => setContextSearch(e.target.value)}
                className="w-full px-2 py-1.5 text-sm bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto px-2 pb-2">
              {filteredContexts.map(ctx => {
                const className = ctx.split('.').pop() || ctx;
                const isSelected = filters.sourceContexts.includes(ctx);
                
                return (
                  <label
                    key={ctx}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-hover)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSourceContext(ctx)}
                      className="w-3.5 h-3.5 rounded border-[var(--border-color)] bg-[var(--bg-secondary)] checked:bg-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
                    />
                    <span className="text-xs text-[var(--text-primary)] truncate" title={ctx}>
                      {className}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Exception Type Filter */}
      {stats.uniqueExceptionTypes.length > 0 && (
        <div className="bg-[var(--bg-panel)] rounded-lg border border-[var(--border-color)] overflow-hidden">
          <button
            onClick={() => setShowExceptionTypes(!showExceptionTypes)}
            className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors"
          >
            <span className="text-sm font-medium text-[var(--text-primary)]">
              Exception Types
              {filters.exceptionTypes.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded">
                  {filters.exceptionTypes.length}
                </span>
              )}
            </span>
            {showExceptionTypes ? (
              <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
            )}
          </button>
          
          {showExceptionTypes && (
            <div className="border-t border-[var(--border-color)] max-h-48 overflow-y-auto p-2">
              {stats.uniqueExceptionTypes.map(type => {
                const shortType = type.replace('System.', '').replace('Ifs.Cloud.Client.Exceptions.', '');
                const isSelected = filters.exceptionTypes.includes(type);
                
                return (
                  <label
                    key={type}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--bg-hover)] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleExceptionType(type)}
                      className="w-3.5 h-3.5 rounded border-[var(--border-color)] bg-[var(--bg-secondary)] checked:bg-red-500 focus:ring-red-500 focus:ring-offset-0"
                    />
                    <span className="text-xs text-red-400 truncate" title={type}>
                      {shortType}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
