import { Navigate, Route, Routes, useNavigate } from 'react-router';
import { useRef, useState } from 'react';
import type { AdminConsoleData, AdminUser, ToastMessage } from './types';
import { Shell } from './components/Shell';
import { LoginPage } from './pages/LoginPage';
import { CompliancePage } from './pages/CompliancePage';
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
import { AdminApiError, adminApi } from './api/client';
import type { AdminComplianceStatus } from './types';

export default function App() {
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [consoleData, setConsoleData] = useState<AdminConsoleData | null>(null);
  const [pendingCompliance, setPendingCompliance] = useState<AdminComplianceStatus | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const demoLoadingRef = useRef(false);

  const pushToast = (kind: ToastMessage['kind'], text: string) => {
    const toast = { id: `${Date.now()}-${Math.random()}`, kind, text };
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 2600);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const session = await adminApi.login(email, password);
    setAdminUser(session.user);
    setPendingCompliance(null);

    let data: AdminConsoleData;
    try {
      data = await adminApi.loadAdminConsoleData();
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 423) {
        const status = await adminApi.getAdminComplianceStatus();
        setConsoleData(null);
        setPendingCompliance(status);
        setIsLoading(false);
        navigate('/compliance');
        return;
      }
      setIsLoading(false);
      throw error;
    }

    setConsoleData(data);
    setIsLoading(false);
    pushToast('success', '管理员已登录');
    navigate('/overview');
  };

  const openDemoConsole = async () => {
    if (demoLoadingRef.current) return;
    demoLoadingRef.current = true;
    try {
      const { demoAdminSession, demoConsoleData } = await import('./data/demoAdmin');
      setAdminUser(demoAdminSession.user);
      setConsoleData(demoConsoleData);
      setPendingCompliance(null);
      pushToast('info', '已进入本地演示后台');
      navigate('/overview');
    } finally {
      demoLoadingRef.current = false;
    }
  };

  const acceptCompliance = async (phrase: string, language: string) => {
    const status = await adminApi.acceptAdminCompliance(phrase, language);
    if (status.required) {
      setPendingCompliance(status);
      throw new Error('后端仍要求完成合规确认');
    }
    const data = await adminApi.loadAdminConsoleData();
    setConsoleData(data);
    setPendingCompliance(null);
    pushToast('success', '合规确认已记录');
    navigate('/overview');
  };

  const logout = () => {
    adminApi.logout();
    setAdminUser(null);
    setConsoleData(null);
    setPendingCompliance(null);
    navigate('/login');
  };

  const adjustUserBalance = async (userId: number, amount: number, operation: 'set' | 'add' | 'subtract', notes: string) => {
    try {
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
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : '余额调整失败');
    }
  };

  const updateApiKeyGroup = async (keyId: number, groupId: number | null, resetUsage: boolean) => {
    try {
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
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : '分组更新失败');
    }
  };

  const setAccountSchedulable = async (accountId: number, schedulable: boolean) => {
    try {
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
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : '调度操作失败');
    }
  };

  const testAccount = async (accountId: number) => {
    try {
      await adminApi.testAccount(accountId);
      pushToast('success', '账户测试已发起');
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : '账户测试失败');
    }
  };

  const updateChannelStatus = async (channelId: number, status: 'active' | 'disabled') => {
    try {
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
    } catch (error) {
      pushToast('error', error instanceof Error ? error.message : '渠道状态更新失败');
    }
  };

  const isReady = adminUser && consoleData;

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={isReady ? '/overview' : '/login'} replace />} />
        {isLoading ? (
          <Route path="*" element={
            <main className="login-page">
              <div className="login-panel" style={{textAlign:'center'}}>
                <h2>正在加载管理数据...</h2>
                <p className="muted">请稍候，正在连接 sub2api 后端</p>
              </div>
            </main>
          } />
        ) : null}
        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={login}
              demoAction={
                import.meta.env.DEV ? (
                  <button className="button-secondary login-demo" type="button" onClick={openDemoConsole}>
                    查看演示后台
                  </button>
                ) : undefined
              }
            />
          }
        />
        <Route
          path="/compliance"
          element={
            adminUser && pendingCompliance ? (
              <CompliancePage status={pendingCompliance} onAccept={acceptCompliance} onLogout={logout} />
            ) : adminUser && consoleData ? (
              <Navigate to="/overview" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
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
