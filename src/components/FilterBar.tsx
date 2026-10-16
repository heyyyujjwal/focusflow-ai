import type { FilterType } from '../types';

interface FilterBarProps {
  filter: FilterType;
  setFilter: (f: FilterType) => void;
  search: string;
  setSearch: (s: string) => void;
  counts: { all: number; active: number; completed: number };
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
];

export default function FilterBar({ filter, setFilter, search, setSearch, counts }: FilterBarProps) {
  return (
    <div className="filter-bar">
      <div className="filter-tabs" role="tablist" aria-label="Task filters">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            role="tab"
            aria-selected={filter === key}
            className={`filter-tab ${filter === key ? 'filter-tab--active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className="filter-tab__count">{counts[key]}</span>
          </button>
        ))}
      </div>

      <div className="search-wrapper">
        <span className="search-icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          type="search"
          className="search-input"
          placeholder="Search tasks…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search tasks by title"
        />
        {search && (
          <button
            className="search-clear"
            onClick={() => setSearch('')}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
