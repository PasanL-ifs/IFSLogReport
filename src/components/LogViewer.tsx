import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react';
import { useLogStore } from '../stores/logStore';
import { getDisplayMessage } from '../utils/logParser';
import type { LogEntry, LogLevel } from '../types';
import { format } from 'date-fns';

// Helper to format timestamp for display - handles both ISO and regular formats
function formatDisplayTimestamp(entry: LogEntry): string {
  // If we have a valid Date object, use it for consistent formatting
  if (entry.timestamp && !isNaN(entry.timestamp.getTime())) {
    return format(entry.timestamp, 'HH:mm:ss');
  }
  
  // Fallback: try to extract time from raw timestamp
  if (entry.timestampRaw) {
    // Check if it's ISO format (contains 'T')
    if (entry.timestampRaw.includes('T')) {
      const match = entry.timestampRaw.match(/T(\d{2}:\d{2}:\d{2})/);
      if (match) return match[1];
    }
    // Regular format: "YYYY-MM-DD HH:MM:SS AM/PM"
    const parts = entry.timestampRaw.split(' ');
    if (parts.length >= 3) {
      return parts.slice(-2).join(' ');
    }
  }
  
  return 'N/A';
}

// Helper to format full date for display
function formatDisplayDate(entry: LogEntry): string {
  if (entry.timestamp && !isNaN(entry.timestamp.getTime())) {
    return format(entry.timestamp, 'yyyy-MM-dd');
  }
  
  if (entry.timestampRaw) {
    // ISO format
    if (entry.timestampRaw.includes('T')) {
      const match = entry.timestampRaw.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    // Regular format
    const parts = entry.timestampRaw.split(' ');
    if (parts.length >= 1) return parts[0];
  }
  
  return '';
}

function LogLevelBadge({ level }: { level: LogLevel }) {
  switch (level) {
    case 'E':
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded bg-red-500/20 text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
        </span>
      );
    case 'W':
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded bg-amber-500/20 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
        </span>
      );
    case 'I':
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded bg-blue-500/20 text-blue-400">
          <Info className="w-3.5 h-3.5" />
        </span>
      );
    case 'T':
      return (
        <span className="flex items-center justify-center w-6 h-6 rounded bg-purple-500/20 text-purple-400">
          <Zap className="w-3.5 h-3.5" />
        </span>
      );
  }
}

