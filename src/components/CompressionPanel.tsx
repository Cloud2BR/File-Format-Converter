import { useMemo, useState } from 'react';

interface CompressionPanelProps {
  file: File;
  busy: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;
  hasResult: boolean;
  onCompress: (quality: number, targetSizeBytes: number | null) => void;
  onDownload: () => void;
}

const RANGES = [
  { label: 'Maximum quality', quality: 0.9, description: 'Best visual fidelity', range: '90–100%' },
  { label: 'Balanced', quality: 0.7, description: 'Recommended for most images', range: '70–89%' },
  { label: 'Smallest file', quality: 0.4, description: 'Prioritizes file size', range: '40–69%' },
];

export default function CompressionPanel({
  file,
  busy,
  progress,
  progressMessage,
  error,
  hasResult,
  onCompress,
  onDownload,
}: CompressionPanelProps) {
  const [quality, setQuality] = useState(0.7);
  const [targetSize, setTargetSize] = useState('');
  const isPng = file.name.toLowerCase().endsWith('.png');
  const targetBytes = useMemo(() => {
    const value = Number(targetSize);
    return Number.isFinite(value) && value > 0 ? value * 1024 : null;
  }, [targetSize]);

  return (
    <div className="compression-panel">
      <p className="compression-panel__intro">
        Choose a quality range, or set a maximum size. Compression runs locally in your browser.
      </p>
      <div className="compression-ranges" role="radiogroup" aria-label="Compression quality">
        {RANGES.map((range, index) => (
          <button
            key={range.label}
            type="button"
            role="radio"
            aria-checked={quality === range.quality}
            tabIndex={quality === range.quality ? 0 : -1}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
              event.preventDefault();
              const nextIndex =
                (index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + RANGES.length) %
                RANGES.length;
              const next = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                '[role="radio"]',
              )[nextIndex];
              next?.focus();
              next?.click();
            }}
            className={`format-chip${quality === range.quality ? ' format-chip--active' : ''}`}
            onClick={() => setQuality(range.quality)}
          >
            <span className="format-chip__label">{range.label}</span>
            <span className="format-chip__desc">{range.description} · {range.range}</span>
          </button>
        ))}
      </div>
      <label className="compression-target">
        Maximum size (KB, optional)
        <input
          type="number"
          min="1"
          step="1"
          value={targetSize}
          disabled={isPng}
          onChange={(event) => setTargetSize(event.target.value)}
          placeholder={String(Math.max(1, Math.round(file.size / 1024)))}
        />
      </label>
      {isPng && <p className="compression-panel__hint">PNG compression stays lossless; size targeting is available for JPG and WebP.</p>}
      <div className="convert-panel__actions">
        <button type="button" className="btn btn--primary" disabled={busy} onClick={() => onCompress(quality, targetBytes)}>
          {busy ? 'Compressing…' : 'Compress image'}
        </button>
        {hasResult && <button type="button" className="btn btn--success" onClick={onDownload} disabled={busy}>Download result</button>}
      </div>
      {busy && <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
        <div className="progress__bar" style={{ width: `${Math.max(8, progress * 100)}%` }} />
        <span className="progress__label">{progressMessage || 'Working…'}</span>
      </div>}
      {error && <div className="alert alert--error" role="alert">{error}</div>}
    </div>
  );
}
