import type { FormatId, FormatMeta } from './types';

/** Catalog of every format the app understands. */
export const FORMATS: Record<FormatId, FormatMeta> = {
  markdown: {
    id: 'markdown',
    label: 'Markdown',
    extensions: ['md', 'markdown', 'mdown', 'mkd'],
    description: 'Lightweight plain-text markup (.md)',
  },
  docx: {
    id: 'docx',
    label: 'Word document',
    extensions: ['docx'],
    description: 'Microsoft Word (.docx)',
  },
  pdf: {
    id: 'pdf',
    label: 'PDF',
    extensions: ['pdf'],
    description: 'Portable Document Format (.pdf)',
  },
  html: {
    id: 'html',
    label: 'HTML',
    extensions: ['html', 'htm'],
    description: 'Web page (.html)',
  },
  txt: {
    id: 'txt',
    label: 'Plain text',
    extensions: ['txt', 'text'],
    description: 'Unformatted text (.txt)',
  },
  csv: {
    id: 'csv',
    label: 'CSV',
    extensions: ['csv'],
    description: 'Comma-separated values (.csv)',
  },
  json: {
    id: 'json',
    label: 'JSON',
    extensions: ['json'],
    description: 'JavaScript Object Notation (.json)',
  },
  pptx: {
    id: 'pptx',
    label: 'PowerPoint',
    extensions: ['pptx'],
    description: 'Slides generated from headings (.pptx)',
  },
  'png-zip': {
    id: 'png-zip',
    label: 'Images (ZIP)',
    extensions: ['zip'],
    description: 'One PNG per page, bundled in a ZIP',
  },
  png: {
    id: 'png',
    label: 'Images (per page)',
    extensions: ['png'],
    description: 'Preview & download each page individually',
  },
  jpg: {
    id: 'jpg',
    label: 'JPEG image',
    extensions: ['jpg', 'jpeg'],
    description: 'Compressed raster image (.jpg, .jpeg)',
  },
  webp: {
    id: 'webp',
    label: 'WebP image',
    extensions: ['webp'],
    description: 'Modern compressed raster image (.webp)',
  },
};

const EXTENSION_LOOKUP: Record<string, FormatId> = (() => {
  const map: Record<string, FormatId> = {};
  for (const meta of Object.values(FORMATS)) {
    for (const ext of meta.extensions) {
      // First format that claims an extension wins (input formats only).
      if (!(ext in map)) map[ext] = meta.id;
    }
  }
  return map;
})();

/** Extract the lowercase extension (no dot) from a filename. */
export function getExtension(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
}

/** Base name without the trailing extension. */
export function getBaseName(filename: string): string {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.slice(0, idx) : filename;
}

/** Detect a source format from a filename, or null if unsupported as input. */
export function detectFormat(filename: string): FormatId | null {
  const ext = getExtension(filename);
  return EXTENSION_LOOKUP[ext] ?? null;
}
