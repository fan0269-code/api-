import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  KeyRound,
  Layers3,
  LogOut,
  Network,
  PanelsTopLeft,
  RadioTower,
  Settings,
  UsersRound,
  WalletCards
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import type { AdminUser } from '../types';

const navItems = [
  { to: '/overview', label: '运营总览', icon: PanelsTopLeft },
  { to: '/users', label: '用户管理', icon: UsersRound },
  { to: '/keys', label: 'API Key 管理', icon: KeyRound },
  { to: '/accounts', label: '订阅账户池', icon: WalletCards },
  { to: '/groups', label: '分组调度', icon: Layers3 },
  { to: '/channels', label: '模型渠道', icon: RadioTower },
  { to: '/usage', label: '调用日志', icon: BarChart3 },
  { to: '/alerts', label: '告警任务', icon: AlertTriangle },
  { to: '/orders', label: '订单余额', icon: CreditCard },
  { to: '/settings', label: '系统设置', icon: Settings }
];

export function Shell({ user, children, onLogout }: { user: AdminUser; children: ReactNode; onLogout: () => void }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>sub2api Admin</strong>
            <span>订阅 API 网关后台</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="主导航">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div>
            <span className="eyebrow">Operations Console</span>
            <h1>sub2api 管理后台</h1>
          </div>
          <div className="account-pill">
            <Network size={16} />
            <span>{user.username || user.email}</span>
            <strong>{user.role}</strong>
            <button className="icon-text-button" onClick={onLogout}>
              <LogOut size={16} />
              退出
            </button>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
