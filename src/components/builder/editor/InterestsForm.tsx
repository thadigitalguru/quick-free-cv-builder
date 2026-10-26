import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCVStore } from '../../../store/cvStore';
import { Button, Input } from '../../shared/controls';
import { CsvInput, Field } from './fields';

export function InterestsForm() {
  const { document: cvDocument, setInterests, clearSection } = useCVStore();
  const [draft, setDraft] = useState('');

  const updateInterests = (next: string[]) => {
    setInterests(next);
  };

  const add = (interest: string) => {
    const next = interest.trim();
    if (!next) return;
    if (cvDocument.interests.some((item) => item.toLowerCase() === next.toLowerCase())) return;
    updateInterests([...cvDocument.interests, next]);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('interests')}>Clear section</Button>
      </div>
      <Field label="Add an interest" hint="Add hobbies or personal interests in a short phrase.">
        <div className="flex gap-2">
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(draft); } }} placeholder="e.g. Travel" />
          <Button variant="secondary" onClick={() => add(draft)}><Plus className="h-4 w-4" /> Add</Button>
        </div>
      </Field>
      <div className="flex flex-wrap gap-2">
        {cvDocument.interests.map((interest) => (
          <button key={interest} type="button" className="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-sm text-slate-700" onClick={() => updateInterests(cvDocument.interests.filter((item) => item !== interest))}>
            {interest} <span className="text-slate-400">×</span>
          </button>
        ))}
      </div>
      <Field label="Interests (comma separated)" hint="Use short words or phrases, comma separated.">
        <CsvInput multiline rows={4} value={cvDocument.interests} onCommit={updateInterests} placeholder="e.g. Hiking, Chess" />
      </Field>
    </div>
  );
}
