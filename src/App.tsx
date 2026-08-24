import { useCallback, useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import FormatSelector from './components/FormatSelector';
import ConvertPanel from './components/ConvertPanel';
import CompressionPanel from './components/CompressionPanel';
import Preview from './components/Preview';
import Footer from './components/Footer';
import { compressImage, convert, detectFormat, FORMATS, getRoutes } from './converters';
import type { ConversionResult, FormatId } from './converters/types';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
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
  const isCompressible = sourceFormat === 'jpg' || sourceFormat === 'webp' || sourceFormat === 'png';
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
      if (!fmt || !available.length) {
        setError(
          `"${next.name}" isn't a supported input type. Try Markdown, Word, PDF, HTML, text, CSV, JSON, JPG, PNG, or WebP.`,
        );
      }
    },
    [reset],
  );

  const handleClear = useCallback(() => {
    setFile(null);
    reset();
  }, [reset]);

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
      if (!file || !isCompressible) return;
      setBusy(true);
      setError(null);
      revokeResultPreview();
      setResult(null);
      setProgress(0);
      setProgressMessage('Starting…');
      try {
        const res = await compressImage(file, { quality, targetSizeBytes }, (fraction, message) => {
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
    [file, isCompressible, revokeResultPreview],
  );

  return (
    <div className="app">
      <Header />

      <main className="app__main">
        <section className="hero">
          <h1 className="hero__title">
            Convert your files, <span>right in your browser</span>
          </h1>
          <p className="hero__subtitle">
            Markdown, Word, PDF, HTML, text, CSV, JSON, and image compression —
            fast, free, and private. Nothing is uploaded to a server.
          </p>
        </section>

        <section className="workspace card">
          <div className="workspace__step">
            <span className="step-badge">1</span>
            <h2 className="workspace__heading">Choose a file</h2>
          </div>
          <Dropzone file={file} onFile={handleFile} onClear={handleClear} />

          {file && isCompressible && (
            <>
              <div className="workspace__step">
                <span className="step-badge">2</span>
                <h2 className="workspace__heading">Compress image</h2>
              </div>
              <CompressionPanel
                file={file}
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

          {!isCompressible && sourceFormat && (
            <>
              <div className="workspace__step">
                <span className="step-badge">2</span>
                <h2 className="workspace__heading">Pick a target format</h2>
              </div>
              <FormatSelector
                sourceLabel={FORMATS[sourceFormat].label}
                routes={routes}
                selected={target}
                onSelect={setTarget}
              />
              <div className="workspace__step">
                <span className="step-badge">3</span>
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

        <section className="card about-card" aria-label="Owner and organization">
          <div className="about-card__header">
            <h2 className="about-card__title">Owner and Organization</h2>
            <p className="about-card__subtitle">
              Built and maintained by Cloud2BR Open Source Microsoft Cloud Sandbox
              - Learning Hub.
            </p>
          </div>

          <div className="about-card__grid">
            <article className="about-profile">
              <span className="about-profile__label">Owner / Founder</span>
              <div className="about-profile__main">
                <img
                  className="about-profile__avatar"
                  src="https://github.com/brown9804.png"
                  alt="Photo of @brown9804"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div className="about-profile__meta">
                  <strong>@brown9804</strong>
                  <span>Creator and maintainer</span>
                </div>
              </div>
              <div className="about-profile__links">
                <a href="https://github.com/brown9804" target="_blank" rel="noreferrer">
                  GitHub
                </a>
              </div>
            </article>

            <article className="about-profile">
              <span className="about-profile__label">Organization</span>
              <div className="about-profile__main">
                <img
                  className="about-profile__avatar about-profile__avatar--org"
                  src="https://github.com/Cloud2BR-MSFTLearningHub.png"
                  alt="Cloud2BR Open Source Microsoft Cloud Sandbox - Learning Hub logo"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
                <div className="about-profile__meta">
                  <strong>Cloud2BR Open Source</strong>
                  <span>Microsoft Cloud Sandbox - Learning Hub</span>
                </div>
              </div>
              <p className="about-profile__tagline">
                Community demos, learning assets, and lightweight browser tools.
              </p>
              <div className="about-profile__links">
                <a
                  href="https://github.com/Cloud2BR-MSFTLearningHub"
                  target="_blank"
                  rel="noreferrer"
                >
                  Organization page
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
