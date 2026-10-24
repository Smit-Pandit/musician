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
  RefreshCw,
  Server,
  AlertTriangle,
  HardDrive,
  Cpu,
  Key
} from 'lucide-react';
import { sqlApi, sqlQueryLog, subscribeToSqlLog, subscribeToMySqlStatus } from '../services/sqlApi';

export default function SqlConsoleModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState(() => [...sqlQueryLog]);
  const [rawQuery, setRawQuery] = useState('SELECT track_id, title, genre, yt_video_id, duration_sec, is_embeddable FROM tracks LIMIT 10;');
  const [queryResult, setQueryResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('innodb'); // Default to innodb status tab!

  // MySQL Status & Config State
  const [mySql, setMySql] = useState({ connected: false });
  const [configForm, setConfigForm] = useState({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'music_game_db'
  });
  const [configStatus, setConfigStatus] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  useEffect(() => {
    const unsubLog = subscribeToSqlLog(() => {
      setLogs([...sqlQueryLog]);
    });
    const unsubStatus = subscribeToMySqlStatus(status => {
      setMySql(status);
      if (status.config) {
        setConfigForm(prev => ({
          ...prev,
          host: status.config.host || prev.host,
          port: status.config.port || prev.port,
          user: status.config.user || prev.user,
          database: status.database || status.config.database || prev.database
        }));
      }
    });
    return () => {
      unsubLog();
      unsubStatus();
    };
  }, []);

  if (!isOpen) return null;

  const handleRunQuery = async (e) => {
    e?.preventDefault();
    if (!rawQuery.trim()) return;
    setIsExecuting(true);
    try {
      const res = await sqlApi.executeRawQuery(rawQuery.trim());
      setQueryResult(res);
    } catch (err) {
      setQueryResult({ success: false, error: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRefreshStatus = async () => {
    await sqlApi.checkBackendStatus();
  };

  const handleUpdateConfig = async (e) => {
    e.preventDefault();
    setConfigStatus({ loading: true, message: 'Connecting to MySQL InnoDB...' });
    const res = await sqlApi.updateDbCredentials(configForm);
    if (res.success) {
      setConfigStatus({ type: 'success', message: `Connected to ${res.database || configForm.database} successfully!` });
    } else {
      setConfigStatus({ type: 'error', message: res.error || 'Connection failed' });
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedResult(null);
    try {
      const res = await sqlApi.initializeDatabase();
      if (res.success) {
        setSeedResult({ type: 'success', message: res.message || 'Database seeded successfully!' });
      } else {
        setSeedResult({ type: 'error', message: res.error || 'Seeding failed' });
      }
    } catch (e) {
      setSeedResult({ type: 'error', message: e.message });
    } finally {
      setIsSeeding(false);
    }
  };

  const sampleQueries = [
    'SELECT track_id, title, genre, yt_video_id, duration_sec FROM tracks;',
    'SELECT user_id, username, email, total_xp FROM users ORDER BY total_xp DESC;',
    'SELECT a.name, COUNT(t.track_id) AS track_count FROM artists a LEFT JOIN tracks t ON a.artist_id = t.artist_id GROUP BY a.artist_id;',
    'SELECT * FROM game_sessions ORDER BY played_at DESC LIMIT 5;',
    'SELECT * FROM game_attempts WHERE is_correct = 1;',
    'SHOW TABLES;'
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="sql-console-container glass-panel" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <div className={`modal-icon-badge ${mySql.connected ? 'innodb-badge-active' : 'sql-badge-icon'}`}>
              {mySql.connected ? <Server size={22} /> : <Terminal size={22} />}
            </div>
            <div>
              <div className="modal-title-row">
                <h2 className="modal-title">Relational SQL Engine &amp; InnoDB Console</h2>
                {mySql.connected ? (
                  <span className="pill-badge pill-innodb-online">
                    <span className="pulse-dot-green"></span>
                    MySQL InnoDB Live
                  </span>
                ) : (
                  <span className="pill-badge pill-innodb-offline">
                    <span className="pulse-dot-amber"></span>
                    In-Memory Relational
                  </span>
                )}
              </div>
              <p className="modal-sub">
                {mySql.connected
                  ? `Connected to local InnoDB on port ${mySql.config?.port || 3306} • Database: ${mySql.database}`
                  : 'Backend API server on port 5000 running in-memory fallback. Connect MySQL to stream live queries.'}
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
            className={`sql-tab ${activeTab === 'innodb' ? 'active' : ''}`}
            onClick={() => setActiveTab('innodb')}
          >
            <Server size={15} />
            <span>MySQL InnoDB Status</span>
            {mySql.connected && <span className="tab-live-indicator">LIVE</span>}
          </button>
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
            <span>MySQL InnoDB DDL</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="sql-console-body">
          {/* TAB 1: MYSQL INNODB STATUS */}
          {activeTab === 'innodb' && (
            <div className="sql-innodb-view">
              {/* Health Banner */}
              <div className={`innodb-status-card ${mySql.connected ? 'is-connected' : 'is-disconnected'}`}>
                <div className="innodb-card-header">
                  <div className="innodb-card-left">
                    <div className="innodb-indicator-dot"></div>
                    <div>
                      <h3 className="innodb-card-title">
                        {mySql.connected ? 'Local MySQL InnoDB Database Connected' : 'MySQL InnoDB Not Connected'}
                      </h3>
                      <p className="innodb-card-subtitle">
                        {mySql.connected
                          ? `ACID Compliant • Engine: ${mySql.engine} • Version: ${mySql.version || 'MySQL 8/MariaDB'} • Latency: ${mySql.latencyMs || 1}ms`
                          : (mySql.error || 'Ensure MySQL is running on port 3306 and node server/server.js is started.')}
                      </p>
                    </div>
                  </div>
                  <div className="innodb-card-actions">
                    <button className="btn-refresh-status" onClick={handleRefreshStatus} title="Refresh connection status">
                      <RefreshCw size={14} /> Refresh
                    </button>
                  </div>
                </div>

                {/* Stat Metric Badges */}
                <div className="innodb-metrics-row">
                  <div className="metric-chip">
                    <HardDrive size={14} className="metric-icon" />
                    <span className="metric-label">Database:</span>
                    <span className="metric-value font-mono">{mySql.database || 'music_game_db'}</span>
                  </div>
                  <div className="metric-chip">
                    <Cpu size={14} className="metric-icon" />
                    <span className="metric-label">Host:</span>
                    <span className="metric-value font-mono">{mySql.config?.host || 'localhost'}:{mySql.config?.port || 3306}</span>
                  </div>
                  <div className="metric-chip">
                    <Layers size={14} className="metric-icon" />
                    <span className="metric-label">Engine:</span>
                    <span className="metric-value font-mono">InnoDB</span>
                  </div>
                  <div className="metric-chip">
                    <Clock size={14} className="metric-icon" />
                    <span className="metric-label">Ping:</span>
                    <span className="metric-value font-mono">{mySql.latencyMs || 1}ms</span>
                  </div>
                </div>
              </div>

              {/* Table Rows Breakdown */}
              <div className="innodb-section">
                <div className="section-title-row">
                  <h4 className="section-title">
                    <Layers size={16} /> Relational Tables in `{mySql.database || 'music_game_db'}`
                  </h4>
                  <button
                    className="btn-seed-action"
                    onClick={handleSeedDatabase}
                    disabled={isSeeding}
                  >
                    <RefreshCw size={14} className={isSeeding ? 'spin-icon' : ''} />
                    <span>{isSeeding ? 'Seeding...' : 'Run Seed Script'}</span>
                  </button>
                </div>

                {seedResult && (
                  <div className={`seed-feedback-banner ${seedResult.type}`}>
                    {seedResult.message}
                  </div>
                )}

                <div className="innodb-tables-grid">
                  {(mySql.stats?.tables && mySql.stats.tables.length > 0 ? mySql.stats.tables : [
                    { name: 'artists', engine: 'InnoDB', rowCount: 5 },
                    { name: 'albums', engine: 'InnoDB', rowCount: 7 },
                    { name: 'tracks', engine: 'InnoDB', rowCount: 8 },
                    { name: 'users', engine: 'InnoDB', rowCount: 3 },
                    { name: 'playlists', engine: 'InnoDB', rowCount: 3 },
                    { name: 'playlist_tracks', engine: 'InnoDB', rowCount: 8 },
                    { name: 'listening_history', engine: 'InnoDB', rowCount: 4 },
                    { name: 'game_sessions', engine: 'InnoDB', rowCount: 3 },
                    { name: 'game_attempts', engine: 'InnoDB', rowCount: 3 }
                  ]).map((t, idx) => (
                    <div key={idx} className="table-stat-card glass-panel">
                      <div className="table-stat-header">
                        <span className="table-stat-name font-mono">{t.name}</span>
                        <span className="table-stat-engine">{t.engine || 'InnoDB'}</span>
                      </div>
                      <div className="table-stat-rows">
                        <span className="table-count-number">{t.rowCount ?? 0}</span>
                        <span className="table-count-label">rows</span>
                      </div>
                      <div className="table-stat-footer">
                        <button
                          className="table-peek-btn font-mono"
                          onClick={() => {
                            setRawQuery(`SELECT * FROM ${t.name} LIMIT 10;`);
                            setActiveTab('query');
                          }}
                        >
                          SELECT *
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* MySQL Credentials Form */}
              <div className="innodb-config-box glass-panel">
                <h4 className="config-box-title">
                  <Key size={16} /> Configure MySQL / MariaDB Connection
                </h4>
                <p className="config-box-subtitle">
                  Update database credentials dynamically without restarting the server:
                </p>
                <form onSubmit={handleUpdateConfig} className="innodb-config-form">
                  <div className="form-grid-3">
                    <div className="config-field">
                      <label>Host</label>
                      <input
                        type="text"
                        value={configForm.host}
                        onChange={e => setConfigForm({ ...configForm, host: e.target.value })}
                        placeholder="localhost"
                      />
                    </div>
                    <div className="config-field">
                      <label>Port</label>
                      <input
                        type="number"
                        value={configForm.port}
                        onChange={e => setConfigForm({ ...configForm, port: parseInt(e.target.value, 10) || 3306 })}
                        placeholder="3306"
                      />
                    </div>
                    <div className="config-field">
                      <label>Database</label>
                      <input
                        type="text"
                        value={configForm.database}
                        onChange={e => setConfigForm({ ...configForm, database: e.target.value })}
                        placeholder="music_game_db"
                      />
                    </div>
                  </div>
                  <div className="form-grid-2">
                    <div className="config-field">
                      <label>User</label>
                      <input
                        type="text"
                        value={configForm.user}
                        onChange={e => setConfigForm({ ...configForm, user: e.target.value })}
                        placeholder="root"
                      />
                    </div>
                    <div className="config-field">
                      <label>Password</label>
                      <input
                        type="password"
                        value={configForm.password}
                        onChange={e => setConfigForm({ ...configForm, password: e.target.value })}
                        placeholder="(Empty for default XAMPP/local)"
                      />
                    </div>
                  </div>
                  <div className="config-submit-row">
                    <button type="submit" className="btn-primary btn-save-config">
                      Test &amp; Connect to InnoDB
                    </button>
                    {configStatus && (
                      <span className={`config-status-msg ${configStatus.type}`}>
                        {configStatus.message}
                      </span>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE QUERY STREAM */}
          {activeTab === 'stream' && (
            <div className="sql-stream-view">
              <div className="stream-header-row">
                <span className="stream-caption">
                  Active SQL queries dispatched by frontend user actions, audio streams, games &amp; auth:
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
                        {log.isRealMysql && (
                          <span className="innodb-tag font-mono">
                            ⚡ InnoDB Live
                          </span>
                        )}
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

          {/* TAB 3: INTERACTIVE SQL PLAYGROUND */}
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
                  <button type="submit" className="btn-run-sql btn-primary" disabled={isExecuting}>
                    <Play size={15} /> {isExecuting ? 'Running...' : 'Execute on InnoDB'}
                  </button>
                </div>
              </form>

              {queryResult && (
                <div className="query-result-box glass-panel">
                  <div className="result-header">
                    <span className="result-count font-mono">
                      {queryResult.success ? (
                        <>Returned {queryResult.count} row{queryResult.count !== 1 ? 's' : ''} {queryResult.isRealMysql ? '(via MySQL InnoDB)' : '(in-memory)'}</>
                      ) : (
                        <span className="error-text">Execution Error</span>
                      )}
                    </span>
                  </div>
                  <div className="result-table-scroll">
                    {queryResult.success ? (
                      <pre className="result-json font-mono">
                        {JSON.stringify(queryResult.rows, null, 2)}
                      </pre>
                    ) : (
                      <div className="result-error-box font-mono">
                        {queryResult.error}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MYSQL INNODB DDL & TRIGGERS */}
          {activeTab === 'ddl' && (
            <div className="sql-ddl-view">
              <div className="ddl-info-row">
                <span className="badge badge-purple">database/schema.sql (MySQL InnoDB)</span>
                <span className="ddl-caption">
                  Native MySQL / MariaDB InnoDB DDL with ENGINE=InnoDB, Foreign Keys, Check Constraints &amp; Triggers
                </span>
              </div>
              <pre className="ddl-code-pre font-mono">
{`-- 1. ARTISTS TABLE
CREATE TABLE artists (
    artist_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    yt_channel_id VARCHAR(100) UNIQUE DEFAULT NULL,
    verified_status BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. ALBUMS TABLE
CREATE TABLE albums (
    album_id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    release_year INT NOT NULL,
    cover_art_url TEXT NOT NULL,
    album_type VARCHAR(20) NOT NULL,
    CONSTRAINT chk_album_type CHECK (album_type IN ('album', 'ep', 'single')),
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. USERS TABLE
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    total_xp INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. TRACKS TABLE (Parent-lineage FK for covers/remixes)
CREATE TABLE tracks (
    track_id INT AUTO_INCREMENT PRIMARY KEY,
    artist_id INT NOT NULL,
    album_id INT DEFAULT NULL,
    parent_track_id INT DEFAULT NULL,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    yt_video_id VARCHAR(11) NOT NULL UNIQUE,
    track_type VARCHAR(30) NOT NULL,
    duration_sec INT NOT NULL,
    snippet_start_sec DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
    custom_thumbnail_url TEXT DEFAULT NULL,
    is_embeddable BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(album_id) ON DELETE SET NULL,
    FOREIGN KEY (parent_track_id) REFERENCES tracks(track_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. GAME_SESSIONS & 6. GAME_ATTEMPTS
CREATE TABLE game_attempts (
    attempt_id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    track_id INT NOT NULL,
    unlocked_tier_sec DECIMAL(3, 1) NOT NULL,
    attempts_used INT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    response_time_ms INT NOT NULL DEFAULT 0,
    points_awarded INT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INNODB TRIGGER FOR DERIVED TOTAL_SCORE:
DELIMITER $$
CREATE TRIGGER trg_after_insert_game_attempt_score
AFTER INSERT ON game_attempts
FOR EACH ROW
BEGIN
    UPDATE game_sessions
    SET total_score = (
        SELECT COALESCE(SUM(points_awarded), 0)
        FROM game_attempts
        WHERE session_id = NEW.session_id
    )
    WHERE session_id = NEW.session_id;
END$$
DELIMITER ;`}
              </pre>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="modal-footer-left">
            <span className="innodb-engine-stamp">
              Engine: <strong>InnoDB (ACID Compliant)</strong>
            </span>
          </div>
          <button className="btn-secondary" onClick={onClose}>
            Close Console
          </button>
        </div>
      </div>
    </div>
  );
}
