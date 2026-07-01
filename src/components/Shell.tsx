import {
  AlertTriangle,
  BarChart3,
  CreditCard,
  KeyRound,
  Layers3,
  LogOut,
  Menu,
  Network,
  PanelsTopLeft,
  RadioTower,
  Settings,
  UsersRound,
  WalletCards,
  X
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink } from 'react-router';
import type { AdminUser } from '../types';

const navItems = [
  { to: '/overview', label: '总览', icon: PanelsTopLeft },
  { to: '/users', label: '用户管理', icon: UsersRound },
  { to: '/keys', label: 'API 密钥', icon: KeyRound },
  { to: '/accounts', label: '账户池', icon: WalletCards },
  { to: '/groups', label: '分组调度', icon: Layers3 },
  { to: '/channels', label: '模型', icon: RadioTower },
  { to: '/usage', label: '日志', icon: BarChart3 },
  { to: '/alerts', label: '状态', icon: AlertTriangle },
  { to: '/orders', label: '钱包', icon: CreditCard },
  { to: '/settings', label: '设置', icon: Settings }
];

export function Shell({ user, children, onLogout }: { user: AdminUser; children: ReactNode; onLogout: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = (
    <nav className="nav-list" aria-label="主导航">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {sidebarOpen ? <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" /> : null}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>智链 AI</strong>
            <span>sub2api 运营控制台</span>
          </div>
          <button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="关闭菜单">
            <X size={18} />
          </button>
        </div>
        {nav}
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div>
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="打开菜单">
              <Menu size={20} />
            </button>
            <h1>智链 AI 管理后台</h1>
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
