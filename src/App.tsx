import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import { account, apiKeys as initialKeys } from './data/mock';
import type { ApiKey, ToastMessage } from './types';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ModelsPage } from './pages/ModelsPage';
import { UsagePage } from './pages/UsagePage';
import { BillingPage } from './pages/BillingPage';
import { DocsPage } from './pages/DocsPage';
import { ToastStack } from './components/ui';

export default function App() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (kind: ToastMessage['kind'], text: string) => {
    const toast = { id: `${Date.now()}-${Math.random()}`, kind, text };
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 2600);
  };

  const activeKey = useMemo(() => keys.find((key) => key.status === 'active') ?? keys[0], [keys]);

  const login = () => {
    setIsAuthed(true);
    navigate('/overview');
  };

  const logout = () => {
    setIsAuthed(false);
    navigate('/login');
  };

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route
          path="/*"
          element={
            isAuthed ? (
              <Shell account={account} onLogout={logout}>
                <Routes>
                  <Route path="/overview" element={<OverviewPage activeKey={activeKey} pushToast={pushToast} />} />
                  <Route path="/keys" element={<ApiKeysPage keys={keys} setKeys={setKeys} pushToast={pushToast} />} />
                  <Route path="/models" element={<ModelsPage pushToast={pushToast} />} />
                  <Route path="/usage" element={<UsagePage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/docs" element={<DocsPage pushToast={pushToast} />} />
                  <Route path="*" element={<Navigate to="/overview" replace />} />
                </Routes>
              </Shell>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
      <ToastStack toasts={toasts} />
    </>
  );
}
