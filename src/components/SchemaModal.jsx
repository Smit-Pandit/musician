import React, { useState } from 'react';
import {
  X,
  Database,
  ArrowRight,
  ExternalLink,
  Table,
  Key,
  Link2,
  FileCode,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
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

export default function SchemaModal() {
  const { isSchemaModalOpen, setIsSchemaModalOpen, setActiveTab } = useApp();
  const [selectedTable, setSelectedTable] = useState('USERS');

  if (!isSchemaModalOpen) return null;

  const schemaTables = [
    {
      name: 'USERS',
      description: 'Player & listener accounts, authentication & derived total XP',
      color: '#8b5cf6',
      rowsCount: USERS.length,
      columns: [
        { name: 'user_id', type: 'int', key: 'PK' },
        { name: 'username', type: 'varchar', key: 'UK' },
        { name: 'email', type: 'varchar', key: 'UK' },
        { name: 'password', type: 'varchar', note: 'Plain-text / Hashed' },
        { name: 'total_xp', type: 'int', note: 'Derived via Trigger' },
        { name: 'created_at', type: 'timestamp' }
      ],
      relations: [
        'Creates (1:N) PLAYLISTS',
        'Streams (1:N) LISTENING_HISTORY',
        'Plays (1:N) GAME_SESSIONS'
      ]
    },
    {
      name: 'ARTISTS',
      description: 'Verified creators and official YouTube music channels',
      color: '#06b6d4',
      rowsCount: ARTISTS.length,
      columns: [
        { name: 'artist_id', type: 'int', key: 'PK' },
        { name: 'name', type: 'varchar' },
        { name: 'yt_channel_id', type: 'varchar', key: 'UK', note: 'Optional YT Channel ID' },
        { name: 'verified_status', type: 'boolean' },
        { name: 'avatar_url', type: 'text' }
      ],
      relations: [
        'Releases (1:N) ALBUMS',
        'Performs (1:N) TRACKS'
      ]
    },
    {
      name: 'ALBUMS',
      description: 'Studio albums, EPs, and single releases',
      color: '#ec4899',
      rowsCount: ALBUMS.length,
      columns: [
        { name: 'album_id', type: 'int', key: 'PK' },
        { name: 'artist_id', type: 'int', key: 'FK' },
        { name: 'title', type: 'varchar' },
        { name: 'release_year', type: 'int' },
        { name: 'cover_art_url', type: 'text' },
        { name: 'album_type', type: 'varchar', note: 'album | ep | single' }
      ],
      relations: [
        'Belongs to (N:1) ARTISTS',
        'Contains (0..1:N) TRACKS'
      ]
    },
    {
      name: 'TRACKS',
      description: 'Audio library with snippet offsets and YouTube iframe embeds',
      color: '#f59e0b',
      rowsCount: TRACKS.length,
      columns: [
        { name: 'track_id', type: 'int', key: 'PK' },
        { name: 'artist_id', type: 'int', key: 'FK' },
        { name: 'album_id', type: 'int', key: 'FK', note: 'Nullable for YT singles/covers' },
        { name: 'parent_track_id', type: 'int', key: 'FK', note: 'Self-FK for Cover/Remix' },
        { name: 'title', type: 'varchar' },
        { name: 'genre', type: 'varchar' },
        { name: 'yt_video_id', type: 'varchar', key: 'UK', note: '11-char YT IFrame Video ID' },
        { name: 'track_type', type: 'varchar', note: 'official_audio | music_video | remix | live_cover' },
        { name: 'duration_sec', type: 'int', note: 'Total track length in sec' },
        { name: 'snippet_start_sec', type: 'decimal', note: 'Game Hook Start Sec (e.g. 27.50)' },
        { name: 'custom_thumbnail_url', type: 'text', note: 'Nullable (Auto-uses YT thumb)' },
        { name: 'is_embeddable', type: 'boolean', note: 'True if YT IFrame allowed' }
      ],
      relations: [
        'Derives From Remix/Cover (1:N) TRACKS (Self)',
        'Logged in (1:N) LISTENING_HISTORY',
        'Tested in Game (1:N) GAME_ATTEMPTS',
        'Belongs to (N:1) ARTISTS & ALBUMS'
      ]
    },
    {
      name: 'PLAYLISTS',
      description: 'User-curated song collections with public/private visibility',
      color: '#3b82f6',
      rowsCount: PLAYLISTS.length,
      columns: [
        { name: 'playlist_id', type: 'int', key: 'PK' },
        { name: 'user_id', type: 'int', key: 'FK' },
        { name: 'title', type: 'varchar' },
        { name: 'is_public', type: 'boolean' },
        { name: 'created_at', type: 'timestamp' }
      ],
      relations: [
        'Created by (N:1) USERS',
        'Has (1:N) PLAYLIST_TRACKS'
      ]
    },
    {
      name: 'PLAYLIST_TRACKS',
      description: 'Junction table for ordered tracks in playlists',
      color: '#6366f1',
      rowsCount: PLAYLIST_TRACKS.length,
      columns: [
        { name: 'playlist_id', type: 'int', key: 'PK, FK' },
        { name: 'track_id', type: 'int', key: 'PK, FK' },
        { name: 'position_order', type: 'int' },
        { name: 'added_at', type: 'timestamp' }
      ],
      relations: [
        'References PLAYLISTS & TRACKS'
      ]
    },
    {
      name: 'LISTENING_HISTORY',
      description: 'User streaming logs, playback duration, and liked status',
      color: '#10b981',
      rowsCount: LISTENING_HISTORY.length,
      columns: [
        { name: 'history_id', type: 'int', key: 'PK' },
        { name: 'user_id', type: 'int', key: 'FK' },
        { name: 'track_id', type: 'int', key: 'FK' },
        { name: 'played_at', type: 'timestamp' },
        { name: 'listened_duration_sec', type: 'int', note: 'Duration streamed in sec' },
        { name: 'is_liked', type: 'boolean' }
      ],
      relations: [
        'Logged for (N:1) USERS & TRACKS'
      ]
    },
    {
      name: 'GAME_SESSIONS',
      description: 'Game rounds (Daily, Genre Rush, History Quiz) with score & streak',
      color: '#f97316',
      rowsCount: GAME_SESSIONS.length,
      columns: [
        { name: 'session_id', type: 'int', key: 'PK' },
        { name: 'user_id', type: 'int', key: 'FK' },
        { name: 'game_mode', type: 'varchar', note: 'daily | genre_rush | history' },
        { name: 'total_score', type: 'int', note: 'Derived via Trigger' },
        { name: 'max_streak', type: 'int' },
        { name: 'played_at', type: 'timestamp' }
      ],
      relations: [
        'Played by (N:1) USERS',
        'Logs Round (1:N) GAME_ATTEMPTS'
      ]
    },
    {
      name: 'GAME_ATTEMPTS',
      description: 'Individual song guesses with tier unlocks (0.1s - 5.0s) & speed scoring',
      color: '#ef4444',
      rowsCount: GAME_ATTEMPTS.length,
      columns: [
        { name: 'attempt_id', type: 'int', key: 'PK' },
        { name: 'session_id', type: 'int', key: 'FK' },
        { name: 'track_id', type: 'int', key: 'FK', note: 'Target YT IFrame Track' },
        { name: 'unlocked_tier_sec', type: 'decimal', note: '0.1 | 1.0 | 2.0 | 5.0' },
        { name: 'attempts_used', type: 'int', note: '1 to 4' },
        { name: 'is_correct', type: 'boolean' },
        { name: 'response_time_ms', type: 'int' },
        { name: 'points_awarded', type: 'int', note: '1000 | 750 | 500 | 250 | 0' }
      ],
      relations: [
        'Belongs to (N:1) GAME_SESSIONS',
        'Targets (N:1) TRACKS'
      ]
    }
  ];

  const currentTbl = schemaTables.find(t => t.name === selectedTable) || schemaTables[0];

  return (
    <div className="modal-backdrop" onClick={() => setIsSchemaModalOpen(false)}>
      <div className="schema-modal-container glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge erd-badge-icon">
              <Database size={20} />
            </div>
            <div>
              <h2 className="modal-title">Relational ERD Architecture Inspector</h2>
              <p className="modal-sub">
                Implemented 1:1 with your relational schema diagram
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => setIsSchemaModalOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="schema-modal-body">
          {/* Table Selector Pills */}
          <div className="schema-table-pills">
            {schemaTables.map(t => (
              <button
                key={t.name}
                className={`schema-pill-btn ${t.name === selectedTable ? 'active' : ''}`}
                style={{
                  borderColor: t.name === selectedTable ? t.color : 'transparent'
                }}
                onClick={() => setSelectedTable(t.name)}
              >
                <span
                  className="table-pill-indicator"
                  style={{ backgroundColor: t.color }}
                ></span>
                <span className="pill-name">{t.name}</span>
                <span className="pill-rows-count">{t.rowsCount}</span>
              </button>
            ))}
          </div>

          {/* Active Table Details */}
          <div className="table-details-card glass-panel">
            <div className="table-details-header">
              <div className="table-name-group">
                <span
                  className="table-tag"
                  style={{ backgroundColor: `${currentTbl.color}22`, color: currentTbl.color, borderColor: currentTbl.color }}
                >
                  TABLE
                </span>
                <h3 className="table-title">{currentTbl.name}</h3>
                <span className="table-live-count">{currentTbl.rowsCount} Records Loaded</span>
              </div>
              <p className="table-description">{currentTbl.description}</p>
            </div>

            {/* Column Schema Table */}
            <div className="table-scroll-view">
              <table className="erd-data-table">
                <thead>
                  <tr>
                    <th>Column Name</th>
                    <th>Data Type</th>
                    <th>Key / Constraint</th>
                    <th>Notes & Trigger Info</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTbl.columns.map((col, idx) => (
                    <tr key={idx}>
                      <td className="col-name font-mono">
                        <Key size={13} className="key-icon-subtle" />
                        {col.name}
                      </td>
                      <td className="col-type font-mono">{col.type}</td>
                      <td>
                        {col.key ? (
                          <span className={`key-badge key-${col.key.toLowerCase().replace(/[^a-z]/g, '')}`}>
                            {col.key}
                          </span>
                        ) : (
                          <span className="key-none">-</span>
                        )}
                      </td>
                      <td className="col-note">{col.note || 'Standard field'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Foreign Key Lineage & Relationships */}
            <div className="table-relations-box">
              <p className="relations-label">
                <Link2 size={14} /> Relationships & Constraints in Diagram:
              </p>
              <div className="relations-chips">
                {currentTbl.relations.map((rel, i) => (
                  <span key={i} className="relation-chip">
                    {rel}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={() => {
              setIsSchemaModalOpen(false);
              setActiveTab('schema');
            }}
          >
            <ExternalLink size={15} /> Open Full Visual Schema Page
          </button>
          <button
            className="btn-primary"
            onClick={() => setIsSchemaModalOpen(false)}
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
