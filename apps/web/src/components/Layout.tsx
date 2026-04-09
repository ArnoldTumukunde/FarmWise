import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { OfflineBanner } from '@/components/OfflineBanner';
import { cloudinaryImageUrl, formatUGX } from '@/lib/utils';
import { fetchApi } from '@/lib/api';
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
  Heart,
  Award,
  Download,
  GraduationCap,
} from 'lucide-react';


interface SubCategory {
  id: string;
  name: string;
  slug: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  iconName?: string;
  children?: SubCategory[];
}

/* ── Search result types ─── */
interface SearchResult {
  id: string;
  slug: string;
  title: string;
  thumbnailPublicId: string | null;
  instructor: { profile?: { displayName: string } };
  averageRating: number;
  price: number;
}

/* ── Recent searches helpers ─── */
const RECENT_KEY = 'fw_recent_searches';
function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]').slice(0, 5);
  } catch {
    return [];
  }
}
function addRecentSearch(q: string) {
  const recent = getRecentSearches().filter((s) => s !== q);
  recent.unshift(q);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 5)));
}

/* ══════════════════════════════════════════════════════
   NAVBAR
   ══════════════════════════════════════════════════════ */

function Navbar() {
  const { token, user, logout } = useAuthStore();
  const cart = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const catTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const catRef = useRef<HTMLDivElement>(null);

  const [cartDropdownOpen, setCartDropdownOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<{ displayName?: string; avatarPublicId?: string | null; email?: string | null; phone?: string | null } | null>(null);

  /* Fetch categories once */
  useEffect(() => {
    fetchApi('/courses/categories')
      .then((res) => setCategories(res.categories || []))
      .catch(() => {});
  }, []);

  /* Fetch user profile for avatar + display name */
  useEffect(() => {
    if (!token) { setProfile(null); return; }
    fetchApi('/profile')
      .then((res) => setProfile(res.profile || res))
      .catch(() => {});
  }, [token]);

  /* Fetch notification count */
  useEffect(() => {
    if (!token) return;
    const fetchCount = () => {
      fetchApi('/notifications/unread-count')
        .then((r) => setUnreadCount(r.count))
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [token]);

  /* Fetch cart when logged in */
  useEffect(() => {
    if (token && !cart.fetched) cart.fetchCart();
  }, [token, cart.fetched]);

  /* Close dropdowns on click outside */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node;
      if (avatarRef.current && !avatarRef.current.contains(t)) setAvatarOpen(false);
      if (cartRef.current && !cartRef.current.contains(t)) setCartDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(t)) setSearchFocused(false);
      if (catRef.current && !catRef.current.contains(t)) setCatMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Close mobile menu on route change */
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  /* Lock body scroll when mobile menu is open */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  /* Debounced search */
  const doSearch = useCallback(
    (q: string) => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      searchTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetchApi(`/courses?search=${encodeURIComponent(q)}&limit=5`);
          setSearchResults(
            (res.data || []).map((c: any) => ({
              id: c.id,
              slug: c.slug,
              title: c.title,
              thumbnailPublicId: c.thumbnailPublicId,
              instructor: c.instructor,
              averageRating: Number(c.averageRating) || 0,
              price: Number(c.price) || 0,
            }))
          );
        } catch {
          setSearchResults([]);
        }
      }, 300);
    },
    []
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    doSearch(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    addRecentSearch(q);
    setSearchFocused(false);
    navigate(`/courses?search=${encodeURIComponent(q)}`);
    setSearchQuery('');
    setMobileMenuOpen(false);
  };

  const handleSearchFocus = () => {
    setRecentSearches(getRecentSearches());
    setSearchFocused(true);
  };

  const handleLogout = () => {
    logout();
    cart.clearCart();
    setAvatarOpen(false);
    setMobileMenuOpen(false);
    navigate('/courses');
  };

  const cartCount = cart.items.length;
  const cartTotal = cart.items.reduce((s, i) => s + (i.course.price || 0), 0);

  const showSearchDropdown = searchFocused && (searchQuery.trim() || recentSearches.length > 0);

  return (
    <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto h-full px-4 flex items-center gap-3">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
        >
          <Leaf className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary hidden sm:inline">FarmWise</span>
        </Link>

        {/* Categories dropdown (desktop) */}
        <div
          ref={catRef}
          className="relative hidden lg:block"
          onMouseEnter={() => {
            if (catTimerRef.current) clearTimeout(catTimerRef.current);
            setCatMenuOpen(true);
          }}
          onMouseLeave={() => {
            catTimerRef.current = setTimeout(() => setCatMenuOpen(false), 200);
          }}
        >
          <button
            className="flex items-center gap-1 text-sm font-medium text-text-base hover:text-primary transition-colors px-3 py-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            onClick={() => setCatMenuOpen(!catMenuOpen)}
          >
            Explore
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${catMenuOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {catMenuOpen && (
            <div className="absolute top-full left-0 z-50 bg-white shadow-xl rounded-b-lg border border-t-0 border-gray-200 animate-in flex">
              {/* Parent list */}
              <div className="w-56 py-2 border-r border-gray-100">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="relative"
                    onMouseEnter={() => setHoveredCat(cat.id)}
                  >
                    <Link
                      to={`/courses?category=${cat.slug}`}
                      onClick={() => setCatMenuOpen(false)}
                      className={`flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                        hoveredCat === cat.id ? 'bg-surface text-primary' : 'text-text-base hover:bg-surface hover:text-primary'
                      }`}
                    >
                      <span>{cat.name}</span>
                      {cat.children && cat.children.length > 0 && (
                        <ChevronDown size={12} className="text-text-muted -rotate-90" />
                      )}
                    </Link>
                  </div>
                ))}
              </div>
              {/* Subcategory panel */}
              {hoveredCat && (() => {
                const parent = categories.find(c => c.id === hoveredCat);
                if (!parent?.children?.length) return null;
                return (
                  <div className="w-52 py-2">
                    <p className="px-4 py-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                      {parent.name}
                    </p>
                    {parent.children.map((sub) => (
                      <Link
                        key={sub.id}
                        to={`/courses?category=${sub.slug}`}
                        onClick={() => setCatMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-text-base hover:bg-surface hover:text-primary transition-colors"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Search bar (desktop) */}
        <div ref={searchRef} className="relative flex-1 max-w-lg mx-2 hidden md:block">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="search"
                placeholder="Search farming courses, topics, instructors…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={handleSearchFocus}
                className="w-full h-10 pl-10 pr-9 rounded-lg border border-gray-200 bg-surface text-sm text-text-base placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Search dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 overflow-hidden">
              {/* Recent searches (when no query) */}
              {!searchQuery.trim() && recentSearches.length > 0 && (
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs font-medium text-text-muted mb-2">Recent searches</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setSearchQuery(q);
                          doSearch(q);
                        }}
                        className="text-xs bg-surface text-text-base px-3 py-1 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Instant results */}
              {searchQuery.trim() && searchResults.length > 0 && (
                <div>
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-surface transition-colors"
                      onClick={() => {
                        addRecentSearch(searchQuery.trim());
                        setSearchFocused(false);
                        setSearchQuery('');
                        navigate(`/course/${r.slug}`);
                      }}
                    >
                      <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                        {r.thumbnailPublicId && (
                          <img
                            src={cloudinaryImageUrl(r.thumbnailPublicId, 96, 54)}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-base font-medium truncate">{r.title}</p>
                        <p className="text-xs text-text-muted truncate">
                          {r.instructor?.profile?.displayName || 'Instructor'}
                          {r.averageRating > 0 && ` · ${r.averageRating.toFixed(1)}★`}
                          {' · '}
                          {r.price === 0 ? 'Free' : formatUGX(r.price)}
                        </p>
                      </div>
                    </button>
                  ))}
                  <button
                    className="w-full px-3 py-2.5 text-sm text-primary font-medium text-left hover:bg-surface transition-colors border-t border-gray-100"
                    onClick={() => {
                      addRecentSearch(searchQuery.trim());
                      setSearchFocused(false);
                      navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchQuery('');
                    }}
                  >
                    See all results for "{searchQuery.trim()}" &rarr;
                  </button>
                </div>
              )}

              {searchQuery.trim() && searchResults.length === 0 && (
                <div className="px-3 py-4 text-sm text-text-muted text-center">
                  No results for "{searchQuery.trim()}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 ml-auto">
          {/* Mobile search icon */}
          <Link
            to="/courses"
            className="md:hidden flex items-center justify-center h-10 w-10 rounded-lg text-text-base hover:bg-gray-100 transition-colors"
            aria-label="Search courses"
          >
            <Search className="h-5 w-5" />
          </Link>

          {!token ? (
            /* Logged out */
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-text-base hover:text-primary transition-colors px-3 py-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center justify-center h-10 px-5 rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Get Started
              </Link>
            </div>
          ) : (
            /* Logged in */
            <>
              {/* Cart icon */}
              <div ref={cartRef} className="relative">
                <button
                  onClick={() => setCartDropdownOpen(!cartDropdownOpen)}
                  className="flex items-center justify-center h-10 w-10 rounded-lg text-text-base hover:bg-gray-100 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                </button>

                {/* Cart dropdown */}
                {cartDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 animate-in">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-text-base mb-3">
                        {cartCount > 0
                          ? `Your cart (${cartCount} item${cartCount !== 1 ? 's' : ''})`
                          : 'Your cart is empty'}
                      </h3>

                      {cartCount === 0 ? (
                        <div className="text-center py-4">
                          <ShoppingCart className="h-8 w-8 text-text-muted/40 mx-auto mb-2" />
                          <p className="text-sm text-text-muted mb-3">Your cart is empty</p>
                          <Link
                            to="/courses"
                            onClick={() => setCartDropdownOpen(false)}
                            className="text-sm font-semibold text-primary hover:underline"
                          >
                            Browse courses
                          </Link>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3 max-h-60 overflow-y-auto">
                            {cart.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex gap-3 pb-3 border-b border-gray-100 last:border-0"
                              >
                                <div className="w-14 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                                  {item.course.thumbnailPublicId && (
                                    <img
                                      src={cloudinaryImageUrl(item.course.thumbnailPublicId, 112, 80)}
                                      alt=""
                                      className="w-full h-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-text-base line-clamp-2 leading-tight">
                                    {item.course.title}
                                  </p>
                                  <p className="text-[11px] text-text-muted mt-0.5">
                                    {item.course.instructor?.name ||
                                      item.course.instructor?.profile?.displayName ||
                                      'Instructor'}
                                  </p>
                                  <p className="text-xs font-bold text-text-base mt-0.5">
                                    {item.course.price === 0 ? 'Free' : formatUGX(item.course.price)}
                                  </p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cart.removeItem(item.id);
                                  }}
                                  className="text-text-muted hover:text-red-500 flex-shrink-0 self-start"
                                  aria-label="Remove"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                            <span className="text-sm font-semibold text-text-base">Total:</span>
                            <span className="text-sm font-bold text-text-base">
                              {formatUGX(cartTotal)}
                            </span>
                          </div>

                          <div className="mt-3 space-y-2">
                            <Link
                              to="/cart"
                              onClick={() => setCartDropdownOpen(false)}
                              className="block w-full text-center py-2.5 text-sm font-semibold border border-primary text-primary rounded hover:bg-primary/5 transition-colors"
                            >
                              Go to Cart
                            </Link>
                            <Link
                              to="/checkout"
                              onClick={() => setCartDropdownOpen(false)}
                              className="block w-full text-center py-2.5 text-sm font-semibold bg-primary text-white rounded hover:bg-primary-light transition-colors"
                            >
                              Checkout
                            </Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <Link
                to="/notifications"
                className="hidden md:flex items-center justify-center h-10 w-10 rounded-lg text-text-base hover:bg-gray-100 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Avatar dropdown (desktop) */}
              <div ref={avatarRef} className="relative hidden md:block">
                <button
                  onClick={() => setAvatarOpen(!avatarOpen)}
                  className="flex items-center gap-1.5 h-10 px-2 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  aria-label="User menu"
                >
                  {profile?.avatarPublicId ? (
                    <img
                      src={cloudinaryImageUrl(profile.avatarPublicId, 64)}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <ChevronDown
                    size={14}
                    className={`text-text-muted transition-transform duration-150 ${avatarOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {avatarOpen && (
                  <div className="absolute right-0 top-full mt-1 w-56 rounded-lg border border-gray-200 bg-white shadow-xl py-1 z-50 animate-in">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      {profile?.avatarPublicId ? (
                        <img
                          src={cloudinaryImageUrl(profile.avatarPublicId, 64)}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <User size={16} className="text-primary" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-base truncate">
                          {profile?.displayName && profile.displayName !== 'User'
                            ? profile.displayName
                            : profile?.email?.split('@')[0] || 'My Account'}
                        </p>
                        <p className="text-xs text-text-muted capitalize">
                          {user?.role?.toLowerCase() || 'farmer'}
                        </p>
                      </div>
                    </div>

                    <NavDropdownLink to="/profile" icon={<User size={16} />} onClick={() => setAvatarOpen(false)}>
                      My Profile
                    </NavDropdownLink>
                    <NavDropdownLink to="/my-learning" icon={<BookOpen size={16} />} onClick={() => setAvatarOpen(false)}>
                      My Learning
                    </NavDropdownLink>
                    <NavDropdownLink to="/my-library" icon={<Download size={16} />} onClick={() => setAvatarOpen(false)}>
                      My Downloads
                    </NavDropdownLink>
                    <NavDropdownLink to="/wishlist" icon={<Heart size={16} />} onClick={() => setAvatarOpen(false)}>
                      My Wishlist
                    </NavDropdownLink>
                    <NavDropdownLink to="/certificates" icon={<Award size={16} />} onClick={() => setAvatarOpen(false)}>
                      My Certificates
                    </NavDropdownLink>

                    {(user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') && (
                      <>
                        <div className="border-t border-gray-100 my-1" />
                        <NavDropdownLink to="/instructor" icon={<GraduationCap size={16} />} onClick={() => setAvatarOpen(false)}>
                          Instructor Dashboard
                        </NavDropdownLink>
                      </>
                    )}

                    {user?.role === 'ADMIN' && (
                      <NavDropdownLink to="/admin" icon={<Shield size={16} />} onClick={() => setAvatarOpen(false)}>
                        Admin Console
                      </NavDropdownLink>
                    )}

                    <div className="border-t border-gray-100 my-1" />

                    <NavDropdownLink to="/notifications" icon={<Bell size={16} />} onClick={() => setAvatarOpen(false)}>
                      Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unreadCount}
                        </span>
                      )}
                    </NavDropdownLink>
                    <NavDropdownLink to="/settings" icon={<Settings size={16} />} onClick={() => setAvatarOpen(false)}>
                      Settings
                    </NavDropdownLink>

                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut size={16} />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex items-center justify-center h-10 w-10 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-text-base" /> : <Menu className="h-6 w-6 text-text-base" />}
          </button>
        </div>
      </div>

      {/* ─── Mobile Drawer ─── */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileMenuOpen(false)} />
          <nav className="relative w-72 max-w-[80vw] h-full bg-white shadow-xl overflow-y-auto animate-in">
            <div className="p-4 space-y-1">
              {/* Mobile search */}
              <form onSubmit={handleSearchSubmit} className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
                  <input
                    type="search"
                    placeholder="Search courses…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 bg-surface text-sm text-text-base placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
              </form>

              {/* Categories section */}
              <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider px-3 pt-2 pb-1">
                Explore
              </p>
              {categories.map((cat) => (
                <MobileCategoryItem
                  key={cat.id}
                  category={cat}
                  onClose={() => setMobileMenuOpen(false)}
                />
              ))}

              <div className="border-t border-gray-100 my-2" />

              {!token ? (
                <>
                  <Link
                    to="/courses"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-base rounded-lg hover:bg-surface transition-colors"
                  >
                    <BookOpen size={16} className="text-text-muted" />
                    Browse Courses
                  </Link>
                  <div className="border-t border-gray-100 my-2" />
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-10 w-full rounded-lg border border-gray-200 text-text-base text-sm font-medium hover:bg-surface transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center h-10 w-full rounded-full bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <>
                  <MobileNavLink to="/my-learning" icon={<BookOpen size={16} />} onClick={() => setMobileMenuOpen(false)}>
                    My Learning
                  </MobileNavLink>
                  <MobileNavLink to="/my-library" icon={<Download size={16} />} onClick={() => setMobileMenuOpen(false)}>
                    My Downloads
                  </MobileNavLink>
                  <MobileNavLink to="/wishlist" icon={<Heart size={16} />} onClick={() => setMobileMenuOpen(false)}>
                    My Wishlist
                  </MobileNavLink>
                  <MobileNavLink to="/certificates" icon={<Award size={16} />} onClick={() => setMobileMenuOpen(false)}>
                    My Certificates
                  </MobileNavLink>
                  <MobileNavLink to="/notifications" icon={<Bell size={16} />} onClick={() => setMobileMenuOpen(false)}>
                    Notifications
                    {unreadCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unreadCount}
                      </span>
                    )}
                  </MobileNavLink>
                  <MobileNavLink to="/cart" icon={<ShoppingCart size={16} />} onClick={() => setMobileMenuOpen(false)}>
                    Cart
                    {cartCount > 0 && (
                      <span className="ml-auto bg-accent text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {cartCount}
                      </span>
                    )}
                  </MobileNavLink>

                  {user?.role === 'FARMER' && (
                    <>
                      <div className="border-t border-gray-100 my-2" />
                      <MobileNavLink to="/become-instructor" icon={<Leaf size={16} />} onClick={() => setMobileMenuOpen(false)}>
                        Become an Instructor
                      </MobileNavLink>
                    </>
                  )}
                  {(user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN') && (
                    <>
                      <div className="border-t border-gray-100 my-2" />
                      <MobileNavLink to="/instructor" icon={<GraduationCap size={16} />} onClick={() => setMobileMenuOpen(false)}>
                        Instructor Dashboard
                      </MobileNavLink>
                    </>
                  )}
                  {user?.role === 'ADMIN' && (
                    <MobileNavLink to="/admin" icon={<Shield size={16} />} onClick={() => setMobileMenuOpen(false)}>
                      Admin Console
                    </MobileNavLink>
                  )}

                  <MobileNavLink to="/settings" icon={<Settings size={16} />} onClick={() => setMobileMenuOpen(false)}>
                    Settings
                  </MobileNavLink>

                  <div className="border-t border-gray-100 my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors w-full text-left"
                  >
                    <LogOut size={16} />
                    Sign Out
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

/* ── Nav dropdown link helper ── */
function NavDropdownLink({
  to,
  icon,
  onClick,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-base hover:bg-surface transition-colors"
    >
      <span className="text-text-muted">{icon}</span>
      {children}
    </Link>
  );
}

/* ── Mobile category with expandable subcategories ── */
function MobileCategoryItem({ category, onClose }: { category: Category; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubs = category.children && category.children.length > 0;

  return (
    <div>
      <div className="flex items-center">
        <Link
          to={`/courses?category=${category.slug}`}
          onClick={onClose}
          className="flex-1 block px-3 py-2 text-sm text-text-base rounded-lg hover:bg-surface transition-colors"
        >
          {category.name}
        </Link>
        {hasSubs && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-2 text-text-muted hover:text-primary"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            <ChevronDown size={14} className={`transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>
      {expanded && hasSubs && (
        <div className="pl-4 pb-1">
          {category.children!.map((sub) => (
            <Link
              key={sub.id}
              to={`/courses?category=${sub.slug}`}
              onClick={onClose}
              className="block px-3 py-1.5 text-sm text-text-muted hover:text-primary hover:bg-surface rounded-lg transition-colors"
            >
              {sub.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Mobile nav link helper ── */
function MobileNavLink({
  to,
  icon,
  onClick,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-text-base rounded-lg hover:bg-surface transition-colors"
    >
      <span className="text-text-muted">{icon}</span>
      {children}
    </Link>
  );
}

/* ══════════════════════════════════════════════════════
   FOOTER
   ══════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="bg-surface-dark text-white py-8">
      <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-primary-light" />
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

/* ══════════════════════════════════════════════════════
   LAYOUT WRAPPERS
   ══════════════════════════════════════════════════════ */

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <OfflineBanner />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <OfflineBanner />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <OfflineBanner />
      <main className="flex-1">{children}</main>
    </div>
  );
}
