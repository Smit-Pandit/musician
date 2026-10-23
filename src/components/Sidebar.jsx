import React from 'react';
import {
  Gamepad2,
  User,
  Compass,
  Mic2,
  ListMusic,
  Trophy,
  Database,
  Radio,
  Sparkles,
  Flame,
  Plus
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Sidebar() {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    playlists,
    navigateToPlaylist,
    createPlaylist
  } = useApp();

  const navItems = [
    { id: 'game', label: 'Game Arena', icon: Gamepad2, badge: 'Live Daily' },
    { id: 'profile', label: 'User Profile', icon: User, badge: `Lvl ${currentUser.level}` },
    { id: 'discover', label: 'Discover Tracks', icon: Compass },
    { id: 'artist', label: 'Artists & Lineage', icon: Mic2 },
    { id: 'playlists', label: 'Playlists', icon: ListMusic },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'schema', label: 'ERD Database', icon: Database, badge: 'Diagram' }
  ];

  const handleCreateNewPlaylist = () => {
    const title = prompt('Enter a name for your new playlist:');
    if (title && title.trim()) {
      const id = createPlaylist(title.trim(), 'User generated playlist');
      navigateToPlaylist(id);
    }
  };

  return (
    <aside className="sidebar-wrapper">
      <div className="sidebar-content">
        {/* Navigation Sections */}
        <div className="nav-group">
          <p className="nav-group-title">EXPLORE ARENA</p>
          <nav className="nav-menu">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  className={`nav-button ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <div className="nav-icon-wrapper">
                    <Icon size={18} />
                  </div>
                  <span className="nav-label">{item.label}</span>
                  {item.badge && (
                    <span className={`nav-badge ${isActive ? 'active-badge' : ''}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Playlists Section */}
        <div className="nav-group playlists-group">
          <div className="nav-group-header">
            <p className="nav-group-title">MY PLAYLISTS</p>
            <button
              className="btn-add-playlist"
              title="Create new playlist"
              onClick={handleCreateNewPlaylist}
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="sidebar-playlists-list">
            {playlists.map(pl => (
              <button
                key={pl.playlist_id}
                className="playlist-item-btn"
                onClick={() => navigateToPlaylist(pl.playlist_id)}
              >
                <div className="playlist-mini-art">
                  <ListMusic size={13} />
                </div>
                <div className="playlist-mini-info">
                  <span className="playlist-mini-title">{pl.title}</span>
                  <span className="playlist-mini-type">{pl.is_public ? 'Public' : 'Private'}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Quick Status Banner */}
        <div className="sidebar-user-card glass-panel" onClick={() => setActiveTab('profile')}>
          <div className="sidebar-user-row">
            <img src={currentUser.avatar_url} alt={currentUser.username} className="card-avatar" />
            <div className="card-user-info">
              <span className="card-user-name">@{currentUser.username}</span>
              <span className="card-user-rank">{currentUser.rank_title}</span>
            </div>
            <div className="card-user-streak" title="Active Win Streak">
              <Flame size={14} className="streak-fire" />
              <span>{currentUser.streak_days}</span>
            </div>
          </div>
          <div className="xp-progress-bar-container">
            <div
              className="xp-progress-fill"
              style={{ width: `${(currentUser.total_xp % 500) / 5}%` }}
            ></div>
          </div>
          <div className="xp-progress-meta">
            <span>XP: {currentUser.total_xp.toLocaleString()}</span>
            <span>Next Lvl: {currentUser.level + 1}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
