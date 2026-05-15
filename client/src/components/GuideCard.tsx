import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

interface GuideCardProps {
  guide: {
    id: string;
    title: string;
    destination: {
      name: string;
      image: string;
      region: string;
    };
    rating: number;
    budget: string;
  };
}

const GuideCard: React.FC<GuideCardProps> = ({ guide }) => {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(guide.id);

  return (
    <div className="guide-card">
      <Link to={`/guide/${guide.id}`} className="card-image-link">
        <div className="card-image-wrapper">
          <img src={guide.destination.image} alt={guide.destination.name} className="card-image" />
          <div className="card-badge">{guide.destination.region}</div>
        </div>
      </Link>
      <div className="card-content">
        <div className="card-header">
          <Link to={`/guide/${guide.id}`}>
            <h3 className="card-title">{guide.title}</h3>
          </Link>
          <button 
            className={`favorite-btn ${favorite ? 'active' : ''}`}
            onClick={() => toggleFavorite(guide.id)}
          >
            <Heart size={20} fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="card-dest">{guide.destination.name}</p>
        <div className="card-footer">
          <div className="card-rating">
            <Star size={16} fill="#FFB800" color="#FFB800" />
            <span>{guide.rating}</span>
          </div>
          <span className="card-budget">預算: {guide.budget}</span>
        </div>
      </div>
      <style>{`
        .guide-card {
          background: white;
          border-radius: var(--radius);
          overflow: hidden;
          box-shadow: var(--shadow);
          transition: var(--transition);
          border: 1px solid var(--border);
        }
        .guide-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .card-image-wrapper {
          position: relative;
          aspect-ratio: 16/10;
          overflow: hidden;
        }
        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: var(--transition);
        }
        .guide-card:hover .card-image {
          transform: scale(1.05);
        }
        .card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(255, 255, 255, 0.9);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .card-content {
          padding: 16px;
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
          margin-bottom: 4px;
        }
        .card-title {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.4;
          color: var(--text-main);
        }
        .card-dest {
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 12px;
        }
        .favorite-btn {
          color: var(--text-secondary);
          transition: var(--transition);
        }
        .favorite-btn.active {
          color: #ff4d4f;
        }
        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
        }
        .card-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }
        .card-budget {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default GuideCard;
