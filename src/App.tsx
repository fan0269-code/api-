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

  const adjustUserBalance = async (userId: number, amount: number, operation: 'set' | 'add' | 'subtract', notes: string) => {
    const user = await adminApi.updateUserBalance(userId, { balance: amount, operation, notes });
    setConsoleData((current) =>
      current
        ? {
            ...current,
            users: {
              ...current.users,
              items: current.users.items.map((item) => (item.id === user.id ? { ...item, ...user } : item))
            }
          }
        : current
    );
    pushToast('success', '用户余额已更新');
  };

  const updateApiKeyGroup = async (keyId: number, groupId: number | null, resetUsage: boolean) => {
    const apiKey = await adminApi.updateApiKeyGroup(keyId, { group_id: groupId, reset_rate_limit_usage: resetUsage });
    setConsoleData((current) =>
      current
        ? {
            ...current,
            apiKeys: {
              ...current.apiKeys,
              items: current.apiKeys.items.map((item) => (item.id === apiKey.id ? { ...item, ...apiKey } : item))
            }
          }
        : current
    );
    pushToast('success', 'API Key 分组已更新');
  };

  const setAccountSchedulable = async (accountId: number, schedulable: boolean) => {
    const account = await adminApi.setAccountSchedulable(accountId, schedulable);
    setConsoleData((current) =>
      current
        ? {
            ...current,
            accounts: {
              ...current.accounts,
              items: current.accounts.items.map((item) => (item.id === account.id ? { ...item, ...account } : item))
            }
          }
        : current
    );
    pushToast('success', schedulable ? '账户已恢复调度' : '账户已暂停调度');
  };

  const testAccount = async (accountId: number) => {
    await adminApi.testAccount(accountId);
    pushToast('success', '账户测试已发起');
  };

  const updateChannelStatus = async (channelId: number, status: 'active' | 'disabled') => {
    const channel = await adminApi.updateChannelStatus(channelId, status);
    setConsoleData((current) =>
      current
        ? {
            ...current,
            channels: {
              ...current.channels,
              items: current.channels.items.map((item) => (item.id === channel.id ? { ...item, ...channel } : item))
            }
          }
        : current
    );
    pushToast('success', status === 'active' ? '渠道已启用' : '渠道已停用');
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
                  <Route path="/users" element={<UsersPage users={consoleData.users.items} onAdjustBalance={adjustUserBalance} />} />
                  <Route path="/keys" element={<ApiKeysPage keys={consoleData.apiKeys.items} groups={consoleData.groups.items} onUpdateGroup={updateApiKeyGroup} />} />
                  <Route path="/accounts" element={<AccountsPage accounts={consoleData.accounts.items} onSetSchedulable={setAccountSchedulable} onTestAccount={testAccount} />} />
                  <Route path="/groups" element={<GroupsPage groups={consoleData.groups.items} />} />
                  <Route path="/channels" element={<ChannelsPage channels={consoleData.channels.items} onUpdateStatus={updateChannelStatus} />} />
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
