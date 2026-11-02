import { useMemo } from 'react';
import { Trash2, Upload } from 'lucide-react';
import { useCVStore } from '../../../store/cvStore';
import { Button, Input, Textarea } from '../../shared/controls';
import { prepareProfilePhoto } from '../../../utils/files';
import { PHOTO_ZOOM_MAX, PHOTO_ZOOM_MIN, useCroppedPhoto } from '../../../utils/photoCrop';
import { cn } from '../../../utils/dom';
import { type ValidationIssue } from '../../../utils/validation';
import { Field, buildIssueLookup } from './fields';

export function PersonalInfoForm({ validationIssues }: { validationIssues: ValidationIssue[] }) {
  const { document, updatePersonalInfo, updateProfilePhoto, removeProfilePhoto } = useCVStore();
  const info = document.personalInfo;
  const croppedPhoto = useCroppedPhoto(info.profilePhoto, { zoom: info.photoZoom, x: info.photoX, y: info.photoY });
  const issueMap = useMemo(() => buildIssueLookup(validationIssues), [validationIssues]);
  const fieldError = (field: string) => issueMap.get(field);

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
        <div className="flex items-center gap-4">
          {info.profilePhoto ? (
            <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-full border-2 border-white shadow-[0_4px_12px_rgba(15,23,42,0.15)]">
              {/* The same baked crop the CV and PDF use, so what you frame here is what exports. */}
              {croppedPhoto && <img src={croppedPhoto} alt="Profile photo as it appears on your CV" className="h-full w-full" />}
            </div>
          ) : (
            <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full border border-dashed border-[#c9d3e2] bg-white text-[12px] font-medium text-[#5d6b84]">
              No photo
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-[#374151]">Profile photo</div>
            <p className="mt-0.5 text-[13px] leading-5 text-[#5d6b84]">Optional. A square image, at least 400×400px. Shown in Standard exports; ATS exports leave it out.</p>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="profile-photo-upload"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            updateProfilePhoto(await prepareProfilePhoto(file));
            e.target.value = '';
          }}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {/* A button inside a <label> doesn't open the file picker, so trigger the input directly. */}
          <Button
            variant="secondary"
            className="h-10 rounded-[12px] border-[#c3cde0] bg-white px-4 text-[14px] font-semibold text-[#374151]"
            onClick={() => window.document.getElementById('profile-photo-upload')?.click()}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            {info.profilePhoto ? 'Replace photo' : 'Upload photo'}
          </Button>
          {info.profilePhoto && (
            <Button variant="secondary" className="h-10 rounded-[12px] border-[#c3cde0] bg-white px-4 text-[14px] font-semibold text-[#374151]" onClick={removeProfilePhoto}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove photo
            </Button>
          )}
        </div>

        {info.profilePhoto && (
          <div className="mt-4 space-y-4 rounded-[14px] border border-[#e3eaf4] bg-white p-4">
                <PhotoControl
                  label="Zoom"
                  value={Math.min(PHOTO_ZOOM_MAX, Math.max(PHOTO_ZOOM_MIN, info.photoZoom))}
                  min={PHOTO_ZOOM_MIN}
                  max={PHOTO_ZOOM_MAX}
                  step={0.05}
                  format={(value) => `${value.toFixed(2)}×`}
                  onChange={(value) => updatePersonalInfo('photoZoom', value)}
                />
                <PhotoControl
                  label="Left ↔ right"
                  value={info.photoX}
                  min={0}
                  max={100}
                  step={1}
                  format={(value) => `${Math.round(value)}%`}
                  onChange={(value) => updatePersonalInfo('photoX', value)}
                />
                <PhotoControl
                  label="Up ↕ down"
                  value={info.photoY}
                  min={0}
                  max={100}
                  step={1}
                  format={(value) => `${Math.round(value)}%`}
                  onChange={(value) => updatePersonalInfo('photoY', value)}
                />
            <p className="text-xs leading-5 text-[#5d6b84]">Position moves the frame once the photo is zoomed in or isn't square.</p>
            <Button variant="secondary" className="h-9 rounded-[12px] border-[#c3cde0] bg-white px-3 text-xs font-semibold text-[#374151]" onClick={() => {
              updatePersonalInfo('photoZoom', 1);
              updatePersonalInfo('photoX', 50);
              updatePersonalInfo('photoY', 50);
            }} aria-label="Reset photo crop to centered default">
              Reset crop
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-5">
        {/* A missing name isn't an error while someone is still filling the form in; the Checks box covers it. */}
        <Field label="Full Name *" hint="Needed before you can export.">
          <Input
            value={info.fullName}
            onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
            placeholder="Jane Doe"
            autoComplete="name"
            required
            className="h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]"
          />
        </Field>

        <Field label="Job Title" hint="Short professional title, e.g. Product Designer or SEO Manager.">
          <Input
            value={info.jobTitle}
            onChange={(e) => updatePersonalInfo('jobTitle', e.target.value)}
            placeholder="Software Engineer, Product Designer, etc."
            autoComplete="organization-title"
            className="h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label htmlFor="summary-input" className="block text-[15px] font-semibold text-[#374151]">Summary / Objective</label>
            <Button variant="ghost" className="h-auto self-start px-2 py-1 text-xs leading-none text-slate-500" onClick={() => useCVStore.getState().clearSection('summary')}>Clear summary</Button>
          </div>
          <Textarea
            id="summary-input"
            aria-describedby="summary-tip"
            value={info.summary}
            onChange={(e) => updatePersonalInfo('summary', e.target.value)}
            rows={4}
            placeholder="2–4 lines summarizing your experience and goals."
            className="min-h-[108px] rounded-[12px] border-[#cbd6e4] px-4 py-3 text-[15px] placeholder:text-[#a1aab8]"
          />
          <p id="summary-tip" className="mt-2 text-[13px] leading-5 text-[#5d6b84]">
            Tip: wrap words in <strong className="font-semibold text-[#5b6780]">**double asterisks**</strong> for bold, and start a line with <strong className="font-semibold text-[#5b6780]">- </strong> for a bullet.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Email *" error={fieldError('email')} hint="Use the inbox recruiters should contact.">
            <Input
              type="email"
              value={info.email}
              onChange={(e) => updatePersonalInfo('email', e.target.value)}
              placeholder="jane@example.com"
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(fieldError('email'))}
              className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError('email') && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
            />
          </Field>
          <Field label="Phone" hint="Include country code if you work internationally.">
            <Input
              type="tel"
              value={info.phone}
              onChange={(e) => updatePersonalInfo('phone', e.target.value)}
              placeholder="+1 234 567 890"
              autoComplete="tel"
              inputMode="tel"
              className="h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]"
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Location" hint="City, country is usually enough.">
            <Input
              value={info.location}
              onChange={(e) => updatePersonalInfo('location', e.target.value)}
              placeholder="City, Country"
              autoComplete="address-level2"
              className="h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]"
            />
          </Field>
          <Field label="LinkedIn URL" error={fieldError('linkedinUrl')} hint="Paste the full profile URL, including https://.">
            <Input
              type="url"
              value={info.linkedinUrl}
              onChange={(e) => updatePersonalInfo('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/you"
              inputMode="url"
              autoComplete="url"
              aria-invalid={Boolean(fieldError('linkedinUrl'))}
              className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError('linkedinUrl') && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
            />
          </Field>
        </div>

        <Field label="Personal Website" error={fieldError('websiteUrl')} hint="Portfolio, website, or GitHub Pages link.">
          <Input
            type="url"
            value={info.websiteUrl}
            onChange={(e) => updatePersonalInfo('websiteUrl', e.target.value)}
            placeholder="https://your-portfolio.com"
            inputMode="url"
            autoComplete="url"
            aria-invalid={Boolean(fieldError('websiteUrl'))}
            className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError('websiteUrl') && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
          />
        </Field>
      </div>

    </div>
  );
}

function PhotoControl({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const valueText = format(value);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm font-medium text-[#425067]">
        <span>{label}</span>
        <span className="tabular-nums text-[#6e7f99]" aria-hidden="true">
          {valueText}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-brand-600"
      />
    </div>
  );
}
