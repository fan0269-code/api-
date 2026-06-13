import type { ToastMessage } from '../types';

export function ModelsPage(_props: { pushToast: (kind: ToastMessage['kind'], text: string) => void }) {
  return <section className="page-section">模型接口</section>;
}
