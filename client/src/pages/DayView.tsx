import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, MapPin, Clock, ExternalLink } from 'lucide-react';

const DayView: React.FC = () => {
  const { id, dayId } = useParams<{ id: string; dayId: string }>();
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  if (!guide) return <div className="no-results">找不到行程資料。</div>;

  const currentDayIndex = parseInt(dayId || '1') - 1;
  const dayData = guide.itinerary[currentDayIndex];
  const totalDays = guide.itinerary.length;

  if (!dayData) return <div className="no-results">找不到第 {dayId} 天的行程。</div>;

  const getGoogleMapsLink = (location: string) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  return (
    <div className="day-view">
      {/* Top Navigation */}
      <div className="day-nav-top">
        <div className="container">
          <div className="nav-header">
            <Link to={`/guide/${id}`} className="back-link">
              <ArrowLeft size={20} /> 返回總覽
            </Link>
            <div className="day-selector">
              {guide.itinerary.map((d: any) => (
                <Link 
                  key={d.day} 
                  to={`/guide/${id}/day/${d.day}`}
                  className={`day-dot ${parseInt(dayId || '1') === d.day ? 'active' : ''}`}
                  title={`第 ${d.day} 天`}
                >
                  {d.day}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container content-container">
        {/* Day Header */}
        <div className="day-title-section">
          <div className="day-badge">Day {dayId}</div>
          <h1 className="day-main-title">{dayData.title}</h1>
          <p className="day-description">{dayData.description}</p>
        </div>

        {/* Activities Timeline */}
        <div className="activities-timeline">
          {dayData.activities.map((activity: any, index: number) => (
            <div key={index} className="timeline-card">
              <div className="card-time">
                <Clock size={16} /> {activity.time}
              </div>
              <div className="card-content">
                <div className="activity-text">{activity.text}</div>
                {activity.location && (
                  <a 
                    href={getGoogleMapsLink(activity.location)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="map-link"
                  >
                    <MapPin size={14} /> {activity.location}
                    <ExternalLink size={12} className="external-icon" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="day-nav-bottom">
          {currentDayIndex > 0 ? (
            <Link to={`/guide/${id}/day/${guide.itinerary[currentDayIndex - 1].day}`} className="nav-btn prev">
              <ArrowLeft size={20} /> 前一天
            </Link>
          ) : <div />}
          
          {currentDayIndex < totalDays - 1 ? (
            <Link to={`/guide/${id}/day/${guide.itinerary[currentDayIndex + 1].day}`} className="nav-btn next">
              下一天 <ArrowRight size={20} />
            </Link>
          ) : (
            <Link to="/" className="nav-btn home">
              回首頁
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .day-view {
          padding-top: 80px;
          min-height: 100vh;
          background-color: #f8fafc;
        }
        .day-nav-top {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          background: white;
          border-bottom: 1px solid #edf2f7;
          z-index: 90;
          padding: 12px 0;
        }
        .nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .back-link {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .day-selector {
          display: flex;
          gap: 8px;
        }
        .day-dot {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #f1f5f9;
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          transition: all 0.2s;
        }
        .day-dot.active {
          background: var(--primary);
          color: white;
        }
        .content-container {
          padding-top: 60px;
          padding-bottom: 120px;
          max-width: 800px;
        }
        .day-title-section {
          margin-bottom: 48px;
          text-align: center;
        }
        .day-badge {
          display: inline-block;
          background: var(--primary);
          color: white;
          padding: 4px 16px;
          border-radius: 20px;
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 16px;
        }
        .day-main-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: #1a202c;
          margin-bottom: 12px;
        }
        .day-description {
          font-size: 1.1rem;
          color: #64748b;
          max-width: 600px;
          margin: 0 auto;
        }
        .activities-timeline {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .timeline-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          display: flex;
          gap: 24px;
          border: 1px solid #edf2f7;
          transition: transform 0.2s;
        }
        .timeline-card:hover {
          transform: translateX(5px);
        }
        .card-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
          color: var(--primary);
          font-size: 15px;
          white-space: nowrap;
          min-width: 80px;
        }
        .activity-text {
          font-size: 1.1rem;
          font-weight: 600;
          color: #2d3436;
          margin-bottom: 8px;
        }
        .map-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--accent);
          font-size: 14px;
          font-weight: 600;
          padding: 4px 12px;
          background: #f0fdfa;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .map-link:hover {
          background: #ccfbf1;
          text-decoration: underline;
        }
        .external-icon {
          opacity: 0.5;
        }
        .day-nav-bottom {
          margin-top: 60px;
          display: flex;
          justify-content: space-between;
          padding-top: 40px;
          border-top: 2px solid #edf2f7;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 700;
          background: white;
          border: 1px solid #e2e8f0;
          color: #4a5568;
          transition: all 0.2s;
        }
        .nav-btn:hover {
          background: #f8fafc;
          border-color: var(--primary);
          color: var(--primary);
        }
        .nav-btn.next {
          background: var(--primary);
          color: white;
          border: none;
        }
        .nav-btn.next:hover {
          background: #357abd;
        }
        @media (max-width: 640px) {
          .day-main-title { font-size: 1.8rem; }
          .timeline-card { flex-direction: column; gap: 8px; }
        }
      `}</style>
    </div>
  );
};

export default DayView;
