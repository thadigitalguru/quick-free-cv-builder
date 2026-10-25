import { useEffect, useState } from 'react';

export const PHOTO_ZOOM_MIN = 1;
export const PHOTO_ZOOM_MAX = 3;

export interface PhotoCrop {
  zoom: number;
  /** 0 = left/top edge of the photo, 100 = right/bottom edge, 50 = centred. */
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

/**
 * The square of the source image that ends up in the circle. Zoom 1 uses the largest centred
 * square; higher zoom takes a smaller square. x/y slide it within the image, so the crop can never
 * run past an edge and leave a gap.
 */
export const getCropRect = (width: number, height: number, crop: PhotoCrop) => {
  const zoom = clamp(crop.zoom, PHOTO_ZOOM_MIN, PHOTO_ZOOM_MAX);
  const size = Math.min(width, height) / zoom;
  return {
    sx: (width - size) * (clamp(crop.x, 0, 100) / 100),
    sy: (height - size) * (clamp(crop.y, 0, 100) / 100),
    size,
  };
};

const cache = new Map<string, Promise<string>>();

/**
 * Bakes the crop into a round PNG with transparent corners. The PDF renderer (html2canvas) ignores
 * object-fit and object-position, so CSS-only cropping would come out stretched in the export.
 */
export const renderCroppedPhoto = (src: string, crop: PhotoCrop, outputSize = 320): Promise<string> => {
  const key = `${crop.zoom}|${crop.x}|${crop.y}|${outputSize}|${src}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const result = (async () => {
    const image = new Image();
    image.src = src;
    await image.decode();
    const { sx, sy, size } = getCropRect(image.naturalWidth, image.naturalHeight, crop);
    const canvas = document.createElement('canvas');
    canvas.width = outputSize;
    canvas.height = outputSize;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.beginPath();
    context.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
    context.clip();
    context.drawImage(image, sx, sy, size, size, 0, 0, outputSize, outputSize);
    return canvas.toDataURL('image/png');
  })();
  // Keep the cache small: slider drags produce many short-lived crops.
  if (cache.size > 24) cache.delete(cache.keys().next().value!);
  cache.set(key, result);
  result.catch(() => cache.delete(key));
  return result;
};

/** The cropped photo as a data URL; keeps showing the previous crop while the next one renders. */
export const useCroppedPhoto = (src: string, crop: PhotoCrop) => {
  const [cropped, setCropped] = useState<{ src: string; url: string } | null>(null);
  const { zoom, x, y } = crop;
  useEffect(() => {
    if (!src) return;
    let active = true;
    renderCroppedPhoto(src, { zoom, x, y })
      .then((url) => active && setCropped({ src, url }))
      .catch(() => active && setCropped(null));
    return () => {
      active = false;
    };
  }, [src, zoom, x, y]);
  // Never show a crop of a photo that has since been replaced or removed.
  return src && cropped?.src === src ? cropped.url : null;
};
