import { useCallback, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import FormatSelector from './components/FormatSelector';
import ConvertPanel from './components/ConvertPanel';
import CompressionPanel from './components/CompressionPanel';
import Preview from './components/Preview';
import Footer from './components/Footer';
import { compressFile, convert, detectFormat, FORMATS, getRoutes } from './converters';
import type { ConversionResult, FormatId } from './converters/types';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [actionMode, setActionMode] = useState<'convert' | 'compress'>('convert');
  const [target, setTarget] = useState<FormatId | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);
  const sourceFormat = useMemo<FormatId | null>(
    () => (file ? detectFormat(file.name) : null),
    [file],
  );
  const isImage = sourceFormat === 'jpg' || sourceFormat === 'webp' || sourceFormat === 'png';
  const isPdf = sourceFormat === 'pdf';
  const revokeResultPreview = useCallback(() => {
    if (result?.preview?.kind === 'images') {
      result.preview.urls.forEach((url) => URL.revokeObjectURL(url));
    }
  }, [result]);
  const routes = useMemo(
    () => (sourceFormat ? getRoutes(sourceFormat) : []),
    [sourceFormat],
  );

  const reset = useCallback(() => {
    setActionMode('convert');
    setTarget(null);
    setError(null);
    setResult(null);
    setProgress(0);
    setProgressMessage('');
  }, []);

  const handleFile = useCallback(
    (next: File) => {
      reset();
      setFile(next);
      const fmt = detectFormat(next.name);
      const available = fmt ? getRoutes(fmt) : [];
      setTarget(available[0]?.target ?? null);
      if (fmt && !available.length) setActionMode('compress');
      if (!fmt) {
        setError(
          `"${next.name}" isn't a supported input type. Try Markdown, Word, PDF, HTML, text, CSV, JSON, PowerPoint, JPG, PNG, or WebP.`,
        );
      }
    },
    [reset],
  );

  const handleClear = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

  const handleActionMode = useCallback((mode: 'convert' | 'compress') => {
    revokeResultPreview();
    setActionMode(mode);
    setError(null);
    setResult(null);
    setProgress(0);
    setProgressMessage('');
  }, [revokeResultPreview]);

  const handleConvert = useCallback(async () => {
    if (!file || !target) return;
    setBusy(true);
    setError(null);
    revokeResultPreview();
    setResult(null);
    setProgress(0);
    setProgressMessage('Starting…');
    try {
      const res = await convert(file, target, (fraction, message) => {
        setProgress(fraction);
        if (message) setProgressMessage(message);
      });
      setResult(res);
      setProgress(1);
      setProgressMessage('Done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, [file, revokeResultPreview, target]);

  const handleDownload = useCallback(() => {
    if (result) saveAs(result.blob, result.filename);
  }, [result]);

  const handleCompress = useCallback(
    async (quality: number, targetSizeBytes: number | null) => {
      if (!file || !sourceFormat) return;
      setBusy(true);
      setError(null);
      revokeResultPreview();
      setResult(null);
      setProgress(0);
      setProgressMessage('Starting…');
      try {
        const res = await compressFile(file, { quality, targetSizeBytes }, (fraction, message) => {
          setProgress(fraction);
          if (message) setProgressMessage(message);
        });
        setResult(res);
        setProgress(1);
        setProgressMessage('Done');
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [file, revokeResultPreview, sourceFormat],
  );

  return (
    <div className="app">
      <Header />

      <main className="app__main">
        <section className="tool-intro">
          <div>
            <p className="eyebrow">Private browser workspace</p>
            <h1>File format converter</h1>
            <p>
              Convert or compress documents and images without uploading them.
            </p>
          </div>
          <span className="privacy-mark">
            <span aria-hidden="true">✓</span>
            Local only
          </span>
        </section>

        <section className="workspace card">
          <div className="workspace__step">
            <span className="step-badge">1</span>
            <h2 className="workspace__heading">Choose a file</h2>
          </div>
          <Dropzone file={file} onFile={handleFile} onClear={handleClear} />

          {file && sourceFormat && (
            <>
              <div className="workspace__step">
                <span className="step-badge">2</span>
                <h2 className="workspace__heading">Choose an action</h2>
              </div>
              <div className="mode-selector" role="group" aria-label="File action">
                <button
                  type="button"
                  className={`mode-selector__option${actionMode === 'convert' ? ' mode-selector__option--active' : ''}`}
                  aria-pressed={actionMode === 'convert'}
                  disabled={!routes.length}
                  onClick={() => handleActionMode('convert')}
                >
                  <strong>Convert format</strong>
                  <span>{isImage ? 'Change between JPG, PNG, and WebP' : 'Change to another available format'}</span>
                </button>
                <button
                  type="button"
                  className={`mode-selector__option${actionMode === 'compress' ? ' mode-selector__option--active' : ''}`}
                  aria-pressed={actionMode === 'compress'}
                  onClick={() => handleActionMode('compress')}
                >
                  <strong>Compress file size</strong>
                  <span>{isImage ? 'Keep the image format and reduce its size' : 'Download in the original file format'}</span>
                </button>
              </div>

              {actionMode === 'convert' ? (
                <>
                  <div className="workspace__step">
                    <span className="step-badge">3</span>
                    <h2 className="workspace__heading">Pick a target format</h2>
                  </div>
                  <FormatSelector
                    sourceLabel={FORMATS[sourceFormat].label}
                    routes={routes}
                    selected={target}
                    onSelect={setTarget}
                  />
                  <div className="workspace__step">
                    <span className="step-badge">4</span>
                    <h2 className="workspace__heading">Convert &amp; download</h2>
                  </div>
                  <ConvertPanel
                    canConvert={!!target}
                    busy={busy}
                    progress={progress}
                    progressMessage={progressMessage}
                    error={error}
                    hasResult={!!result}
                    onConvert={handleConvert}
                    onDownload={handleDownload}
                  />
                </>
              ) : (
                <>
                  <div className="workspace__step">
                    <span className="step-badge">3</span>
                    <h2 className="workspace__heading">Set compression target</h2>
                  </div>
                  <CompressionPanel
                    file={file}
                    isImage={isImage}
                    isPdf={isPdf}
                    busy={busy}
                    progress={progress}
                    progressMessage={progressMessage}
                    error={error}
                    hasResult={!!result}
                    onCompress={handleCompress}
                    onDownload={handleDownload}
                  />
                </>
              )}
            </>
          )}

          {!sourceFormat && error && (
            <div className="alert alert--error" role="alert">
              {error}
            </div>
          )}
        </section>

        {result && (
          <section className="card">
            <Preview result={result} />
          </section>
        )}

      </main>

      <Footer />
    </div>
  );
}
