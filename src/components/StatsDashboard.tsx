import { AlertCircle, AlertTriangle, Info, FileText, Clock, AlertOctagon } from 'lucide-react';
import { useLogStore } from '../stores/logStore';
import { format } from 'date-fns';

export function StatsDashboard() {
  const { stats, fileInfo } = useLogStore();

  if (!stats || !fileInfo) {
    return (
      <div className="p-4 bg-[var(--bg-panel)] rounded-xl border border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <FileText className="w-5 h-5" />
          <span>No log file loaded</span>
        </div>
      </div>
    );
  }

  const timeRange = stats.timeRange.start && stats.timeRange.end
    ? `${format(stats.timeRange.start, 'HH:mm:ss')} - ${format(stats.timeRange.end, 'HH:mm:ss')}`
    : 'N/A';

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Total */}
        <div className="p-3 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-[var(--accent)]" />
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Total</span>
          </div>
          <p className="text-2xl font-bold text-[var(--text-primary)]">
            {stats.total.toLocaleString()}
          </p>
        </div>

        {/* Errors */}
        <div className="p-3 bg-gradient-to-br from-red-500/10 to-transparent rounded-lg border border-red-500/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-300 uppercase tracking-wide">Errors</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {stats.errors}
          </p>
        </div>

        {/* Warnings */}
        <div className="p-3 bg-gradient-to-br from-amber-500/10 to-transparent rounded-lg border border-amber-500/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-amber-300 uppercase tracking-wide">Warnings</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">
            {stats.warnings}
          </p>
        </div>

        {/* Info */}
        <div className="p-3 bg-gradient-to-br from-blue-500/10 to-transparent rounded-lg border border-blue-500/30">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-blue-300 uppercase tracking-wide">Info</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {stats.info.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="flex gap-2">
        {/* Time Range */}
        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-color)]">
          <Clock className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs text-[var(--text-secondary)]">Time Range:</span>
          <span className="text-xs text-[var(--text-primary)] font-mono">{timeRange}</span>
          {stats.timeRange.start && (
            <span className="text-xs text-[var(--text-secondary)] ml-auto">
              {format(stats.timeRange.start, 'MMM d, yyyy')}
            </span>
          )}
        </div>

        {/* Unparsed Count */}
        {stats.unparsed > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-lg border border-yellow-500/30">
            <AlertOctagon className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300">Unparsed:</span>
            <span className="text-sm font-bold text-yellow-400">{stats.unparsed}</span>
          </div>
        )}
      </div>

      {/* Exception Types Summary */}
      {stats.uniqueExceptionTypes.length > 0 && (
        <div className="px-3 py-2 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-color)]">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">
              Exception Types ({stats.uniqueExceptionTypes.length})
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {stats.uniqueExceptionTypes.slice(0, 5).map(type => (
              <span 
                key={type} 
                className="px-2 py-0.5 text-xs bg-red-500/10 text-red-400 rounded border border-red-500/20"
                title={type}
              >
                {type.replace('System.', '').replace('Ifs.Cloud.Client.Exceptions.', '')}
              </span>
            ))}
            {stats.uniqueExceptionTypes.length > 5 && (
              <span className="px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                +{stats.uniqueExceptionTypes.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
