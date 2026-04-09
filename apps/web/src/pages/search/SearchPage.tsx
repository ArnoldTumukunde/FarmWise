import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchApi } from '../../lib/api';
import { cloudinaryImageUrl, formatUGX } from '../../lib/utils';
import {
  Search,
  Star,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Sprout,
} from 'lucide-react';
import { toast } from 'sonner';

interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  price: string;
  thumbnailPublicId: string | null;
  level: string;
  language: string;
  category: { id: string; name: string };
  instructor: { profile: { displayName: string } };
  _count: { enrollments: number; reviews: number };
  averageRating?: number;
}

interface Category {
  id: string;
  name: string;
}

type SortOption =
  | 'relevant'
  | 'highest-rated'
  | 'newest'
  | 'price-low'
  | 'price-high';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'highest-rated', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
];

const RATING_OPTIONS = [
  { value: '4.5', label: '4.5 & up' },
  { value: '4.0', label: '4.0 & up' },
  { value: '3.5', label: '3.5 & up' },
];

const PRICE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
];

const LEVEL_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
const LANGUAGE_OPTIONS = ['English', 'Luganda', 'Swahili'];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i <= Math.round(rating)
              ? 'fill-[#F57F17] text-[#F57F17]'
              : 'fill-gray-200 text-gray-200'
          }`}
        />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden animate-pulse">
      <div className="aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-1/4 mt-2" />
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filters
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minRating, setMinRating] = useState('');
  const [priceFilter, setPriceFilter] = useState('all');
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('relevant');

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load categories once
  useEffect(() => {
    fetchApi('/courses/categories')
      .then((res) => setCategories(res.categories || []))
      .catch(console.error);
  }, []);

  // Sync from URL on mount
  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, []);

  const fetchCourses = useCallback(
    async (searchQuery: string, pageNum = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.set('search', searchQuery);
        if (selectedCategories.length > 0) params.set('categoryId', selectedCategories[0]);
        if (minRating) params.set('minRating', minRating);
        if (priceFilter === 'free') params.set('price', '0');
        if (priceFilter === 'paid') params.set('minPrice', '1');
        if (selectedLevels.length > 0) params.set('level', selectedLevels.join(','));
        if (selectedLanguages.length > 0) params.set('language', selectedLanguages.join(','));
        if (sortBy === 'highest-rated') params.set('sort', 'rating');
        else if (sortBy === 'newest') params.set('sort', 'newest');
        else if (sortBy === 'price-low') params.set('sort', 'price_asc');
        else if (sortBy === 'price-high') params.set('sort', 'price_desc');
        params.set('page', String(pageNum));
        params.set('limit', '12');

        const res = await fetchApi(`/courses?${params.toString()}`);
        setCourses(res.data || []);
        setTotal(res.total ?? res.data?.length ?? 0);
        setTotalPages(res.totalPages ?? (Math.ceil((res.total ?? 0) / 12) || 1));
      } catch (err: any) {
        toast.error(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    },
    [selectedCategories, minRating, priceFilter, selectedLevels, selectedLanguages, sortBy]
  );

  // Search on filter/sort/page change
  useEffect(() => {
    fetchCourses(query, page);
  }, [selectedCategories, minRating, priceFilter, selectedLevels, selectedLanguages, sortBy, page]);

  // Debounced search on query change
  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      setSearchParams(val ? { q: val } : {});
      fetchCourses(val, 1);
    }, 300);
  };

  const toggleArrayItem = (arr: string[], item: string): string[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const activeFilterCount =
    selectedCategories.length +
    (minRating ? 1 : 0) +
    (priceFilter !== 'all' ? 1 : 0) +
    selectedLevels.length +
    selectedLanguages.length;

  return (
    <div className="min-h-screen bg-[#FAFAF5]">
      {/* Search bar */}
      <div className="bg-white border-b border-[#2E7D32]/10 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5A6E5A]" />
            <input
              type="search"
              placeholder="Search farming courses..."
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-[#2E7D32]/20 bg-[#FAFAF5] text-[#1B2B1B] text-base placeholder:text-[#5A6E5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-8">
          {/* Filter Sidebar — Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FilterPanel
              categories={categories}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              minRating={minRating}
              setMinRating={setMinRating}
              priceFilter={priceFilter}
              setPriceFilter={setPriceFilter}
              selectedLevels={selectedLevels}
              setSelectedLevels={setSelectedLevels}
              selectedLanguages={selectedLanguages}
              setSelectedLanguages={setSelectedLanguages}
              toggleArrayItem={toggleArrayItem}
            />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                {/* Mobile filter toggle */}
                <button
                  onClick={() => setFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#2E7D32]/20 text-sm text-[#1B2B1B] hover:bg-[#2E7D32]/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="bg-[#2E7D32] text-white text-xs px-1.5 py-0.5 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                {!loading && (
                  <p className="text-sm text-[#5A6E5A]">
                    {total} result{total !== 1 ? 's' : ''}
                    {query ? ` for '${query}'` : ''}
                  </p>
                )}
              </div>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as SortOption);
                  setPage(1);
                }}
                className="px-3 py-2 rounded-lg border border-[#2E7D32]/20 text-sm text-[#1B2B1B] bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Results */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : courses.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <Link
                      key={course.id}
                      to={`/course/${course.slug}`}
                      className="bg-white rounded-xl border border-[#2E7D32]/10 overflow-hidden group hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32] focus-visible:ring-offset-2"
                    >
                      {course.thumbnailPublicId ? (
                        <img
                          src={cloudinaryImageUrl(course.thumbnailPublicId, 400, 225)}
                          alt={course.title}
                          className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-video bg-gradient-to-br from-[#2E7D32]/20 to-[#4CAF50]/10 flex items-center justify-center">
                          <Sprout size={40} className="text-[#2E7D32]/30" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-[#1B2B1B] line-clamp-2 leading-snug text-sm group-hover:text-[#2E7D32] transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-[#5A6E5A] mt-1 truncate">
                          {course.instructor?.profile?.displayName}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-sm font-medium text-[#1B2B1B]">
                            {course.averageRating
                              ? Number(course.averageRating).toFixed(1)
                              : 'New'}
                          </span>
                          {course.averageRating ? (
                            <StarRating rating={course.averageRating} />
                          ) : null}
                          <span className="text-xs text-[#5A6E5A]">
                            ({course._count?.enrollments?.toLocaleString() ?? 0})
                          </span>
                        </div>
                        <p className="text-base font-bold text-[#1B2B1B] mt-2">
                          {formatUGX(course.price)}
                        </p>
                        {course.level && (
                          <span className="inline-block mt-2 text-xs text-[#5A6E5A] bg-[#FAFAF5] px-2 py-0.5 rounded">
                            {course.level}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-2 rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#2E7D32]/5 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-[#5A6E5A] px-3">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-2 rounded-lg border border-[#2E7D32]/20 text-[#1B2B1B] hover:bg-[#2E7D32]/5 disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-[#2E7D32]/10">
                <Sprout className="h-12 w-12 text-[#5A6E5A]/40 mx-auto mb-4" />
                <p className="text-lg text-[#1B2B1B] font-medium">No results found</p>
                <p className="text-sm text-[#5A6E5A] max-w-md mx-auto mt-1">
                  Try different keywords or adjust your filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-[#1B2B1B]">Filters</h2>
              <button
                onClick={() => setFiltersOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2E7D32]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel
                categories={categories}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                minRating={minRating}
                setMinRating={setMinRating}
                priceFilter={priceFilter}
                setPriceFilter={setPriceFilter}
                selectedLevels={selectedLevels}
                setSelectedLevels={setSelectedLevels}
                selectedLanguages={selectedLanguages}
                setSelectedLanguages={setSelectedLanguages}
                toggleArrayItem={toggleArrayItem}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FilterPanelProps {
  categories: Category[];
  selectedCategories: string[];
  setSelectedCategories: React.Dispatch<React.SetStateAction<string[]>>;
  minRating: string;
  setMinRating: React.Dispatch<React.SetStateAction<string>>;
  priceFilter: string;
  setPriceFilter: React.Dispatch<React.SetStateAction<string>>;
  selectedLevels: string[];
  setSelectedLevels: React.Dispatch<React.SetStateAction<string[]>>;
  selectedLanguages: string[];
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  toggleArrayItem: (arr: string[], item: string) => string[];
}

function FilterPanel({
  categories,
  selectedCategories,
  setSelectedCategories,
  minRating,
  setMinRating,
  priceFilter,
  setPriceFilter,
  selectedLevels,
  setSelectedLevels,
  selectedLanguages,
  setSelectedLanguages,
  toggleArrayItem,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-[#1B2B1B] mb-3">Category</h3>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex items-center gap-2 cursor-pointer text-sm text-[#1B2B1B]"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat.id)}
                onChange={() =>
                  setSelectedCategories((prev) => toggleArrayItem(prev, cat.id))
                }
                className="h-4 w-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              {cat.name}
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-semibold text-[#1B2B1B] mb-3">Rating</h3>
        <div className="space-y-2">
          {RATING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer text-sm text-[#1B2B1B]"
            >
              <input
                type="radio"
                name="rating"
                checked={minRating === opt.value}
                onChange={() => setMinRating(opt.value)}
                className="h-4 w-4 border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              <div className="flex items-center gap-1">
                <StarRating rating={parseFloat(opt.value)} />
                <span>{opt.label}</span>
              </div>
            </label>
          ))}
          {minRating && (
            <button
              onClick={() => setMinRating('')}
              className="text-xs text-[#2E7D32] hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Price */}
      <div>
        <h3 className="text-sm font-semibold text-[#1B2B1B] mb-3">Price</h3>
        <div className="space-y-2">
          {PRICE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 cursor-pointer text-sm text-[#1B2B1B]"
            >
              <input
                type="radio"
                name="price"
                checked={priceFilter === opt.value}
                onChange={() => setPriceFilter(opt.value)}
                className="h-4 w-4 border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <h3 className="text-sm font-semibold text-[#1B2B1B] mb-3">Level</h3>
        <div className="space-y-2">
          {LEVEL_OPTIONS.map((level) => (
            <label
              key={level}
              className="flex items-center gap-2 cursor-pointer text-sm text-[#1B2B1B]"
            >
              <input
                type="checkbox"
                checked={selectedLevels.includes(level)}
                onChange={() =>
                  setSelectedLevels((prev) => toggleArrayItem(prev, level))
                }
                className="h-4 w-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              {level}
            </label>
          ))}
        </div>
      </div>

      {/* Language */}
      <div>
        <h3 className="text-sm font-semibold text-[#1B2B1B] mb-3">Language</h3>
        <div className="space-y-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <label
              key={lang}
              className="flex items-center gap-2 cursor-pointer text-sm text-[#1B2B1B]"
            >
              <input
                type="checkbox"
                checked={selectedLanguages.includes(lang)}
                onChange={() =>
                  setSelectedLanguages((prev) => toggleArrayItem(prev, lang))
                }
                className="h-4 w-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]"
              />
              {lang}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
