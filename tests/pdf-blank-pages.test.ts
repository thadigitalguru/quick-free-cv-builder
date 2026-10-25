import { describe, expect, it } from 'vitest';
import { jsPDF } from 'jspdf';
import { removeTrailingBlankPages } from '../src/utils/pdf';

describe('removeTrailingBlankPages', () => {
  it('drops empty trailing pages, including ones with only a background fill', () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    pdf.text('Page one', 10, 10);
    pdf.addPage();
    pdf.text('Page two', 10, 10);
    pdf.addPage();
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, 210, 20, 'F');
    pdf.addPage();
    removeTrailingBlankPages(pdf as never);
    expect(pdf.getNumberOfPages()).toBe(2);
  });

  it('keeps blank pages that sit before content and never removes the only page', () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    pdf.addPage();
    pdf.text('Last page text', 10, 10);
    removeTrailingBlankPages(pdf as never);
    expect(pdf.getNumberOfPages()).toBe(2);

    const empty = new jsPDF({ unit: 'mm', format: 'a4' });
    removeTrailingBlankPages(empty as never);
    expect(empty.getNumberOfPages()).toBe(1);
  });
});
