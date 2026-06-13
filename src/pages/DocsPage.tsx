import type { ToastMessage } from '../types';

export function DocsPage(_props: { pushToast: (kind: ToastMessage['kind'], text: string) => void }) {
  return <section className="page-section">接入文档</section>;
}
