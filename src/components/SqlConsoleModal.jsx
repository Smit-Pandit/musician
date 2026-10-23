import React, { useState, useEffect } from 'react';
import {
  Database,
  Terminal,
  Play,
  X,
  Clock,
  CheckCircle,
  Copy,
  Layers,
  Code,
  FileText,
  Trash2,
  RefreshCw
} from 'lucide-react';
import { sqlApi, sqlQueryLog, subscribeToSqlLog } from '../services/sqlApi';

export default function SqlConsoleModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState(() => [...sqlQueryLog]);
  const [rawQuery, setRawQuery] = useState('SELECT * FROM tracks WHERE is_embeddable = 1;');
  const [queryResult, setQueryResult] = useState(null);
  const [activeTab, setActiveTab] = useState('stream'); // 'stream' | 'query' | 'ddl'

  useEffect(() => {
    const unsubscribe = subscribeToSqlLog(() => {
      setLogs([...sqlQueryLog]);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const handleRunQuery = (e) => {
    e?.preventDefault();
    if (!rawQuery.trim()) return;
    const res = sqlApi.executeRawQuery(rawQuery.trim());
    setQueryResult(res);
  };

  const sampleQueries = [
    'SELECT * FROM users ORDER BY total_xp DESC;',
    'SELECT * FROM tracks WHERE genre = "Synthwave";',
    'SELECT * FROM game_attempts WHERE is_correct = 1;',
    'SELECT * FROM playlists WHERE is_public = 1;',
    'SELECT * FROM listening_history ORDER BY played_at DESC;'
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sql-console-container glass-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge sql-badge-icon">
              <Terminal size={20} />
            </div>
            <div>
              <h2 className="modal-title">Live SQL Engine &amp; Endpoint Console</h2>
              <p className="modal-sub">
                Every API call executes real SQL queries mapped to the updated ER diagram
              </p>
            </div>
          </div>
          <div className="modal-header-actions">
            <button className="modal-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="sql-tabs-bar">
          <button
            className={`sql-tab ${activeTab === 'stream' ? 'active' : ''}`}
            onClick={() => setActiveTab('stream')}
          >
            <Clock size={15} />
            <span>Live Query Stream</span>
            <span className="sql-count-pill">{logs.length}</span>
          </button>
          <button
            className={`sql-tab ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => setActiveTab('query')}
          >
            <Terminal size={15} />
            <span>Interactive SQL Playground</span>
          </button>
          <button
            className={`sql-tab ${activeTab === 'ddl' ? 'active' : ''}`}
            onClick={() => setActiveTab('ddl')}
          >
            <FileText size={15} />
            <span>schema.sql (DDL &amp; Triggers)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="sql-console-body">
          {/* TAB 1: LIVE QUERY STREAM */}
          {activeTab === 'stream' && (
            <div className="sql-stream-view">
              <div className="stream-header-row">
                <span className="stream-caption">
                  Active queries dispatched by user clicks, games, audio streams &amp; auth:
                </span>
                <button
                  className="btn-clear-logs"
                  onClick={() => {
                    sqlQueryLog.length = 0;
                    setLogs([]);
                  }}
                >
                  <Trash2 size={13} /> Clear Log
                </button>
              </div>

              <div className="sql-logs-scroll">
                {logs.length === 0 ? (
                  <div className="empty-logs-msg">
                    No queries logged yet. Click around the app (play songs, guess songs, like tracks) to see live SQL in action!
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="sql-log-card glass-panel">
                      <div className="log-top-meta">
                        <span className={`sql-verb-tag verb-${log.sql.split(' ')[0].toLowerCase()}`}>
                          {log.sql.split(' ')[0]}
                        </span>
                        <span className="log-time font-mono">{log.timestamp}</span>
                        <span className="log-latency font-mono">
                          <Clock size={11} /> {log.executionTimeMs}ms
                        </span>
                        <span className="log-rows font-mono">
                          {log.affectedRows} row{log.affectedRows !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <pre className="sql-code-block font-mono">{log.sql}</pre>
                      {log.params && log.params.length > 0 && (
                        <div className="log-params-row font-mono">
                          <span>Params:</span> [{log.params.map(p => JSON.stringify(p)).join(', ')}]
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE SQL PLAYGROUND */}
          {activeTab === 'query' && (
            <div className="sql-playground-view">
              <div className="sample-queries-strip">
                <span className="sample-label">Sample Queries:</span>
                <div className="sample-chips">
                  {sampleQueries.map((q, i) => (
                    <button
                      key={i}
                      className="sample-query-chip font-mono"
                      onClick={() => setRawQuery(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleRunQuery} className="sql-query-form">
                <div className="query-editor-wrap">
                  <textarea
                    className="sql-query-editor font-mono"
                    rows={4}
                    value={rawQuery}
                    onChange={e => setRawQuery(e.target.value)}
                    placeholder="Enter SQL Query (e.g. SELECT * FROM tracks;)"
                  />
                  <button type="submit" className="btn-run-sql btn-primary">
                    <Play size={15} /> Execute SQL
                  </button>
                </div>
              </form>

              {queryResult && (
                <div className="query-result-box glass-panel">
                  <div className="result-header">
                    <span className="result-count font-mono">
                      Returned {queryResult.count} row{queryResult.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="result-table-scroll">
                    <pre className="result-json font-mono">
                      {JSON.stringify(queryResult.rows, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DDL & TRIGGERS */}
          {activeTab === 'ddl' && (
            <div className="sql-ddl-view">
              <div className="ddl-info-row">
                <span className="badge badge-purple">database/schema.sql</span>
                <span className="ddl-caption">
                  Full production-ready SQL DDL with Foreign Keys, Check Constraints &amp; Trigger Derivations
                </span>
              </div>
              <pre className="ddl-code-pre font-mono">
{`-- 1. ARTISTS (avatar_url, verified_status, optional yt_channel_id)
CREATE TABLE artists (
    artist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    yt_channel_id VARCHAR(100) UNIQUE,
    verified_status BOOLEAN NOT NULL DEFAULT 0,
    avatar_url TEXT NOT NULL
);

-- 2. ALBUMS (album_type in album, ep, single)
CREATE TABLE albums (
    album_id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    release_year INTEGER NOT NULL,
    cover_art_url TEXT NOT NULL,
    album_type VARCHAR(20) NOT NULL CHECK (album_type IN ('album', 'ep', 'single')),
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE
);

-- 3. USERS (derived total_xp via trigger)
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    total_xp INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRACKS (duration_sec, snippet_start_sec, yt_video_id, parent_track_id)
CREATE TABLE tracks (
    track_id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    album_id INTEGER,
    parent_track_id INTEGER,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    yt_video_id VARCHAR(11) NOT NULL UNIQUE,
    track_type VARCHAR(30) NOT NULL CHECK (track_type IN ('official_audio', 'music_video', 'remix', 'live_cover')),
    duration_sec INTEGER NOT NULL,
    snippet_start_sec DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    custom_thumbnail_url TEXT,
    is_embeddable BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(album_id) ON DELETE SET NULL,
    FOREIGN KEY (parent_track_id) REFERENCES tracks(track_id) ON DELETE SET NULL
);

-- 5. GAME_SESSIONS & 6. GAME_ATTEMPTS (unlocked_tier_sec 0.1, 1.0, 2.0, 5.0)
CREATE TABLE game_attempts (
    attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    unlocked_tier_sec DECIMAL(3, 1) NOT NULL CHECK (unlocked_tier_sec IN (0.1, 1.0, 2.0, 5.0)),
    attempts_used INTEGER NOT NULL CHECK (attempts_used BETWEEN 1 AND 4),
    is_correct BOOLEAN NOT NULL DEFAULT 0,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    points_awarded INTEGER NOT NULL CHECK (points_awarded IN (1000, 750, 500, 250, 0)),
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
);

-- TRIGGERS TO AUTO-UPDATE DERIVED FIELDS:
CREATE TRIGGER trg_after_insert_game_attempt_score
AFTER INSERT ON game_attempts
BEGIN
    UPDATE game_sessions
    SET total_score = (SELECT COALESCE(SUM(points_awarded), 0) FROM game_attempts WHERE session_id = NEW.session_id)
    WHERE session_id = NEW.session_id;
END;`}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}
