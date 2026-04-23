export const exportPreviewAsPdf = async (element: HTMLElement | null) => {
  if (!element) return;

  const { default: html2pdf } = await import('html2pdf.js');
  const options = {
    margin: [6, 6, 8, 6] as [number, number, number, number],
    filename: 'Quick-Free-CV.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: {
      mode: ['css', 'legacy', 'avoid-all'],
      avoid: ['.resume-section', '.pdf-avoid-break', '.pdf-section-group'],
    },
    enableLinks: true,
  };

  await html2pdf().set(options as any).from(element).save();
};
