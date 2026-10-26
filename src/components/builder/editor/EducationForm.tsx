import { useMemo } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { useCVStore } from '../../../store/cvStore';
import { Button, Input, Textarea } from '../../shared/controls';
import { cn } from '../../../utils/dom';
import { fieldKey, type ValidationIssue } from '../../../utils/validation';
import { Field, buildIssueLookup } from './fields';

export function EducationForm({ validationIssues }: { validationIssues: ValidationIssue[] }) {
  const { document, addEducation, duplicateEducation, updateEducation, deleteEducation, moveEducation, clearSection } = useCVStore();
  const issueMap = useMemo(() => buildIssueLookup(validationIssues), [validationIssues]);
  const fieldError = (field: string) => issueMap.get(field);

  return (
    <div className="space-y-4">
      {document.education.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="min-w-0 font-semibold">Education {index + 1}</h4>
            <div className="flex flex-wrap items-center gap-1">
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveEducation(item.id, 'up')} disabled={index === 0}>Up</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveEducation(item.id, 'down')} disabled={index === document.education.length - 1}>Down</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" aria-label="Duplicate this education entry" title="Duplicate this education entry" onClick={() => duplicateEducation(item.id)}><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" aria-label="Delete this education entry" title="Delete this education entry" onClick={() => deleteEducation(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Institution" hint="School, college, or university."><Input value={item.institution} onChange={(e) => updateEducation(item.id, { institution: e.target.value })} placeholder="e.g. University of Nairobi" /></Field>
            <Field label="Qualification" hint="e.g. BSc, Diploma, MBA."><Input value={item.qualification} onChange={(e) => updateEducation(item.id, { qualification: e.target.value })} placeholder="e.g. BSc" /></Field>
            <Field label="Field of study" hint="Optional, but useful for recruiter context."><Input value={item.fieldOfStudy} onChange={(e) => updateEducation(item.id, { fieldOfStudy: e.target.value })} placeholder="e.g. Computer Science" /></Field>
            <Field label="Start date" error={fieldError(fieldKey('education', item.id, 'startDate'))} hint="Use YYYY or YYYY-MM.">
              <Input
                value={item.startDate}
                onChange={(e) => updateEducation(item.id, { startDate: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('education', item.id, 'startDate')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('education', item.id, 'startDate')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <Field label="End date" error={fieldError(fieldKey('education', item.id, 'endDate'))} hint="Use YYYY or YYYY-MM.">
              <Input
                value={item.endDate}
                onChange={(e) => updateEducation(item.id, { endDate: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('education', item.id, 'endDate')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('education', item.id, 'endDate')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <Field label="Description" hint="Optional notes such as honors or coursework."><Textarea rows={4} value={item.description} onChange={(e) => updateEducation(item.id, { description: e.target.value })} /></Field>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={addEducation} variant="secondary"><Plus className="h-4 w-4" /> Add education</Button>
        {document.education.length > 0 && (
          <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('education')}>Clear section</Button>
        )}
      </div>
    </div>
  );
}
