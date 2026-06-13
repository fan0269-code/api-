import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useMemo, useState } from 'react';
import type { Account, ApiKey, BillingRecord, ChannelInfo, DocsExample, ModelInfo, ToastMessage, UsagePoint } from './types';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { ApiKeysPage } from './pages/ApiKeysPage';
import { ModelsPage } from './pages/ModelsPage';
import { UsagePage } from './pages/UsagePage';
import { BillingPage } from './pages/BillingPage';
import { DocsPage } from './pages/DocsPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { ToastStack } from './components/ui';
import { HomePage } from './pages/HomePage';
import { api } from './api/client';

interface ConsoleState {
  account: Account;
  keys: ApiKey[];
  models: ModelInfo[];
  channels: ChannelInfo[];
  usageSeries: UsagePoint[];
  billingRecords: BillingRecord[];
  docsExamples: DocsExample[];
}

export default function App() {
  const navigate = useNavigate();
  const [isAuthed, setIsAuthed] = useState(false);
  const [consoleState, setConsoleState] = useState<ConsoleState | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (kind: ToastMessage['kind'], text: string) => {
    const toast = { id: `${Date.now()}-${Math.random()}`, kind, text };
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 2600);
  };

  const activeKey = useMemo(() => consoleState?.keys.find((key) => key.status === 'active') ?? consoleState?.keys[0], [consoleState]);

  const login = async (identifier: string, password: string) => {
    const session = await api.login(identifier, password);
    const data = await api.loadConsoleData(session.account);
    setConsoleState(data);
    setIsAuthed(true);
    navigate('/overview');
  };

  const logout = () => {
    setIsAuthed(false);
    setConsoleState(null);
    navigate('/login');
  };

  const createKey = async (name: string) => {
    const key = await api.createKey(name);
    setConsoleState((current) => (current ? { ...current, keys: [key, ...current.keys] } : current));
    return key;
  };

  const updateKeyStatus = async (id: string, status: ApiKey['status']) => {
    const key = await api.updateKeyStatus(id, status);
    setConsoleState((current) =>
      current ? { ...current, keys: current.keys.map((item) => (item.id === key.id ? key : item)) } : current
    );
    return key;
  };

  const updateChannelStatus = async (id: string, status: ChannelInfo['status']) => {
    const channel = await api.updateChannelStatus(id, status);
    setConsoleState((current) =>
      current ? { ...current, channels: current.channels.map((item) => (item.id === channel.id ? channel : item)) } : current
    );
    return channel;
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route
          path="/*"
          element={
            isAuthed && consoleState && activeKey ? (
              <Shell account={consoleState.account} onLogout={logout}>
                <Routes>
                  <Route
                    path="/overview"
                    element={
                      <OverviewPage
                        account={consoleState.account}
                        activeKey={activeKey}
                        billingRecords={consoleState.billingRecords}
                        models={consoleState.models}
                        usageSeries={consoleState.usageSeries}
                        pushToast={pushToast}
                      />
                    }
                  />
                  <Route
                    path="/keys"
                    element={
                      <ApiKeysPage
                        keys={consoleState.keys}
                        createKey={createKey}
                        updateKeyStatus={updateKeyStatus}
                        pushToast={pushToast}
                      />
                    }
                  />
                  <Route path="/models" element={<ModelsPage models={consoleState.models} pushToast={pushToast} />} />
                  <Route
                    path="/channels"
                    element={
                      <ChannelsPage
                        channels={consoleState.channels}
                        updateChannelStatus={updateChannelStatus}
                        pushToast={pushToast}
                      />
                    }
                  />
                  <Route path="/usage" element={<UsagePage models={consoleState.models} usageSeries={consoleState.usageSeries} />} />
                  <Route
                    path="/billing"
                    element={<BillingPage account={consoleState.account} billingRecords={consoleState.billingRecords} />}
                  />
                  <Route path="/docs" element={<DocsPage docsExamples={consoleState.docsExamples} pushToast={pushToast} />} />
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
