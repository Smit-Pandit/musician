import React, { useState } from 'react';
import {
  Flame,
  Sparkles,
  Palette,
  Database,
  Search,
  ChevronDown,
  Volume2,
  Award,
  Zap,
  LogIn,
  Terminal
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Navbar({ onSearch }) {
  const {
    currentUser,
    usersList,
    switchUser,
    activeTab,
    setActiveTab,
    theme,
    navigate,
    setIsDesignStudioOpen,
    setIsSchemaModalOpen,
    setIsSqlConsoleOpen
  } = useApp();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="navbar-wrapper">
      <div className="navbar-left">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => setActiveTab('game')}>
          <div className="brand-icon-box">
            <span className="brand-pulse"></span>
            <Zap size={22} className="brand-icon" />
          </div>
          <div className="brand-text">
            <span className="brand-title">SONIX</span>
            <span className="brand-sub">AUDIO ARENA</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="search-bar-container">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search songs, artists, genres, YouTube IDs..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      <div className="navbar-right">
        {/* SQL Endpoints & Console Button */}
        <button
          className="btn-sql-trigger"
          title="Open Live SQL Query Stream & Endpoints Console"
          onClick={() => setIsSqlConsoleOpen(true)}
        >
          <Terminal size={16} />
          <span className="hide-mobile">SQL Endpoints</span>
          <span className="sql-live-dot"></span>
        </button>

        {/* Schema Inspector Button */}
        <button
          className="btn-schema-trigger"
          title="Inspect Relational ERD Database Schema"
          onClick={() => setIsSchemaModalOpen(true)}
        >
          <Database size={16} />
          <span className="hide-mobile">ERD Schema</span>
          <span className="erd-badge">9 Tables</span>
        </button>

        {/* Design Studio Switcher Button ("i wanna make more designs") */}
        <button
          className="btn-design-trigger"
          title="Open Theme & Design Studio"
          onClick={() => setIsDesignStudioOpen(true)}
        >
          <Palette size={16} />
          <span className="hide-mobile">Design Studio</span>
          <span className="active-theme-dot"></span>
        </button>

        {/* Sign In / Register trigger */}
        <button
          className="btn-auth-trigger"
          title="Sign In or Register account"
          onClick={() => navigate('/login')}
        >
          <LogIn size={15} />
          <span className="hide-mobile">Sign In / Register</span>
        </button>

        {/* XP & Streak Stat Chip */}
        <div className="xp-pill" onClick={() => setActiveTab('profile')}>
          <div className="streak-indicator" title={`${currentUser.streak_days} Day Streak`}>
            <Flame size={16} className="streak-icon" />
            <span>{currentUser.streak_days}d</span>
          </div>
          <div className="xp-divider"></div>
          <div className="xp-val" title="Total XP Earned">
            <Award size={15} className="xp-icon" />
            <span>{currentUser.total_xp.toLocaleString()} XP</span>
          </div>
        </div>

        {/* User Profile Dropdown Switcher */}
        <div className="user-dropdown-container">
          <div
            className="user-profile-btn"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="user-avatar"
            />
            <div className="user-info-text hide-mobile">
              <span className="user-name">@{currentUser.username}</span>
              <span className="user-rank">Lvl {currentUser.level}</span>
            </div>
            <ChevronDown size={14} className="user-chevron" />
          </div>

          {userMenuOpen && (
            <div className="user-menu-flyout glass-panel">
              <div className="menu-header">
                <p className="menu-header-label">Switch User Account</p>
                <span className="menu-header-sub">Test multi-user ERD profiles</span>
              </div>
              <div className="menu-list">
                {usersList.map(u => (
                  <div
                    key={u.user_id}
                    className={`menu-item ${u.user_id === currentUser.user_id ? 'active' : ''}`}
                    onClick={() => {
                      switchUser(u.user_id);
                      setUserMenuOpen(false);
                    }}
                  >
                    <img src={u.avatar_url} alt={u.username} className="menu-avatar" />
                    <div className="menu-item-info">
                      <p className="menu-item-name">@{u.username}</p>
                      <span className="menu-item-meta">{u.total_xp.toLocaleString()} XP • {u.rank_title}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="menu-footer">
                <button
                  className="btn-view-profile"
                  onClick={() => {
                    setActiveTab('profile');
                    setUserMenuOpen(false);
                  }}
                >
                  View Full Profile & History
                </button>
                <div className="menu-footer-auth-links">
                  <button
                    className="menu-link-btn"
                    onClick={() => {
                      navigate('/login');
                      setUserMenuOpen(false);
                    }}
                  >
                    Switch Account (/login)
                  </button>
                  <span className="dot-sep">•</span>
                  <button
                    className="menu-link-btn"
                    onClick={() => {
                      navigate('/register');
                      setUserMenuOpen(false);
                    }}
                  >
                    New Account (/register)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
