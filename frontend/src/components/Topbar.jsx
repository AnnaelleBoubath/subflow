import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Topbar({ title }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) navigate(`/abonnes?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="topbar">
      <div className="page-title">{title}</div>

      <div className="topbar-right">
        <form className="search-box" onSubmit={handleSearch}>
          <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            placeholder="Rechercher un abonné…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>

        <div className="notif-btn">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div className="notif-dot" />
        </div>

        <button className="btn btn-accent" onClick={() => navigate('/abonnes?new=true')}>
          + Nouvel abonné
        </button>
      </div>
    </header>
  );
}
