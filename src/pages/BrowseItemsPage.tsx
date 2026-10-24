import React, { useState, useMemo } from 'react';
import { 
  Search, 
  PlusCircle, 
  Compass,
  X
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ItemCard } from '../components/items/ItemCard';
import { CATEGORY_LABELS } from '../types/database';
import type { ItemReport } from '../types/database';

interface BrowseItemsPageProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenReportLost: () => void;
  onOpenReportFound: () => void;
}

export const BrowseItemsPage: React.FC<BrowseItemsPageProps> = ({
  onNavigate,
  onOpenReportLost,
  onOpenReportFound,
}) => {
  const { reports } = useData();

  // Filters state
  const [selectedTab, setSelectedTab] = useState<'all' | 'lost' | 'found'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Extract distinct locations for filter dropdown
  const uniqueLocations = useMemo(() => {
    const locs = reports.map(r => r.location.split(',')[0].trim());
    return ['all', ...new Set(locs)];
  }, [reports]);

  // Filtering and sorting logic
  const filteredReports = useMemo(() => {
    return reports.filter(item => {
      // Tab filter
      if (selectedTab !== 'all' && item.report_type !== selectedTab) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Location filter
      if (selectedLocation !== 'all' && !item.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
        return false;
      }

      // Date filter
      if (dateFilter !== 'all') {
        const itemDate = new Date(item.occurred_at).getTime();
        const now = Date.now();
        const diffHours = (now - itemDate) / (1000 * 60 * 60);

        if (dateFilter === '24h' && diffHours > 24) return false;
        if (dateFilter === '7d' && diffHours > 24 * 7) return false;
        if (dateFilter === '30d' && diffHours > 24 * 30) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchRef = item.reference_code.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchRef && !matchLoc) return false;
      }

      return true;
    }).sort((a, b) => {
      const timeA = new Date(a.occurred_at).getTime();
      const timeB = new Date(b.occurred_at).getTime();
      return sortBy === 'newest' ? timeB - timeA : timeA - timeB;
    });
  }, [reports, selectedTab, selectedCategory, selectedLocation, dateFilter, searchQuery, sortBy]);

  const clearFilters = () => {
    setSelectedTab('all');
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setDateFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Browse Campus Belongings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search verified lost and found listings across university faculties, libraries, and hostels.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenReportLost}
            className="btn-primary text-xs px-4 py-2"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Lost</span>
          </button>
          <button
            onClick={onOpenReportFound}
            className="btn-teal text-xs px-4 py-2"
          >
            <span>Report Found</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Tabs + Search */}
      <div className="space-y-4">
        
        {/* Type Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'lost', label: 'Lost Items' },
              { id: 'found', label: 'Found Items' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedTab === tab.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Showing <strong className="text-slate-700">{filteredReports.length}</strong> items
          </span>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by keywords, wallet, keys, ref code..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
          </div>

          {/* Location Dropdown */}
          <div>
            <select
              value={selectedLocation}
              onChange={e => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Campus Locations</option>
              {uniqueLocations.filter(l => l !== 'all').map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
            </select>
          </div>

        </div>

      </div>

      {/* Items Grid */}
      {filteredReports.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No items found matching your filters</h3>
          <p className="text-xs text-slate-500">
            Try adjusting your search terms, campus zone, or clearing selected filters.
          </p>
          <button
            onClick={clearFilters}
            className="btn-secondary text-xs px-4 py-2 mt-2"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredReports.map(report => (
            <ItemCard
              key={report.id}
              report={report}
              onSelect={(r: ItemReport) => onNavigate('item-detail', { reportId: r.id })}
            />
          ))}
        </div>
      )}

    </div>
  );
};
