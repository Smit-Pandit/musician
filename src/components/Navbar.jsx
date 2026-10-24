import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  X,
  Compass,
  Gamepad2,
  ListMusic,
  Database,
  Terminal,
  LogIn,
  ChevronDown,
  Flame,
  Award,
  Sparkles,
  SlidersHorizontal,
  Server
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { subscribeToMySqlStatus } from '../services/sqlApi';

export default function Navbar({ onSearch }) {
  const {
    currentUser,
    usersList,
    switchUser,
    sidebarCollapsed,
    toggleSidebar,
    setIsDesignStudioOpen,
    setIsSchemaModalOpen,
    setIsSqlConsoleOpen
  } = useApp();

  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mySql, setMySql] = useState({ connected: false });

  useEffect(() => {
    return subscribeToMySqlStatus((status) => setMySql(status));
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearch) onSearch(val);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) onSearch('');
  };

  return (
    <header className="sleek-navbar">
      {/* 1. Left: Sidebar Toggle & Modern Brand Logo */}
      <div className="navbar-left-cluster">
        <button
          className="navbar-sidebar-toggle-btn"
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <Menu size={20} />
        </button>

        <div className="navbar-brand-pill" onClick={() => navigate('/discover')}>
          <div className="brand-logo-icon">
            <span className="brand-pulse-glow"></span>
            <Sparkles size={16} className="brand-sparkle-red" />
          </div>
          <span className="brand-name-bold">MUSICIANS</span>
        </div>
      </div>

      {/* 2. Center: YouTube Music Style Pill Search Bar */}
      <div className="navbar-search-cluster">
        <div className="sleek-search-pill">
          <Search size={17} className="search-pill-icon" />
          <input
            type="text"
            className="search-pill-input"
            placeholder="Search songs, artists, albums, or genres..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={handleClearSearch}
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* 3. Right: Quick Actions & User Profile */}
      <div className="navbar-right-cluster">
        {/* Quick Nav Shortcut Pills */}
        <div className="navbar-quick-pills hide-tablet">
          <NavLink
            to="/discover"
            className={({ isActive }) => `quick-nav-pill ${isActive ? 'is-active' : ''}`}
          >
            Discover
          </NavLink>
          <NavLink
            to="/game"
            className={({ isActive }) => `quick-nav-pill ${isActive ? 'is-active' : ''}`}
          >
            <span className="pill-dot-red"></span>
            Arena
          </NavLink>
          <NavLink
            to="/playlists"
            className={({ isActive }) => `quick-nav-pill ${isActive ? 'is-active' : ''}`}
          >
            Playlists
          </NavLink>
        </div>

        {/* Database Status Button */}
        <button
          className={`btn-db-status-chip ${mySql.connected ? 'is-connected' : ''}`}
          onClick={() => setIsSqlConsoleOpen(true)}
          title={mySql.connected ? `MySQL InnoDB Connected (${mySql.database})` : 'MySQL Offline'}
        >
          <Server size={14} />
          <span className="hide-mobile">InnoDB</span>
          <span className={`db-status-dot ${mySql.connected ? 'dot-live' : ''}`}></span>
        </button>

        {/* User Profile Pill & Dropdown */}
        <div className="navbar-user-dropdown-anchor">
          <motion.div
            className="navbar-user-pill"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          >
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="navbar-avatar-img"
            />
            <span className="navbar-user-name hide-mobile">@{currentUser.username}</span>
            <ChevronDown size={14} className={`navbar-chevron ${userDropdownOpen ? 'is-open' : ''}`} />
          </motion.div>

          <AnimatePresence>
            {userDropdownOpen && (
              <motion.div
                className="sleek-user-dropdown-panel"
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <div className="dropdown-user-header">
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.username}
                    className="dropdown-user-avatar"
                  />
                  <div className="dropdown-user-info">
                    <p className="dropdown-user-title">@{currentUser.username}</p>
                    <span className="dropdown-user-subtitle">{currentUser.rank_title} • Lvl {currentUser.level}</span>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-section-label">SWITCH USER PROFILE</div>
                <div className="dropdown-user-list">
                  {usersList.map((u) => (
                    <div
                      key={u.user_id}
                      className={`dropdown-user-item ${u.user_id === currentUser.user_id ? 'is-selected' : ''}`}
                      onClick={() => {
                        switchUser(u.user_id);
                        setUserDropdownOpen(false);
                      }}
                    >
                      <img src={u.avatar_url} alt={u.username} className="item-avatar-mini" />
                      <div className="item-user-text">
                        <span className="item-user-name">@{u.username}</span>
                        <span className="item-user-level font-mono">{u.total_xp.toLocaleString()} XP • Lvl {u.level}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-footer-actions">
                  <button
                    className="dropdown-footer-btn"
                    onClick={() => {
                      navigate('/profile');
                      setUserDropdownOpen(false);
                    }}
                  >
                    View Profile & Stats
                  </button>
                  <div className="dropdown-auth-links">
                    <button
                      className="auth-link-text"
                      onClick={() => {
                        navigate('/login');
                        setUserDropdownOpen(false);
                      }}
                    >
                      Login
                    </button>
                    <span>•</span>
                    <button
                      className="auth-link-text"
                      onClick={() => {
                        navigate('/register');
                        setUserDropdownOpen(false);
                      }}
                    >
                      Register
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
