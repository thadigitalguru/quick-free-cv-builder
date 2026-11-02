import { ChevronDown, Minus, Plus } from 'lucide-react';
import { typographyMinMax, type PreviewTypography } from './typography';

export function AdvancedOptionsCard({
  open,
  onToggle,
  onReset,
  typography,
  onChange,
}: {
  open: boolean;
  onToggle: () => void;
  onReset: () => void;
  typography: PreviewTypography;
  onChange: (key: keyof PreviewTypography, value: number) => void;
}) {
  return (
    // Lives at the foot of the design card: one quiet line until opened.
    <div className="mt-2.5 border-t border-[#e6ecf4] pt-2">
      <div className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 flex-1">
          <button type="button" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5d6b84] hover:text-[#111827]" onClick={onToggle} aria-expanded={open}>
            <ChevronDown className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            Font sizes
            <span className="font-normal">· the defaults work for most CVs</span>
          </button>
        </h2>
        {/* A separate button: a control nested inside the toggle can't be reached reliably. */}
        {open && (
          <button type="button" onClick={onReset} className="shrink-0 text-[13px] font-semibold text-[#2f5ee2]">
            Restore defaults
          </button>
        )}
      </div>

      {open && (
        <div className="mt-4 space-y-6">
          <section>
            <h3 className="text-[16px] font-semibold text-[#374151]">Personal Info Options</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <TypographyField
                label="Full name font size"
                description="Controls the name in the header."
                value={typography.fullName}
                min={typographyMinMax.fullName.min}
                max={typographyMinMax.fullName.max}
                onMinus={() => onChange('fullName', typography.fullName - 1)}
                onPlus={() => onChange('fullName', typography.fullName + 1)}
                onInput={(value) => onChange('fullName', value)}
              />
              <TypographyField
                label="Job title font size"
                description="Applies to the role beneath your name."
                value={typography.jobTitle}
                min={typographyMinMax.jobTitle.min}
                max={typographyMinMax.jobTitle.max}
                onMinus={() => onChange('jobTitle', typography.jobTitle - 1)}
                onPlus={() => onChange('jobTitle', typography.jobTitle + 1)}
                onInput={(value) => onChange('jobTitle', value)}
              />
              <TypographyField
                label="Contact details font size"
                description="Email, phone, and links in the header."
                value={typography.contact}
                min={typographyMinMax.contact.min}
                max={typographyMinMax.contact.max}
                onMinus={() => onChange('contact', typography.contact - 1)}
                onPlus={() => onChange('contact', typography.contact + 1)}
                onInput={(value) => onChange('contact', value)}
              />
            </div>
          </section>

          <section>
            <h3 className="text-[16px] font-semibold text-[#374151]">Section Typography</h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <TypographyField
                label="Section title font size"
                description="Applies to headings like Experience or Skills."
                value={typography.sectionTitle}
                min={typographyMinMax.sectionTitle.min}
                max={typographyMinMax.sectionTitle.max}
                onMinus={() => onChange('sectionTitle', typography.sectionTitle - 1)}
                onPlus={() => onChange('sectionTitle', typography.sectionTitle + 1)}
                onInput={(value) => onChange('sectionTitle', value)}
              />
              <TypographyField
                label="Section item title font size"
                description="Used for job titles and project names."
                value={typography.sectionItemTitle}
                min={typographyMinMax.sectionItemTitle.min}
                max={typographyMinMax.sectionItemTitle.max}
                onMinus={() => onChange('sectionItemTitle', typography.sectionItemTitle - 1)}
                onPlus={() => onChange('sectionItemTitle', typography.sectionItemTitle + 1)}
                onInput={(value) => onChange('sectionItemTitle', value)}
              />
              <TypographyField
                label="Section details font size"
                description="Controls the text under each entry."
                value={typography.sectionDetails}
                min={typographyMinMax.sectionDetails.min}
                max={typographyMinMax.sectionDetails.max}
                onMinus={() => onChange('sectionDetails', typography.sectionDetails - 1)}
                onPlus={() => onChange('sectionDetails', typography.sectionDetails + 1)}
                onInput={(value) => onChange('sectionDetails', value)}
              />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function TypographyField({
  label,
  description,
  value,
  min,
  max,
  onMinus,
  onPlus,
  onInput,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onMinus: () => void;
  onPlus: () => void;
  onInput: (value: number) => void;
}) {
  return (
    <div>
      <h4 className="text-[16px] font-semibold text-[#374151]">{label}</h4>
      <p className="mt-1 text-[14px] text-[#5d6b84]">{description}</p>
      <div className="mt-3 flex items-center gap-2.5">
        <button type="button" onClick={onMinus} aria-label={`Decrease ${label.toLowerCase()}`} className="grid h-[44px] w-[44px] place-items-center rounded-[12px] border border-[#cfd9e8] bg-white text-[28px] leading-none text-[#5d6b84] shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <Minus className="h-5 w-5" />
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          aria-label={`${label} in pixels`}
          onChange={(event) => onInput(Number(event.target.value) || min)}
          className="h-[44px] w-full rounded-[12px] border border-[#cfd9e8] bg-white px-3.5 text-[15px] text-[#334155] outline-none focus:border-brand-500"
        />
        <span className="text-[14px] font-medium text-[#5d6b84]">px</span>
        <button type="button" onClick={onPlus} aria-label={`Increase ${label.toLowerCase()}`} className="grid h-[44px] w-[44px] place-items-center rounded-[12px] border border-[#cfd9e8] bg-white text-[#5d6b84] shadow-[0_1px_0_rgba(15,23,42,0.03)]">
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
