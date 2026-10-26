import { useMemo } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { useCVStore } from '../../../store/cvStore';
import { Button, Input, Textarea } from '../../shared/controls';
import { cn } from '../../../utils/dom';
import { fieldKey, type ValidationIssue } from '../../../utils/validation';
import { CsvInput, Field, buildIssueLookup } from './fields';

export function ExperienceForm({ validationIssues }: { validationIssues: ValidationIssue[] }) {
  const { document, addExperience, duplicateExperience, updateExperience, deleteExperience, moveExperience, clearSection } = useCVStore();
  const issueMap = useMemo(() => buildIssueLookup(validationIssues), [validationIssues]);
  const fieldError = (field: string) => issueMap.get(field);

  return (
    <div className="space-y-4">
      {document.experience.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="min-w-0 font-semibold">Experience {index + 1}</h4>
            <div className="flex flex-wrap items-center gap-1">
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveExperience(item.id, 'up')} disabled={index === 0}>Up</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveExperience(item.id, 'down')} disabled={index === document.experience.length - 1}>Down</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" aria-label="Duplicate this role" title="Duplicate this role" onClick={() => duplicateExperience(item.id)}><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" aria-label="Delete this role" title="Delete this role" onClick={() => deleteExperience(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Role" hint="Your job title in this role."><Input value={item.role} onChange={(e) => updateExperience(item.id, { role: e.target.value })} placeholder="e.g. Customer Success Manager" /></Field>
            <Field label="Company" hint="Employer or client name."><Input value={item.company} onChange={(e) => updateExperience(item.id, { company: e.target.value })} placeholder="e.g. Safaricom" /></Field>
            <Field label="Location" hint="City, country or remote."><Input value={item.location} onChange={(e) => updateExperience(item.id, { location: e.target.value })} placeholder="e.g. Nairobi, Kenya" /></Field>
            <Field label="Start date" error={fieldError(fieldKey('experience', item.id, 'startDate'))} hint="Use YYYY or YYYY-MM, e.g. 2022 or 2022-09.">
              <Input
                value={item.startDate}
                onChange={(e) => updateExperience(item.id, { startDate: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('experience', item.id, 'startDate')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('experience', item.id, 'startDate')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <Field label="End date" error={fieldError(fieldKey('experience', item.id, 'endDate'))} hint="Use YYYY or YYYY-MM, or leave blank for a current role.">
              <Input
                value={item.endDate}
                onChange={(e) => updateExperience(item.id, { endDate: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('experience', item.id, 'endDate')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('experience', item.id, 'endDate')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Current role">
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" checked={item.isCurrent} onChange={(e) => updateExperience(item.id, { isCurrent: e.target.checked })} />
                  I currently work here
                </label>
              </Field>
              {item.isCurrent && <p className="mt-1 text-xs text-slate-500">Shown as Present in the CV preview.</p>}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <Field label="Achievements (one per line)" hint="Start each line with an action + outcome.">
              <Textarea
                rows={6}
                value={item.achievements.join('\n')}
                // Keep blank lines while typing so Enter starts a new bullet; they're tidied on blur and skipped in the preview.
                onChange={(e) => updateExperience(item.id, { achievements: e.target.value.split('\n') })}
                onBlur={(e) => updateExperience(item.id, { achievements: e.target.value.split('\n').map((line) => line.trim()).filter(Boolean) })}
                placeholder={'One achievement per line, e.g.\nResolved 40+ customer issues a week with 95% satisfaction'}
              />
            </Field>
            <Field label="Technologies (comma separated)" hint="Use short keywords recruiters search for."><CsvInput value={item.technologies} onCommit={(technologies) => updateExperience(item.id, { technologies })} placeholder="e.g. Zendesk, Excel" /></Field>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={addExperience} variant="secondary"><Plus className="h-4 w-4" /> Add experience</Button>
        {document.experience.length > 0 && (
          <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('experience')}>Clear section</Button>
        )}
      </div>
    </div>
  );
}
