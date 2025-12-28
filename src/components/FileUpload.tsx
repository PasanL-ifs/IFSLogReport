import { useCallback, useState } from 'react';
import { Upload, File, X, FileText } from 'lucide-react';
import { useLogStore } from '../stores/logStore';
import { formatFileSize } from '../utils/logParser';

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const { loadFile, clearFile, fileInfo } = useLogStore();

  const handleFile = useCallback((file: File) => {
    if (!file.name.match(/\.(txt|log)$/i)) {
      alert('Please upload a .txt or .log file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      loadFile(content, {
        name: file.name,
        size: file.size,
        lastModified: new Date(file.lastModified),
      });
    };
    reader.readAsText(file);
  }, [loadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  if (fileInfo) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-color)]">
        <FileText className="w-5 h-5 text-[var(--accent)]" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {fileInfo.name}
          </p>
          <p className="text-xs text-[var(--text-secondary)]">
            {formatFileSize(fileInfo.size)}
          </p>
        </div>
        <button
          onClick={clearFile}
          className="p-1.5 rounded-md hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Clear file"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200
        ${isDragging 
          ? 'border-[var(--accent)] bg-[var(--accent)]/10 scale-[1.02]' 
          : 'border-[var(--border-color)] hover:border-[var(--accent)]/50 bg-[var(--bg-panel)]'
        }
      `}
    >
      <input
        type="file"
        accept=".txt,.log"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className="flex flex-col items-center gap-3">
        <div className={`
          p-4 rounded-full transition-all duration-200
          ${isDragging 
            ? 'bg-[var(--accent)]/20 text-[var(--accent)]' 
            : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
          }
        `}>
          {isDragging ? (
            <File className="w-8 h-8" />
          ) : (
            <Upload className="w-8 h-8" />
          )}
        </div>
        
        <div>
          <p className="text-[var(--text-primary)] font-medium">
            {isDragging ? 'Drop your log file here' : 'Drag & drop your log file'}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            or click to browse (.txt, .log)
          </p>
        </div>
      </div>
    </div>
  );
}

