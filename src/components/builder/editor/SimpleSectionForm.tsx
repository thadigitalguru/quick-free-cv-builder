import { Copy, Plus, Trash2 } from 'lucide-react';
import { useCVStore } from '../../../store/cvStore';
import { Button, Input } from '../../shared/controls';
import { Field } from './fields';

const simpleSectionExamples: Record<'certifications' | 'volunteer' | 'awards' | 'references', { title: string; details: string }> = {
  certifications: { title: 'e.g. Google Analytics Certification', details: 'e.g. Google, 2024' },
  volunteer: { title: 'e.g. Mentor, Code Club', details: 'e.g. Weekly sessions teaching 20 students' },
  awards: { title: 'e.g. Employee of the Year', details: 'e.g. Acme Corp, 2023' },
  references: { title: 'e.g. Available on request', details: 'Name, role, and contact details' },
};

export function SimpleSectionForm({ section, title }: { section: 'certifications' | 'volunteer' | 'awards' | 'references'; title: string }) {
  const { document, addSimpleItem, duplicateSimpleItem, updateSimpleItem, deleteSimpleItem, clearSection } = useCVStore();
  const items = document[section];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection(section)}>Clear section</Button>
      </div>
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`${title} title`}><Input value={item.title} onChange={(e) => updateSimpleItem(section, item.id, { title: e.target.value })} placeholder={simpleSectionExamples[section].title} /></Field>
            <Field label="Details"><Input value={item.details} onChange={(e) => updateSimpleItem(section, item.id, { details: e.target.value })} placeholder={simpleSectionExamples[section].details} /></Field>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" className="px-3 py-2 text-xs" aria-label="Duplicate this entry" title="Duplicate this entry" onClick={() => duplicateSimpleItem(section, item.id)}><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" aria-label="Delete this entry" title="Delete this entry" onClick={() => deleteSimpleItem(section, item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      <Button onClick={() => addSimpleItem(section)} variant="secondary"><Plus className="h-4 w-4" /> Add {title.toLowerCase()}</Button>
    </div>
  );
}

/**
 * Comma-separated list field. Keeps the raw text while focused so typing ", " isn't swallowed
 * by re-parsing on every keystroke, and still commits the parsed list as the user types.
 */
