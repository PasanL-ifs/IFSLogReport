import { create } from 'zustand';
import type { LogEntry, LogStats, LogFilters, FileInfo, LogLevel } from '../types';
import { parseLogFile, calculateStats } from '../utils/logParser';

interface LogStore {
  // Data
  entries: LogEntry[];
  stats: LogStats | null;
  fileInfo: FileInfo | null;
  
  // Selection
  selectedEntryId: number | null;
  
  // Filters
  filters: LogFilters;
  
  // Computed
  filteredEntries: LogEntry[];
  
  // Actions
  loadFile: (content: string, fileInfo: FileInfo) => void;
  clearFile: () => void;
  selectEntry: (id: number | null) => void;
  setFilters: (filters: Partial<LogFilters>) => void;
  toggleLevel: (level: LogLevel) => void;
  setSearchQuery: (query: string) => void;
  toggleSourceContext: (context: string) => void;
  toggleExceptionType: (type: string) => void;
  toggleEventName: (name: string) => void;
  toggleShowUnparsed: () => void;
  jumpToNextError: () => void;
  jumpToNextWarning: () => void;
  jumpToPrevError: () => void;
  jumpToPrevWarning: () => void;
  jumpToNextTrace: () => void;
  jumpToPrevTrace: () => void;
}

const defaultFilters: LogFilters = {
  levels: { I: true, W: true, E: true, T: true },
  searchQuery: '',
  sourceContexts: [],
  exceptionTypes: [],
  eventNames: [],
  timeRange: { start: null, end: null },
  showUnparsed: true,
};

function filterEntries(entries: LogEntry[], filters: LogFilters): LogEntry[] {
  return entries.filter(entry => {
    // Filter by level
    if (!filters.levels[entry.level]) return false;
    
    // Filter unparsed entries
    if (!filters.showUnparsed && entry.parseStatus !== 'parsed') return false;
    
    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesMessage = entry.message.toLowerCase().includes(query);
      const matchesSource = entry.sourceContext.toLowerCase().includes(query);
      const matchesException = entry.exceptionMessage?.toLowerCase().includes(query);
      const matchesExceptionType = entry.exceptionType?.toLowerCase().includes(query);
      const matchesStackTrace = entry.stackTrace?.some(line => 
        line.toLowerCase().includes(query)
      );
      const matchesRaw = entry.rawContent.toLowerCase().includes(query);
      const matchesEventName = entry.eventName?.toLowerCase().includes(query);
      
      if (!matchesMessage && !matchesSource && !matchesException && 
          !matchesExceptionType && !matchesStackTrace && !matchesRaw && !matchesEventName) {
        return false;
      }
    }
    
    // Filter by source context
    if (filters.sourceContexts.length > 0) {
      if (!filters.sourceContexts.includes(entry.sourceContext)) {
        return false;
      }
    }
    
    // Filter by exception type (check both primary and nested)
    if (filters.exceptionTypes.length > 0) {
      if (entry.level === 'E') {
        const hasMatchingException = 
          (entry.exceptionType && filters.exceptionTypes.includes(entry.exceptionType)) ||
          (entry.nestedExceptions?.some(ne => filters.exceptionTypes.includes(ne.type)));
        
        if (!hasMatchingException) return false;
      } else {
        return false; // Non-errors don't have exception types
      }
    }
    
    // Filter by event name (for JSONL format)
    if (filters.eventNames.length > 0) {
      if (!entry.eventName || !filters.eventNames.includes(entry.eventName)) {
        return false;
      }
    }
    
    // Filter by time range
    if (filters.timeRange.start && entry.timestamp < filters.timeRange.start) {
      return false;
    }
    if (filters.timeRange.end && entry.timestamp > filters.timeRange.end) {
      return false;
    }
    
    return true;
  });
}

