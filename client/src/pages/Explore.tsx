import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import GuideCard from '../components/GuideCard';

const Explore: React.FC = () => {
  const [guides, setGuides] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [themeFilter, setThemeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const regions = ['亞洲', '歐洲', '北美'];
  const themes = ['美食', '購物', '文化', '浪漫', '藝術', '建築', '海灘', '放鬆', '大自然'];

  useEffect(() => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    let url = `${apiUrl}/guides?`;
    if (searchQuery) url += `q=${encodeURIComponent(searchQuery)}&`;
    if (regionFilter) url += `region=${regionFilter}&`;
    if (themeFilter) url += `theme=${themeFilter}&`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setGuides(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [searchQuery, regionFilter, themeFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setRegionFilter('');
    setThemeFilter('');
  };

  return (
    <div className="explore-page section-padding">
      <div className="container">
        <h1 className="page-title">探索旅遊攻略</h1>
        
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input 
              type="text" 
              placeholder="搜尋攻略標題或作者..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">地區:</span>
            <div className="filter-options">
              {regions.map(r => (
                <button 
                  key={r} 
                  className={`filter-opt ${regionFilter === r ? 'active' : ''}`}
                  onClick={() => setRegionFilter(regionFilter === r ? '' : r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="filter-group">
            <span className="filter-label">主題:</span>
            <div className="filter-options">
              {themes.map(t => (
                <button 
                  key={t} 
                  className={`filter-opt ${themeFilter === t ? 'active' : ''}`}
                  onClick={() => setThemeFilter(themeFilter === t ? '' : t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          {(searchQuery || regionFilter || themeFilter) && (
            <button className="clear-btn" onClick={clearFilters}>
              清除所有篩選 <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="loading">載入中...</div>
        ) : guides.length > 0 ? (
          <div className="guide-grid">
            {guides.map(guide => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <Search size={48} />
            <p>找不到符合條件的攻略，換個關鍵字或標籤試試看吧！</p>
          </div>
        )}
      </div>

      <style>{`
        .page-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 40px;
        }
        .search-container {
          margin-bottom: 32px;
          max-width: 600px;
        }
        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-secondary);
        }
        .search-input {
          width: 100%;
          padding: 14px 48px;
          border-radius: 30px;
          border: 2px solid var(--border);
          font-size: 16px;
          transition: var(--transition);
          outline: none;
        }
        .search-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(var(--primary-rgb), 0.1);
        }
        .clear-search {
          position: absolute;
          right: 16px;
          color: var(--text-secondary);
          background: none;
          border: none;
          cursor: pointer;
        }
        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 32px;
          margin-bottom: 48px;
          padding: 24px;
          background: var(--surface);
          border-radius: var(--radius);
          align-items: center;
        }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .filter-label {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .filter-options {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .filter-opt {
          padding: 6px 16px;
          border-radius: 20px;
          background: white;
          border: 1px solid var(--border);
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition);
        }
        .filter-opt:hover {
          border-color: var(--primary);
        }
        .filter-opt.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .clear-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          color: var(--text-secondary);
          font-weight: 600;
        }
        .loading, .no-results {
          text-align: center;
          padding: 100px 0;
          color: var(--text-secondary);
        }
        .no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .filter-bar { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
};

export default Explore;
