import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, ShoppingBag, Tag, Ticket, Trophy,
  Zap, Bell, Settings, HelpCircle, FileText, LogOut, ChevronLeft,
  ChevronRight, Dumbbell, Package,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV = [
  { label: 'Dashboard',     to: '/',                icon: LayoutDashboard },
  { label: 'Users',         to: '/users',           icon: Users },
  { divider: true, label: 'E-Commerce' },
  { label: 'Products',      to: '/products',        icon: ShoppingBag },
  { label: 'Categories',    to: '/categories',      icon: Tag },
  { label: 'Orders',        to: '/orders',          icon: Package },
  { label: 'Coupons',       to: '/coupons',         icon: Ticket },
  { divider: true, label: 'Fitness' },
  { label: 'Challenges',    to: '/challenges',      icon: Dumbbell },
  { label: 'Gamification',  to: '/gamification',    icon: Trophy },
  { divider: true, label: 'System' },
  { label: 'Notifications', to: '/notifications',   icon: Bell },
  { label: 'Support',       to: '/support',         icon: HelpCircle },
  { label: 'FAQs',          to: '/faqs',            icon: FileText },
  { label: 'App Config',    to: '/config',          icon: Settings },
  { label: 'Legal',         to: '/legal',           icon: FileText },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gray-900 text-white flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-gray-700/50">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Athlofit</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center mx-auto">
            <Zap size={16} className="text-white" />
          </div>
        )}
        <button
          onClick={onToggle}
          className={`p-1 rounded-lg hover:bg-gray-700 transition-colors ${collapsed ? 'hidden' : ''}`}
        >
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
      </div>

      {collapsed && (
        <button
          onClick={onToggle}
          className="flex justify-center py-2 hover:bg-gray-700 transition-colors"
        >
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV.map((item, i) => {
          if (item.divider) {
            return collapsed ? (
              <div key={i} className="my-2 border-t border-gray-700/50" />
            ) : (
              <div key={i} className="px-3 pt-4 pb-1">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-700/60 hover:text-white'
                } ${collapsed ? 'justify-center' : ''}`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-700/50 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors" title="Logout">
              <LogOut size={15} className="text-gray-400" />
            </button>
          </div>
        ) : (
          <button onClick={logout} className="flex justify-center w-full p-2 rounded-lg hover:bg-gray-700 transition-colors" title="Logout">
            <LogOut size={18} className="text-gray-400" />
          </button>
        )}
      </div>
    </aside>
  );
}
