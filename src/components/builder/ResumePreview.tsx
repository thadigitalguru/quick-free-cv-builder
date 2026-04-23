import { useEffect } from 'react';
import { useCVStore } from '../../store/cvStore';
import { formatRange, getVisibleOrder, experienceSummary, projectSummary } from '../../utils/cvUtils';
import { sectionLabelMap } from '../../data/sectionMeta';
import { exportPreviewAsPdf } from '../../utils/pdf';

export default function ResumePreview() {
  const cvDocument = useCVStore((state) => state.document);

  useEffect(() => {
    const node = window.document.getElementById('resume-preview-root');
    const handler = () => exportPreviewAsPdf(node);
    node?.addEventListener('download-pdf', handler as EventListener);
    return () => node?.removeEventListener('download-pdf', handler as EventListener);
  }, []);

  const visibleOrder = getVisibleOrder(cvDocument);

  return (
    <div className="h-full overflow-auto rounded-[1.5rem] bg-white p-4 lg:p-8">
      <div id="resume-preview-root" className="mx-auto max-w-[800px] bg-white text-slate-900 print:p-0">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{cvDocument.personalInfo.fullName || 'Your Full Name'}</h1>
            <p className="text-lg font-medium text-brand-700">{cvDocument.personalInfo.jobTitle || 'Professional Title'}</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
            {cvDocument.personalInfo.email && <span>{cvDocument.personalInfo.email}</span>}
            {cvDocument.personalInfo.phone && <span>{cvDocument.personalInfo.phone}</span>}
            {cvDocument.personalInfo.location && <span>{cvDocument.personalInfo.location}</span>}
            {cvDocument.personalInfo.linkedinUrl && <span>{cvDocument.personalInfo.linkedinUrl}</span>}
            {cvDocument.personalInfo.websiteUrl && <span>{cvDocument.personalInfo.websiteUrl}</span>}
          </div>
        </header>

        <div className="mt-6 space-y-6">
          {visibleOrder.map((sectionId) => (
            <PreviewSection key={sectionId} sectionId={sectionId} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ sectionId }: { sectionId: keyof typeof sectionLabelMap }) {
  const cvDocument = useCVStore((state) => state.document);
  const label = sectionLabelMap[sectionId];

  if (sectionId === 'personalInfo') return null;
  if (sectionId === 'summary' && !cvDocument.personalInfo.summary) return null;
  if (sectionId === 'experience' && cvDocument.experience.length === 0) return null;
  if (sectionId === 'education' && cvDocument.education.length === 0) return null;
  if (sectionId === 'skills' && cvDocument.skills.length === 0) return null;
  if (sectionId === 'projects' && cvDocument.projects.length === 0) return null;
  if (sectionId === 'languages' && cvDocument.languages.length === 0) return null;
  if (sectionId === 'certifications' && cvDocument.certifications.length === 0) return null;
  if (sectionId === 'awards' && cvDocument.awards.length === 0) return null;

  return (
    <section className="break-inside-avoid">
      <h2 className="border-b border-slate-200 pb-2 text-sm font-bold uppercase tracking-[0.18em] text-slate-700">{label}</h2>
      <div className="mt-3">
        {sectionId === 'summary' && <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{cvDocument.personalInfo.summary}</p>}
        {sectionId === 'experience' && (
          <div className="space-y-4">
            {cvDocument.experience.map((item) => (
              <article key={item.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{item.role || 'Role title'}</h3>
                    <p className="text-sm font-medium text-slate-600">{experienceSummary(item) || 'Company'}</p>
                  </div>
                  <p className="text-sm text-slate-500">{formatRange(item.startDate, item.endDate, item.isCurrent)}</p>
                </div>
                {(item.technologies.length > 0 || item.achievements.length > 0) && (
                  <div className="mt-2 space-y-1.5">
                    {item.technologies.length > 0 && <p className="text-xs uppercase tracking-wider text-slate-400">{item.technologies.join(' • ')}</p>}
                    <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-slate-700">
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
          <div className="space-y-4">
            {cvDocument.education.map((item) => (
              <article key={item.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{item.qualification || 'Qualification'}</h3>
                    <p className="text-sm font-medium text-slate-600">{item.institution || 'Institution'}{item.fieldOfStudy ? ` • ${item.fieldOfStudy}` : ''}</p>
                  </div>
                  <p className="text-sm text-slate-500">{formatRange(item.startDate, item.endDate)}</p>
                </div>
                {item.description && <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>}
              </article>
            ))}
          </div>
        )}
        {sectionId === 'skills' && <p className="text-sm leading-6 text-slate-700">{cvDocument.skills.join(' · ')}</p>}
        {sectionId === 'projects' && (
          <div className="space-y-4">
            {cvDocument.projects.map((item) => (
              <article key={item.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{item.name || 'Project name'}</h3>
                    <p className="text-sm font-medium text-slate-600">{projectSummary(item) || 'Project role'}</p>
                  </div>
                  <p className="text-sm text-slate-500">{item.date}</p>
                </div>
                {item.description && <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>}
                {item.technologies.length > 0 && <p className="mt-2 text-xs uppercase tracking-wider text-slate-400">{item.technologies.join(' • ')}</p>}
              </article>
            ))}
          </div>
        )}
        {sectionId === 'languages' && (
          <div className="flex flex-wrap gap-2 text-sm text-slate-700">
            {cvDocument.languages.map((item) => (
              <span key={item.id} className="rounded-full bg-slate-100 px-3 py-1.5">{item.name} — {item.proficiency}</span>
            ))}
          </div>
        )}
        {sectionId === 'certifications' && (
          <div className="space-y-3">
            {cvDocument.certifications.map((item) => (
              <div key={item.id} className="break-inside-avoid">
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-700">{item.details}</p>
              </div>
            ))}
          </div>
        )}
        {sectionId === 'awards' && (
          <div className="space-y-3">
            {cvDocument.awards.map((item) => (
              <div key={item.id} className="break-inside-avoid">
                <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-700">{item.details}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
