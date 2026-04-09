import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, MessageSquare, LogOut, Menu, X,
  Tag, Ticket, RotateCcw, TrendingUp, Megaphone, Shield, Settings,
  Home, FileText, ClipboardList,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function AdminLayout() {
  const location = useLocation();
  const { logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups = [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Content',
      items: [
        { name: 'Courses', path: '/admin/courses', icon: BookOpen },
        { name: 'Categories', path: '/admin/categories', icon: Tag },
        { name: 'Pages', path: '/admin/pages', icon: FileText },
        { name: 'Moderation', path: '/admin/moderation', icon: Shield },
      ],
    },
    {
      label: 'Users',
      items: [
        { name: 'All Users', path: '/admin/users', icon: Users },
      ],
    },
    {
      label: 'Commerce',
      items: [
        { name: 'Coupons', path: '/admin/coupons', icon: Ticket },
        { name: 'Refunds', path: '/admin/refunds', icon: RotateCcw },
        { name: 'Revenue', path: '/admin/revenue', icon: TrendingUp },
      ],
    },
    {
      label: 'Communications',
      items: [
        { name: 'Broadcasts', path: '/admin/notifications', icon: Megaphone },
        { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
      ],
    },
    {
      label: 'System',
      items: [
        { name: 'Homepage', path: '/admin/homepage', icon: Home },
        { name: 'Settings', path: '/admin/settings', icon: Settings },
        { name: 'Audit Log', path: '/admin/audit-log', icon: ClipboardList },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#2E7D32]/10">
        <Link
          to="/"
          className="text-xl font-bold text-[#1B2B1B] flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] rounded"
        >
          <span className="w-8 h-8 bg-[#2E7D32] rounded-lg flex items-center justify-center text-white text-sm font-bold">FW</span>
          <span>FarmWise</span>
          <span className="text-[10px] bg-[#2E7D32] px-2 py-0.5 rounded-full text-white font-semibold uppercase tracking-wide">Admin</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-[#5A6E5A]/60 mb-1">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] ${
                        active
                          ? 'bg-[#2E7D32]/10 text-[#2E7D32] border-l-[3px] border-[#F57F17]'
                          : 'text-[#5A6E5A] hover:text-[#1B2B1B] hover:bg-[#2E7D32]/5'
                      }`}
                    >
                      <Icon size={18} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Browse as student + Logout */}
      <div className="p-4 border-t border-[#2E7D32]/10 space-y-1">
        <Link
          to="/"
          onClick={() => setSidebarOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-medium text-[#5A6E5A] hover:text-[#2E7D32] hover:bg-[#2E7D32]/5 rounded-lg transition-colors"
        >
          <BookOpen size={18} />
          Browse as student
        </Link>
        <button
          onClick={() => { logout(); setSidebarOpen(false); }}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-sm font-medium text-[#5A6E5A] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF5] flex">
      {/* Mobile hamburger */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-white border-b border-[#2E7D32]/10 flex items-center px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-[#1B2B1B] hover:bg-[#2E7D32]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
        <span className="ml-3 font-bold text-[#1B2B1B]">FarmWise Admin</span>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#2E7D32]/10 flex flex-col transition-transform duration-200 ease-in-out
          lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Mobile close */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-1.5 rounded-lg text-[#5A6E5A] hover:bg-[#2E7D32]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
          aria-label="Close sidebar"
        >
          <X size={20} />
        </button>
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
