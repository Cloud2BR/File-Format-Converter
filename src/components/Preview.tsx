import { useEffect } from 'react';
import { saveAs } from 'file-saver';
import type { ConversionResult } from '../converters/types';

interface PreviewProps {
  result: ConversionResult;
}

export default function Preview({ result }: PreviewProps) {
  const preview = result.preview;
  useEffect(() => {
    return () => {
      if (preview?.kind === 'images') {
        preview.urls.forEach((url) => URL.revokeObjectURL(url));
      }
    };
  }, [preview]);
  if (!preview) {
    return (
      <div className="preview preview--empty">
        <p className="muted">
          Conversion complete. Use <strong>Download result</strong> to save
          your file.
        </p>
      </div>
    );
  }

  return (
    <div className="preview">
      <div className="preview__head">
        <span className="preview__title">Preview</span>
      </div>
      <div className="preview__body">
        {preview.kind === 'text' && (
          <pre className="preview__text">{preview.content}</pre>
        )}
        {preview.kind === 'html' && (
          <div
            className="preview__html"
            // Content is generated locally from the user's own file.
            dangerouslySetInnerHTML={{ __html: preview.content }}
          />
        )}
        {preview.kind === 'images' && (
          <div className="preview__images">
            {preview.urls.map((url, i) => (
              <figure className="preview__page" key={url}>
                <img src={url} alt={`Page ${i + 1}`} loading="lazy" />
                <figcaption>
                  <span>Page {i + 1}</span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => saveAs(url, `page-${i + 1}.png`)}
                  >
                    Save PNG
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
