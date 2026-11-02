import { Check, Maximize2, Minus, Pipette, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useState, type RefObject } from 'react';
import type { ResumeTemplateId } from '../../types/cv';
import { cn } from '../../utils/dom';
import { accentSwatches, contrastWithWhite, defaultAccent, templateLabelMap } from '../../utils/templateConfig';

/** Width the preview page is laid out at on wide screens; zoom scales it from there. */
export const PREVIEW_PAGE_WIDTH = 860;
const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(value * 100) / 100));

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    onChange();
    list.addEventListener('change', onChange);
    return () => list.removeEventListener('change', onChange);
  }, [query]);
  return matches;
};

/** Zoom for the preview page. "Fit" follows the canvas width until the user picks a zoom. */
export const usePreviewZoom = (canvasRef: RefObject<HTMLElement | null>, enabled: boolean) => {
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !fit || !canvas) return;
    const measure = () => {
      const style = window.getComputedStyle(canvas);
      const available = canvas.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
      if (available > 0) setZoom(clampZoom(Math.min(1, available / PREVIEW_PAGE_WIDTH)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, enabled, fit]);

  return {
    zoom,
    fit,
    zoomIn: () => {
      setFit(false);
      setZoom((value) => clampZoom(value + 0.1));
    },
    zoomOut: () => {
      setFit(false);
      setZoom((value) => clampZoom(value - 0.1));
    },
    fitToWidth: () => setFit(true),
    canZoomIn: zoom < MAX_ZOOM,
    canZoomOut: zoom > MIN_ZOOM,
  };
};

export function ZoomControls({ zoom, fit, zoomIn, zoomOut, fitToWidth, canZoomIn, canZoomOut }: ReturnType<typeof usePreviewZoom>) {
  const button = 'grid h-9 w-9 place-items-center rounded-lg text-[#374151] transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className="hidden items-center gap-0.5 rounded-xl border border-[#d9e2ef] bg-white p-0.5 lg:flex" role="group" aria-label="Preview zoom">
      <button type="button" className={button} onClick={zoomOut} disabled={!canZoomOut} aria-label="Zoom out">
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-12 text-center text-sm font-semibold tabular-nums text-[#374151]" aria-live="polite">
        {Math.round(zoom * 100)}%
      </span>
      <button type="button" className={button} onClick={zoomIn} disabled={!canZoomIn} aria-label="Zoom in">
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        className={cn('ml-0.5 inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold transition', fit ? 'bg-brand-50 text-brand-700' : 'text-[#374151] hover:bg-slate-100')}
        onClick={fitToWidth}
        aria-pressed={fit}
        title="Fit the page to the width of the preview"
      >
        <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
        Fit
      </button>
    </div>
  );
}

const templateOrder: ResumeTemplateId[] = ['classic', 'modern', 'compact', 'banner'];

/** Template and CV colour, side by side above the page. */
export function DesignBar({
  templateId,
  onChangeTemplate,
  accentColor,
  onChangeAccent,
  atsMode,
}: {
  templateId: ResumeTemplateId;
  onChangeTemplate: (templateId: ResumeTemplateId) => void;
  accentColor: string | null;
  onChangeAccent: (accentColor: string | null) => void;
  atsMode: boolean;
}) {
  const current = accentColor ?? defaultAccent;
  const isSwatch = accentSwatches.some((swatch) => swatch.value === current);
  const lowContrast = contrastWithWhite(current) < 4.5;

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <span id="template-label" className="text-xs font-bold uppercase tracking-[0.08em] text-[#5d6b84]">
          Template
        </span>
        <div className="inline-flex flex-wrap rounded-xl border border-[#d9e2ef] bg-[#f5f7fc] p-0.5" role="group" aria-labelledby="template-label">
          {templateOrder.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={templateId === id}
              onClick={() => onChangeTemplate(id)}
              className={cn(
                'rounded-[10px] px-3 py-1.5 text-sm font-semibold transition',
                templateId === id ? 'bg-white text-[#111827] shadow-[0_2px_8px_rgba(15,23,42,0.10)]' : 'text-[#5d6b84] hover:text-[#111827]',
              )}
            >
              {templateLabelMap[id]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span id="accent-label" className="text-xs font-bold uppercase tracking-[0.08em] text-[#5d6b84]">
          CV colour
        </span>
        <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-labelledby="accent-label">
          {accentSwatches.map((swatch) => {
            const selected = swatch.value === current;
            return (
              <button
                key={swatch.value}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={swatch.name}
                title={swatch.name}
                onClick={() => onChangeAccent(swatch.value === defaultAccent ? null : swatch.value)}
                className={cn('grid h-7 w-7 place-items-center rounded-full ring-offset-2 transition', selected ? 'ring-2 ring-[#111827]' : 'hover:scale-110')}
                style={{ backgroundColor: swatch.value }}
              >
                {selected && <Check className="h-3.5 w-3.5 text-white" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
        <label
          className={cn(
            'relative inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500',
            isSwatch ? 'border-[#d9e2ef] text-[#374151] hover:bg-slate-50' : 'border-[#111827] text-[#111827]',
          )}
        >
          <Pipette className="h-3.5 w-3.5" aria-hidden="true" style={isSwatch ? undefined : { color: current }} />
          Custom
          <input type="color" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" value={current} onChange={(event) => onChangeAccent(event.target.value)} />
        </label>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#d9e2ef] px-2.5 text-xs font-semibold text-[#374151] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onChangeAccent(null)}
          disabled={accentColor === null}
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset
        </button>
      </div>
      {(atsMode || lowContrast) && (
        <p className="text-xs text-[#5d6b84] xl:basis-full" role="status">
          {atsMode ? 'ATS mode prints in black, whatever the colour.' : 'This colour is light: text in it may be hard to read. Darker colours print more clearly.'}
        </p>
      )}
    </div>
  );
}
