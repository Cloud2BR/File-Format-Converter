// Shared types for the conversion engine.

export type FormatId =
  | 'markdown'
  | 'docx'
  | 'pdf'
  | 'html'
  | 'txt'
  | 'csv'
  | 'json'
  | 'pptx'
  | 'png-zip'
  | 'png'
  | 'jpg'
  | 'webp';

export interface CompressionOptions {
  /** Output quality from 0.4 to 1.0 for lossy image formats. */
  quality: number;
  /** Desired maximum size in bytes, or null to use the quality setting. */
  targetSizeBytes: number | null;
}

export interface FormatMeta {
  id: FormatId;
  label: string;
  /** File extensions (lowercase, no dot) that map to this format. */
  extensions: string[];
  /** Short human description shown in the UI. */
  description: string;
}

/** The result a converter handler produces. */
export interface ConversionResult {
  /** The bytes to download. */
  blob: Blob;
  /** Suggested file name (without directory). */
  filename: string;
  /** Optional in-browser preview payload. */
  preview?:
    | { kind: 'text'; content: string }
    | { kind: 'html'; content: string }
    | { kind: 'images'; urls: string[] };
}

export interface ConversionContext {
  /** Source file the user uploaded. */
  file: File;
  /** Base name of the source file without extension. */
  baseName: string;
  /** Progress reporter (0..1) the UI can subscribe to. */
  onProgress?: (fraction: number, message?: string) => void;
}

export type ConversionHandler = (
  ctx: ConversionContext,
) => Promise<ConversionResult>;

export interface ConversionRoute {
  /** Target format produced by this route. */
  target: FormatId;
  handler: ConversionHandler;
}
