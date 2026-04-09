import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Sprout,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import CourseCard, { type CourseCardData } from '@/components/course/CourseCard';
import { CourseCardSkeleton } from '@/components/course/CourseCardSkeleton';

/* ── Constants ─── */

const SORT_OPTIONS = [
  { value: '', label: 'Most Relevant' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'most-enrolled', label: 'Most Enrolled' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
];

const RATING_OPTIONS = [
  { value: '4.5', label: '4.5 & up' },
  { value: '4.0', label: '4.0 & up' },
  { value: '3.5', label: '3.5 & up' },
  { value: '3.0', label: '3.0 & up' },
];

const PRICE_OPTIONS = [
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

const DURATION_OPTIONS = [
  { value: 'under-1h', label: 'Under 1 hour' },
  { value: '1-3h', label: '1–3 hours' },
  { value: '3-6h', label: '3–6 hours' },
  { value: '6h+', label: '6+ hours' },
];

const LEVEL_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
];

const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Luganda', label: 'Luganda' },
  { value: 'Swahili', label: 'Swahili' },
  { value: 'Kinyarwanda', label: 'Kinyarwanda' },
];

const PAGE_SIZE = 20;

/* ── Filters type ─── */

interface Filters {
  search: string;
  categoryId: string;
  categorySlug: string;
  rating: string;
  price: string;
  duration: string;
  level: string;
  language: string;
  sort: string;
}

const defaultFilters: Filters = {
  search: '',
  categoryId: '',
  categorySlug: '',
  rating: '',
  price: '',
  duration: '',
  level: '',
  language: '',
  sort: '',
};

/* ── Helper: map API course → CourseCardData ─── */

function mapCourse(c: any): CourseCardData {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle || '',
    thumbnailPublicId: c.thumbnailPublicId,
    instructor: { name: c.instructor?.profile?.displayName || 'Instructor' },
    category: c.category,
    averageRating: Number(c.averageRating) || 0,
    reviewCount: c.reviewCount || c._count?.reviews || 0,
    price: Number(c.price) || 0,
    originalPrice: c.originalPrice ? Number(c.originalPrice) : undefined,
    totalDuration: c.totalDuration || 0,
    level: c.level,
    language: c.language,
    updatedAt: c.updatedAt,
    isFeatured: c.isFeatured,
    isOfflineEnabled: c.isOfflineEnabled,
    outcomes: c.outcomes || [],
    _count: c._count,
  };
}

/* ══════════════════════════════════════════════════════
   COURSE CATALOG PAGE
   ══════════════════════════════════════════════════════ */

