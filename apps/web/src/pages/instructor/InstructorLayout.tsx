import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  BarChart3,
  MessageSquare,
  CreditCard,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sprout,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { to: '/instructor', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/instructor/courses', icon: BookOpen, label: 'Courses', end: false },
  { to: '/instructor/analytics', icon: BarChart3, label: 'Performance', end: false },
  { to: '/instructor/communication', icon: MessageSquare, label: 'Communication', end: false },
  { to: '/instructor/payouts', icon: CreditCard, label: 'Payouts', end: false },
  { to: '/settings', icon: UserCircle, label: 'Profile', end: false },
];

export default function InstructorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Map sub-routes to parent nav items for active state
  const isActive = (item: typeof navItems[0]) => {
    if (item.end) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  return (
    <div className="flex h-screen bg-[#FAFAF5] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden md:flex flex-col bg-[#1A2E1A] text-white transition-all duration-200 ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo area */}
        <div className="flex items-center gap-2 px-4 h-16 border-b border-white/10">
          <Sprout className="w-6 h-6 text-[#4CAF50] flex-shrink-0" />
          {!collapsed && (
            <span className="font-bold text-sm tracking-wide">AAN Academy</span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white/15 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Browse as student link */}
        <Link
          to="/"
          className={`flex items-center gap-3 mx-2 mb-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="Browse as student"
        >
          <ExternalLink className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Browse as student</span>}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-12 border-t border-white/10 text-white/40 hover:text-white/70 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-[#1A2E1A] text-white z-10 flex flex-col">
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sprout className="w-6 h-6 text-[#4CAF50]" />
                <span className="font-bold text-sm">AAN Academy</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-white/15 text-white'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile only) */}
        <div className="md:hidden flex items-center gap-3 px-4 h-14 bg-white border-b border-gray-200">
          <button onClick={() => setMobileOpen(true)} className="text-[#1B2B1B]">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-[#1B2B1B] text-sm">Instructor</span>
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
