import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Gamepad2,
  Users,
  ListMusic,
  Trophy,
  Database,
  Plus,
  Flame,
  ChevronLeft,
  ChevronRight,
  Heart,
  Music2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const {
    currentUser,
    playlists,
    createPlaylist,
    sidebarCollapsed,
    toggleSidebar
  } = useApp();
  const navigate = useNavigate();

  const primaryNav = [
    { path: '/discover', label: 'Discover', icon: Compass },
    { path: '/game', label: 'Audio Arena', icon: Gamepad2, badge: 'LIVE' },
    { path: '/artist', label: 'Artists', icon: Users },
    { path: '/playlists', label: 'Playlists', icon: ListMusic },
    { path: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { path: '/schema', label: 'Database Schema', icon: Database }
  ];

  const handleCreateNewPlaylist = async (e) => {
    e.stopPropagation();
    const title = prompt('Enter a name for your new playlist:');
    if (title && title.trim()) {
      const id = await createPlaylist(title.trim(), 'Personal playlist');
      navigate(`/playlists/${id}`);
    }
  };

  return (
    <motion.aside
      className={`sleek-sidebar ${sidebarCollapsed ? 'is-collapsed' : 'is-expanded'}`}
      initial={false}
      animate={{ width: sidebarCollapsed ? 76 : 240 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="sidebar-inner-container">
        {/* Sidebar Header & Toggle */}
        <div className="sidebar-header-row">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                className="sidebar-brand-inline"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.18 }}
                onClick={() => navigate('/discover')}
              >
                <div className="brand-dot-pulse"></div>
                <span className="brand-text-name">MUSICIANS</span>
                <span className="brand-sub-badge">AUDIO</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className="sidebar-collapse-btn"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Primary Navigation Items */}
        <div className="sidebar-nav-section">
          {!sidebarCollapsed && (
            <span className="sidebar-section-title">MENU</span>
          )}
          <nav className="sidebar-menu-list">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `sidebar-nav-btn ${isActive ? 'is-active' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="sidebar-nav-icon">
                    <Icon size={19} />
                  </div>
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.div
                        className="sidebar-nav-label-group"
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -6 }}
                        transition={{ duration: 0.15 }}
                      >
                        <span className="sidebar-nav-label">{item.label}</span>
                        {item.badge && (
                          <span className="sidebar-live-pill">{item.badge}</span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Library & Playlists Section */}
        <div className="sidebar-library-section">
          <div className="library-header-row">
            {!sidebarCollapsed && (
              <span className="sidebar-section-title">YOUR LIBRARY</span>
            )}
            <button
              className="btn-create-playlist-mini"
              onClick={handleCreateNewPlaylist}
              title="Create new playlist"
            >
              <Plus size={15} />
            </button>
          </div>

          <div className="sidebar-playlists-scroll">
            {playlists.map((pl) => (
              <NavLink
                key={pl.playlist_id}
                to={`/playlists/${pl.playlist_id}`}
                className={({ isActive }) => `sidebar-playlist-item ${isActive ? 'is-active' : ''}`}
                title={sidebarCollapsed ? pl.title : undefined}
              >
                <div className="playlist-icon-box">
                  <Music2 size={15} />
                </div>
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.div
                      className="playlist-text-wrap"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span className="playlist-title-sub">{pl.title}</span>
                      <span className="playlist-count-sub">Playlist • {pl.is_public ? 'Public' : 'Private'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </NavLink>
            ))}
          </div>
        </div>

        {/* User Mini Card at Bottom */}
        <div
          className="sidebar-bottom-user-card"
          onClick={() => navigate('/profile')}
          title="View profile & stats"
        >
          <div className="sidebar-user-avatar-wrap">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="sidebar-user-avatar"
            />
            <div className="user-online-pip"></div>
          </div>

          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                className="sidebar-user-meta"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
              >
                <span className="sidebar-user-name">@{currentUser.username}</span>
                <span className="sidebar-user-rank">{currentUser.rank_title}</span>
                <div className="sidebar-user-level-row">
                  <div className="level-bar-bg">
                    <div
                      className="level-bar-fill"
                      style={{ width: `${(currentUser.total_xp % 500) / 5}%` }}
                    ></div>
                  </div>
                  <span className="level-text font-mono">Lv.{currentUser.level}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