export default function CourseCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* State */
  const [courses, setCourses] = useState<CourseCardData[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string; children?: { id: string; name: string; slug: string }[] }[]>([]);
  /* Flat list of all categories + subcategories for slug → id resolution */
  const [allCats, setAllCats] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [totalCourses, setTotalCourses] = useState(0);
  const [offset, setOffset] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    ...defaultFilters,
    search: searchParams.get('search') || '',
    categorySlug: searchParams.get('category') || '',
  });
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const initialLoad = useRef(true);

  /* Fetch categories */
  useEffect(() => {
    fetchApi('/courses/categories')
      .then((res) => {
        const cats = res.categories || [];
        setCategories(cats);
        // Build flat list for slug resolution (parents + children)
        const flat: { id: string; name: string; slug: string }[] = [];
        for (const cat of cats) {
          flat.push({ id: cat.id, name: cat.name, slug: cat.slug });
          if (cat.children) {
            for (const sub of cat.children) {
              flat.push({ id: sub.id, name: sub.name, slug: sub.slug });
            }
          }
        }
        setAllCats(flat);
        // Resolve category slug to ID
        const slug = searchParams.get('category');
        if (slug) {
          const found = flat.find((c) => c.slug === slug);
          if (found) {
            setFilters((prev) => ({ ...prev, categoryId: found.id, categorySlug: slug }));
          }
        }
      })
      .catch(() => {});
  }, []);

  /* Sync URL search param changes */
  useEffect(() => {
    const search = searchParams.get('search') || '';
    const catSlug = searchParams.get('category') || '';
    setFilters((prev) => {
      const catId = catSlug
        ? allCats.find((c) => c.slug === catSlug)?.id || prev.categoryId
        : '';
      return { ...prev, search, categorySlug: catSlug, categoryId: catId };
    });
  }, [searchParams, allCats]);

  /* Load courses when filters change */
  useEffect(() => {
    // Skip the very first render if we haven't resolved category slug yet
    if (initialLoad.current && filters.categorySlug && !filters.categoryId) {
      return;
    }
    initialLoad.current = false;
    loadCourses(true);
  }, [
    filters.search,
    filters.categoryId,
    filters.rating,
    filters.price,
    filters.duration,
    filters.level,
    filters.language,
    filters.sort,
  ]);

  /* Close sort dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  /* Lock body scroll for mobile filter */
  useEffect(() => {
    document.body.style.overflow = mobileFilterOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileFilterOpen]);

  /* ── Load courses ─── */
  const loadCourses = useCallback(
    async (reset = false) => {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setError(false);
      } else {
        setLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.categoryId) params.append('categoryId', filters.categoryId);
        if (filters.rating) params.append('rating', filters.rating);
        if (filters.price) params.append('filter', filters.price);
        if (filters.duration) params.append('duration', filters.duration);
        if (filters.level) params.append('level', filters.level);
        if (filters.language) params.append('language', filters.language);
        if (filters.sort) params.append('sort', filters.sort);
        params.append('limit', String(PAGE_SIZE));
        params.append('offset', String(reset ? 0 : offset));

        const res = await fetchApi(`/courses?${params.toString()}`);
        const raw = res.data || [];
        const mapped = raw.map(mapCourse);

        if (reset) {
          setCourses(mapped);
          setOffset(PAGE_SIZE);
        } else {
          setCourses((prev) => [...prev, ...mapped]);
          setOffset((prev) => prev + PAGE_SIZE);
        }
        setTotalCourses(res.total ?? mapped.length);
      } catch {
        setError(true);
        if (reset) setCourses([]);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, offset]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (filters.search) prev.set('search', filters.search);
      else prev.delete('search');
      return prev;
    });
  };

  const updateFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: prev[key] === value ? '' : value }));
  };

  const clearAllFilters = () => {
    setFilters({ ...defaultFilters });
    setSearchParams({});
  };

  const hasActiveFilters =
    filters.rating || filters.price || filters.duration || filters.level || filters.language;

  const allLoaded = courses.length >= totalCourses;
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === filters.sort)?.label || 'Most Relevant';

  const activeChips: { label: string; key: keyof Filters }[] = [];
  if (filters.rating)
    activeChips.push({
      label: `Rating: ${filters.rating}+`,
      key: 'rating',
    });
  if (filters.price)
    activeChips.push({
      label: filters.price === 'free' ? 'Free' : 'Paid',
      key: 'price',
    });
  if (filters.duration)
    activeChips.push({
      label: DURATION_OPTIONS.find((d) => d.value === filters.duration)?.label || filters.duration,
      key: 'duration',
    });
  if (filters.level)
    activeChips.push({
      label: LEVEL_OPTIONS.find((l) => l.value === filters.level)?.label || filters.level,
      key: 'level',
    });
  if (filters.language) activeChips.push({ label: filters.language, key: 'language' });

  /* ── Category pills for selected state ─── */
  const selectedCatName =
    filters.categoryId ? allCats.find((c) => c.id === filters.categoryId)?.name : null;

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-surface-dark text-white py-10 md:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-5">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sprout className="h-7 w-7 text-primary-light" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">
            {filters.search
              ? `Results for "${filters.search}"`
              : selectedCatName
              ? selectedCatName
              : 'Learn to Farm Smarter'}
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-2xl mx-auto">
            Practical courses from expert farmers. Grow your skills, grow your harvest.
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="search"
                placeholder="Search farming courses…"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full h-12 sm:h-14 pl-12 pr-28 rounded-xl border-0 bg-white text-text-base text-base placeholder:text-text-muted shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 sm:h-10 px-5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent-light transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Category pills */}
      <div className="max-w-7xl mx-auto px-4 mt-5 mb-2">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
          <button
            onClick={() => {
              setFilters((prev) => ({ ...prev, categoryId: '', categorySlug: '' }));
              setSearchParams((prev) => { prev.delete('category'); return prev; });
            }}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              !filters.categoryId
                ? 'bg-primary text-white'
                : 'bg-white text-text-base border border-gray-200 hover:border-primary hover:text-primary'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setFilters((prev) => ({ ...prev, categoryId: cat.id, categorySlug: cat.slug }));
                setSearchParams((prev) => { prev.set('category', cat.slug); return prev; });
              }}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                filters.categoryId === cat.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-text-base border border-gray-200 hover:border-primary hover:text-primary'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main content: sidebar + grid */}
      <section className="max-w-7xl mx-auto px-4 py-4 pb-12">
        <div className="flex gap-6">
          {/* ─── Filter sidebar (desktop) ─── */}
          <aside className="hidden md:block w-60 flex-shrink-0">
            <div className="sticky top-20 space-y-5">
              {/* Sort */}
              <div ref={sortRef} className="relative">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5 block">
                  Sort by
                </label>
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="w-full flex items-center justify-between h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-text-base hover:border-primary transition-colors"
                >
                  <span>{currentSortLabel}</span>
                  <ChevronDown
                    size={14}
                    className={`text-text-muted transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {sortDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, sort: opt.value }));
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          filters.sort === opt.value
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-text-base hover:bg-surface'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <FilterSection title="Rating">
                {RATING_OPTIONS.map((opt) => (
                  <FilterRadio
                    key={opt.value}
                    label={opt.label}
                    checked={filters.rating === opt.value}
                    onChange={() => updateFilter('rating', opt.value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Price">
                {PRICE_OPTIONS.map((opt) => (
                  <FilterCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={filters.price === opt.value}
                    onChange={() => updateFilter('price', opt.value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Duration">
                {DURATION_OPTIONS.map((opt) => (
                  <FilterCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={filters.duration === opt.value}
                    onChange={() => updateFilter('duration', opt.value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Level">
                {LEVEL_OPTIONS.map((opt) => (
                  <FilterCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={filters.level === opt.value}
                    onChange={() => updateFilter('level', opt.value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Language">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <FilterCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={filters.language === opt.value}
                    onChange={() => updateFilter('language', opt.value)}
                  />
                ))}
              </FilterSection>
            </div>
          </aside>

          {/* ─── Results area ─── */}
          <div className="flex-1 min-w-0">
            {/* Mobile filter button + sort row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {/* Mobile filter trigger */}
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="md:hidden flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-text-base hover:border-primary transition-colors"
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </button>

                {!loading && courses.length > 0 && (
                  <p className="text-sm text-text-muted">
                    {totalCourses} course{totalCourses !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>

              {/* Mobile sort */}
              <div ref={sortRef} className="relative md:hidden">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-1 h-9 px-3 rounded-lg border border-gray-200 bg-white text-sm text-text-base"
                >
                  Sort
                  <ChevronDown size={14} />
                </button>
                {sortDropdownOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 py-1">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, sort: opt.value }));
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          filters.sort === opt.value
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-text-base hover:bg-surface'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={() => setFilters((prev) => ({ ...prev, [chip.key]: '' }))}
                    className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1 hover:bg-primary/20 transition-colors"
                  >
                    {chip.label}
                    <X size={12} />
                  </button>
                ))}
                <button
                  onClick={clearAllFilters}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {/* Error state */}
            {error && !loading && (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <AlertTriangle size={40} className="text-amber-500 mb-4" />
                <h3 className="text-lg font-semibold text-text-base mb-2">Something went wrong</h3>
                <p className="text-sm text-text-muted mb-5 max-w-xs">
                  We couldn't load courses. Please check your connection and try again.
                </p>
                <button
                  onClick={() => loadCourses(true)}
                  className="bg-primary hover:bg-primary-light text-white text-sm font-semibold px-5 py-2.5 rounded transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && !error ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                {Array.from({ length: 9 }).map((_, i) => (
                  <CourseCardSkeleton key={i} />
                ))}
              </div>
            ) : !error && courses.length === 0 ? (
              /* Empty state */
              <div className="text-center py-16 space-y-3">
                <Sprout className="h-12 w-12 text-text-muted/40 mx-auto" />
                <p className="text-lg text-text-base font-medium">No courses found</p>
                <p className="text-sm text-text-muted max-w-md mx-auto">
                  {filters.search
                    ? `No courses found for "${filters.search}". Try a crop name or farming topic.`
                    : 'No courses match your current filters.'}
                </p>
                {(filters.search || hasActiveFilters || filters.categoryId) && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm font-semibold text-primary hover:underline mt-2"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            ) : !error ? (
              <>
                {/* Course grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                  {courses.map((course, i) => (
                    <CourseCard key={course.id} course={course} eager={i < 3} />
                  ))}
                </div>

                {/* Load More */}
                <div className="mt-8 text-center">
                  {allLoaded ? (
                    <p className="text-sm text-text-muted">
                      Showing all {totalCourses} result{totalCourses !== 1 ? 's' : ''}
                    </p>
                  ) : (
                    <button
                      onClick={() => loadCourses(false)}
                      disabled={loadingMore}
                      className="bg-white border border-gray-200 hover:border-primary text-text-base hover:text-primary text-sm font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading…' : `Load ${PAGE_SIZE} more courses`}
                    </button>
                  )}
                </div>

                {/* Loading more skeletons */}
                {loadingMore && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mt-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <CourseCardSkeleton key={`more-${i}`} />
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </section>

      {/* ─── Mobile filter bottom sheet ─── */}
      {mobileFilterOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-2xl max-h-[80vh] flex flex-col animate-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-base font-semibold text-text-base">Filters</h3>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Filter body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <FilterSection title="Rating">
                {RATING_OPTIONS.map((opt) => (
                  <FilterRadio
                    key={opt.value}
                    label={opt.label}
                    checked={filters.rating === opt.value}
                    onChange={() => updateFilter('rating', opt.value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Price">
                {PRICE_OPTIONS.map((opt) => (
                  <FilterCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={filters.price === opt.value}
                    onChange={() => updateFilter('price', opt.value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Duration">
                {DURATION_OPTIONS.map((opt) => (
                  <FilterCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={filters.duration === opt.value}
                    onChange={() => updateFilter('duration', opt.value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Level">
                {LEVEL_OPTIONS.map((opt) => (
                  <FilterCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={filters.level === opt.value}
                    onChange={() => updateFilter('level', opt.value)}
                  />
                ))}
              </FilterSection>

              <FilterSection title="Language">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <FilterCheckbox
                    key={opt.value}
                    label={opt.label}
                    checked={filters.language === opt.value}
                    onChange={() => updateFilter('language', opt.value)}
                  />
                ))}
              </FilterSection>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setFilters((prev) => ({
                    ...prev,
                    rating: '',
                    price: '',
                    duration: '',
                    level: '',
                    language: '',
                  }));
                  setMobileFilterOpen(false);
                }}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-sm font-medium text-text-base hover:bg-surface transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex-1 h-10 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   FILTER COMPONENTS
   ══════════════════════════════════════════════════════ */

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border-b border-gray-100 pb-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left mb-2"
      >
        <span className="text-sm font-semibold text-text-base">{title}</span>
        {open ? (
          <ChevronUp size={14} className="text-text-muted" />
        ) : (
          <ChevronDown size={14} className="text-text-muted" />
        )}
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  );
}

function FilterRadio({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5">
      <span
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          checked ? 'border-primary' : 'border-gray-300 group-hover:border-primary'
        }`}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-primary" />}
      </span>
      <span className="text-sm text-text-base">{label}</span>
    </label>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group py-0.5" onClick={onChange}>
      <span
        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          checked
            ? 'border-primary bg-primary'
            : 'border-gray-300 group-hover:border-primary'
        }`}
      >
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="text-sm text-text-base">{label}</span>
    </label>
  );
}
