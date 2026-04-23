import { useEffect } from 'react';
import { useCVStore } from '../../store/cvStore';
import { formatRange, getVisibleOrder, experienceSummary, projectSummary } from '../../utils/cvUtils';
import { sectionLabelMap } from '../../data/sectionMeta';
import { exportPreviewAsPdf } from '../../utils/pdf';

export default function ResumePreview({ mode = 'standard' }: { mode?: 'standard' | 'ats' }) {
  const cvDocument = useCVStore((state) => state.document);
  const templateId = useCVStore((state) => state.templateId);

  useEffect(() => {
    const node = window.document.getElementById('resume-preview-root');
    const handler = () => exportPreviewAsPdf(node);
    node?.addEventListener('download-pdf', handler as EventListener);
    return () => node?.removeEventListener('download-pdf', handler as EventListener);
  }, []);

  const visibleOrder = getVisibleOrder(cvDocument);

  const templateStyles = {
    classic: 'bg-white text-slate-900',
    modern: 'bg-slate-950 text-white',
    compact: 'bg-white text-slate-900',
  }[templateId];

  return (
    <div className="h-full overflow-auto rounded-[1.5rem] bg-white p-4 lg:p-8">
      <div id="resume-preview-root" className={`mx-auto max-w-[800px] ${templateStyles} print:p-0 ${mode === 'ats' ? 'font-sans' : ''}`}>
        <header className={`pb-5 ${mode === 'ats' ? 'border-b border-black' : templateId === 'modern' ? 'border-b border-white/20' : 'border-b border-slate-200'}`}>
          <div className="flex items-start gap-4">
            {cvDocument.personalInfo.profilePhoto && (
              <div className={`shrink-0 overflow-hidden rounded-2xl ${mode === 'ats' ? 'border border-black' : templateId === 'modern' ? 'border border-white/20' : 'border border-slate-200 shadow-sm'}`}>
                <img
                  src={cvDocument.personalInfo.profilePhoto}
                  alt="Profile"
                  className="h-20 w-20 object-cover"
                  style={{
                    transform: `translate(${cvDocument.personalInfo.photoX - 50}%, ${cvDocument.personalInfo.photoY - 50}%) scale(${cvDocument.personalInfo.photoZoom})`,
                    objectPosition: '50% 50%',
                  }}
                />
              </div>
            )}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h1 className={`text-3xl font-bold tracking-tight ${mode === 'ats' || templateId === 'classic' ? 'text-inherit' : 'text-white'}`}>{cvDocument.personalInfo.fullName || 'Your Full Name'}</h1>
              <p className={`text-lg font-medium ${mode === 'ats' ? 'text-black' : templateId === 'modern' ? 'text-brand-100' : 'text-brand-700'}`}>{cvDocument.personalInfo.jobTitle || 'Professional Title'}</p>
            </div>
          </div>
          <div className={`mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm ${mode === 'ats' ? 'text-black' : templateId === 'modern' ? 'text-white/90' : 'text-slate-600'}`}>
            {cvDocument.personalInfo.email && <span>{cvDocument.personalInfo.email}</span>}
            {cvDocument.personalInfo.phone && <span>{cvDocument.personalInfo.phone}</span>}
            {cvDocument.personalInfo.location && <span>{cvDocument.personalInfo.location}</span>}
            {cvDocument.personalInfo.linkedinUrl && <span>{cvDocument.personalInfo.linkedinUrl}</span>}
            {cvDocument.personalInfo.websiteUrl && <span>{cvDocument.personalInfo.websiteUrl}</span>}
          </div>
          {(cvDocument.personalInfo.summary || cvDocument.skills.length > 0) && (
            <div className={`mt-4 grid gap-3 rounded-2xl p-4 text-sm ${mode === 'ats' ? 'border border-black bg-white text-black' : templateId === 'modern' ? 'border border-white/10 bg-white/5 text-white sm:grid-cols-2' : 'bg-slate-50 text-slate-600 sm:grid-cols-2'}`}>
              {cvDocument.personalInfo.summary && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mode === 'ats' ? 'text-black' : templateId === 'modern' ? 'text-white/70' : 'text-slate-400'}`}>Summary</p>
                  <p className={`mt-1 max-h-24 overflow-hidden leading-6 ${mode === 'ats' ? 'text-black' : templateId === 'modern' ? 'text-white/90' : 'text-slate-700'}`}>{cvDocument.personalInfo.summary}</p>
                </div>
              )}
              {cvDocument.skills.length > 0 && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${mode === 'ats' ? 'text-black' : templateId === 'modern' ? 'text-white/70' : 'text-slate-400'}`}>Top skills</p>
                  <p className={`mt-1 leading-6 ${mode === 'ats' ? 'text-black' : templateId === 'modern' ? 'text-white/90' : 'text-slate-700'}`}>{cvDocument.skills.slice(0, 8).join(' · ')}</p>
                </div>
              )}
            </div>
          )}
        </header>

        <div className="mt-6 space-y-7">
          {visibleOrder.map((sectionId) => (
            <PreviewSection key={sectionId} sectionId={sectionId} mode={mode} templateId={templateId} />
          ))}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ sectionId, mode, templateId }: { sectionId: keyof typeof sectionLabelMap; mode: 'standard' | 'ats'; templateId: 'classic' | 'modern' | 'compact' }) {
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
  if (sectionId === 'volunteer' && cvDocument.volunteer.length === 0) return null;
  if (sectionId === 'awards' && cvDocument.awards.length === 0) return null;
  if (sectionId === 'interests' && cvDocument.interests.length === 0) return null;
  if (sectionId === 'references' && cvDocument.references.length === 0) return null;

  const isModern = templateId === 'modern' && mode !== 'ats';

  return (
    <section className="break-inside-avoid resume-section">
      <h2 className={`pb-2 text-sm font-bold uppercase tracking-[0.18em] ${mode === 'ats' ? 'border-b border-black text-black' : isModern ? 'border-b border-white/20 text-white' : 'border-b border-slate-200 text-slate-700'}`}>{label}</h2>
      <div className="mt-3">
        {sectionId === 'summary' && <p className={`whitespace-pre-line text-sm leading-6 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`}>{cvDocument.personalInfo.summary}</p>}
        {sectionId === 'experience' && (
          <div className="space-y-4">
            {cvDocument.experience.map((item) => (
              <article key={item.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className={`text-base font-semibold ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-900'}`}>{item.role || 'Role title'}</h3>
                    <p className={`text-sm font-medium ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-slate-600'}`}>{experienceSummary(item) || 'Company'}</p>
                  </div>
                  <p className={`text-sm ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/70' : 'text-slate-500'}`}>{formatRange(item.startDate, item.endDate, item.isCurrent)}</p>
                </div>
                {(item.technologies.length > 0 || item.achievements.length > 0) && (
                  <div className="mt-2 space-y-1.5">
                    {item.technologies.length > 0 && <p className={`text-xs uppercase tracking-wider ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/60' : 'text-slate-400'}`}>{item.technologies.join(' • ')}</p>}
                    <ul className={`list-disc space-y-1 pl-5 text-sm leading-6 ${mode === 'ats' ? 'text-black marker:text-black' : isModern ? 'text-white/90 marker:text-white/90' : 'text-slate-700 marker:text-brand-600'}`}>
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
                    <h3 className={`text-base font-semibold ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-900'}`}>{item.qualification || 'Qualification'}</h3>
                    <p className={`text-sm font-medium ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-slate-600'}`}>{item.institution || 'Institution'}{item.fieldOfStudy ? ` • ${item.fieldOfStudy}` : ''}</p>
                  </div>
                  <p className={`text-sm ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/70' : 'text-slate-500'}`}>{formatRange(item.startDate, item.endDate)}</p>
                </div>
                {item.description && <p className={`mt-2 text-sm leading-6 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`}>{item.description}</p>}
              </article>
            ))}
          </div>
        )}
        {sectionId === 'skills' && <p className={`text-sm leading-6 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`}>{cvDocument.skills.join(' · ')}</p>}
        {sectionId === 'projects' && (
          <div className="space-y-4">
            {cvDocument.projects.map((item) => (
              <article key={item.id} className="break-inside-avoid">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className={`text-base font-semibold ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-900'}`}>{item.name || 'Project name'}</h3>
                    <p className={`text-sm font-medium ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/80' : 'text-slate-600'}`}>{projectSummary(item) || 'Project role'}</p>
                  </div>
                  <p className={`text-sm ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/70' : 'text-slate-500'}`}>{item.date}</p>
                </div>
                {item.description && <p className={`mt-2 text-sm leading-6 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`}>{item.description}</p>}
                {item.technologies.length > 0 && <p className={`mt-2 text-xs uppercase tracking-wider ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/60' : 'text-slate-400'}`}>{item.technologies.join(' • ')}</p>}
              </article>
            ))}
          </div>
        )}
        {sectionId === 'languages' && (
          <div className={`flex flex-wrap gap-2 text-sm ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`}>
            {cvDocument.languages.map((item) => (
              <span key={item.id} className={`rounded-full px-3 py-1.5 ${mode === 'ats' ? 'border border-black bg-white' : isModern ? 'border border-white/20 bg-white/5' : 'bg-slate-100'}`}>{item.name} — {item.proficiency}</span>
            ))}
          </div>
        )}
        {sectionId === 'certifications' && renderSimpleItems(cvDocument.certifications, mode, isModern)}
        {sectionId === 'volunteer' && renderSimpleItems(cvDocument.volunteer, mode, isModern)}
        {sectionId === 'awards' && renderSimpleItems(cvDocument.awards, mode, isModern)}
        {sectionId === 'references' && renderSimpleItems(cvDocument.references, mode, isModern)}
        {sectionId === 'interests' && (
          <div className={`flex flex-wrap gap-2 text-sm ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`}>
            {cvDocument.interests.map((interest) => (
              <span key={interest} className={`rounded-full px-3 py-1.5 ${mode === 'ats' ? 'border border-black bg-white' : isModern ? 'border border-white/20 bg-white/5' : 'bg-slate-100'}`}>{interest}</span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function renderSimpleItems(items: Array<{ id: string; title: string; details: string }>, mode: 'standard' | 'ats', isModern: boolean) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="break-inside-avoid">
          <h3 className={`text-base font-semibold ${mode === 'ats' ? 'text-black' : isModern ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
          <p className={`text-sm leading-6 ${mode === 'ats' ? 'text-black' : isModern ? 'text-white/90' : 'text-slate-700'}`}>{item.details}</p>
        </div>
      ))}
    </div>
  );
}
