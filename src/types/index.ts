// Extended to support Trace level from new log formats
export type LogLevel = 'I' | 'W' | 'E' | 'T';
export type ParseStatus = 'parsed' | 'partial' | 'unparsed';

// Log format type detection
export type LogFormatType = 
  | 'original'      // LEVEL TIMESTAMP MESSAGE {SourceContext} (space-separated, YYYY-MM-DD)
  | 'tab-separated' // LEVEL\tTIMESTAMP\tMESSAGE (tab-separated, MM/DD/YYYY)
  | 'jsonl'         // JSON Lines format {"LoggedAt":"...","Name":"..."}
  | 'unknown';

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
  formatType?: LogFormatType; // Which format this entry came from
  
  // For errors only
  exceptionType?: string;
  exceptionMessage?: string;
  stackTrace?: string[];
  nestedExceptions?: NestedExceptionInfo[];  // For chained exceptions
  
  // For unparsed entries
  parseError?: string;
  
  // JSONL-specific fields
  eventName?: string;        // For JSONL format "Name" field
  properties?: Record<string, unknown>;  // For JSONL Properties
}

export interface LogStats {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  trace: number;             // NEW: Track trace entries
  unparsed: number;          // Track unparsed entries
  uniqueExceptionTypes: string[];
  uniqueSourceContexts: string[];
  uniqueEventNames: string[]; // NEW: For JSONL format
  timeRange: { start: Date | null; end: Date | null };
  detectedFormat: LogFormatType; // NEW: What format was detected
}

export interface LogFilters {
  levels: {
    I: boolean;
    W: boolean;
    E: boolean;
    T: boolean;              // NEW: Trace filter
  };
  searchQuery: string;
  sourceContexts: string[];
  exceptionTypes: string[];
  eventNames: string[];      // NEW: For JSONL format filtering
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
