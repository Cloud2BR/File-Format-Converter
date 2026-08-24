import { saveAs } from 'file-saver';
import type { ConversionResult } from '../converters/types';

interface PreviewProps {
  result: ConversionResult;
}

export default function Preview({ result }: PreviewProps) {
  const preview = result.preview;
  const resultExtension = result.filename.split('.').pop()?.toLowerCase() || 'png';
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
                <img src={url} alt={preview.urls.length > 1 ? `Page ${i + 1}` : result.filename} loading="lazy" />
                <figcaption>
                  <span>{preview.urls.length > 1 ? `Page ${i + 1}` : result.filename}</span>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => saveAs(url, preview.urls.length > 1 ? `page-${i + 1}.${resultExtension}` : result.filename)}
                  >
                    Save {resultExtension.toUpperCase()}
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
