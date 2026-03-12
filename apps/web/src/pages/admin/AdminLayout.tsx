import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, MessageSquare, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function AdminLayout() {
  const location = useLocation();
  const { logout } = useAuthStore();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Users & Apps', path: '/admin/users', icon: Users },
    { name: 'Courses', path: '/admin/courses', icon: BookOpen },
    { name: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/" className="text-xl font-bold text-white flex items-center gap-2">
            🌱 FarmWise <span className="text-xs bg-primary px-2 py-0.5 rounded text-white">Admin</span>
          </Link>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path} 
                    className={`flex items-center gap-3 px-6 py-3 font-medium transition-colors ${
                      isActive ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={20} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-4 py-2 w-full text-slate-400 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <Outlet />
      </main>
    </div>
  );
}
