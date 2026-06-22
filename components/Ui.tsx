import { InputHTMLAttributes, PropsWithChildren, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import clsx from 'clsx';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function SectionCard({
  title,
  eyebrow,
  description,
  aside,
  children,
  className
}: PropsWithChildren<{
  title: string;
  eyebrow?: string;
  description?: string;
  aside?: ReactNode;
  className?: string;
}>) {
  return (
    <section className={clsx('panel-surface section-card', className)}>
      <div className="section-head">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2>{title}</h2>
          {description ? <p className="section-copy">{description}</p> : null}
        </div>
        {aside ? <div className="section-aside">{aside}</div> : null}
      </div>
      <div className="section-body">{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  meta,
  tone = 'sunrise'
}: {
  label: string;
  value: string | number;
  meta?: string;
  tone?: 'sunrise' | 'sea' | 'ink' | 'gold';
}) {
  return (
    <article className={clsx('stat-card', `stat-${tone}`)}>
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      {meta ? <p>{meta}</p> : null}
    </article>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div>
        <p className="eyebrow">Nothing to show</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function ActionDisclosure({
  title,
  summary,
  children,
  defaultOpen = false,
  className
}: PropsWithChildren<{
  title: string;
  summary: string;
  defaultOpen?: boolean;
  className?: string;
}>) {
  return (
    <details className={clsx('action-disclosure', className)} open={defaultOpen}>
      <summary>
        <div>
          <span className="eyebrow">Action</span>
          <strong>{title}</strong>
        </div>
        <p>{summary}</p>
      </summary>
      <div className="action-disclosure-body">{children}</div>
    </details>
  );
}

export function StatusBadge({
  children,
  tone = 'neutral'
}: PropsWithChildren<{
  tone?: StatusTone;
}>) {
  return <span className={clsx('status-badge', `tone-${tone}`)}>{children}</span>;
}

export function InlineMessage({
  tone,
  children
}: PropsWithChildren<{ tone: 'success' | 'danger' | 'info' }>) {
  return <p className={clsx('inline-message', `message-${tone}`)}>{children}</p>;
}

export function Field({ label, hint, required, children }: PropsWithChildren<{ label: string; hint?: string; required?: boolean }>) {
  return (
    <label className="field-shell">
      <span className="field-label">
        {label}
        {required ? <em>Required</em> : null}
      </span>
      {children}
      {hint ? <small className="field-hint">{hint}</small> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={clsx('field-input', props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={clsx('field-input', props.className)} />;
}

export function TextAreaInput(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={clsx('field-input field-textarea', props.className)} />;
}
