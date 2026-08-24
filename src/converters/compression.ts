import JSZip from 'jszip';
import type {
  CompressionOptions,
  ConversionContext,
  ConversionResult,
} from './types';

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const OFFICE_PACKAGE_TYPES: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unable to read this image.'));
    };
    image.src = url;
  });
}

function canvasBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image export failed.'))),
      type,
      quality,
    );
  });
}

function drawImage(image: HTMLImageElement, scale = 1): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create canvas context.');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function convertImage(
  ctx: ConversionContext,
  extension: 'jpg' | 'png' | 'webp',
): Promise<ConversionResult> {
  const image = await loadImage(ctx.file);
  const canvas = drawImage(image);
  ctx.onProgress?.(0.5, `Converting to ${extension.toUpperCase()}…`);
  const blob = await canvasBlob(canvas, IMAGE_TYPES[extension], extension === 'png' ? 1 : 0.92);
  ctx.onProgress?.(1, 'Done');
  return {
    blob,
    filename: `${ctx.baseName}.${extension}`,
    preview: { kind: 'images', urls: [URL.createObjectURL(blob)] },
  };
}

export const imageToJpg = (ctx: ConversionContext) => convertImage(ctx, 'jpg');
export const imageToPng = (ctx: ConversionContext) => convertImage(ctx, 'png');
export const imageToWebp = (ctx: ConversionContext) => convertImage(ctx, 'webp');

/**
 * Compress a raster image locally. Lossy formats use a quality search when a
 * maximum size is supplied; PNG remains lossless because canvas ignores PNG
 * quality values.
 */
export async function compressImage(
  file: File,
  options: CompressionOptions,
  onProgress?: (fraction: number, message?: string) => void,
): Promise<ConversionResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const type = IMAGE_TYPES[extension];
  if (!type) throw new Error('Compression supports JPG, PNG, and WebP images.');

  const image = await loadImage(file);
  let canvas = drawImage(image);

  const quality = Math.min(1, Math.max(0.1, options.quality));
  let blob = await canvasBlob(canvas, type, quality);
  onProgress?.(0.35, 'Compressing image…');

  if (options.targetSizeBytes && type !== 'image/png' && blob.size > options.targetSizeBytes) {
    let low = 0.1;
    let high = quality;
    let smallest = await canvasBlob(canvas, type, low);
    let bestUnderTarget: Blob | null =
      smallest.size <= options.targetSizeBytes ? smallest : null;
    for (let attempt = 0; attempt < 8; attempt++) {
      const candidateQuality = (low + high) / 2;
      const candidate = await canvasBlob(canvas, type, candidateQuality);
      if (candidate.size < smallest.size) smallest = candidate;
      onProgress?.(0.35 + ((attempt + 1) / 8) * 0.55, 'Matching target size…');
      if (candidate.size <= options.targetSizeBytes) {
        blob = candidate;
        bestUnderTarget = candidate;
        low = candidateQuality;
      } else {
        high = candidateQuality;
      }
    }
    blob = bestUnderTarget ?? smallest;

    let scale = 1;
    for (let resizeAttempt = 0; !bestUnderTarget && resizeAttempt < 8; resizeAttempt++) {
      const estimatedScale = Math.sqrt(options.targetSizeBytes / Math.max(1, blob.size)) * 0.95;
      scale *= Math.min(0.9, Math.max(0.35, estimatedScale));
      canvas = drawImage(image, scale);
      const candidate = await canvasBlob(canvas, type, low);
      if (candidate.size < blob.size) blob = candidate;
      if (candidate.size <= options.targetSizeBytes) bestUnderTarget = candidate;
      onProgress?.(0.9 + ((resizeAttempt + 1) / 8) * 0.09, 'Reducing image dimensions…');
    }
    blob = bestUnderTarget ?? blob;
  }

  if (blob.size >= file.size) {
    blob = file;
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'compressed';
  return {
    blob,
    filename: `${baseName}-compressed.${extension}`,
    preview: { kind: 'images', urls: [URL.createObjectURL(blob)] },
  };
}

async function compressOfficePackage(
  file: File,
  extension: string,
  onProgress?: (fraction: number, message?: string) => void,
): Promise<ConversionResult> {
  onProgress?.(0.1, 'Reading document package…');
  const zip = await JSZip.loadAsync(file);
  const blob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
      mimeType: OFFICE_PACKAGE_TYPES[extension],
    },
    ({ percent }) => onProgress?.(0.1 + (percent / 100) * 0.9, 'Compressing document…'),
  );
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'compressed';
  return {
    blob,
    filename: `${baseName}-compressed.${extension}`,
  };
}

/** Prepare any supported upload in its original format without sending it outside the browser. */
export function compressFile(
  file: File,
  options: CompressionOptions,
  onProgress?: (fraction: number, message?: string) => void,
): Promise<ConversionResult> {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'compressed';

  if (IMAGE_TYPES[extension]) {
    return compressImage(file, options, onProgress);
  }
  if (OFFICE_PACKAGE_TYPES[extension]) {
    return compressOfficePackage(file, extension, onProgress);
  }

  onProgress?.(1, 'Original format preserved');
  return Promise.resolve({
    blob: file,
    filename: `${baseName}-compressed.${extension}`,
  });
}
