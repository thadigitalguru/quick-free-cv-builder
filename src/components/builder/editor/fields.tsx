import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { FieldContext, Input, Label, Textarea } from '../../shared/controls';
import { joinCsvList, parseCsvList } from '../../../utils/cvUtils';
import { type ValidationIssue } from '../../../utils/validation';

export const buildIssueLookup = (issues: ValidationIssue[]) => new Map(issues.map((issue) => [issue.field, issue.message]));

export function CsvInput({
  value,
  onCommit,
  multiline = false,
  rows,
  placeholder,
}: {
  value: string[];
  onCommit: (items: string[]) => void;
  multiline?: boolean;
  rows?: number;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => joinCsvList(value));
  const focused = useRef(false);

  useEffect(() => {
    if (!focused.current) setText(joinCsvList(value));
  }, [value]);

  const handlers = {
    value: text,
    placeholder,
    onFocus: () => {
      focused.current = true;
    },
    onBlur: () => {
      focused.current = false;
      setText(joinCsvList(value));
    },
    onChange: (event: { target: { value: string } }) => {
      setText(event.target.value);
      onCommit(parseCsvList(event.target.value));
    },
  };

  return multiline ? <Textarea rows={rows} {...handlers} /> : <Input {...handlers} />;
}

export function Field({ label, children, error, hint }: { label: string; children: ReactNode; error?: string | null; hint?: string }) {
  const id = useId();
  const noteId = `${id}-note`;
  const note = error || hint;
  return (
    <FieldContext.Provider value={{ id, describedBy: note ? noteId : undefined }}>
      <div>
        <Label htmlFor={id}>{label}</Label>
        {children}
        {hint && !error && <p id={noteId} className="mt-1.5 text-xs text-slate-500">{hint}</p>}
        {error && <p id={noteId} className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>}
      </div>
    </FieldContext.Provider>
  );
}
