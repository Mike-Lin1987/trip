import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Globe } from 'lucide-react';
import GuideCard from '../components/GuideCard';

const Home: React.FC = () => {
  const [featuredGuides, setFeaturedGuides] = useState<any[]>([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    fetch(`${apiUrl}/guides`)
      .then(res => res.json())
      .then(data => setFeaturedGuides(data.slice(0, 3)))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <div className="hero-badge">2024 冬季限定</div>
          <h1 className="hero-title">北陸、大阪冬日之旅</h1>
          <p className="hero-subtitle">探索金澤雪景、白川鄉合掌村與大阪美食的悠閒 9 天行程。</p>
          <div className="hero-actions">
            <Link to="/guide/hokuriku-guide" className="btn btn-primary">
              查看詳細攻略 <ArrowRight size={20} />
            </Link>
            <Link to="/explore" className="btn btn-outline">
              探索更多目的地
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features section-padding">
        <div className="container grid-features">
          <div className="feature-item">
            <div className="feature-icon"><MapPin size={32} /></div>
            <h3>精選景點</h3>
            <p>由當地達人親自走訪，篩選出最值得造訪的必去地標。</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><Globe size={32} /></div>
            <h3>深度攻略</h3>
            <p>不只是走馬看花，我們提供交通、美食與預算等全方位建議。</p>
          </div>
        </div>
      </section>

      {/* Featured Guides Section */}
      <section className="featured section-padding bg-surface">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">熱門旅遊攻略</h2>
            <Link to="/explore" className="link-more">
              查看全部 <ArrowRight size={18} />
            </Link>
          </div>
          <div className="guide-grid">
            {featuredGuides.map(guide => (
              <GuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .hero {
          height: 85vh;
          background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url('https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1600&q=80');
          background-size: cover;
          background-position: center;
          display: flex;
          align-items: center;
          color: white;
          text-align: center;
        }
        .hero-badge {
          display: inline-block;
          padding: 6px 16px;
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 24px;
          text-transform: uppercase;
          letter-spacing: 2px;
          border: 1px solid rgba(255,255,255,0.3);
        }
        .hero-title {
          font-size: 4.5rem;
          font-weight: 800;
          margin-bottom: 24px;
          letter-spacing: -1px;
          line-height: 1.1;
        }
        .hero-subtitle {
          font-size: 1.5rem;
          max-width: 700px;
          margin: 0 auto 48px;
          opacity: 0.95;
          line-height: 1.6;
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 16px 36px;
          border-radius: 40px;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 16px;
        }
        .btn-primary {
          background: white;
          color: var(--primary);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .btn-primary:hover {
          background: #f8fafc;
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }
        .btn-outline {
          background: transparent;
          color: white;
          border: 2px solid rgba(255,255,255,0.4);
        }
        .btn-outline:hover {
          background: rgba(255,255,255,0.1);
          border-color: white;
          transform: translateY(-3px);
        }
        .section-padding {
          padding: 100px 0;
        }
        .bg-surface {
          background-color: var(--surface);
        }
        .grid-features {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 48px;
        }
        .feature-item {
          text-align: center;
        }
        .feature-icon {
          margin-bottom: 20px;
          color: var(--accent);
        }
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 48px;
        }
        .section-title {
          font-size: 2.5rem;
          font-weight: 700;
        }
        .link-more {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
          color: var(--accent);
        }
        .guide-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 32px;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .hero-subtitle { font-size: 1.1rem; }
          .grid-features { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Home;
