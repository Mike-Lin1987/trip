import React from 'react';
import { Link } from 'react-router-dom';
import { Map, Heart, Menu } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="container nav-content">
        <Link to="/" className="logo">
          <Map size={24} />
          <span>Wanderlust</span>
        </Link>
        <div className="nav-links">
          <Link to="/explore" className="nav-link">探索</Link>
          <Link to="/favorites" className="nav-link">
            <Heart size={20} />
            <span>我的最愛</span>
          </Link>
        </div>
        <button className="mobile-menu">
          <Menu size={24} />
        </button>
      </div>
      <style>{`
        .navbar {
          height: 72px;
          border-bottom: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 1000;
        }
        .nav-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 100%;
        }
        .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 1.25rem;
          color: var(--primary);
        }
        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .nav-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--secondary);
          font-weight: 500;
          transition: var(--transition);
        }
        .nav-link:hover {
          color: var(--primary);
        }
        .mobile-menu {
          display: none;
        }
        @media (max-width: 768px) {
          .nav-links {
            display: none;
          }
          .mobile-menu {
            display: block;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
