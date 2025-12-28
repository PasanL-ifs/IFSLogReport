export type LogLevel = 'I' | 'W' | 'E';
export type ParseStatus = 'parsed' | 'partial' | 'unparsed';

export interface NestedExceptionInfo {
  type: string;
  message: string;
  stackTrace: string[];
}

export interface LogEntry {
  id: number;
  level: LogLevel;
  timestamp: Date;
  timestampRaw: string;
  message: string;
  sourceContext: string;
  className: string;
  rawContent: string;        // Full original content (may be multi-line)
  lineNumber: number;
  lineCount: number;         // How many lines this entry spans
  parseStatus: ParseStatus;  // Track parsing success
  
  // For errors only
  exceptionType?: string;
  exceptionMessage?: string;
  stackTrace?: string[];
  nestedExceptions?: NestedExceptionInfo[];  // For chained exceptions
  
  // For unparsed entries
  parseError?: string;
}

export interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  unparsed: number;          // Track unparsed entries
  uniqueExceptionTypes: string[];
  uniqueSourceContexts: string[];
  timeRange: { start: Date | null; end: Date | null };
}

export interface LogFilters {
  levels: {
    I: boolean;
    W: boolean;
    E: boolean;
  };
  searchQuery: string;
  sourceContexts: string[];
  exceptionTypes: string[];
  timeRange: {
    start: Date | null;
    end: Date | null;
  };
  showUnparsed: boolean;     // Toggle for unparsed entries
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: Date;
}
