/** Saves a file through a link click; must run inside the user's tap or click on iOS to download. */
export const downloadBlob = (filename: string, blob: Blob) => {
  if (typeof window === 'undefined') return;

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking straight away can cancel a download that is still starting on slower devices.
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const downloadTextFile = (filename: string, content: string, mimeType = 'text/plain;charset=utf-8') => {
  downloadBlob(filename, new Blob([content], { type: mimeType }));
};

/**
 * iPhone and iPad (including iPadOS, which reports itself as a Mac). Safari there only downloads
 * a file when the save happens inside a tap; a save that fires seconds later opens the PDF in a tab.
 */
export const needsTapToSave = () =>
  typeof navigator !== 'undefined' &&
  (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && (navigator.maxTouchPoints > 1 || (typeof document !== 'undefined' && 'ontouchend' in document))));

export const canShareFile = (file: File) => {
  try {
    return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
};
