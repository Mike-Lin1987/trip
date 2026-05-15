import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, DollarSign, Car, Star, Heart, MapPin } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';

const GuideDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/guides/${id}`)
      .then(res => res.json())
      .then(data => {
        setGuide(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="loading">載入中...</div>;
  if (!guide) return <div className="no-results">找不到該攻略。</div>;

  const favorite = isFavorite(guide.id);

  return (
    <div className="guide-details">
      {/* Header Image */}
      <div className="detail-hero">
        <img src={guide.destination.image} alt={guide.destination.name} className="hero-img" />
        <div className="hero-overlay">
          <div className="container hero-container">
            <button className="back-btn" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} /> 返回
            </button>
            <div className="hero-text-content">
              <h1 className="detail-title">{guide.title}</h1>
              <div className="detail-meta">
                <div className="meta-badge"><Star size={16} fill="#FFB800" color="#FFB800" /> {guide.rating}</div>
                <div className="meta-badge"><Clock size={16} /> {guide.itinerary.length} 天</div>
                <div className="meta-badge"><DollarSign size={16} /> {guide.budget}預算</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container detail-content">
        <div className="content-grid">
          {/* Main Column */}
          <div className="main-col">
            <div className="section-header-block">
              <h2 className="section-subtitle">行程規劃內容</h2>
              <div className="author-tag">作者：{guide.author}</div>
            </div>
            
            <div className="itinerary-list">
              {guide.itinerary.map((day: any) => (
                <Link key={day.day} to={`/guide/${guide.id}/day/${day.day}`} className="day-card-link">
                  <div className="day-card">
                    <div className="day-header">
                      <div className="day-number">Day {day.day}</div>
                      <h3 className="day-title">{day.title || '當日行程'}</h3>
                      <ArrowRight size={20} className="card-arrow" />
                    </div>
                    <div className="day-body">
                      <p className="day-preview-desc">{day.description}</p>
                      <div className="activity-count">包含 {day.activities.length} 項行程項目</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="sidebar">
            <div className="sidebar-sticky">
              <div className="sidebar-card info-card">
                <h3 className="sidebar-title">基本交通資訊</h3>
                <div className="sidebar-info">
                  <div className="info-item">
                    <div className="info-icon"><Car size={20} /></div>
                    <div>
                      <strong>交通方式</strong>
                      <p>{guide.transportation}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon"><MapPin size={20} /></div>
                    <div>
                      <strong>主要目的地</strong>
                      <p>{guide.destination.name}</p>
                    </div>
                  </div>
                </div>
                <button 
                  className={`action-btn favorite ${favorite ? 'active' : ''}`}
                  onClick={() => toggleFavorite(guide.id)}
                >
                  <Heart size={20} fill={favorite ? "currentColor" : "none"} />
                  {favorite ? '已加入我的最愛' : '加入我的最愛'}
                </button>
              </div>

              <div className="sidebar-card tips-card">
                <h3 className="sidebar-title">旅行小叮嚀</h3>
                <ul className="tips-list">
                  <li>建議提前預約熱門餐廳與車票。</li>
                  <li>冬日北陸地區氣溫較低，請注意保暖。</li>
                  <li>準備好 ICOCA 或 Suica 卡方便市區移動。</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .guide-details {
          background-color: #f8f9fa;
          min-height: 100vh;
        }
        .detail-hero {
          height: 50vh;
          position: relative;
          color: white;
          overflow: hidden;
        }
        .hero-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transform: scale(1.05);
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: 40px;
        }
        .hero-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .back-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          font-weight: 500;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(4px);
          padding: 8px 16px;
          border-radius: 20px;
          align-self: flex-start;
          transition: var(--transition);
        }
        .back-btn:hover {
          background: rgba(255,255,255,0.3);
        }
        .hero-text-content {
          max-width: 800px;
        }
        .detail-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin-bottom: 20px;
          line-height: 1.1;
          text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        .detail-meta {
          display: flex;
          gap: 12px;
        }
        .meta-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          padding: 6px 16px;
          border-radius: 30px;
          font-size: 14px;
        }
        .detail-content {
          padding-top: 50px;
          padding-bottom: 100px;
        }
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 40px;
        }
        .section-header-block {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e9ecef;
        }
        .section-subtitle {
          font-size: 1.75rem;
          font-weight: 700;
          color: #2d3436;
        }
        .author-tag {
          font-weight: 600;
          color: var(--text-secondary);
          background: #f1f3f5;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 14px;
        }
        .itinerary-list {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .day-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          transition: transform 0.2s;
        }
        .day-card-link:hover {
          transform: translateY(-4px);
        }
        .day-card-link:hover .day-card {
          border-color: var(--primary);
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .card-arrow {
          margin-left: auto;
          color: var(--border);
          transition: var(--transition);
        }
        .day-card-link:hover .card-arrow {
          color: var(--primary);
          transform: translateX(5px);
        }
        .day-preview-desc {
          color: var(--text-secondary);
          margin-bottom: 16px;
          font-size: 15px;
          line-height: 1.5;
        }
        .activity-count {
          font-size: 13px;
          font-weight: 700;
          color: var(--primary);
          background: #f0f7ff;
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
        }
        .day-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          overflow: hidden;
          border: 1px solid #edf2f7;
          transition: var(--transition);
        }
        .day-header {
          background: #f8fafc;
          padding: 20px 30px;
          border-bottom: 1px solid #edf2f7;
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .day-number {
          background: var(--primary);
          color: white;
          padding: 4px 12px;
          border-radius: 6px;
          font-weight: 800;
          font-size: 14px;
          letter-spacing: 0.5px;
        }
        .day-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a202c;
        }
        .day-body {
          padding: 30px;
        }
        .block-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .activity-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          font-weight: 500;
          color: #4a5568;
          line-height: 1.5;
          border-left: 4px solid transparent;
          transition: var(--transition);
        }
        .activity-item:hover {
          background: #f1f5f9;
          border-left-color: var(--primary);
        }
        .activity-dot {
          width: 8px;
          height: 8px;
          background: #cbd5e1;
          border-radius: 50%;
          margin-top: 7px;
          flex-shrink: 0;
        }
        .sidebar-sticky {
          position: sticky;
          top: 40px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sidebar-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          border: 1px solid #edf2f7;
        }
        .sidebar-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 20px;
          color: #1a202c;
          padding-bottom: 12px;
          border-bottom: 1px solid #edf2f7;
        }
        .sidebar-info {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 24px;
        }
        .info-item {
          display: flex;
          gap: 16px;
        }
        .info-icon {
          width: 40px;
          height: 40px;
          background: #f1f5f9;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
          flex-shrink: 0;
        }
        .info-item strong {
          display: block;
          font-size: 14px;
          color: #718096;
          margin-bottom: 4px;
        }
        .info-item p {
          font-size: 15px;
          color: #2d3436;
          font-weight: 600;
          line-height: 1.4;
        }
        .tips-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .tips-list li {
          font-size: 14px;
          color: #4a5568;
          padding-left: 14px;
          position: relative;
        }
        .tips-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: var(--accent);
          font-weight: bold;
        }
        .action-btn {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: var(--transition);
        }
        .action-btn.favorite {
          background: #f1f5f9;
          color: #4a5568;
          border: 1px solid #e2e8f0;
        }
        .action-btn.favorite.active {
          background: #fff5f5;
          border-color: #feb2b2;
          color: #e53e3e;
        }
        @media (max-width: 992px) {
          .content-grid { grid-template-columns: 1fr; }
          .detail-title { font-size: 2.5rem; }
          .detail-hero { height: 40vh; }
        }
      `}</style>
    </div>
  );
};

export default GuideDetails;
