import React, { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import GuideCard from '../components/GuideCard';
import { useFavorites } from '../context/FavoritesContext';

const Favorites: React.FC = () => {
  const [favoriteGuides, setFavoriteGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { favorites } = useFavorites();

  useEffect(() => {
    setLoading(true);
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/favorites`)
      .then(res => res.json())
      .then(data => {
        setFavoriteGuides(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [favorites]);

  return (
    <div className="favorites-page section-padding">
      <div className="container">
        <h1 className="page-title">我的最愛攻略</h1>
        
        {loading ? (
          <div className="loading">載入中...</div>
        ) : favoriteGuides.length > 0 ? (
          <div className="guide-grid">
            {favoriteGuides.map(guide => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        ) : (
          <div className="no-results">
            <Heart size={48} color="#d2d2d7" />
            <p>您還沒有收藏任何攻略喔！快去探索吧。</p>
          </div>
        )}
      </div>

      <style>{`
        .page-title {
          font-size: 2.5rem;
          font-weight: 800;
          margin-bottom: 48px;
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
      `}</style>
    </div>
  );
};

export default Favorites;
