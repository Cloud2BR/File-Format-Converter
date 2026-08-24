import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves this to a hashed asset URL we can hand to the worker.
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import JSZip from 'jszip';
import type { ConversionContext, ConversionResult } from './types';
import { readArrayBuffer } from './shared';

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

/** Target render scale (higher = sharper but heavier). */
const RENDER_SCALE = 2;

async function renderPages(
  ctx: ConversionContext,
): Promise<{ blobs: Blob[]; urls: string[] }> {
  const data = await readArrayBuffer(ctx.file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const blobs: Blob[] = [];
  const urls: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: RENDER_SCALE });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create canvas context.');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Canvas export failed.'))),
        'image/png',
      );
    });
    blobs.push(blob);
    urls.push(URL.createObjectURL(blob));

    ctx.onProgress?.(pageNum / pdf.numPages, `Rendering page ${pageNum} of ${pdf.numPages}`);
  }

  return { blobs, urls };
}

export interface RenderedPdfPage {
  blob: Blob;
  width: number;
  height: number;
}

/** Render PDF pages as JPEGs for the explicit size-limit compression mode. */
export async function renderPdfPagesAsJpegs(
  file: File,
  scale: number,
  quality: number,
  onProgress?: (fraction: number, message?: string) => void,
): Promise<RenderedPdfPage[]> {
  const data = await readArrayBuffer(file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const pages: RenderedPdfPage[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const pageSize = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to create canvas context.');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('JPEG export failed.'))),
        'image/jpeg',
        quality,
      );
    });
    pages.push({ blob, width: pageSize.width, height: pageSize.height });
    onProgress?.(pageNum / pdf.numPages, `Rendering page ${pageNum} of ${pdf.numPages}`);
  }

  return pages;
}

/** PDF -> ZIP archive of one PNG per page. */
export async function pdfToImagesZip(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const { blobs, urls } = await renderPages(ctx);
  const zip = new JSZip();
  const pad = String(blobs.length).length;
  blobs.forEach((blob, i) => {
    const n = String(i + 1).padStart(pad, '0');
    zip.file(`${ctx.baseName}-page-${n}.png`, blob);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    filename: `${ctx.baseName}-pages.zip`,
    preview: { kind: 'images', urls },
  };
}

/**
 * PDF -> per-page images. The downloadable artifact is still a ZIP (browsers
 * cannot emit many files at once), but the preview lets the user save each
 * page individually.
 */
export async function pdfToImagesPerPage(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const { blobs, urls } = await renderPages(ctx);
  const zip = new JSZip();
  const pad = String(blobs.length).length;
  blobs.forEach((blob, i) => {
    const n = String(i + 1).padStart(pad, '0');
    zip.file(`${ctx.baseName}-page-${n}.png`, blob);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  return {
    blob,
    filename: `${ctx.baseName}-pages.zip`,
    preview: { kind: 'images', urls },
  };
}

/** PDF -> extracted plain text. */
export async function pdfToText(
  ctx: ConversionContext,
): Promise<ConversionResult> {
  const data = await readArrayBuffer(ctx.file);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const parts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ')
      .replace(/\s+\n/g, '\n')
      .trim();
    parts.push(text);
    ctx.onProgress?.(pageNum / pdf.numPages, `Extracting page ${pageNum} of ${pdf.numPages}`);
  }

  const fullText = parts.join('\n\n');
  return {
    blob: new Blob([fullText], { type: 'text/plain;charset=utf-8' }),
    filename: `${ctx.baseName}.txt`,
    preview: { kind: 'text', content: fullText },
  };
}
