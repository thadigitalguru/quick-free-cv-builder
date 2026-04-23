export const exportPreviewAsPdf = async (element: HTMLElement | null) => {
  if (!element) return;

  const { default: html2pdf } = await import('html2pdf.js');
  const options = {
    margin: [8, 8, 10, 8] as [number, number, number, number],
    filename: 'Quick-Free-CV.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  };

  await html2pdf().set(options as any).from(element).save();
};
