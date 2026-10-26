import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCVStore } from '../../../store/cvStore';
import { Button, Input } from '../../shared/controls';
import { parseCsvList } from '../../../utils/cvUtils';
import { CsvInput, Field } from './fields';

export function SkillsForm() {
  const { document, setSkills, clearSection } = useCVStore();
  const [draft, setDraft] = useState('');

  const addSkill = (input: string) => {
    // Accepts one skill or a pasted comma-separated list, skipping duplicates.
    const next = [...document.skills];
    parseCsvList(input).forEach((skill) => {
      if (!next.some((item) => item.toLowerCase() === skill.toLowerCase())) next.push(skill);
    });
    if (next.length !== document.skills.length) setSkills(next);
    setDraft('');
  };

  const removeSkill = (skill: string) => {
    setSkills(document.skills.filter((item) => item !== skill));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="ghost" className="px-3 py-2 text-xs text-slate-500" onClick={() => clearSection('skills')}>Clear section</Button>
      </div>
      <Field label="Add a skill" hint="Add one keyword at a time or paste a comma-separated list.">
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill(draft);
              }
            }}
            placeholder="e.g. Figma"
          />
          <Button variant="secondary" onClick={() => addSkill(draft)}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </Field>

      <div className="flex flex-wrap gap-2">
        {document.skills.map((skill) => (
          <button
            key={skill}
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
            onClick={() => removeSkill(skill)}
            title="Remove skill"
          >
            {skill}
            <span className="text-slate-400">×</span>
          </button>
        ))}
      </div>

      <Field label="Skills (comma separated)" hint="Comma-separated list is best for ATS parsing.">
        <CsvInput multiline rows={6} value={document.skills} onCommit={setSkills} placeholder="React, TypeScript, Accessibility" />
      </Field>
    </div>
  );
}
