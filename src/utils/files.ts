export const readFileAsDataUrl = async (file: File): Promise<string> =>
  await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read file'));
    reader.readAsDataURL(file);
  });

export const PROFILE_PHOTO_MAX_SIZE = 600;

/** Scale so the longest side is at most `max`, never enlarging. */
export const fitWithin = (width: number, height: number, max = PROFILE_PHOTO_MAX_SIZE) => {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
};

/**
 * Downscales a photo on the device before it's stored. A raw phone photo can exceed the ~5 MB
 * localStorage quota on its own and stop autosave; 600px JPEG is plenty for a CV photo.
 * Falls back to the original file if the browser can't decode it.
 */
export const prepareProfilePhoto = async (file: File): Promise<string> => {
  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas unavailable');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();
    return canvas.toDataURL('image/jpeg', 0.85);
  } catch {
    return await readFileAsDataUrl(file);
  }
};
