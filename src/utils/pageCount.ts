import { useEffect, useState } from 'react';
import type { ResumeTemplateId } from '../types/cv';
import { getExportClasses, getExportGeometry } from './pdf';

type MeasureOptions = { templateId: ResumeTemplateId; mode: 'standard' | 'ats' };

// Height slack before a page counts: sub-pixel rounding shouldn't add an empty last page.
const PAGE_SLACK_PX = 4;

export const countPages = (contentHeightPx: number, pageContentHeightPx: number) =>
  Math.max(1, Math.ceil((contentHeightPx - PAGE_SLACK_PX) / pageContentHeightPx));

let frame: HTMLIFrameElement | null = null;

/**
 * jsPDF lays the preview out in a container exactly `windowWidth` px wide, so measure a clone at that
 * width in a hidden same-origin iframe carrying the page's styles (media queries then match too).
 */
const getMeasureFrame = (width: number) => {
  if (!frame || !frame.isConnected) {
    frame = document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;height:800px;border:0;visibility:hidden;pointer-events:none;';
    document.body.appendChild(frame);
    const doc = frame.contentDocument!;
    const styles = [...document.querySelectorAll('style, link[rel="stylesheet"]')].map((node) => node.outerHTML).join('');
    doc.open();
    doc.write(`<!doctype html><html><head><base href="${document.baseURI}">${styles}</head><body style="margin:0"></body></html>`);
    doc.close();
  }
  frame.style.width = `${width}px`;
  return frame;
};

const waitForStyles = async (doc: Document) => {
  const links = [...doc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].filter((link) => !link.sheet);
  await Promise.all(links.map((link) => new Promise((resolve) => link.addEventListener('load', resolve, { once: true }))));
};

export const measurePreviewPages = async (element: HTMLElement, options: MeasureOptions) => {
  const { windowWidth, pageContentHeightPx } = getExportGeometry(options);
  const measureFrame = getMeasureFrame(windowWidth);
  const doc = measureFrame.contentDocument!;
  await waitForStyles(doc);
  const clone = element.cloneNode(true) as HTMLElement;
  clone.removeAttribute('id');
  clone.classList.add(...getExportClasses(options.mode));
  const container = doc.createElement('div');
  container.style.width = `${windowWidth}px`;
  container.appendChild(clone);
  doc.body.replaceChildren(container);
  await Promise.all([...clone.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)));
  // Laying the clone out starts its web-font loads; measuring before they finish uses fallback metrics.
  void clone.offsetHeight;
  await doc.fonts?.ready;
  const height = Math.max(clone.scrollHeight, clone.offsetHeight);
  doc.body.replaceChildren();
  return countPages(height, pageContentHeightPx);
};

/** Debounced A4 page count of the preview as it would export; null until the first measurement. */
export const usePageCount = (elementId: string, options: MeasureOptions & { enabled: boolean }, deps: unknown[]) => {
  const [pages, setPages] = useState<number | null>(null);
  const { templateId, mode, enabled } = options;
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      const element = document.getElementById(elementId);
      if (!element) return;
      measurePreviewPages(element, { templateId, mode })
        .then((count) => !cancelled && setPages(count))
        .catch(() => !cancelled && setPages(null));
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [elementId, templateId, mode, enabled, ...deps]);
  return pages;
};
