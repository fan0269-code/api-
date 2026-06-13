import { useState } from 'react';
import { CopyButton, Modal, SectionHeader, StatusBadge } from '../components/ui';
import type { ApiKey, ToastMessage } from '../types';

export function ApiKeysPage({
  keys,
  createKey,
  updateKeyStatus,
  pushToast
}: {
  keys: ApiKey[];
  createKey: (name: string) => Promise<ApiKey>;
  updateKeyStatus: (id: string, status: ApiKey['status']) => Promise<ApiKey>;
  pushToast: (kind: ToastMessage['kind'], text: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [newSecret, setNewSecret] = useState('');

  const handleCopy = (ok: boolean) => {
    pushToast(ok ? 'success' : 'error', ok ? '已复制到剪贴板' : '复制失败，请手动复制');
  };

  const handleCreateKey = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('请输入 Key 名称');
      return;
    }

    const key = await createKey(trimmed);
    setNewSecret(key.secret ?? key.maskedKey);
    setError('');
    setName('');
    pushToast('success', 'API Key 已创建');
  };

  const toggleStatus = async (key: ApiKey) => {
    await updateKeyStatus(key.id, key.status === 'active' ? 'disabled' : 'active');
  };

  return (
    <section className="page-grid">
      <SectionHeader
        eyebrow="Credentials"
        title="API Keys"
        action={
          <button className="button-primary" type="button" onClick={() => setIsModalOpen(true)}>
            创建 API Key
          </button>
        }
      />

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>Key</th>
              <th>权限</th>
              <th>月配额</th>
              <th>RPM</th>
              <th>状态</th>
              <th>创建时间</th>
              <th>最近使用</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id}>
                <td>{key.name}</td>
                <td>
                  <code>{key.maskedKey}</code>
                </td>
                <td>{key.scopes.join(', ')}</td>
                <td>
                  ¥{key.monthlyUsed.toFixed(2)} / ¥{key.monthlyQuota.toFixed(2)}
                </td>
                <td>{key.rateLimitPerMinute}</td>
                <td>
                  <StatusBadge status={key.status} />
                </td>
                <td>{key.createdAt}</td>
                <td>{key.lastUsedAt}</td>
                <td>
                  <div className="row-actions">
                    <CopyButton value={key.secret ?? key.maskedKey} label="复制" onDone={handleCopy} />
                    <button className="button-secondary" type="button" onClick={() => toggleStatus(key)}>
                      {key.status === 'active' ? '停用' : '启用'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen ? (
        <Modal
          title="创建 API Key"
          onClose={() => setIsModalOpen(false)}
          footer={
            <>
              <button className="button-secondary" type="button" onClick={() => setIsModalOpen(false)}>
                关闭
              </button>
              <button className="button-primary" type="button" onClick={handleCreateKey}>
                创建并显示密钥
              </button>
            </>
          }
        >
          <div className="form-field">
            <label htmlFor="keyName">Key 名称</label>
            <input id="keyName" value={name} onChange={(event) => setName(event.target.value)} placeholder="例如：本地开发" />
            {error ? <span className="field-error">{error}</span> : null}
          </div>
          {newSecret ? (
            <div className="secret-box">
              <span>请立即保存，关闭后仅显示脱敏 Key。</span>
              <code>{newSecret}</code>
              <CopyButton value={newSecret} label="复制新密钥" onDone={handleCopy} />
            </div>
          ) : null}
        </Modal>
      ) : null}
    </section>
  );
}
