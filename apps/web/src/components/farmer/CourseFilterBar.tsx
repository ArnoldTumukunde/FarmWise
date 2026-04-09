import { useState, useEffect, useRef } from 'react';
import { Search, X, LayoutGrid, List, ChevronDown } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CourseFilterBarProps {
  categories: Category[];
  filteredCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategories: string[];
  onCategoriesChange: (ids: string[]) => void;
  progressFilter: string;
  onProgressChange: (val: string) => void;
  sortBy: string;
  onSortChange: (val: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
}

const sortOptions = [
  { value: 'recent', label: 'Recently accessed' },
  { value: 'title-az', label: 'Title: A-Z' },
  { value: 'title-za', label: 'Title: Z-A' },
  { value: 'newest', label: 'Newest enrolled' },
  { value: 'oldest', label: 'Oldest enrolled' },
];

const progressOptions = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'not_started', label: 'Not started' },
  { value: 'completed', label: 'Completed' },
];

function DropdownPanel({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div ref={ref} className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2 min-w-[220px]">
      {children}
    </div>
  );
}

export function CourseFilterBar({
  categories, filteredCount, searchQuery, onSearchChange,
  selectedCategories, onCategoriesChange,
  progressFilter, onProgressChange,
  sortBy, onSortChange,
  viewMode, onViewModeChange,
}: CourseFilterBarProps) {
  const [catOpen, setCatOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [tempCats, setTempCats] = useState<string[]>(selectedCategories);

  useEffect(() => { setTempCats(selectedCategories); }, [selectedCategories]);

  const toggleCat = (id: string) => {
    setTempCats(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const applyCats = () => {
    onCategoriesChange(tempCats);
    setCatOpen(false);
  };

  const clearCats = () => {
    setTempCats([]);
    onCategoriesChange([]);
    setCatOpen(false);
  };

  const currentSort = sortOptions.find(o => o.value === sortBy) || sortOptions[0];
  const currentProgress = progressOptions.find(o => o.value === progressFilter);

  return (
    <div className="px-4 md:px-6 lg:px-10 py-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Left group — dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Categories */}
          <div className="relative">
            <button
              onClick={() => { setCatOpen(!catOpen); setProgressOpen(false); setSortOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors hover:bg-gray-50
                ${selectedCategories.length > 0 ? 'text-primary font-semibold border-primary' : 'text-text-base'}`}
            >
              Categories{selectedCategories.length > 0 ? ` (${selectedCategories.length})` : ''}
              <ChevronDown size={14} />
            </button>
            <DropdownPanel open={catOpen} onClose={() => setCatOpen(false)}>
              <div className="max-h-60 overflow-y-auto px-3 py-1">
                {categories.map(cat => (
                  <label key={cat.id} className="flex items-center gap-2 py-1.5 cursor-pointer text-sm text-text-base hover:text-primary">
                    <input
                      type="checkbox"
                      checked={tempCats.includes(cat.id)}
                      onChange={() => toggleCat(cat.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
              <div className="flex items-center justify-between px-3 pt-2 border-t border-gray-100 mt-1">
                <button onClick={clearCats} className="text-xs text-text-muted hover:text-text-base">Clear</button>
                <button onClick={applyCats} className="text-xs font-semibold text-primary hover:underline">Apply</button>
              </div>
            </DropdownPanel>
          </div>

          {/* Progress */}
          <div className="relative">
            <button
              onClick={() => { setProgressOpen(!progressOpen); setCatOpen(false); setSortOpen(false); }}
              className={`flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm transition-colors hover:bg-gray-50
                ${progressFilter !== 'all' ? 'text-primary font-semibold border-primary' : 'text-text-base'}`}
            >
              {progressFilter !== 'all' ? `Progress: ${currentProgress?.label}` : 'Progress'}
              <ChevronDown size={14} />
            </button>
            <DropdownPanel open={progressOpen} onClose={() => setProgressOpen(false)}>
              {progressOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onProgressChange(opt.value); setProgressOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2
                    ${progressFilter === opt.value ? 'text-primary font-semibold' : 'text-text-base'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${progressFilter === opt.value ? 'border-primary' : 'border-gray-300'}`}>
                    {progressFilter === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </DropdownPanel>
          </div>

          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => { setSortOpen(!sortOpen); setCatOpen(false); setProgressOpen(false); }}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-sm text-text-base transition-colors hover:bg-gray-50"
            >
              Sort by: {currentSort.label}
              <ChevronDown size={14} />
            </button>
            <DropdownPanel open={sortOpen} onClose={() => setSortOpen(false)}>
              {sortOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onSortChange(opt.value); setSortOpen(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2
                    ${sortBy === opt.value ? 'text-primary font-semibold' : 'text-text-base'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                    ${sortBy === opt.value ? 'border-primary' : 'border-gray-300'}`}>
                    {sortBy === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </span>
                  {opt.label}
                </button>
              ))}
            </DropdownPanel>
          </div>
        </div>

        {/* Right group — search + view toggle */}
        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search my courses"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg w-64
                focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
                placeholder:text-text-muted"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-base"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => onViewModeChange('grid')}
              className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-text-base text-white' : 'text-text-muted hover:bg-gray-50'}`}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => onViewModeChange('list')}
              className={`p-2 transition-colors border-l border-gray-300 ${viewMode === 'list' ? 'bg-text-base text-white' : 'text-text-muted hover:bg-gray-50'}`}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Course count */}
      <p className="text-sm font-medium text-text-base mt-3">
        {filteredCount} course{filteredCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
