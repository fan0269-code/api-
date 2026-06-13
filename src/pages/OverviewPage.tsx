import type { ApiKey, ToastMessage } from '../types';

export function OverviewPage(_props: { activeKey: ApiKey; pushToast: (kind: ToastMessage['kind'], text: string) => void }) {
  return <section className="page-section">总览</section>;
}
