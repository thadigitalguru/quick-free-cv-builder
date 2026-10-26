import { useMemo } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { useCVStore } from '../../../store/cvStore';
import { Button, Input, Textarea } from '../../shared/controls';
import { cn } from '../../../utils/dom';
import { fieldKey, type ValidationIssue } from '../../../utils/validation';
import { CsvInput, Field, buildIssueLookup } from './fields';

export function ProjectsForm({ validationIssues }: { validationIssues: ValidationIssue[] }) {
  const { document, addProject, duplicateProject, updateProject, deleteProject, moveProject, clearSection } = useCVStore();
  const issueMap = useMemo(() => buildIssueLookup(validationIssues), [validationIssues]);
  const fieldError = (field: string) => issueMap.get(field);

  return (
    <div className="space-y-4">
      {document.projects.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="min-w-0 font-semibold">Project {index + 1}</h4>
            <div className="flex flex-wrap items-center gap-1">
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveProject(item.id, 'up')} disabled={index === 0}>Up</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveProject(item.id, 'down')} disabled={index === document.projects.length - 1}>Down</Button>
              <Button variant="ghost" className="px-3 py-2 text-xs" aria-label="Duplicate this project" title="Duplicate this project" onClick={() => duplicateProject(item.id)}><Copy className="h-4 w-4" /></Button>
              <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" aria-label="Delete this project" title="Delete this project" onClick={() => deleteProject(item.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input value={item.name} onChange={(e) => updateProject(item.id, { name: e.target.value })} placeholder="e.g. Online booking app" /></Field>
            <Field label="Role"><Input value={item.role} onChange={(e) => updateProject(item.id, { role: e.target.value })} placeholder="e.g. Lead developer" /></Field>
            <Field label="Date" error={fieldError(fieldKey('projects', item.id, 'date'))}>
              <Input
                value={item.date}
                onChange={(e) => updateProject(item.id, { date: e.target.value })}
                placeholder="YYYY or YYYY-MM"
                inputMode="numeric"
                aria-invalid={Boolean(fieldError(fieldKey('projects', item.id, 'date')))}
                className={cn('h-[52px] rounded-[12px] border-[#cbd6e4] px-4 text-[15px] placeholder:text-[#a1aab8]', fieldError(fieldKey('projects', item.id, 'date')) && 'border-rose-300 focus:border-rose-500 focus:ring-rose-100')}
              />
            </Field>
            <Field label="Link"><Input value={item.link} onChange={(e) => updateProject(item.id, { link: e.target.value })} placeholder="https://…" /></Field>
            <Field label="Description"><Textarea rows={4} value={item.description} onChange={(e) => updateProject(item.id, { description: e.target.value })} placeholder="What it does and the result, e.g. Cut booking time from 10 to 2 minutes." /></Field>
            <Field label="Technologies"><CsvInput value={item.technologies} onCommit={(technologies) => updateProject(item.id, { technologies })} placeholder="e.g. React, Firebase" /></Field>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button onClick={addProject} variant="secondary"><Plus className="h-4 w-4" /> Add project</Button>
        {document.projects.length > 0 && (
          <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('projects')}>Clear section</Button>
        )}
      </div>
    </div>
  );
}
