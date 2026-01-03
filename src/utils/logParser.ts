import type { LogEntry, LogLevel, LogStats, NestedExceptionInfo, LogFormatType } from '../types';

// ============================================================================
// FORMAT DETECTION PATTERNS
// ============================================================================

// Original format: LEVEL TIMESTAMP MESSAGE (space-separated, YYYY-MM-DD)
const ORIGINAL_FORMAT_START = /^([IWE])\s+(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)\s+/;

// Tab-separated format: LEVEL\tTIMESTAMP\tMESSAGE (MM/DD/YYYY)
const TAB_FORMAT_START = /^([IWET])\t(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)\t/;

// JSON Lines format: starts with {"LoggedAt" or {"
const JSONL_FORMAT = /^\s*\{.*"LoggedAt"/;

// Pattern to extract SourceContext JSON at the end
const SOURCE_CONTEXT_PATTERN = /\{"SourceContext":"([^"]+)"\}\s*$/;

// ============================================================================
// FORMAT DETECTION
// ============================================================================

/**
 * Detect the log format type from file content
 */
export function detectLogFormat(content: string): LogFormatType {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return 'unknown';
  
  // Check first few non-empty lines to determine format
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Check for JSONL format first (most distinctive)
    if (JSONL_FORMAT.test(line)) {
      return 'jsonl';
    }
    
    // Check for tab-separated format
    if (TAB_FORMAT_START.test(line)) {
      return 'tab-separated';
    }
    
    // Check for original format
    if (ORIGINAL_FORMAT_START.test(line)) {
      return 'original';
    }
  }
  
  return 'unknown';
}

// ============================================================================
// TIMESTAMP PARSING
// ============================================================================

/**
 * Parse timestamp string to Date object - handles multiple formats
 */
