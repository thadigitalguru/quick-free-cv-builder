import { ChevronDown, Minus, Plus } from 'lucide-react';
import { Select } from '../shared/controls';
import { templateLabelMap } from '../../utils/templateConfig';
import { typographyMinMax, type PreviewTypography } from './typography';

export function AdvancedOptionsCard({
  open,
  onToggle,
  onReset,
  typography,
  templateId,
  onChangeTemplate,
  onChange,
}: {
  open: boolean;
  onToggle: () => void;
  onReset: () => void;
  typography: PreviewTypography;
  templateId: 'classic' | 'modern' | 'compact';
  onChangeTemplate: (templateId: 'classic' | 'modern' | 'compact') => void;
  onChange: (key: keyof PreviewTypography, value: number) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#d9e2ef] bg-white px-4 py-3 shadow-[0_18px_48px_rgba(15,23,42,0.06)] lg:px-5 lg:py-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 flex-1">
          <button type="button" className="flex w-full items-start gap-2.5 text-left" onClick={onToggle} aria-expanded={open}>
            <ChevronDown className={`mt-0.5 h-4.5 w-4.5 shrink-0 text-[#5d6b84] transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            <span>
              <span className="block text-[16px] font-bold uppercase tracking-[0.08em] text-[#5d6b84]">Advanced options</span>
              <span className="mt-0.5 block text-[14px] font-normal normal-case tracking-normal text-[#5d6b84]">Template and font sizes. The defaults work for most CVs.</span>
            </span>
          </button>
        </h2>
        {/* A separate button: a control nested inside the toggle can't be reached reliably. */}
        <button type="button" onClick={onReset} className="shrink-0 pt-1 text-[15px] font-semibold text-[#2f5ee2]">
          Restore defaults
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-6">
          <section>
            <h3 className="text-[16px] font-semibold text-[#374151]">Template</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <label htmlFor="template-select" className="mb-1.5 block text-sm font-medium text-slate-700">Preview style</label>
                <Select id="template-select" value={templateId} onChange={(event) => onChangeTemplate(event.target.value as 'classic' | 'modern' | 'compact')}>
                  {Object.entries(templateLabelMap).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <p className="text-sm text-[#5d6b84]">
                {templateId === 'compact'
                  ? 'Compact tightens spacing in the editor and export.'
                  : 'Switch between the available preview styles.'}
              </p>
            </div>
          </section>

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
