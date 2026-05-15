import React from 'react';
import { Map } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <div className="logo">
            <Map size={24} />
            <span>Wanderlust</span>
          </div>
          <p className="footer-desc">為每一位旅人提供最懂生活的旅遊攻略。</p>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Wanderlust Guides. All rights reserved.</p>
        </div>
      </div>
      <style>{`
        .footer {
          background: var(--primary);
          color: white;
          padding: 80px 0 40px;
          margin-top: 100px;
        }
        .footer-content {
          display: flex;
          flex-direction: column;
          gap: 60px;
        }
        .footer-brand {
          max-width: 400px;
        }
        .footer-brand .logo {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 1.5rem;
          margin-bottom: 16px;
        }
        .footer-desc {
          opacity: 0.7;
          line-height: 1.6;
        }
        .footer-bottom {
          padding-top: 40px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
          font-size: 14px;
          opacity: 0.5;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