export const useLogStore = create<LogStore>((set, get) => ({
  // Initial state
  entries: [],
  stats: null,
  fileInfo: null,
  selectedEntryId: null,
  filters: defaultFilters,
  filteredEntries: [],
  
  // Actions
  loadFile: (content: string, fileInfo: FileInfo) => {
    const entries = parseLogFile(content);
    const stats = calculateStats(entries);
    const filteredEntries = filterEntries(entries, defaultFilters);
    
    set({
      entries,
      stats,
      fileInfo,
      selectedEntryId: null,
      filters: defaultFilters,
      filteredEntries,
    });
  },
  
  clearFile: () => {
    set({
      entries: [],
      stats: null,
      fileInfo: null,
      selectedEntryId: null,
      filters: defaultFilters,
      filteredEntries: [],
    });
  },
  
  selectEntry: (id: number | null) => {
    set({ selectedEntryId: id });
  },
  
  setFilters: (newFilters: Partial<LogFilters>) => {
    const { entries, filters } = get();
    const updatedFilters = { ...filters, ...newFilters };
    const filteredEntries = filterEntries(entries, updatedFilters);
    
    set({
      filters: updatedFilters,
      filteredEntries,
    });
  },
  
  toggleLevel: (level: LogLevel) => {
    const { filters } = get();
    get().setFilters({
      levels: {
        ...filters.levels,
        [level]: !filters.levels[level],
      },
    });
  },
  
  setSearchQuery: (query: string) => {
    get().setFilters({ searchQuery: query });
  },
  
  toggleSourceContext: (context: string) => {
    const { filters } = get();
    const contexts = filters.sourceContexts.includes(context)
      ? filters.sourceContexts.filter(c => c !== context)
      : [...filters.sourceContexts, context];
    
    get().setFilters({ sourceContexts: contexts });
  },
  
  toggleExceptionType: (type: string) => {
    const { filters } = get();
    const types = filters.exceptionTypes.includes(type)
      ? filters.exceptionTypes.filter(t => t !== type)
      : [...filters.exceptionTypes, type];
    
    get().setFilters({ exceptionTypes: types });
  },
  
  toggleEventName: (name: string) => {
    const { filters } = get();
    const names = filters.eventNames.includes(name)
      ? filters.eventNames.filter(n => n !== name)
      : [...filters.eventNames, name];
    
    get().setFilters({ eventNames: names });
  },
  
  toggleShowUnparsed: () => {
    const { filters } = get();
    get().setFilters({ showUnparsed: !filters.showUnparsed });
  },
  
  jumpToNextError: () => {
    const { filteredEntries, selectedEntryId } = get();
    const errors = filteredEntries.filter(e => e.level === 'E');
    if (errors.length === 0) return;
    
    const currentIndex = errors.findIndex(e => e.id === selectedEntryId);
    const nextIndex = currentIndex < errors.length - 1 ? currentIndex + 1 : 0;
    set({ selectedEntryId: errors[nextIndex].id });
  },
  
  jumpToPrevError: () => {
    const { filteredEntries, selectedEntryId } = get();
    const errors = filteredEntries.filter(e => e.level === 'E');
    if (errors.length === 0) return;
    
    const currentIndex = errors.findIndex(e => e.id === selectedEntryId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : errors.length - 1;
    set({ selectedEntryId: errors[prevIndex].id });
  },
  
  jumpToNextWarning: () => {
    const { filteredEntries, selectedEntryId } = get();
    const warnings = filteredEntries.filter(e => e.level === 'W');
    if (warnings.length === 0) return;
    
    const currentIndex = warnings.findIndex(e => e.id === selectedEntryId);
    const nextIndex = currentIndex < warnings.length - 1 ? currentIndex + 1 : 0;
    set({ selectedEntryId: warnings[nextIndex].id });
  },
  
  jumpToPrevWarning: () => {
    const { filteredEntries, selectedEntryId } = get();
    const warnings = filteredEntries.filter(e => e.level === 'W');
    if (warnings.length === 0) return;
    
    const currentIndex = warnings.findIndex(e => e.id === selectedEntryId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : warnings.length - 1;
    set({ selectedEntryId: warnings[prevIndex].id });
  },
  
  jumpToNextTrace: () => {
    const { filteredEntries, selectedEntryId } = get();
    const traces = filteredEntries.filter(e => e.level === 'T');
    if (traces.length === 0) return;
    
    const currentIndex = traces.findIndex(e => e.id === selectedEntryId);
    const nextIndex = currentIndex < traces.length - 1 ? currentIndex + 1 : 0;
    set({ selectedEntryId: traces[nextIndex].id });
  },
  
  jumpToPrevTrace: () => {
    const { filteredEntries, selectedEntryId } = get();
    const traces = filteredEntries.filter(e => e.level === 'T');
    if (traces.length === 0) return;
    
    const currentIndex = traces.findIndex(e => e.id === selectedEntryId);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : traces.length - 1;
    set({ selectedEntryId: traces[prevIndex].id });
  },
}));
