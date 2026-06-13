import { BarChart3, BookOpen, CreditCard, KeyRound, LogOut, Network, PanelsTopLeft, RadioTower } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router';
import type { Account } from '../types';

const navItems = [
  { to: '/overview', label: '总览', icon: PanelsTopLeft },
  { to: '/keys', label: 'API Keys', icon: KeyRound },
  { to: '/models', label: '模型接口', icon: Network },
  { to: '/channels', label: '渠道管理', icon: RadioTower },
  { to: '/usage', label: '用量统计', icon: BarChart3 },
  { to: '/billing', label: '账单余额', icon: CreditCard },
  { to: '/docs', label: '接入文档', icon: BookOpen }
];

export function Shell({ account, children, onLogout }: { account: Account; children: ReactNode; onLogout: () => void }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <strong>RelayHub</strong>
            <span>API 中转站</span>
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
            <span className="eyebrow">Developer Console</span>
            <h1>API 中转控制台</h1>
          </div>
          <div className="account-pill">
            <span>{account.name}</span>
            <strong>余额 ¥{account.balance.toFixed(2)}</strong>
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
