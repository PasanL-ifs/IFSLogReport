import type { LogEntry, LogLevel, LogStats, NestedExceptionInfo } from '../types';

// Pattern to identify the START of a new log entry
const LOG_ENTRY_START = /^([IWE])\s+(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}:\d{2}\s+[AP]M)\s+/;

// Pattern to extract SourceContext JSON at the end
const SOURCE_CONTEXT_PATTERN = /\{"SourceContext":"([^"]+)"\}\s*$/;

/**
 * Parse timestamp string to Date object
 */
function parseTimestamp(ts: string): Date {
  try {
    const parts = ts.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)/i);
    if (!parts) return new Date(ts);
    
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
  } catch {
    return new Date(ts);
  }
}

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
  const pattern = /<([\w.]+(?:Exception|Error))><Message>([\s\S]*?)<\/Message><StackTrace>([\s\S]*?)<\/StackTrace>/g;
  
  let match;
  while ((match = pattern.exec(content)) !== null) {
    exceptions.push({
      type: match[1],
      message: match[2].trim(),
      stackTrace: parseStackTrace(match[3]),
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
  // Find the outermost exception (first one in the content)
  const match = content.match(/<([\w.]+(?:Exception|Error))><Message>([\s\S]*?)<\/Message>/);
  if (!match) return null;
  
  const type = match[1];
  const message = match[2].trim();
  
  // Find the stack trace for this specific exception
  // Look for the closing tag pattern
  const fullPattern = new RegExp(
    `<${type.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}><Message>[\\s\\S]*?</Message><StackTrace>([\\s\\S]*?)</StackTrace>`,
    'i'
  );
  const stackMatch = content.match(fullPattern);
  const stackTrace = stackMatch ? parseStackTrace(stackMatch[1]) : [];
  
  return { type, message, stackTrace };
}

/**
 * Parse a single raw entry block into a LogEntry
 */
function parseEntryBlock(
  rawContent: string,
  lineNumber: number,
  lineCount: number,
  id: number
): LogEntry {
  const lines = rawContent.split(/\r?\n/);
  const firstLine = lines[0];
  
  // Try to match the entry start pattern
  const startMatch = firstLine.match(LOG_ENTRY_START);
  
  if (!startMatch) {
    // This shouldn't happen if we split correctly, but handle it
    return {
      id,
      level: 'I',
      timestamp: new Date(),
      timestampRaw: '',
      message: rawContent,
      sourceContext: 'Unknown',
      className: 'Unknown',
      rawContent,
      lineNumber,
      lineCount,
      parseStatus: 'unparsed',
      parseError: 'Could not identify log entry start pattern',
    };
  }
  
  const level = startMatch[1] as LogLevel;
  const timestampRaw = startMatch[2];
  const timestamp = parseTimestamp(timestampRaw);
  
  // Get the content after the timestamp
  const afterTimestamp = firstLine.substring(startMatch[0].length);
  const fullContent = lineCount > 1 
    ? afterTimestamp + '\n' + lines.slice(1).join('\n')
    : afterTimestamp;
  
  // Try to extract SourceContext from the END of the full content
  const sourceMatch = fullContent.match(SOURCE_CONTEXT_PATTERN);
  const sourceContext = sourceMatch ? sourceMatch[1] : 'Unknown';
  const className = extractClassName(sourceContext);
  
  // Get the message content (everything before the SourceContext JSON)
  let message = sourceMatch 
    ? fullContent.substring(0, fullContent.lastIndexOf('{"SourceContext":')).trim()
    : fullContent.trim();
  
  // Base entry
  const entry: LogEntry = {
    id,
    level,
    timestamp,
    timestampRaw,
    message,
    sourceContext,
    className,
    rawContent,
    lineNumber,
    lineCount,
    parseStatus: 'parsed',
  };
  
  // For error entries, parse exception information
  if (level === 'E' && message.includes('<') && message.includes('Exception')) {
    const primaryException = extractPrimaryException(message);
    
    if (primaryException) {
      entry.exceptionType = primaryException.type;
      entry.exceptionMessage = primaryException.message;
      entry.stackTrace = primaryException.stackTrace;
      
      // Check for nested exceptions
      const allExceptions = parseNestedExceptions(message);
      if (allExceptions.length > 1) {
        entry.nestedExceptions = allExceptions;
      }
    } else {
      entry.parseStatus = 'partial';
      entry.parseError = 'Could not parse exception details';
    }
  }
  
  // Check if we got minimal required info
  if (!sourceMatch && level !== 'E') {
    entry.parseStatus = 'partial';
    entry.parseError = 'Missing SourceContext metadata';
  }
  
  return entry;
}

/**
 * Main parser function - splits content into entry blocks first
 */
export function parseLogFile(content: string): LogEntry[] {
  const lines = content.split(/\r?\n/);
  const entries: LogEntry[] = [];
  
  // First pass: identify entry boundaries
  const entryBlocks: { startLine: number; endLine: number; content: string }[] = [];
  let currentBlockStart = -1;
  let currentBlockLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip completely empty lines at the start
    if (currentBlockStart === -1 && !line.trim()) continue;
    
    // Check if this line starts a new entry
    const isNewEntry = LOG_ENTRY_START.test(line);
    
    if (isNewEntry) {
      // Save previous block if exists
      if (currentBlockStart !== -1 && currentBlockLines.length > 0) {
        entryBlocks.push({
          startLine: currentBlockStart,
          endLine: i,
          content: currentBlockLines.join('\n'),
        });
      }
      
      // Start new block
      currentBlockStart = i + 1; // 1-indexed line numbers
      currentBlockLines = [line];
    } else if (currentBlockStart !== -1) {
      // Continue current block (stack trace continuation, etc.)
      currentBlockLines.push(line);
    }
  }
  
  // Don't forget the last block
  if (currentBlockStart !== -1 && currentBlockLines.length > 0) {
    entryBlocks.push({
      startLine: currentBlockStart,
      endLine: lines.length,
      content: currentBlockLines.join('\n'),
    });
  }
  
  // Second pass: parse each block
  for (let i = 0; i < entryBlocks.length; i++) {
    const block = entryBlocks[i];
    const entry = parseEntryBlock(
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
 * Calculate statistics from log entries
 */
export function calculateStats(entries: LogEntry[]): LogStats {
  const stats: LogStats = {
    total: entries.length,
    errors: 0,
    warnings: 0,
    info: 0,
    unparsed: 0,
    uniqueExceptionTypes: [],
    uniqueSourceContexts: [],
    timeRange: { start: null, end: null },
  };
  
  const exceptionTypeSet = new Set<string>();
  const sourceContextSet = new Set<string>();
  
  for (const entry of entries) {
    // Count by level
    switch (entry.level) {
      case 'E':
        stats.errors++;
        if (entry.exceptionType) {
          exceptionTypeSet.add(entry.exceptionType);
        }
        // Also add nested exception types
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
    }
    
    // Count unparsed/partial
    if (entry.parseStatus !== 'parsed') {
      stats.unparsed++;
    }
    
    // Collect source contexts
    if (entry.sourceContext !== 'Unknown') {
      sourceContextSet.add(entry.sourceContext);
    }
    
    // Update time range
    if (entry.timestamp) {
      if (!stats.timeRange.start || entry.timestamp < stats.timeRange.start) {
        stats.timeRange.start = entry.timestamp;
      }
      if (!stats.timeRange.end || entry.timestamp > stats.timeRange.end) {
        stats.timeRange.end = entry.timestamp;
      }
    }
  }
  
  stats.uniqueExceptionTypes = Array.from(exceptionTypeSet).sort();
  stats.uniqueSourceContexts = Array.from(sourceContextSet).sort();
  
  return stats;
}

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
  if (entry.level === 'E' && entry.exceptionType) {
    // For errors, show exception type and message
    const shortType = entry.exceptionType
      .replace('System.', '')
      .replace('Ifs.Cloud.Client.Exceptions.', '');
    return `[${shortType}] ${entry.exceptionMessage || 'No message'}`;
  }
  
  // For others, clean up any XML tags
  return entry.message
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
