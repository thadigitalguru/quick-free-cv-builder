import { createContext, useContext, type ButtonHTMLAttributes, type Ref, type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '../../utils/dom';

/** Set by a form field so its control is tied to the visible label and hint without wiring ids by hand. */
export const FieldContext = createContext<{ id: string; describedBy?: string } | null>(null);

const useFieldProps = (props: { id?: string; 'aria-describedby'?: string }) => {
  const field = useContext(FieldContext);
  return { id: props.id ?? field?.id, 'aria-describedby': props['aria-describedby'] ?? field?.describedBy };
};

export function Button({ className = '', variant = 'primary', ref, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; ref?: Ref<HTMLButtonElement> }) {
  const styles = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-ink border border-border hover:bg-slate-50',
    ghost: 'bg-transparent text-ink hover:bg-slate-100',
  }[variant];

  return <button ref={ref} className={cn('inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50', styles, className)} {...props} />;
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('w-full rounded-2xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100', className)} {...props} {...useFieldProps(props)} />;
}

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-2xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100', className)} {...props} {...useFieldProps(props)} />;
}

export function Select({ className = '', ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('w-full rounded-2xl border border-border bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100', className)} {...props} {...useFieldProps(props)} />;
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
      {children}
    </label>
  );
}

export function Pill({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-border bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">{children}</span>;
}
