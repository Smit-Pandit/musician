import React, { useState } from 'react';
import {
  User,
  Flame,
  Award,
  Calendar,
  Mail,
  Zap,
  TrendingUp,
  Clock,
  ListMusic,
  Heart,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Shield,
  Layers,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  USERS,
  getTrackWithRelations,
  getFullPlaylist
} from '../data/musicData';

export default function UserProfileView() {
  const {
    currentUser,
    usersList,
    switchUser,
    playlists,
    playlistTracks,
    listeningHistory,
    gameSessions,
    gameAttempts,
    playTrack,
    navigateToPlaylist,
    createPlaylist,
    toggleLikeTrack
  } = useApp();

  const [activeProfileTab, setActiveProfileTab] = useState('sessions'); // 'sessions' | 'playlists' | 'history' | 'badges'

  // Filter sessions and history for current user
  const userSessions = gameSessions.filter(s => s.user_id === currentUser.user_id);
  const userPlaylists = playlists.filter(p => p.user_id === currentUser.user_id);
  const userHistory = listeningHistory.filter(h => h.user_id === currentUser.user_id);

  const handleCreatePlaylist = () => {
    const title = prompt('Enter playlist name:');
    if (title && title.trim()) {
      createPlaylist(title.trim(), 'Created by ' + currentUser.username);
    }
  };

  return (
    <div className="user-profile-view">
      {/* User Header Profile Card */}
      <div className="profile-banner-card glass-panel">
        <div className="banner-bg-gradient"></div>
        <div className="profile-card-content">
          <div className="profile-avatar-box">
            <img
              src={currentUser.avatar_url}
              alt={currentUser.username}
              className="profile-main-avatar"
            />
            <div className="profile-level-badge">Lvl {currentUser.level}</div>
          </div>

          <div className="profile-info-details">
            <div className="profile-name-row">
              <h1 className="profile-username">@{currentUser.username}</h1>
              <span className="badge badge-purple">{currentUser.rank_title}</span>
            </div>

            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Mail size={14} /> {currentUser.email}
              </span>
              <span className="meta-bullet">•</span>
              <span className="profile-meta-item">
                <Calendar size={14} /> Member since {new Date(currentUser.created_at).toLocaleDateString()}
              </span>
              <span className="meta-bullet">•</span>
              <span className="profile-meta-item">
                <Sparkles size={14} /> {currentUser.favorite_genre}
              </span>
            </div>

            {/* Level XP Progress Bar */}
            <div className="profile-xp-meter-box">
              <div className="xp-meter-label-row">
                <span className="xp-current">
                  <Award size={14} /> {currentUser.total_xp.toLocaleString()} Total XP (Derived)
                </span>
                <span className="xp-next">
                  {500 - (currentUser.total_xp % 500)} XP to Level {currentUser.level + 1}
                </span>
              </div>
              <div className="xp-progress-rail">
                <div
                  className="xp-progress-fill"
                  style={{ width: `${(currentUser.total_xp % 500) / 5}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="profile-stats-grid">
            <div className="stat-card glass-panel">
              <div className="stat-card-icon-box fire-box">
                <Flame size={20} />
              </div>
              <div className="stat-card-vals">
                <span className="stat-card-number">{currentUser.streak_days} Days</span>
                <span className="stat-card-label">Active Streak</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-icon-box zap-box">
                <Zap size={20} />
              </div>
              <div className="stat-card-vals">
                <span className="stat-card-number">{currentUser.games_won}/{currentUser.games_played}</span>
                <span className="stat-card-label">Games Won</span>
              </div>
            </div>

            <div className="stat-card glass-panel">
              <div className="stat-card-icon-box trend-box">
                <TrendingUp size={20} />
              </div>
              <div className="stat-card-vals">
                <span className="stat-card-number">{currentUser.accuracy}</span>
                <span className="stat-card-label">Accuracy Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Switch Demo User Fast Bar */}
      <div className="switch-user-quickbar glass-panel">
        <span className="quickbar-label">
          <User size={15} /> Switch Active User Account:
        </span>
        <div className="quickbar-users">
          {usersList.map(u => (
            <button
              key={u.user_id}
              className={`quickbar-user-btn ${u.user_id === currentUser.user_id ? 'active' : ''}`}
              onClick={() => switchUser(u.user_id)}
            >
              <img src={u.avatar_url} alt={u.username} className="quick-avatar" />
              <span>@{u.username}</span>
              <span className="quick-xp">({u.total_xp.toLocaleString()} XP)</span>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="profile-tabs-header glass-panel">
        <button
          className={`profile-tab-btn ${activeProfileTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('sessions')}
        >
          <Zap size={16} />
          <span>Game Sessions & Attempts</span>
          <span className="tab-count-badge">{userSessions.length}</span>
        </button>

        <button
          className={`profile-tab-btn ${activeProfileTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('playlists')}
        >
          <ListMusic size={16} />
          <span>My Playlists</span>
          <span className="tab-count-badge">{userPlaylists.length}</span>
        </button>

        <button
          className={`profile-tab-btn ${activeProfileTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('history')}
        >
          <Clock size={16} />
          <span>Listening History</span>
          <span className="tab-count-badge">{userHistory.length}</span>
        </button>

        <button
          className={`profile-tab-btn ${activeProfileTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('badges')}
        >
          <Award size={16} />
          <span>XP Badges</span>
          <span className="tab-count-badge">6</span>
        </button>
      </div>

      {/* TAB 1: GAME SESSIONS & ATTEMPTS (Maps to GAME_SESSIONS and GAME_ATTEMPTS) */}
      {activeProfileTab === 'sessions' && (
        <div className="profile-tab-content">
          <div className="section-intro">
            <div>
              <h2 className="section-title">Game Sessions & Recorded Attempts</h2>
              <p className="section-sub">
                Relational history from <code>GAME_SESSIONS</code> &amp; <code>GAME_ATTEMPTS</code> tables
              </p>
            </div>
          </div>

          <div className="sessions-list">
            {userSessions.map(session => {
              const attemptsForSession = gameAttempts.filter(
                a => a.session_id === session.session_id
              );
              return (
                <div key={session.session_id} className="session-card glass-panel">
                  <div className="session-header">
                    <div className="session-mode-group">
                      <span className="badge badge-purple">
                        MODE: {session.game_mode.toUpperCase()}
                      </span>
                      <span className="session-id font-mono">
                        Session #{session.session_id}
                      </span>
                    </div>
                    <div className="session-score-group">
                      <span className="session-score font-mono">
                        +{session.total_score} XP
                      </span>
                      <span className="session-time font-mono">
                        {new Date(session.played_at).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="attempts-table-wrapper">
                    <table className="profile-attempts-table">
                      <thead>
                        <tr>
                          <th>Attempt ID</th>
                          <th>Target Track</th>
                          <th>Unlocked Tier</th>
                          <th>Attempts Used</th>
                          <th>Speed (ms)</th>
                          <th>Status</th>
                          <th>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attemptsForSession.map(att => {
                          const track = getTrackWithRelations(att.track_id);
                          return (
                            <tr key={att.attempt_id}>
                              <td className="font-mono">#{att.attempt_id}</td>
                              <td>
                                <div className="attempt-track-cell">
                                  <img
                                    src={track?.album?.cover_art_url || track?.artist?.avatar_url}
                                    alt={track?.title}
                                    className="cell-art"
                                  />
                                  <span>{track?.title} — {track?.artist?.name}</span>
                                </div>
                              </td>
                              <td>
                                <span className="badge badge-cyan">{att.unlocked_tier_sec}s</span>
                              </td>
                              <td className="font-mono">{att.attempts_used} / 4</td>
                              <td className="font-mono">{att.response_time_ms} ms</td>
                              <td>
                                {att.is_correct ? (
                                  <span className="status-cell success">
                                    <CheckCircle2 size={14} /> Solved
                                  </span>
                                ) : (
                                  <span className="status-cell failed">
                                    <XCircle size={14} /> Missed
                                  </span>
                                )}
                              </td>
                              <td className="font-mono score-cell">+{att.points_awarded}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: USER PLAYLISTS (Maps to PLAYLISTS and PLAYLIST_TRACKS) */}
      {activeProfileTab === 'playlists' && (
        <div className="profile-tab-content">
          <div className="section-intro">
            <div>
              <h2 className="section-title">Created Playlists</h2>
              <p className="section-sub">
                Curated collections from <code>PLAYLISTS</code> &amp; <code>PLAYLIST_TRACKS</code>
              </p>
            </div>
            <button className="btn-primary" onClick={handleCreatePlaylist}>
              <Plus size={16} /> Create New Playlist
            </button>
          </div>

          <div className="playlists-grid">
            {userPlaylists.map(pl => {
              const full = getFullPlaylist(pl.playlist_id);
              return (
                <div
                  key={pl.playlist_id}
                  className="playlist-card glass-panel"
                  onClick={() => navigateToPlaylist(pl.playlist_id)}
                >
                  <div className="playlist-art-box">
                    <img src={pl.cover_art_url} alt={pl.title} className="playlist-art" />
                    <span className={`playlist-visibility-tag ${pl.is_public ? 'tag-public' : 'tag-private'}`}>
                      {pl.is_public ? 'PUBLIC' : 'PRIVATE'}
                    </span>
                  </div>
                  <div className="playlist-info">
                    <h3 className="playlist-card-title">{pl.title}</h3>
                    <p className="playlist-card-desc">{pl.description}</p>
                    <div className="playlist-footer-meta">
                      <span>{full?.tracks?.length || 0} tracks</span>
                      <span>•</span>
                      <span>Created {new Date(pl.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: LISTENING HISTORY (Maps to LISTENING_HISTORY) */}
      {activeProfileTab === 'history' && (
        <div className="profile-tab-content">
          <div className="section-intro">
            <div>
              <h2 className="section-title">Recent Listening History</h2>
              <p className="section-sub">
                Streamed tracks logged in <code>LISTENING_HISTORY</code>
              </p>
            </div>
          </div>

          <div className="history-list glass-panel">
            {userHistory.map(h => {
              const track = getTrackWithRelations(h.track_id);
              if (!track) return null;
              return (
                <div key={h.history_id} className="history-row">
                  <div className="history-left">
                    <button
                      className="btn-history-play"
                      title="Play snippet"
                      onClick={() => playTrack(track.track_id)}
                    >
                      <Play size={16} className="play-icon-offset" />
                    </button>
                    <img
                      src={track.album?.cover_art_url || track.artist?.avatar_url}
                      alt={track.title}
                      className="history-thumb"
                    />
                    <div className="history-meta">
                      <span className="history-title">{track.title}</span>
                      <span className="history-artist">{track.artist?.name} • {track.genre}</span>
                    </div>
                  </div>

                  <div className="history-right">
                    <span className="history-time font-mono">
                      {new Date(h.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button
                      className={`btn-like-heart ${h.is_liked ? 'liked' : ''}`}
                      onClick={() => toggleLikeTrack(track.track_id)}
                    >
                      <Heart size={16} fill={h.is_liked ? '#ec4899' : 'none'} color={h.is_liked ? '#ec4899' : 'currentColor'} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: BADGES & ACHIEVEMENTS */}
      {activeProfileTab === 'badges' && (
        <div className="profile-tab-content">
          <div className="section-intro">
            <div>
              <h2 className="section-title">Earned XP Badges & Achievements</h2>
              <p className="section-sub">Unlocked via Heardle games, daily streaks, and discography explore</p>
            </div>
          </div>

          <div className="badges-grid">
            <div className="badge-showcase-card glass-panel unlocked">
              <div className="badge-icon-disc gold">
                <Flame size={26} />
              </div>
              <h4 className="badge-name">Firestarter Streak</h4>
              <p className="badge-desc">Maintained a 14-day consecutive song guessing streak.</p>
              <span className="badge-status-tag">Unlocked (Level 28)</span>
            </div>

            <div className="badge-showcase-card glass-panel unlocked">
              <div className="badge-icon-disc purple">
                <Zap size={26} />
              </div>
              <h4 className="badge-name">Sonic Sniper</h4>
              <p className="badge-desc">Correctly identified a track within Tier 1 (0.5s audio snippet).</p>
              <span className="badge-status-tag">Unlocked</span>
            </div>

            <div className="badge-showcase-card glass-panel unlocked">
              <div className="badge-icon-disc cyan">
                <Shield size={26} />
              </div>
              <h4 className="badge-name">Synthesizer Master</h4>
              <p className="badge-desc">Guessed 50+ Synthwave &amp; Cyberpunk genre rush tracks.</p>
              <span className="badge-status-tag">Unlocked</span>
            </div>

            <div className="badge-showcase-card glass-panel locked">
              <div className="badge-icon-disc gray">
                <Award size={26} />
              </div>
              <h4 className="badge-name">Grand Legend (50k XP)</h4>
              <p className="badge-desc">Accumulate 50,000 total XP to join the hall of fame.</p>
              <span className="badge-status-tag locked-tag">In Progress ({currentUser.total_xp}/50,000)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
