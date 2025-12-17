import { useState, useEffect } from 'react';
import { Filters } from './components/Filters';
import { TenderList } from './components/TenderList';
import { TenderDetail } from './components/TenderDetail';
import { type TenderFilters } from './services/api';
import { useStore } from './store';
import { useThemeStore } from './store/themeStore';
import { useTenders, useSavedTenders } from './hooks/useTenders';

function App() {
  const [selectedTenderId, setSelectedTenderId] = useState<string | undefined>(undefined);
  const [filters, setFilters] = useState<TenderFilters>({});
  const [activeTab, setActiveTab] = useState<'search' | 'saved'>('search');

  const { hiddenTenders, savedTenders, addReadTender } = useStore();
  const { theme, toggleTheme } = useThemeStore();

  // Search Query
  const {
    data: searchData,
    isLoading: searchLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useTenders(filters);

  // Saved Query
  const {
    data: savedData,
    isLoading: savedLoading
  } = useSavedTenders(Array.from(savedTenders));

  useEffect(() => {
    console.log('Theme effect triggered. Current theme:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('Added "dark" class to html. ClassList:', document.documentElement.classList.toString());
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed "dark" class from html. ClassList:', document.documentElement.classList.toString());
    }
  }, [theme]);

  const handleLoadMore = () => {
    fetchNextPage();
  };

  const handleFilterChange = (newFilters: TenderFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setActiveTab('search'); // Switch back to search when filtering
  };

  const handleSortChange = (newSort: string) => {
    setFilters(prev => ({ ...prev, sort: newSort }));
  };

  const handleSelectTender = (id: string) => {
    setSelectedTenderId(id);
    addReadTender(id);
  };

  // Flatten search results
  const searchTenders = searchData?.pages.flatMap(page => page.results) || [];
  const savedTendersList = savedData || [];

  const currentTenders = activeTab === 'search' ? searchTenders : savedTendersList;
  const loading = activeTab === 'search' ? searchLoading || isFetchingNextPage : savedLoading;

  // Filter out hidden tenders
  const visibleTenders = currentTenders.filter(t => !hiddenTenders.has(t.idweb || t.id));

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#121212] text-black dark:text-white font-sans overflow-hidden selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-300">
      {/* Noise overlay for texture */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] dark:opacity-[0.05] mix-blend-multiply dark:mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      <Filters filters={filters} onFilterChange={handleFilterChange} theme={theme} onToggleTheme={toggleTheme} />

      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 flex flex-col h-full relative">
          {/* Tab Switcher */}
          <div className="flex items-center gap-4 px-8 py-4 border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#121212]">
            <button
              onClick={() => setActiveTab('search')}
              className={`text-sm font-medium transition-colors ${activeTab === 'search' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              Recherche
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`text-sm font-medium transition-colors ${activeTab === 'saved' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              Enregistrés ({savedTenders.size})
            </button>
          </div>

          <TenderList
            tenders={visibleTenders}
            loading={loading}
            onSelectTender={handleSelectTender}
            selectedTenderId={selectedTenderId}
            onLoadMore={activeTab === 'search' && hasNextPage ? handleLoadMore : undefined}
            sort={filters.sort}
            onSortChange={handleSortChange}
          />

          {selectedTenderId && (
            <TenderDetail
              tender={visibleTenders.find(t => (t.idweb || t.id) === selectedTenderId) || null}
              onClose={() => setSelectedTenderId(undefined)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App

