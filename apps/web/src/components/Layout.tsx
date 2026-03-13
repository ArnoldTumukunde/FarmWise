import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { OfflineBanner } from "@/components/OfflineBanner";
import {
  Bell,
  Leaf,
  Search,
  ShoppingCart,
  Menu,
  X,
  User,
  BookOpen,
  Shield,
  LogOut,
  ChevronDown,
  Settings,
} from "lucide-react";
import { fetchApi } from "@/lib/api";

function Navbar() {
  const { token, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    const fetchCount = () => {
      fetchApi('/notifications/unread-count').then(r => setUnreadCount(r.count)).catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    navigate("/courses");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center justify-between gap-4">
        {/* Left: Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded-md"
        >
          <Leaf className="h-7 w-7 text-[#2E7D32]" />
          <span className="text-xl font-bold text-[#2E7D32]">FarmWise</span>
        </Link>

        {/* Center: Search (desktop) */}
        <form
          onSubmit={handleSearch}
          className="hidden md:flex flex-1 max-w-md mx-4"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6E5A]" />
            <input
              type="search"
              placeholder="Search farming courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            />
          </div>
        </form>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {!token ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/become-instructor"
                className="text-sm font-medium text-[#5A6E5A] hover:text-[#2E7D32] transition-colors px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded-md"
              >
                Teach on FarmWise
              </Link>
              <Link
                to="/login"
                className="text-sm font-medium text-[#1B2B1B] hover:text-[#2E7D32] transition-colors px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2 rounded-md"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#4CAF50] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                Get Started &mdash; It's Free
              </Link>
            </div>
          ) : (
            <>
              <Link
                to="/notifications"
                className="hidden md:flex items-center justify-center h-10 w-10 rounded-lg text-[#1B2B1B] hover:bg-gray-100 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/cart"
                className="hidden md:flex items-center justify-center h-10 w-10 rounded-lg text-[#1B2B1B] hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
              </Link>

              {/* User Dropdown (desktop) */}
              <div ref={dropdownRef} className="relative hidden md:block">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-1.5 h-10 px-3 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  aria-label="User menu"
                >
                  <div className="h-8 w-8 rounded-full bg-[#2E7D32] flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-[#5A6E5A]" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-lg py-1 z-50">
                    <Link
                      to="/my-library"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      <BookOpen className="h-4 w-4 text-[#5A6E5A]" />
                      My Learning
                    </Link>
                    {user?.role === "FARMER" && (
                      <Link
                        to="/become-instructor"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                      >
                        <Leaf className="h-4 w-4 text-[#5A6E5A]" />
                        Become an Instructor
                      </Link>
                    )}
                    {(user?.role === "INSTRUCTOR" || user?.role === "ADMIN") && (
                      <Link
                        to="/instructor"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                      >
                        <Leaf className="h-4 w-4 text-[#5A6E5A]" />
                        Instructor Dashboard
                      </Link>
                    )}
                    {user?.role === "ADMIN" && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                      >
                        <Shield className="h-4 w-4 text-[#5A6E5A]" />
                        Admin
                      </Link>
                    )}
                    <Link
                      to="/settings"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1B2B1B] hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      <Settings className="h-4 w-4 text-[#5A6E5A]" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-[#1B2B1B]" />
            ) : (
              <Menu className="h-6 w-6 text-[#1B2B1B]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile slide-in menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-50">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="relative w-72 max-w-[80vw] h-full bg-white shadow-xl overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Mobile search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5A6E5A]" />
                  <input
                    type="search"
                    placeholder="Search farming courses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-[#FAFAF5] text-sm text-[#1B2B1B] placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  />
                </div>
              </form>

              <div className="border-t border-gray-100" />

              <Link
                to="/courses"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
              >
                <BookOpen className="h-4 w-4 text-[#5A6E5A]" />
                Browse Courses
              </Link>

              {!token ? (
                <>
                  <Link
                    to="/become-instructor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    <Leaf className="h-4 w-4 text-[#5A6E5A]" />
                    Teach on FarmWise
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-10 w-full rounded-lg border border-gray-200 text-[#1B2B1B] text-sm font-medium hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-10 w-full rounded-full bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#4CAF50] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    Get Started &mdash; It's Free
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    <Bell className="h-4 w-4 text-[#5A6E5A]" />
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    <ShoppingCart className="h-4 w-4 text-[#5A6E5A]" />
                    Cart
                  </Link>
                  <Link
                    to="/my-library"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    <BookOpen className="h-4 w-4 text-[#5A6E5A]" />
                    My Learning
                  </Link>
                  {user?.role === "FARMER" && (
                    <Link
                      to="/become-instructor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      <Leaf className="h-4 w-4 text-[#5A6E5A]" />
                      Become an Instructor
                    </Link>
                  )}
                  {(user?.role === "INSTRUCTOR" || user?.role === "ADMIN") && (
                    <Link
                      to="/instructor"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      <Leaf className="h-4 w-4 text-[#5A6E5A]" />
                      Instructor Dashboard
                    </Link>
                  )}
                  {user?.role === "ADMIN" && (
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      <Shield className="h-4 w-4 text-[#5A6E5A]" />
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-[#1B2B1B] rounded-lg hover:bg-[#FAFAF5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    <Settings className="h-4 w-4 text-[#5A6E5A]" />
                    Settings
                  </Link>
                  <div className="border-t border-gray-100" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-[#1A2E1A] text-white py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-[#4CAF50]" />
          <span className="text-lg font-bold">FarmWise</span>
        </div>
        <p className="text-sm text-gray-400">
          Empowering farmers with knowledge to grow smarter.
        </p>
        <p className="text-xs text-gray-500">
          &copy; {new Date().getFullYear()} FarmWise. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

/** Main layout wrapping all public/authenticated pages (not admin). */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF5] flex flex-col">
      <Navbar />
      <OfflineBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

/** Homepage layout — navbar only, no standard footer (homepage has its own). */
export function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF5] flex flex-col">
      <Navbar />
      <OfflineBanner />
      <main className="flex-1">{children}</main>
    </div>
  );
}

/** Minimal layout for auth pages (navbar only, no footer). */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF5] flex flex-col">
      <Navbar />
      <OfflineBanner />
      <main className="flex-1">{children}</main>
    </div>
  );
}