function LogRow({ entry, isSelected, onClick }: { 
  entry: LogEntry; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const rowClass = isSelected
    ? 'log-row-selected'
    : entry.level === 'E'
    ? 'log-row-error'
    : entry.level === 'W'
    ? 'log-row-warning'
    : entry.level === 'T'
    ? 'log-row-trace'
    : 'log-row-info';

  // Get clean display message
  const displayMessage = getDisplayMessage(entry);
  const truncatedMessage = displayMessage.length > 80 
    ? displayMessage.substring(0, 80) + '...' 
    : displayMessage;

  // Format timestamp and date for tooltip
  const displayTime = formatDisplayTimestamp(entry);
  const displayDate = formatDisplayDate(entry);
  const fullTimestamp = displayDate ? `${displayDate} ${displayTime}` : displayTime;

  // Get display name (event name or class name)
  const displayName = entry.eventName || entry.className || 'N/A';
  // Shorten long event names for display
  const shortDisplayName = displayName.length > 20 
    ? displayName.split(':').pop()?.trim() || displayName.substring(0, 20) + '...'
    : displayName;

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 cursor-pointer transition-all 
        hover:brightness-110 border-b border-[var(--border-color)]/30
        ${rowClass}
        ${entry.parseStatus !== 'parsed' ? 'opacity-70' : ''}
      `}
    >
      {/* Line Number */}
      <span className="w-12 text-xs text-[var(--text-secondary)] text-right font-mono shrink-0">
        {entry.lineNumber}
        {entry.lineCount > 1 && (
          <span className="text-[var(--text-secondary)]/50 text-[10px]">+{entry.lineCount - 1}</span>
        )}
      </span>

      {/* Level Badge */}
      <LogLevelBadge level={entry.level} />

      {/* Timestamp - fixed width with tooltip for full timestamp */}
      <span 
        className="w-20 text-xs text-[var(--text-secondary)] font-mono shrink-0 text-center"
        title={fullTimestamp}
      >
        {displayTime}
      </span>

      {/* Class Name / Event Name - with proper truncation */}
      <span 
        className="w-36 text-xs text-[var(--accent)] truncate shrink-0" 
        title={displayName}
      >
        {shortDisplayName}
      </span>

      {/* Message */}
      <span className="flex-1 text-sm text-[var(--text-primary)] truncate font-mono min-w-0">
        {truncatedMessage}
      </span>

      {/* Exception Type Badge */}
      {entry.exceptionType && (
        <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded shrink-0">
          {entry.exceptionType.replace('System.', '').replace('Ifs.Cloud.Client.Exceptions.', '')}
        </span>
      )}
      
      {/* Nested Exception Indicator */}
      {entry.nestedExceptions && entry.nestedExceptions.length > 1 && (
        <span className="px-1.5 py-0.5 text-xs bg-orange-500/20 text-orange-400 rounded shrink-0" title="Has nested exceptions">
          +{entry.nestedExceptions.length - 1}
        </span>
      )}

      {/* Format Type Badge (for mixed logs) */}
      {entry.formatType && entry.formatType !== 'original' && (
        <span className="px-1.5 py-0.5 text-[10px] bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded shrink-0" title={`Format: ${entry.formatType}`}>
          {entry.formatType === 'jsonl' ? 'JSON' : entry.formatType === 'tab-separated' ? 'TAB' : ''}
        </span>
      )}
      
      {/* Parse Status Indicator */}
      {entry.parseStatus !== 'parsed' && (
        <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded shrink-0" title={entry.parseError}>
          ⚠
        </span>
      )}
    </div>
  );
}

export function LogViewer() {
  const parentRef = useRef<HTMLDivElement>(null);
  const { filteredEntries, selectedEntryId, selectEntry } = useLogStore();

  const virtualizer = useVirtualizer({
    count: filteredEntries.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44,
    overscan: 20,
  });

  // Scroll to selected entry
  useEffect(() => {
    if (selectedEntryId !== null) {
      const index = filteredEntries.findIndex(e => e.id === selectedEntryId);
      if (index !== -1) {
        virtualizer.scrollToIndex(index, { align: 'center' });
      }
    }
  }, [selectedEntryId, filteredEntries, virtualizer]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const store = useLogStore.getState();
    
    // Don't capture if user is typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        {
          const currentIdx = filteredEntries.findIndex(entry => entry.id === selectedEntryId);
          if (currentIdx < filteredEntries.length - 1) {
            selectEntry(filteredEntries[currentIdx + 1].id);
          }
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        {
          const currentIdx = filteredEntries.findIndex(entry => entry.id === selectedEntryId);
          if (currentIdx > 0) {
            selectEntry(filteredEntries[currentIdx - 1].id);
          }
        }
        break;
      case 'e':
      case 'E':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          store.jumpToNextError();
        }
        break;
      case 'w':
      case 'W':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          store.jumpToNextWarning();
        }
        break;
      case 't':
      case 'T':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          store.jumpToNextTrace();
        }
        break;
    }
  }, [filteredEntries, selectedEntryId, selectEntry]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (filteredEntries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
        <div className="text-center">
          <p className="text-lg">No log entries to display</p>
          <p className="text-sm mt-1">Upload a log file or adjust your filters</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={parentRef} 
      className="flex-1 overflow-auto bg-[var(--bg-secondary)]"
      tabIndex={0}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const entry = filteredEntries[virtualRow.index];
          return (
            <div
              key={entry.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <LogRow
                entry={entry}
                isSelected={entry.id === selectedEntryId}
                onClick={() => selectEntry(entry.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
