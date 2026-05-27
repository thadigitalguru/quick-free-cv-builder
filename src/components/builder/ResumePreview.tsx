import { useEffect, useState } from 'react';
import { useCVStore } from '../../store/cvStore';
import { formatRange, getVisibleOrder, experienceSummary, projectSummary } from '../../utils/cvUtils';
import { sectionLabelMap } from '../../data/sectionMeta';

type PreviewTypography = {
  fullName: number;
  jobTitle: number;
  contact: number;
  sectionTitle: number;
  sectionItemTitle: number;
  sectionDetails: number;
};

const defaultTypography: PreviewTypography = {
  fullName: 28,
  jobTitle: 20,
  contact: 14,
  sectionTitle: 13,
  sectionItemTitle: 14,
  sectionDetails: 13,
};

export default function ResumePreview({
  mode = 'standard',
  typography = defaultTypography,
}: {
  mode?: 'standard' | 'ats';
  typography?: PreviewTypography;
}) {
  const cvDocument = useCVStore((state) => state.document);
  const templateId = useCVStore((state) => state.templateId);
  const [samplePreview, setSamplePreview] = useState<typeof cvDocument | null>(null);

  useEffect(() => {
    let active = true;
    if (!isBlankDocument(cvDocument)) {
      setSamplePreview(null);
      return () => {
        active = false;
      };
    }

    void import('../../data/mockPreview').then(({ mockPreview }) => {
      if (active) setSamplePreview(mockPreview as typeof cvDocument);
    });

    return () => {
      active = false;
    };
  }, [cvDocument]);

  const isModern = templateId === 'modern' && mode !== 'ats';
  const isCompact = templateId === 'compact' && mode !== 'ats';
  const shellClass = isModern ? 'bg-slate-950 text-white' : 'bg-white text-slate-900';
  const pageClass = isCompact ? 'mx-auto w-full max-w-[980px] px-3 py-5 lg:px-4 lg:py-6' : 'mx-auto w-full max-w-[1100px] px-4 py-7 lg:px-6 lg:py-8';
  const isBlank = isBlankDocument(cvDocument);
  const source = isBlank ? samplePreview ?? cvDocument : cvDocument;
  const visibleOrder = isBlank ? (['summary', 'experience'] as const) : getVisibleOrder(cvDocument);
  const isDemoPreview = isBlank;

  return (
    <div className="h-full overflow-auto bg-transparent">
      <div
        id="resume-preview-root"
        className={`pdf-section-group rounded-[1px] print:p-0 ${pageClass} ${shellClass} ${mode === 'ats' ? 'font-sans' : ''}`}
      >
        {isDemoPreview && (
          <div className={`mb-5 rounded-[14px] border px-4 py-3 text-sm ${mode === 'ats' ? 'border-black bg-white text-black' : isModern ? 'border-white/20 bg-white/5 text-white/80' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
            {samplePreview ? 'Sample content is shown here until you start entering your CV details.' : 'Loading sample preview…'}
          </div>
        )}

        <header className={`pb-5 ${mode === 'ats' ? 'border-b border-black' : isModern ? 'border-b border-white/20' : 'border-b border-slate-200'}`}>
          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="flex min-w-0 gap-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <h1
                  className={`font-extrabold leading-none tracking-[-0.03em] ${mode === 'ats' || !isModern ? 'text-inherit' : 'text-white'}`}
                  style={{ fontSize: `${typography.fullName}px` }}
                >
                  {source.personalInfo.fullName || 'Your full name'}
                </h1>
                <p
                  className={`font-medium ${mode === 'ats' ? 'text-black' : isModern ? 'text-brand-100' : 'text-brand-700'}`}
                  style={{ fontSize: `${typography.jobTitle}px` }}
                >
                  {source.personalInfo.jobTitle || 'Job title or professional headline'}
                </p>
              </div>
            </div>

            <div className={`leading-[1.55] ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-slate-500'}`} style={{ fontSize: `${typography.contact}px` }}>
              <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                <ContactLine label="Email:" value={source.personalInfo.email} href={source.personalInfo.email ? `mailto:${source.personalInfo.email}` : undefined} mode={mode} isModern={isModern} />
                <ContactLine label="Phone:" value={source.personalInfo.phone} href={source.personalInfo.phone ? `tel:${source.personalInfo.phone.replace(/[^+\d]/g, '')}` : undefined} mode={mode} isModern={isModern} />
                <ContactLine label="Location:" value={source.personalInfo.location} mode={mode} isModern={isModern} />
                <ContactLine label="Portfolio:" value={source.personalInfo.websiteUrl} href={normalizeWebUrl(source.personalInfo.websiteUrl)} mode={mode} isModern={isModern} />
                <div className="sm:col-span-2">
                  <ContactLine label="LinkedIn:" value={source.personalInfo.linkedinUrl} href={normalizeWebUrl(source.personalInfo.linkedinUrl)} mode={mode} isModern={isModern} />
                </div>
              </div>
            </div>
          </div>

          {(source.personalInfo.summary || source.skills.length > 0 || isBlank) && (
            <div className={`mt-5 grid gap-3 text-sm ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`}>
              <div>
                <h2
                  className={`pb-2 font-bold uppercase tracking-[0.08em] ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-700'}`}
                  style={{ fontSize: `${typography.sectionTitle}px` }}
                >
                  Professional Summary
                </h2>
                <p className="mt-1 leading-8" style={{ fontSize: `${typography.sectionDetails}px` }}>
                  {source.personalInfo.summary}
                </p>
              </div>
              {source.skills.length > 0 && (
                <div>
                  <h2
                    className={`pb-2 font-bold uppercase tracking-[0.08em] ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-700'}`}
                    style={{ fontSize: `${typography.sectionTitle}px` }}
                  >
                    Top Skills
                  </h2>
                  <p className="mt-1 leading-8" style={{ fontSize: `${typography.sectionDetails}px` }}>
                    {source.skills.slice(0, 8).join(' · ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </header>

        <div className={isCompact ? 'mt-4 space-y-6' : 'mt-6 space-y-8'}>
          {visibleOrder.map((sectionId) => (
            <PreviewSection key={sectionId} sectionId={sectionId} mode={mode} templateId={templateId} typography={typography} source={source as typeof cvDocument} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  sectionId,
  mode,
  templateId,
  typography,
  source,
}: {
  sectionId: keyof typeof sectionLabelMap;
  mode: 'standard' | 'ats';
  templateId: 'classic' | 'modern' | 'compact';
  typography: PreviewTypography;
  source: ReturnType<typeof useCVStore.getState>['document'];
}) {
  const label = sectionLabelMap[sectionId];
  const isModern = templateId === 'modern' && mode !== 'ats';
  const isCompact = templateId === 'compact' && mode !== 'ats';

  if (sectionId === 'personalInfo') return null;
  if (sectionId === 'summary' && !source.personalInfo.summary) return null;
  if (sectionId === 'experience' && source.experience.length === 0) return null;
  if (sectionId === 'education' && source.education.length === 0) return null;
  if (sectionId === 'skills' && source.skills.length === 0) return null;
  if (sectionId === 'projects' && source.projects.length === 0) return null;
  if (sectionId === 'languages' && source.languages.length === 0) return null;
  if (sectionId === 'certifications' && source.certifications.length === 0) return null;
  if (sectionId === 'volunteer' && source.volunteer.length === 0) return null;
  if (sectionId === 'awards' && source.awards.length === 0) return null;
  if (sectionId === 'interests' && source.interests.length === 0) return null;
  if (sectionId === 'references' && source.references.length === 0) return null;

  return (
    <section className="break-inside-avoid resume-section">
      <h2
        className={`pb-2 font-bold uppercase tracking-[0.08em] ${mode === 'ats' ? 'border-b border-black text-black' : isModern ? 'border-b border-white/20 text-white' : 'border-b border-slate-200 text-slate-700'}`}
        style={{ fontSize: `${typography.sectionTitle}px` }}
      >
        {label}
      </h2>
      <div className="mt-4">
        {sectionId === 'summary' && (
          <p className={`whitespace-pre-line leading-8 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
            {source.personalInfo.summary}
          </p>
        )}
        {sectionId === 'experience' && (
          <div className={isCompact ? 'space-y-4' : 'space-y-5'}>
            {source.experience.map((item) => (
              <article key={item.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className={`font-semibold ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: `${typography.sectionItemTitle}px` }}>
                      {item.role || 'Role title'}
                    </h3>
                    <p className={`mt-1 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-slate-600'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
                      {experienceSummary(item) || 'Company'}
                    </p>
                  </div>
                  <p className={`${mode === 'ats' ? 'text-black' : isModern ? 'text-white/70' : 'text-slate-500'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
                    {formatRange(item.startDate, item.endDate, item.isCurrent)}
                  </p>
                </div>
                {(item.technologies.length > 0 || item.achievements.length > 0) && (
                  <div className="mt-3 space-y-1.5">
                    {item.technologies.length > 0 && (
                      <p className={`text-xs uppercase tracking-wider ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/60' : 'text-slate-400'}`}>{item.technologies.join(' • ')}</p>
                    )}
                    <ul className={`list-disc space-y-2 pl-6 ${mode === 'ats' ? 'text-black marker:text-black' : isModern ? 'text-white/90 marker:text-white/90' : 'text-slate-700 marker:text-brand-600'}`} style={{ fontSize: `${typography.sectionDetails}px`, lineHeight: isCompact ? 1.85 : 2 }}>
                      {item.achievements.map((bullet, index) => (
                        <li key={index}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
        {sectionId === 'education' && (
          <div className={isCompact ? 'space-y-4' : 'space-y-5'}>
            {source.education.map((item) => (
              <article key={item.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className={`font-semibold ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: `${typography.sectionItemTitle}px` }}>
                      {item.qualification || 'Qualification'}
                    </h3>
                    <p className={`mt-1 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-slate-600'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
                      {item.institution || 'Institution'}{item.fieldOfStudy ? ` • ${item.fieldOfStudy}` : ''}
                    </p>
                  </div>
                  <p className={`${mode === 'ats' ? 'text-black' : isModern ? 'text-white/70' : 'text-slate-500'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
                    {formatRange(item.startDate, item.endDate)}
                  </p>
                </div>
                {item.description && <p className={`mt-3 leading-8 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>{item.description}</p>}
              </article>
            ))}
          </div>
        )}
        {sectionId === 'skills' && <p className={`leading-8 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>{source.skills.join(' · ')}</p>}
        {sectionId === 'projects' && (
          <div className={isCompact ? 'space-y-4' : 'space-y-5'}>
            {source.projects.map((item) => (
              <article key={item.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className={`font-semibold ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: `${typography.sectionItemTitle}px` }}>
                      {item.name || 'Project name'}
                    </h3>
                    <p className={`mt-1 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-slate-600'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
                      {projectSummary(item) || 'Project role'}
                    </p>
                  </div>
                  <p className={`${mode === 'ats' ? 'text-black' : isModern ? 'text-white/70' : 'text-slate-500'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
                    {item.date}
                  </p>
                </div>
                {item.description && <p className={`mt-3 leading-8 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>{item.description}</p>}
                {item.link && (
                  <p className={`mt-2 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-slate-700'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
                    <span className={mode === 'ats' ? 'font-semibold text-black' : 'font-semibold text-slate-700'}>Link:</span>{' '}
                    <a className="resume-link break-all" href={normalizeWebUrl(item.link)} target="_blank" rel="noreferrer">
                      {item.link}
                    </a>
                  </p>
                )}
                {item.technologies.length > 0 && <p className={`mt-2 text-xs uppercase tracking-wider ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/60' : 'text-slate-400'}`}>{item.technologies.join(' • ')}</p>}
              </article>
            ))}
          </div>
        )}
        {sectionId === 'languages' && (
          <div className={`flex flex-wrap gap-2 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
            {source.languages.map((item) => (
              <span key={item.id} className={`rounded-full px-3 py-1.5 ${mode === 'ats' ? 'border border-black bg-white' : isModern ? 'border border-white/20 bg-white/5' : 'bg-slate-100'}`}>
                {item.name} — {item.proficiency}
              </span>
            ))}
          </div>
        )}
        {sectionId === 'certifications' && renderSimpleItems(source.certifications, mode, isModern, typography)}
        {sectionId === 'volunteer' && renderSimpleItems(source.volunteer, mode, isModern, typography)}
        {sectionId === 'awards' && renderSimpleItems(source.awards, mode, isModern, typography)}
        {sectionId === 'references' && renderSimpleItems(source.references, mode, isModern, typography)}
        {sectionId === 'interests' && (
          <div className={`flex flex-wrap gap-2 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
            {source.interests.map((interest) => (
              <span key={interest} className={`rounded-full px-3 py-1.5 ${mode === 'ats' ? 'border border-black bg-white' : isModern ? 'border border-white/20 bg-white/5' : 'bg-slate-100'}`}>
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ContactLine({
  label,
  value,
  href,
  mode,
  isModern,
}: {
  label: string;
  value: string;
  href?: string;
  mode: 'standard' | 'ats';
  isModern: boolean;
}) {
  const valueClass = mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-[#2f5ee2]';
  const linkClass = `${valueClass} resume-link underline-offset-2 hover:underline`;
  const text = value || '—';

  return (
    <div>
      <span className={mode === 'ats' ? 'font-semibold text-black' : 'font-semibold text-slate-700'}>{label}</span>{' '}
      {href && value ? (
        <a className={linkClass} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined}>
          {text}
        </a>
      ) : (
        <span className={valueClass}>{text}</span>
      )}
    </div>
  );
}

function normalizeWebUrl(value: string) {
  if (!value.trim()) return undefined;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function renderSimpleItems(
  items: Array<{ id: string; title: string; details: string }>,
  mode: 'standard' | 'ats',
  isModern: boolean,
  typography: PreviewTypography,
) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="break-inside-avoid">
          <h3 className={`font-semibold ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-900'}`} style={{ fontSize: `${typography.sectionItemTitle}px` }}>
            {item.title}
          </h3>
          <p className={`mt-1 leading-8 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`} style={{ fontSize: `${typography.sectionDetails}px` }}>
            {item.details}
          </p>
        </div>
      ))}
    </div>
  );
}

function isBlankDocument(document: ReturnType<typeof useCVStore.getState>['document']) {
  return (
    !document.personalInfo.fullName.trim() &&
    !document.personalInfo.jobTitle.trim() &&
    !document.personalInfo.email.trim() &&
    !document.personalInfo.phone.trim() &&
    !document.personalInfo.location.trim() &&
    !document.personalInfo.linkedinUrl.trim() &&
    !document.personalInfo.websiteUrl.trim() &&
    !document.personalInfo.summary.trim() &&
    document.experience.length === 0 &&
    document.education.length === 0 &&
    document.skills.length === 0 &&
    document.projects.length === 0 &&
    document.languages.length === 0 &&
    document.certifications.length === 0 &&
    document.volunteer.length === 0 &&
    document.awards.length === 0 &&
    document.interests.length === 0 &&
    document.references.length === 0
  );
}
