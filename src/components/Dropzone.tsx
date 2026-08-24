import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';

interface DropzoneProps {
  file: File | null;
  onFile: (file: File) => void;
  onClear: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function Dropzone({ file, onFile, onClear }: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped) onFile(dropped);
    },
    [onFile],
  );

  if (file) {
    return (
      <div className="filecard">
        <div className="filecard__icon" aria-hidden="true">
          {file.name.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE'}
        </div>
        <div className="filecard__meta">
          <span className="filecard__name" title={file.name}>
            {file.name}
          </span>
          <span className="filecard__size">{formatBytes(file.size)}</span>
        </div>
        <button className="btn btn--ghost" onClick={onClear} type="button">
          Replace
        </button>
      </div>
    );
  }

  return (
    <div
      className={`dropzone${dragging ? ' dropzone--active' : ''}`}
      onDragOver={(e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        hidden
        accept=".md,.markdown,.mdown,.mkd,.docx,.pdf,.html,.htm,.txt,.text,.csv,.json,.pptx,.jpg,.jpeg,.png,.webp"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const picked = e.target.files?.[0];
          if (picked) onFile(picked);
          e.target.value = '';
        }}
      />
      <div className="dropzone__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="34" height="34" fill="none">
          <path
            d="M12 16V4m0 0L8 8m4-4 4 4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className="dropzone__title">
        Drop a file here, or <span>browse</span>
      </p>
      <p className="dropzone__hint">
        Markdown · Word · PDF · HTML · text · CSV · JSON · PowerPoint · JPG · PNG · WebP
      </p>
    </div>
  );
}
