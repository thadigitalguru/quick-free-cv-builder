import { Copy, Plus, Trash2 } from 'lucide-react';
import { useCVStore } from '../../../store/cvStore';
import type { LanguageItem } from '../../../types/cv';
import { Button, Input, Select } from '../../shared/controls';
import { Field } from './fields';

export function LanguagesForm() {
  const { document, addLanguage, duplicateLanguage, updateLanguage, deleteLanguage, moveLanguage, clearSection } = useCVStore();

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('languages')}>Clear section</Button>
      </div>
      {document.languages.map((item, index) => (
        <div key={item.id} className="grid gap-3 rounded-2xl border border-border p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Language"><Input value={item.name} onChange={(e) => updateLanguage(item.id, { name: e.target.value })} placeholder="e.g. Swahili" /></Field>
          <Field label="Proficiency">
            <Select value={item.proficiency} onChange={(e) => updateLanguage(item.id, { proficiency: e.target.value as LanguageItem['proficiency'] })}>
              {['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic'].map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveLanguage(item.id, 'up')} disabled={index === 0}>Up</Button>
            <Button variant="ghost" className="px-3 py-2 text-xs" onClick={() => moveLanguage(item.id, 'down')} disabled={index === document.languages.length - 1}>Down</Button>
            <Button variant="ghost" className="px-3 py-2 text-xs" aria-label="Duplicate this language" title="Duplicate this language" onClick={() => duplicateLanguage(item.id)}><Copy className="h-4 w-4" /></Button>
            <Button variant="ghost" className="px-3 py-2 text-xs text-rose-600" aria-label="Delete this language" title="Delete this language" onClick={() => deleteLanguage(item.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        </div>
      ))}
      <Button onClick={addLanguage} variant="secondary"><Plus className="h-4 w-4" /> Add language</Button>
    </div>
  );
}