function parseTimestamp(ts: string): Date {
  try {
    // Try YYYY-MM-DD format first (original format)
    let parts = ts.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
    if (parts) {
      const [, year, month, day, hourStr, minute, second, ampm] = parts;
      let hour = parseInt(hourStr, 10);
      if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      else if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        hour,
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }
    
    // Try MM/DD/YYYY format (tab-separated format)
    parts = ts.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
    if (parts) {
      const [, month, day, year, hourStr, minute, second, ampm] = parts;
      let hour = parseInt(hourStr, 10);
      if (ampm.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      else if (ampm.toUpperCase() === 'AM' && hour === 12) hour = 0;
      return new Date(
        parseInt(year, 10),
        parseInt(month, 10) - 1,
        parseInt(day, 10),
        hour,
        parseInt(minute, 10),
        parseInt(second, 10)
      );
    }
    
    // Fallback: try native Date parsing
    return new Date(ts);
  } catch {
    return new Date();
  }
}

/**
 * Parse ISO 8601 timestamp (for JSONL format)
 */
function parseISOTimestamp(ts: string): Date {
  try {
    return new Date(ts);
  } catch {
    return new Date();
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract class name from full namespace path
 */
function extractClassName(sourceContext: string): string {
  const parts = sourceContext.split('.');
  return parts[parts.length - 1] || sourceContext;
}

/**
 * Parse stack trace string into array of lines
 */
function parseStackTrace(trace: string): string[] {
  if (!trace) return [];
  return trace
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Parse all nested exceptions from error message content
 */
function parseNestedExceptions(content: string): NestedExceptionInfo[] {
  const exceptions: NestedExceptionInfo[] = [];
  const pattern = /<([\w.]+(?:Exception|Error))><Message>([\s\S]*?)<\/Message>(?:<StackTrace>([\s\S]*?)<\/StackTrace>)?/g;
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    exceptions.push({
      type: match[1],
      message: match[2].trim(),
      stackTrace: match[3] ? parseStackTrace(match[3]) : [],
    });
  }
  
  return exceptions;
}

/**
 * Extract the primary exception info from error content
 */
function extractPrimaryException(content: string): {
  type: string;
  message: string;
  stackTrace: string[];
} | null {
  // Handle both escaped and non-escaped XML tags
  const unescapedContent = content
    .replace(/\\</g, '<')
    .replace(/\\>/g, '>')
    .replace(/\\\//g, '/');
  
  // Find the outermost exception
  const match = unescapedContent.match(/<([\w.]+(?:Exception|Error))><Message>([\s\S]*?)<\/Message>/);
  if (!match) return null;
  
  const type = match[1];
  const message = match[2].trim();
  
  // Find the stack trace for this specific exception
  const fullPattern = new RegExp(
    `<${type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}><Message>[\\s\\S]*?</Message><StackTrace>([\\s\\S]*?)</StackTrace>`,
    'i'
  );
  const stackMatch = unescapedContent.match(fullPattern);
  const stackTrace = stackMatch ? parseStackTrace(stackMatch[1]) : [];
  
  return { type, message, stackTrace };
}

// ============================================================================
// ORIGINAL FORMAT PARSER
// ============================================================================

/**
 * Parse entry in original format (space-separated, YYYY-MM-DD)
 */
function parseOriginalFormatEntry(
  rawContent: string,
  lineNumber: number,
  lineCount: number,
  id: number
): LogEntry {
  const lines = rawContent.split(/\r?\n/);
  const firstLine = lines[0];
  
  const startMatch = firstLine.match(ORIGINAL_FORMAT_START);
  
  if (!startMatch) {
    return createUnparsedEntry(rawContent, lineNumber, lineCount, id, 'Could not identify log entry start pattern');
  }
  
  const level = startMatch[1] as LogLevel;
  const timestampRaw = startMatch[2];
  const timestamp = parseTimestamp(timestampRaw);
  
  const afterTimestamp = firstLine.substring(startMatch[0].length);
  const fullContent = lineCount > 1 
    ? afterTimestamp + '\n' + lines.slice(1).join('\n')
    : afterTimestamp;
  
  const sourceMatch = fullContent.match(SOURCE_CONTEXT_PATTERN);
  const sourceContext = sourceMatch ? sourceMatch[1] : '';
  const className = sourceContext ? extractClassName(sourceContext) : '';
  
  let message = sourceMatch 
    ? fullContent.substring(0, fullContent.lastIndexOf('{"SourceContext":')).trim()
    : fullContent.trim();
  
  const entry: LogEntry = {
    id,
    level,
    timestamp,
    timestampRaw,
    message,
    sourceContext: sourceContext || 'N/A',
    className: className || 'N/A',
    rawContent,
    lineNumber,
    lineCount,
    parseStatus: 'parsed',
    formatType: 'original',
  };
  
  // Parse exceptions for error entries
  if (level === 'E' && message.includes('<') && message.includes('Exception')) {
    parseExceptionDetails(entry, message);
  }
  
  return entry;
}

// ============================================================================
// TAB-SEPARATED FORMAT PARSER
// ============================================================================

/**
 * Parse entry in tab-separated format (MM/DD/YYYY)
 */
function parseTabFormatEntry(
  rawContent: string,
  lineNumber: number,
  lineCount: number,
  id: number
): LogEntry {
  const lines = rawContent.split(/\r?\n/);
  const firstLine = lines[0];
  
  // Split by tabs
  const tabParts = firstLine.split('\t');
  
  if (tabParts.length < 3) {
    return createUnparsedEntry(rawContent, lineNumber, lineCount, id, 'Invalid tab-separated format');
  }
  
  const levelStr = tabParts[0].trim();
  const timestampRaw = tabParts[1].trim();
  const message = tabParts.slice(2).join('\t').trim();
  
  // Validate level
  if (!['I', 'W', 'E', 'T'].includes(levelStr)) {
    return createUnparsedEntry(rawContent, lineNumber, lineCount, id, `Unknown level: ${levelStr}`);
  }
  
  const level = levelStr as LogLevel;
  const timestamp = parseTimestamp(timestampRaw);
  
  // For multi-line entries, append remaining lines
  const fullMessage = lineCount > 1 
    ? message + '\n' + lines.slice(1).join('\n')
    : message;
  
  // Try to extract source from Server Response JSON if present
  let sourceContext = 'N/A';
  let className = 'N/A';
  
  if (fullMessage.startsWith('Server Response:')) {
    sourceContext = 'ServerResponse';
    className = 'ServerResponse';
  } else if (fullMessage.startsWith('SyncTrace')) {
    sourceContext = 'SyncTrace';
    className = 'SyncTrace';
  } else {
    // Use the message itself as context for simple logs
    const simpleName = fullMessage.split(' ')[0].replace(/[^a-zA-Z]/g, '');
    if (simpleName) {
      sourceContext = simpleName;
      className = simpleName;
    }
  }
  
  const entry: LogEntry = {
    id,
    level,
    timestamp,
    timestampRaw,
    message: fullMessage,
    sourceContext,
    className,
    rawContent,
    lineNumber,
    lineCount,
    parseStatus: 'parsed',
    formatType: 'tab-separated',
  };
  
  return entry;
}

// ============================================================================
// JSONL FORMAT PARSER
// ============================================================================

/**
 * Parse a single JSON Lines entry
 */
function parseJSONLEntry(
  line: string,
  lineNumber: number,
  id: number
): LogEntry {
  try {
    // Remove trailing comma if present
    const cleanLine = line.trim().replace(/,\s*$/, '');
    const json = JSON.parse(cleanLine);
    
    const loggedAt = json.LoggedAt || json.loggedAt || '';
    const name = json.Name || json.name || 'Unknown';
    const properties = json.Properties || json.properties || {};
    
    const timestamp = parseISOTimestamp(loggedAt);
    
    // Determine level from event name and properties
    let level: LogLevel = 'I';
    let exceptionInfo: { type?: string; message?: string; stackTrace?: string[] } = {};
    
    if (name === 'Exception' || properties.Exception) {
      level = 'E';
      // Parse exception from properties
      const exceptionXml = properties.Exception || '';
      const parsed = extractPrimaryException(exceptionXml);
      if (parsed) {
        exceptionInfo = parsed;
      }
    } else if (name.includes('failure') || name.includes('Failure')) {
      level = 'W';
    }
    
    // Create a readable message
    let message = name;
    if (properties && Object.keys(properties).length > 0) {
      // For exceptions, show the message
      if (exceptionInfo.message) {
        message = `${name}: ${exceptionInfo.message}`;
      } else {
        // For others, show relevant properties
        const propSummary = Object.entries(properties)
          .filter(([k]) => k !== 'Exception')
          .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
          .join(', ');
        if (propSummary) {
          message = `${name} (${propSummary})`;
        }
      }
    }
    
    const entry: LogEntry = {
      id,
      level,
      timestamp,
      timestampRaw: loggedAt,
      message,
      sourceContext: name,
      className: name.split(':')[0].replace(/\s+/g, ''),
      rawContent: line,
      lineNumber,
      lineCount: 1,
      parseStatus: 'parsed',
      formatType: 'jsonl',
      eventName: name,
      properties,
    };
    
    if (exceptionInfo.type) {
      entry.exceptionType = exceptionInfo.type;
      entry.exceptionMessage = exceptionInfo.message;
      entry.stackTrace = exceptionInfo.stackTrace;
      
      // Check for nested exceptions
      const exceptionXml = properties.Exception || '';
      const unescaped = exceptionXml.replace(/\\</g, '<').replace(/\\>/g, '>').replace(/\\\//g, '/');
      const allExceptions = parseNestedExceptions(unescaped);
      if (allExceptions.length > 1) {
        entry.nestedExceptions = allExceptions;
      }
    }
    
    return entry;
  } catch (e) {
    return createUnparsedEntry(line, lineNumber, 1, id, `Invalid JSON: ${e instanceof Error ? e.message : 'Parse error'}`);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create an unparsed entry placeholder
 */
function createUnparsedEntry(
  rawContent: string,
  lineNumber: number,
  lineCount: number,
  id: number,
  error: string
): LogEntry {
  return {
    id,
    level: 'I',
    timestamp: new Date(),
    timestampRaw: '',
    message: rawContent.substring(0, 200) + (rawContent.length > 200 ? '...' : ''),
    sourceContext: 'Unknown',
    className: 'Unknown',
    rawContent,
    lineNumber,
    lineCount,
    parseStatus: 'unparsed',
    parseError: error,
  };
}

/**
 * Parse exception details and add to entry
 */
function parseExceptionDetails(entry: LogEntry, message: string): void {
  const primaryException = extractPrimaryException(message);
  
  if (primaryException) {
    entry.exceptionType = primaryException.type;
    entry.exceptionMessage = primaryException.message;
    entry.stackTrace = primaryException.stackTrace;
    
    const allExceptions = parseNestedExceptions(message);
    if (allExceptions.length > 1) {
      entry.nestedExceptions = allExceptions;
    }
  } else {
    entry.parseStatus = 'partial';
    entry.parseError = 'Could not parse exception details';
  }
}

// ============================================================================
// MAIN PARSER FUNCTIONS
// ============================================================================

/**
 * Parse original format file (space-separated)
 */
function parseOriginalFormat(content: string): LogEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: LogEntry[] = [];
  const entryBlocks: { startLine: number; endLine: number; content: string }[] = [];
  let currentBlockStart = -1;
  let currentBlockLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (currentBlockStart === -1 && !line.trim()) continue;
    
    const isNewEntry = ORIGINAL_FORMAT_START.test(line);
    
    if (isNewEntry) {
      if (currentBlockStart !== -1 && currentBlockLines.length > 0) {
        entryBlocks.push({
          startLine: currentBlockStart,
          endLine: i,
          content: currentBlockLines.join('\n'),
        });
      }
      currentBlockStart = i + 1;
      currentBlockLines = [line];
    } else if (currentBlockStart !== -1) {
      currentBlockLines.push(line);
    }
  }
  
  if (currentBlockStart !== -1 && currentBlockLines.length > 0) {
    entryBlocks.push({
      startLine: currentBlockStart,
      endLine: lines.length,
      content: currentBlockLines.join('\n'),
    });
  }
  
  for (let i = 0; i < entryBlocks.length; i++) {
    const block = entryBlocks[i];
    const entry = parseOriginalFormatEntry(
      block.content,
      block.startLine,
      block.endLine - block.startLine + 1,
      i
    );
    entries.push(entry);
  }
  
  return entries;
}

/**
 * Parse tab-separated format file
 */
function parseTabFormat(content: string): LogEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: LogEntry[] = [];
  const entryBlocks: { startLine: number; endLine: number; content: string }[] = [];
  let currentBlockStart = -1;
  let currentBlockLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (currentBlockStart === -1 && !line.trim()) continue;
    
    const isNewEntry = TAB_FORMAT_START.test(line);
    
    if (isNewEntry) {
      if (currentBlockStart !== -1 && currentBlockLines.length > 0) {
        entryBlocks.push({
          startLine: currentBlockStart,
          endLine: i,
          content: currentBlockLines.join('\n'),
        });
      }
      currentBlockStart = i + 1;
      currentBlockLines = [line];
    } else if (currentBlockStart !== -1) {
      currentBlockLines.push(line);
    }
  }
  
  if (currentBlockStart !== -1 && currentBlockLines.length > 0) {
    entryBlocks.push({
      startLine: currentBlockStart,
      endLine: lines.length,
      content: currentBlockLines.join('\n'),
    });
  }
  
  for (let i = 0; i < entryBlocks.length; i++) {
    const block = entryBlocks[i];
    const entry = parseTabFormatEntry(
      block.content,
      block.startLine,
      block.endLine - block.startLine + 1,
      i
    );
    entries.push(entry);
  }
  
  return entries;
}

/**
 * Parse JSON Lines format file
 */
function parseJSONLFormat(content: string): LogEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: LogEntry[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const entry = parseJSONLEntry(line, i + 1, entries.length);
    entries.push(entry);
  }
  
  return entries;
}

/**
 * Main parser function - auto-detects format and parses accordingly
 */
export function parseLogFile(content: string): LogEntry[] {
  const format = detectLogFormat(content);
  
  switch (format) {
    case 'jsonl':
      return parseJSONLFormat(content);
    case 'tab-separated':
      return parseTabFormat(content);
    case 'original':
      return parseOriginalFormat(content);
    default:
      // Try all parsers and use the one that produces results
      const tabResult = parseTabFormat(content);
      if (tabResult.length > 0 && tabResult.some(e => e.parseStatus === 'parsed')) {
        return tabResult;
      }
      
      const originalResult = parseOriginalFormat(content);
      if (originalResult.length > 0 && originalResult.some(e => e.parseStatus === 'parsed')) {
        return originalResult;
      }
      
      const jsonlResult = parseJSONLFormat(content);
      if (jsonlResult.length > 0 && jsonlResult.some(e => e.parseStatus === 'parsed')) {
        return jsonlResult;
      }
      
      // Return whatever we got
      return tabResult.length > 0 ? tabResult : [];
  }
}

// ============================================================================
// STATISTICS
// ============================================================================

/**
 * Calculate statistics from log entries
 */
export function calculateStats(entries: LogEntry[]): LogStats {
  const stats: LogStats = {
    total: entries.length,
    errors: 0,
    warnings: 0,
    info: 0,
    trace: 0,
    unparsed: 0,
    uniqueExceptionTypes: [],
    uniqueSourceContexts: [],
    uniqueEventNames: [],
    timeRange: { start: null, end: null },
    detectedFormat: 'unknown',
  };
  
  const exceptionTypeSet = new Set<string>();
  const sourceContextSet = new Set<string>();
  const eventNameSet = new Set<string>();
  const formatCounts: Record<string, number> = {};
  
  for (const entry of entries) {
    // Count by level
    switch (entry.level) {
      case 'E':
        stats.errors++;
        if (entry.exceptionType) {
          exceptionTypeSet.add(entry.exceptionType);
        }
        if (entry.nestedExceptions) {
          entry.nestedExceptions.forEach(ne => exceptionTypeSet.add(ne.type));
        }
        break;
      case 'W':
        stats.warnings++;
        break;
      case 'I':
        stats.info++;
        break;
      case 'T':
        stats.trace++;
        break;
    }
    
    // Count unparsed/partial
    if (entry.parseStatus !== 'parsed') {
      stats.unparsed++;
    }
    
    // Track format types
    if (entry.formatType) {
      formatCounts[entry.formatType] = (formatCounts[entry.formatType] || 0) + 1;
    }
    
    // Collect source contexts
    if (entry.sourceContext && entry.sourceContext !== 'Unknown' && entry.sourceContext !== 'N/A') {
      sourceContextSet.add(entry.sourceContext);
    }
    
    // Collect event names (for JSONL)
    if (entry.eventName) {
      eventNameSet.add(entry.eventName);
    }
    
    // Update time range
    if (entry.timestamp && !isNaN(entry.timestamp.getTime())) {
      if (!stats.timeRange.start || entry.timestamp < stats.timeRange.start) {
        stats.timeRange.start = entry.timestamp;
      }
      if (!stats.timeRange.end || entry.timestamp > stats.timeRange.end) {
        stats.timeRange.end = entry.timestamp;
      }
    }
  }
  
  // Determine primary format
  const formatEntries = Object.entries(formatCounts);
  if (formatEntries.length > 0) {
    formatEntries.sort((a, b) => b[1] - a[1]);
    stats.detectedFormat = formatEntries[0][0] as LogFormatType;
  }
  
  stats.uniqueExceptionTypes = Array.from(exceptionTypeSet).sort();
  stats.uniqueSourceContexts = Array.from(sourceContextSet).sort();
  stats.uniqueEventNames = Array.from(eventNameSet).sort();
  
  return stats;
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get a clean display message for an entry (strips XML tags for preview)
 */
export function getDisplayMessage(entry: LogEntry): string {
  // For JSONL format with event name
  if (entry.formatType === 'jsonl' && entry.eventName) {
    if (entry.level === 'E' && entry.exceptionMessage) {
      return `[${entry.exceptionType?.replace('System.', '').replace('Ifs.Cloud.Client.Exceptions.', '') || 'Error'}] ${entry.exceptionMessage}`;
    }
    return entry.message;
  }
  
  // For errors with exception type
  if (entry.level === 'E' && entry.exceptionType) {
    const shortType = entry.exceptionType
      .replace('System.', '')
      .replace('Ifs.Cloud.Client.Exceptions.', '');
    return `[${shortType}] ${entry.exceptionMessage || 'No message'}`;
  }
  
  // For trace entries (often large JSON), truncate
  if (entry.level === 'T' && entry.message.length > 100) {
    const preview = entry.message.substring(0, 100);
    return preview + '...';
  }
  
  // For others, clean up any XML tags
  return entry.message
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Get level display name
 */
export function getLevelName(level: LogLevel): string {
  switch (level) {
    case 'I': return 'Info';
    case 'W': return 'Warning';
    case 'E': return 'Error';
    case 'T': return 'Trace';
    default: return level;
  }
}

/**
 * Get format display name
 */
export function getFormatName(format: LogFormatType): string {
  switch (format) {
    case 'original': return 'Original (Space-separated)';
    case 'tab-separated': return 'Tab-separated';
    case 'jsonl': return 'JSON Lines';
    default: return 'Unknown';
  }
}
