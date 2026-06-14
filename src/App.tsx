import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useState } from 'react';
import type { AdminConsoleData, AdminUser, ToastMessage } from './types';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/LoginPage';
import { ToastStack } from './components/ui';
import {
  AccountsPage,
  AlertsPage,
  ApiKeysPage,
  ChannelsPage,
  GroupsPage,
  OrdersPage,
  OverviewPage,
  SettingsPage,
  UsagePage,
  UsersPage
} from './pages/AdminPages';
import { adminApi } from './api/client';

export default function App() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [consoleData, setConsoleData] = useState<AdminConsoleData | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const pushToast = (kind: ToastMessage['kind'], text: string) => {
    const toast = { id: `${Date.now()}-${Math.random()}`, kind, text };
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 2600);
  };

  const login = async (email: string, password: string) => {
    const session = await adminApi.login(email, password);
    const data = await adminApi.loadAdminConsoleData();
    setAdminUser(session.user);
    setConsoleData(data);
    pushToast('success', '管理员已登录');
    navigate('/overview');
  };

  const logout = () => {
    adminApi.logout();
    setAdminUser(null);
    setConsoleData(null);
    navigate('/login');
  };

  const isReady = adminUser && consoleData;

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={isReady ? '/overview' : '/login'} replace />} />
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route
          path="/*"
          element={
            isReady ? (
              <Shell user={adminUser} onLogout={logout}>
                <Routes>
                  <Route path="/overview" element={<OverviewPage data={consoleData} />} />
                  <Route path="/users" element={<UsersPage users={consoleData.users.items} />} />
                  <Route path="/keys" element={<ApiKeysPage keys={consoleData.apiKeys.items} />} />
                  <Route path="/accounts" element={<AccountsPage accounts={consoleData.accounts.items} />} />
                  <Route path="/groups" element={<GroupsPage groups={consoleData.groups.items} />} />
                  <Route path="/channels" element={<ChannelsPage channels={consoleData.channels.items} />} />
                  <Route path="/usage" element={<UsagePage usage={consoleData.usage.items} />} />
                  <Route path="/alerts" element={<AlertsPage errors={consoleData.requestErrors.items} />} />
                  <Route path="/orders" element={<OrdersPage orders={consoleData.paymentOrders.items} />} />
                  <Route path="/settings" element={<SettingsPage settings={consoleData.settings} />} />
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
