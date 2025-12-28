import { ChevronLeft, ChevronRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { useLogStore } from '../stores/logStore';

export function QuickNav() {
  const { 
    jumpToNextError, 
    jumpToPrevError, 
    jumpToNextWarning, 
    jumpToPrevWarning,
    stats,
  } = useLogStore();

  if (!stats) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Error Navigation */}
      {stats.errors > 0 && (
        <div className="flex items-center bg-red-500/10 rounded-lg border border-red-500/30">
          <button
            onClick={jumpToPrevError}
            className="p-1.5 hover:bg-red-500/20 rounded-l-lg transition-colors"
            title="Previous error (Shift+E)"
          >
            <ChevronLeft className="w-4 h-4 text-red-400" />
          </button>
          <div className="flex items-center gap-1.5 px-2 border-x border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs text-red-400 font-medium">{stats.errors}</span>
          </div>
          <button
            onClick={jumpToNextError}
            className="p-1.5 hover:bg-red-500/20 rounded-r-lg transition-colors"
            title="Next error (E)"
          >
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {/* Warning Navigation */}
      {stats.warnings > 0 && (
        <div className="flex items-center bg-amber-500/10 rounded-lg border border-amber-500/30">
          <button
            onClick={jumpToPrevWarning}
            className="p-1.5 hover:bg-amber-500/20 rounded-l-lg transition-colors"
            title="Previous warning (Shift+W)"
          >
            <ChevronLeft className="w-4 h-4 text-amber-400" />
          </button>
          <div className="flex items-center gap-1.5 px-2 border-x border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">{stats.warnings}</span>
          </div>
          <button
            onClick={jumpToNextWarning}
            className="p-1.5 hover:bg-amber-500/20 rounded-r-lg transition-colors"
            title="Next warning (W)"
          >
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      )}
    </div>
  );
}


