import { useMemo, useState } from 'react';

interface CompressionPanelProps {
  file: File;
  isImage: boolean;
  busy: boolean;
  progress: number;
  progressMessage: string;
  error: string | null;
  hasResult: boolean;
  onCompress: (quality: number, targetSizeBytes: number | null) => void;
  onDownload: () => void;
}

const RANGES = [
  { label: 'Maximum quality', quality: 0.9, description: 'Best visual fidelity', range: '90 to 100%' },
  { label: 'Balanced', quality: 0.7, description: 'Recommended for most images', range: '70 to 89%' },
  { label: 'Smallest file', quality: 0.4, description: 'Prioritizes file size', range: '40 to 69%' },
];

export default function CompressionPanel({
  file,
  isImage,
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
  const [targetUnit, setTargetUnit] = useState<'KB' | 'MB'>('MB');
  const isPng = file.name.toLowerCase().endsWith('.png');
  const targetBytes = useMemo(() => {
    const value = Number(targetSize);
    const multiplier = targetUnit === 'MB' ? 1024 * 1024 : 1024;
    return Number.isFinite(value) && value > 0 ? value * multiplier : null;
  }, [targetSize, targetUnit]);

  return (
    <div className="compression-panel">
      <p className="compression-panel__intro">
        {isImage
          ? 'Choose a quality range or maximum size. The compressed image keeps its original format inside a ZIP.'
          : 'Create a losslessly compressed ZIP containing the original file. Compression runs locally in your browser.'}
      </p>
      {isImage && <div className="compression-ranges" role="radiogroup" aria-label="Compression quality">
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
              setQuality(RANGES[nextIndex].quality);
            }}
            className={`format-chip${quality === range.quality ? ' format-chip--active' : ''}`}
            onClick={() => setQuality(range.quality)}
          >
            <span className="format-chip__label">{range.label}</span>
            <span className="format-chip__desc">{range.description} · {range.range}</span>
          </button>
        ))}
      </div>}
      {isImage && <div className="compression-target">
        <label htmlFor="maximum-size">Maximum size (optional)</label>
        <input
          id="maximum-size"
          type="number"
          min="0.01"
          step="0.01"
          value={targetSize}
          disabled={isPng}
          onChange={(event) => setTargetSize(event.target.value)}
          placeholder={targetUnit === 'MB' ? (file.size / 1024 / 1024).toFixed(1) : String(Math.max(1, Math.round(file.size / 1024)))}
        />
        <select value={targetUnit} disabled={isPng} onChange={(event) => setTargetUnit(event.target.value as 'KB' | 'MB')} aria-label="Target size unit">
          <option value="KB">KB</option>
          <option value="MB">MB</option>
        </select>
      </div>}
      {isImage && isPng && <p className="compression-panel__hint">PNG stays lossless. Convert it to JPG or WebP first to target a smaller file size.</p>}
      {isImage && !isPng && targetBytes && targetBytes >= file.size && <p className="compression-panel__hint">The target is not smaller than the original file, so quality settings will determine the result.</p>}
      {isImage && !isPng && targetBytes && <p className="compression-panel__hint">Target size is best effort. Very small targets may reduce image dimensions to preserve a usable result.</p>}
      {!isImage && <p className="compression-panel__hint">The file keeps its original name and format inside the ZIP. Already compressed formats such as PDF, DOCX, and PPTX may not become significantly smaller.</p>}
      <div className="convert-panel__actions">
        <button type="button" className="btn btn--primary" disabled={busy} onClick={() => onCompress(quality, targetBytes)}>
          {busy ? 'Compressing…' : 'Compress file'}
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
