export const exportPreviewAsPdf = async (element: HTMLElement | null, filename = 'Quick-Free-CV.pdf') => {
  if (!element) return;

  const { default: html2pdf } = await import('html2pdf.js');
  const options = {
    margin: [8, 6, 8, 6] as [number, number, number, number],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2.25,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      windowWidth: 1280,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: {
      mode: ['css', 'legacy', 'avoid-all'],
      avoid: ['.resume-section', '.pdf-avoid-break', '.pdf-section-group', 'article', 'li'],
    },
    enableLinks: true,
  };

  element.classList.add('pdf-export');
  try {
    await html2pdf().set(options as any).from(element).save();
  } finally {
    element.classList.remove('pdf-export');
  }
};
