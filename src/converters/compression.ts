import type {
  CompressionOptions,
  ConversionResult,
} from './types';

const IMAGE_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
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
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Unable to create canvas context.');
  context.drawImage(image, 0, 0);

  const quality = Math.min(1, Math.max(0.4, options.quality));
  let blob = await canvasBlob(canvas, type, quality);
  onProgress?.(0.35, 'Compressing image…');

  if (options.targetSizeBytes && type !== 'image/png' && blob.size > options.targetSizeBytes) {
    let low = 0.4;
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
    if (blob.size > options.targetSizeBytes) blob = bestUnderTarget ?? smallest;
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'compressed';
  return {
    blob,
    filename: `${baseName}-compressed.${extension}`,
    preview: { kind: 'images', urls: [URL.createObjectURL(blob)] },
  };
}
