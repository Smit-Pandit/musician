import React from 'react';
import { Database, Link2, ArrowRight, ShieldCheck, Key, GitCommit, Sparkles } from 'lucide-react';
import {
  USERS,
  ARTISTS,
  ALBUMS,
  TRACKS,
  PLAYLISTS,
  PLAYLIST_TRACKS,
  LISTENING_HISTORY,
  GAME_SESSIONS,
  GAME_ATTEMPTS
} from '../data/musicData';

export default function SchemaView() {
  const tables = [
    {
      name: 'USERS',
      color: '#8b5cf6',
      count: USERS.length,
      keys: ['PK: user_id', 'UK: username', 'UK: email'],
      fields: ['password (Plain-text no auth)', 'total_xp (Derived via Trigger)', 'created_at (timestamp)'],
      relations: [
        'Creates (1:N) PLAYLISTS',
        'Streams (1:N) LISTENING_HISTORY',
        'Plays (1:N) GAME_SESSIONS'
      ]
    },
    {
      name: 'ARTISTS',
      color: '#06b6d4',
      count: ARTISTS.length,
      keys: ['PK: artist_id', 'UK: yt_channel_id (Optional)'],
      fields: ['name (varchar)', 'verified_status (boolean)', 'avatar_url (text)'],
      relations: [
        'Releases (1:N) ALBUMS',
        'Performs (1:N) TRACKS'
      ]
    },
    {
      name: 'ALBUMS',
      color: '#ec4899',
      count: ALBUMS.length,
      keys: ['PK: album_id', 'FK: artist_id'],
      fields: ['title (varchar)', 'release_year (int)', 'cover_art_url (text)', 'album_type (album | ep | single)'],
      relations: [
        'Belongs to (N:1) ARTISTS',
        'Contains (0..1:N) TRACKS'
      ]
    },
    {
      name: 'TRACKS',
      color: '#f59e0b',
      count: TRACKS.length,
      keys: ['PK: track_id', 'FK: artist_id', 'FK: album_id', 'FK: parent_track_id (Self-FK)', 'UK: yt_video_id'],
      fields: ['title', 'genre', 'duration_sec', 'track_type (official_audio | music_video | remix | live_cover)', 'snippet_start_sec (Game Hook Start)', 'custom_thumbnail_url', 'is_embeddable (boolean)'],
      relations: [
        'Derives From Remix/Cover (1:N) Self TRACKS',
        'Logged in (1:N) LISTENING_HISTORY',
        'Tested in Game (1:N) GAME_ATTEMPTS'
      ]
    },
    {
      name: 'PLAYLISTS',
      color: '#3b82f6',
      count: PLAYLISTS.length,
      keys: ['PK: playlist_id', 'FK: user_id'],
      fields: ['title (varchar)', 'is_public (boolean)', 'created_at (timestamp)'],
      relations: [
        'Created by (N:1) USERS',
        'Has (1:N) PLAYLIST_TRACKS'
      ]
    },
    {
      name: 'PLAYLIST_TRACKS',
      color: '#6366f1',
      count: PLAYLIST_TRACKS.length,
      keys: ['PK, FK: playlist_id', 'PK, FK: track_id'],
      fields: ['position_order (int)', 'added_at (timestamp)'],
      relations: [
        'Junction table bridging PLAYLISTS and TRACKS'
      ]
    },
    {
      name: 'LISTENING_HISTORY',
      color: '#10b981',
      count: LISTENING_HISTORY.length,
      keys: ['PK: history_id', 'FK: user_id', 'FK: track_id'],
      fields: ['played_at (timestamp)', 'listened_duration_sec (int)', 'is_liked (boolean)'],
      relations: [
        'Streams logged for USERS and TRACKS'
      ]
    },
    {
      name: 'GAME_SESSIONS',
      color: '#f97316',
      count: GAME_SESSIONS.length,
      keys: ['PK: session_id', 'FK: user_id'],
      fields: ['game_mode (daily | genre_rush | history)', 'total_score (Derived via Trigger)', 'max_streak (int)', 'played_at (timestamp)'],
      relations: [
        'Played by (N:1) USERS',
        'Logs Round (1:N) GAME_ATTEMPTS'
      ]
    },
    {
      name: 'GAME_ATTEMPTS',
      color: '#ef4444',
      count: GAME_ATTEMPTS.length,
      keys: ['PK: attempt_id', 'FK: session_id', 'FK: track_id'],
      fields: ['unlocked_tier_sec (0.1 | 1.0 | 2.0 | 5.0)', 'attempts_used (1 to 4)', 'is_correct (boolean)', 'response_time_ms (int)', 'points_awarded (1000 | 750 | 500 | 250 | 0)'],
      relations: [
        'Belongs to (N:1) GAME_SESSIONS',
        'Targets (N:1) TRACKS'
      ]
    }
  ];

  return (
    <div className="schema-view">
      <div className="schema-hero glass-panel">
        <div className="schema-hero-icon">
          <Database size={32} />
        </div>
        <div>
          <h1 className="schema-hero-title">Relational Database ERD Mapping</h1>
          <p className="schema-hero-sub">
            Direct interactive implementation of all 9 entities, primary/foreign key cardinalities, and trigger-derived fields.
          </p>
        </div>
      </div>

      {/* Relational Schema Grid */}
      <div className="schema-grid">
        {tables.map(table => (
          <div
            key={table.name}
            className="erd-card glass-panel"
            style={{ borderTop: `3px solid ${table.color}` }}
          >
            <div className="erd-card-header">
              <span className="erd-table-name" style={{ color: table.color }}>
                {table.name}
              </span>
              <span className="erd-count-badge">{table.count} live records</span>
            </div>

            <div className="erd-card-section">
              <span className="erd-sub-title">Keys &amp; Uniques:</span>
              <ul className="erd-list font-mono">
                {table.keys.map((k, i) => (
                  <li key={i} className="erd-key-item">
                    <Key size={12} className="erd-key-icon" /> {k}
                  </li>
                ))}
              </ul>
            </div>

            <div className="erd-card-section">
              <span className="erd-sub-title">Columns &amp; Triggers:</span>
              <ul className="erd-list font-mono text-xs">
                {table.fields.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="erd-card-relations">
              <span className="erd-sub-title">Cardinality:</span>
              <div className="erd-relations-tags">
                {table.relations.map((r, i) => (
                  <span key={i} className="erd-rel-tag">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
