import { Check, Copy, X } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ApiKeyStatus, ModelStatus, ToastMessage } from '../types';

const statusLabels: Record<ModelStatus | ApiKeyStatus, string> = {
  available: '可用',
  congested: '拥堵',
  maintenance: '维护',
  active: '启用',
  disabled: '停用'
};

export function SectionHeader({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="section-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function MetricCard({ label, value, detail, icon }: { label: string; value: string; detail?: string; icon?: ReactNode }) {
  return (
    <article className="metric-card">
      <div>
        <span className="metric-label">{label}</span>
        <strong>{value}</strong>
        {detail ? <small>{detail}</small> : null}
      </div>
      {icon ? <div className="metric-icon">{icon}</div> : null}
    </article>
  );
}

export function StatusBadge({ status }: { status: ModelStatus | ApiKeyStatus }) {
  return <span className={`status-badge status-${status}`}>{statusLabels[status]}</span>;
}

export function CopyButton({ value, label, onDone }: { value: string; label?: string; onDone: (ok: boolean) => void }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      onDone(true);
    } catch {
      onDone(false);
    }
  };

  return (
    <button className="icon-text-button" type="button" onClick={copy} aria-label={label ?? '复制'}>
      <Copy size={15} />
      {label ?? '复制'}
    </button>
  );
}

export function Modal({
  title,
  children,
  footer,
  onClose
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        <footer className="modal-actions">{footer}</footer>
      </section>
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="empty-state">
      <Check size={20} />
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function CodeBlock({ language, code, onCopy }: { language: string; code: string; onCopy: (ok: boolean) => void }) {
  return (
    <article className="code-card">
      <div className="code-header">
        <strong>{language}</strong>
        <CopyButton value={code} label={`复制 ${language}`} onDone={onCopy} />
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </article>
  );
}

export function ToastStack({ toasts }: { toasts: ToastMessage[] }) {
  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.kind}`} key={toast.id}>
          {toast.text}
        </div>
      ))}
    </div>
  );
}
