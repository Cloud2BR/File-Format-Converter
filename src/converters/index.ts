import type {
  ConversionContext,
  ConversionResult,
  ConversionRoute,
  FormatId,
} from './types';
import {
  detectFormat,
  FORMATS,
  getBaseName,
} from './formats';
import {
  markdownToDocx,
  markdownToHtml,
  markdownToPdf,
  markdownToPptx,
} from './markdown';
import { docxToHtml, docxToMarkdown, docxToPdf } from './docx';
import {
  pdfToImagesPerPage,
  pdfToImagesZip,
  pdfToText,
} from './pdf';
import { csvToJson, jsonToCsv } from './data';
import {
  htmlToPdf,
  textToHtml,
  textToMarkdown,
  textToPdf,
  textToPptx,
} from './text';
import { htmlToMarkdown } from './html';
import {
  compressFile,
  compressImage,
  imageToJpg,
  imageToPng,
  imageToWebp,
} from './compression';

/** All available conversion routes keyed by source format. */
export const ROUTES: Partial<Record<FormatId, ConversionRoute[]>> = {
  markdown: [
    { target: 'html', handler: markdownToHtml },
    { target: 'pdf', handler: markdownToPdf },
    { target: 'docx', handler: markdownToDocx },
    { target: 'pptx', handler: markdownToPptx },
  ],
  docx: [
    { target: 'html', handler: docxToHtml },
    { target: 'markdown', handler: docxToMarkdown },
    { target: 'pdf', handler: docxToPdf },
  ],
  pdf: [
    { target: 'png-zip', handler: pdfToImagesZip },
    { target: 'png', handler: pdfToImagesPerPage },
    { target: 'txt', handler: pdfToText },
  ],
  html: [
    { target: 'markdown', handler: htmlToMarkdown },
    { target: 'pdf', handler: htmlToPdf },
  ],
  txt: [
    { target: 'markdown', handler: textToMarkdown },
    { target: 'html', handler: textToHtml },
    { target: 'pdf', handler: textToPdf },
    { target: 'pptx', handler: textToPptx },
  ],
  csv: [{ target: 'json', handler: csvToJson }],
  json: [{ target: 'csv', handler: jsonToCsv }],
  jpg: [
    { target: 'png', handler: imageToPng },
    { target: 'webp', handler: imageToWebp },
  ],
  png: [
    { target: 'jpg', handler: imageToJpg },
    { target: 'webp', handler: imageToWebp },
  ],
  webp: [
    { target: 'jpg', handler: imageToJpg },
    { target: 'png', handler: imageToPng },
  ],
};

/** Targets available for a given source format. */
export function getRoutes(source: FormatId): ConversionRoute[] {
  return ROUTES[source] ?? [];
}

/** Run a conversion for the chosen target. Throws if no route exists. */
export async function convert(
  file: File,
  target: FormatId,
  onProgress?: (fraction: number, message?: string) => void,
): Promise<ConversionResult> {
  const source = detectFormat(file.name);
  if (!source) {
    throw new Error(`Unsupported input file type: "${file.name}".`);
  }
  const route = getRoutes(source).find((r) => r.target === target);
  if (!route) {
    throw new Error(
      `No conversion from ${FORMATS[source].label} to ${FORMATS[target].label}.`,
    );
  }
  const ctx: ConversionContext = {
    file,
    baseName: getBaseName(file.name) || 'converted',
    onProgress,
  };
  return route.handler(ctx);
}

export { FORMATS, detectFormat, getBaseName };
export type { ConversionResult, FormatId };
export { compressFile, compressImage };
