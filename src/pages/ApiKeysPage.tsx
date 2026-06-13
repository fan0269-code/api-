import type { Dispatch, SetStateAction } from 'react';
import type { ApiKey, ToastMessage } from '../types';

export function ApiKeysPage(_props: {
  keys: ApiKey[];
  setKeys: Dispatch<SetStateAction<ApiKey[]>>;
  pushToast: (kind: ToastMessage['kind'], text: string) => void;
}) {
  return <section className="page-section">API Keys</section>;
}
