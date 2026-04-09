interface MyLearningHeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { key: 'all', label: 'All courses' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'wishlist', label: 'Wishlist' },
  { key: 'certifications', label: 'Certifications' },
  { key: 'archived', label: 'Archived' },
];

export function MyLearningHeader({ activeTab, onTabChange }: MyLearningHeaderProps) {
  return (
    <div className="bg-surface-dark w-full px-6 md:px-10 py-8">
      <div className="max-w-[1340px] mx-auto">
        <h1 className="text-3xl font-bold text-white">My learning</h1>

        <div className="flex items-center gap-0 mt-6 border-b border-white/10 overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap
                ${activeTab === tab.key
                  ? 'text-white border-b-2 border-white -mb-px'
                  : 'text-white/55 hover:text-white/80'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
