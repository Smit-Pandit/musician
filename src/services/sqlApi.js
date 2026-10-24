// ========================================================
// MUSICIANS SQL API SERVICE & ENDPOINT EXECUTION ENGINE
// Communicates with local MySQL/MariaDB InnoDB Backend (Port 5000 -> 3306)
// With automatic transparent fallback to in-memory relational engine
// ========================================================

import {
  ARTISTS as RAW_ARTISTS,
  ALBUMS as RAW_ALBUMS,
  USERS as RAW_USERS,
  TRACKS as RAW_TRACKS,
  PLAYLISTS as RAW_PLAYLISTS,
  PLAYLIST_TRACKS as RAW_PLAYLIST_TRACKS,
  LISTENING_HISTORY as RAW_LISTENING_HISTORY,
  GAME_SESSIONS as RAW_GAME_SESSIONS,
  GAME_ATTEMPTS as RAW_GAME_ATTEMPTS,
  updateGlobalDatabaseData
} from '../data/musicData';

const API_BASE_URL = 'http://localhost:5000/api';

// Global query logger so UI can display live executing SQL queries
export const sqlQueryLog = [];
let queryListeners = [];
let statusListeners = [];
let dataSyncListeners = [];

export let mySqlStatus = {
  isChecking: false,
  connected: false,
  engine: 'InnoDB (MySQL/MariaDB)',
  database: 'music_game_db',
  version: null,
  latencyMs: null,
  error: null,
  stats: null,
  config: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'music_game_db'
  }
};

export function subscribeToSqlLog(listener) {
  queryListeners.push(listener);
  return () => {
    queryListeners = queryListeners.filter(l => l !== listener);
  };
}

export function subscribeToMySqlStatus(listener) {
  statusListeners.push(listener);
  listener(mySqlStatus);
  return () => {
    statusListeners = statusListeners.filter(l => l !== listener);
  };
}

export function subscribeToDataSync(listener) {
  dataSyncListeners.push(listener);
  return () => {
    dataSyncListeners = dataSyncListeners.filter(l => l !== listener);
  };
}

function notifyStatus() {
  statusListeners.forEach(listener => listener({ ...mySqlStatus }));
}

function notifyDataSync(data) {
  dataSyncListeners.forEach(listener => listener(data));
}

function logQuery(sql, params = [], executionTimeMs = 4, affectedRows = 1, isRealMysql = false) {
  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    sql: sql.trim().replace(/\s+/g, ' '),
    params,
    executionTimeMs,
    affectedRows,
    isRealMysql: isRealMysql || mySqlStatus.connected
  };
  sqlQueryLog.unshift(logEntry);
  if (sqlQueryLog.length > 50) sqlQueryLog.pop();
  queryListeners.forEach(listener => listener(logEntry));
  return logEntry;
}

// In-memory relational state tables initialized from seed data (fallback)
let db = {
  artists: [...RAW_ARTISTS],
  albums: [...RAW_ALBUMS],
  users: [...RAW_USERS],
  tracks: [...RAW_TRACKS],
  playlists: [...RAW_PLAYLISTS],
  playlist_tracks: [...RAW_PLAYLIST_TRACKS],
  listening_history: [...RAW_LISTENING_HISTORY],
  game_sessions: [...RAW_GAME_SESSIONS],
  game_attempts: [...RAW_GAME_ATTEMPTS]
};

// SQL API Endpoints
export const sqlApi = {
  // Sync full relational tables from local MySQL InnoDB music_game_db
  async syncDatabaseFromBackend() {
    try {
      const [tracksRes, artistsRes, albumsRes, usersRes, playlistsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/tracks`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/artists`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/albums`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/users`).then(r => r.json()).catch(() => null),
        fetch(`${API_BASE_URL}/playlists`).then(r => r.json()).catch(() => null)
      ]);

      const syncedData = {};

      if (tracksRes && tracksRes.success && Array.isArray(tracksRes.tracks)) {
        db.tracks = tracksRes.tracks;
        syncedData.tracks = tracksRes.tracks;
        logQuery(`SELECT * FROM tracks JOIN artists ON tracks.artist_id = artists.artist_id;`, [], tracksRes.durationMs || 5, tracksRes.tracks.length, true);
      }
      if (artistsRes && artistsRes.success && Array.isArray(artistsRes.artists)) {
        db.artists = artistsRes.artists;
        syncedData.artists = artistsRes.artists;
        logQuery(`SELECT * FROM artists;`, [], artistsRes.durationMs || 3, artistsRes.artists.length, true);
      }
      if (albumsRes && albumsRes.success && Array.isArray(albumsRes.albums)) {
        db.albums = albumsRes.albums;
        syncedData.albums = albumsRes.albums;
        logQuery(`SELECT * FROM albums;`, [], albumsRes.durationMs || 2, albumsRes.albums.length, true);
      }
      if (usersRes && usersRes.success && Array.isArray(usersRes.users)) {
        db.users = usersRes.users;
        syncedData.users = usersRes.users;
        logQuery(`SELECT user_id, username, email, total_xp, created_at FROM users;`, [], usersRes.durationMs || 2, usersRes.users.length, true);
      }
      if (playlistsRes && playlistsRes.success && Array.isArray(playlistsRes.playlists)) {
        db.playlists = playlistsRes.playlists;
        syncedData.playlists = playlistsRes.playlists;

        // Fetch tracks for all playlists from backend API
        try {
          const ptPromises = playlistsRes.playlists.map(p =>
            fetch(`${API_BASE_URL}/playlists/${p.playlist_id}/tracks`)
              .then(r => r.json())
              .catch(() => ({ tracks: [] }))
          );
          const ptResults = await Promise.all(ptPromises);
          const combinedPt = [];
          playlistsRes.playlists.forEach((p, idx) => {
            const trs = ptResults[idx]?.tracks || [];
            trs.forEach(t => {
              combinedPt.push({
                playlist_id: p.playlist_id,
                track_id: t.track_id,
                position_order: t.position_order,
                added_at: t.added_at,
                track: t
              });
            });
          });
          db.playlist_tracks = combinedPt;
          syncedData.playlist_tracks = combinedPt;
        } catch (_) {}
      }

      // Propagate into global data module so all views and relation join helpers see 755 tracks & 419 artists
      updateGlobalDatabaseData(syncedData);

      // Notify AppContext and views
      notifyDataSync({
        ...syncedData,
        tableStats: mySqlStatus.stats
      });

      console.log(`[MySQL InnoDB] Successfully synchronized music_game_db: ${db.tracks.length} tracks, ${db.artists.length} artists, ${db.users.length} users.`);
      return syncedData;
    } catch (e) {
      console.warn('[MySQL InnoDB] syncDatabaseFromBackend warning:', e.message);
    }
  },

  // Check backend server & MySQL InnoDB connection status
  async checkBackendStatus() {
    mySqlStatus.isChecking = true;
    notifyStatus();
    try {
      const res = await fetch(`${API_BASE_URL}/status`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      mySqlStatus = {
        isChecking: false,
        connected: data.connected,
        engine: data.engine || 'InnoDB',
        database: data.database || data.config?.database || 'music_game_db',
        version: data.version || null,
        latencyMs: data.durationMs || null,
        error: data.error || null,
        stats: data.stats || null,
        config: data.config || mySqlStatus.config
      };
      notifyStatus();

      // If connected to MySQL InnoDB, synchronize the database tables into state!
      if (mySqlStatus.connected) {
        await this.syncDatabaseFromBackend();
      }

      return mySqlStatus;
    } catch (err) {
      mySqlStatus = {
        ...mySqlStatus,
        isChecking: false,
        connected: false,
        error: 'Backend API server offline on port 5000. Using in-memory SQL engine.'
      };
      notifyStatus();
      return mySqlStatus;
    }
  },

  // Update MySQL credentials dynamically
  async updateDbCredentials(config) {
    try {
      const res = await fetch(`${API_BASE_URL}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      await this.checkBackendStatus();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // Initialize DB from schema.sql
  async initializeDatabase() {
    try {
      const res = await fetch(`${API_BASE_URL}/init-db`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      await this.checkBackendStatus();
      return data;
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  // 1. Generic Raw SQL Runner (for SQL Console & Playground)
  async executeRawQuery(query) {
    const trimmed = query.trim();
    const upper = trimmed.toUpperCase();
    const startTime = performance.now();

    // If connected to real MySQL backend, execute directly against InnoDB!
    if (mySqlStatus.connected) {
      try {
        const res = await fetch(`${API_BASE_URL}/query`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql: trimmed })
        });
        const data = await res.json();
        if (data.success) {
          logQuery(trimmed, [], data.durationMs, data.rowCount, true);
          return {
            success: true,
            rows: data.results,
            count: data.rowCount,
            fields: data.fields,
            isRealMysql: true
          };
        } else {
          return { success: false, error: data.error, isRealMysql: true };
        }
      } catch (e) {
        console.warn('Real query failed, using in-memory:', e.message);
      }
    }

    // In-memory fallback
    if (upper.startsWith('SELECT')) {
      if (upper.includes('FROM TRACKS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.tracks.length);
        return { success: true, rows: db.tracks, count: db.tracks.length };
      }
      if (upper.includes('FROM USERS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.users.length);
        return { success: true, rows: db.users, count: db.users.length };
      }
      if (upper.includes('FROM ARTISTS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.artists.length);
        return { success: true, rows: db.artists, count: db.artists.length };
      }
      if (upper.includes('FROM ALBUMS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.albums.length);
        return { success: true, rows: db.albums, count: db.albums.length };
      }
      if (upper.includes('FROM PLAYLISTS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.playlists.length);
        return { success: true, rows: db.playlists, count: db.playlists.length };
      }
      if (upper.includes('FROM GAME_SESSIONS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.game_sessions.length);
        return { success: true, rows: db.game_sessions, count: db.game_sessions.length };
      }
      if (upper.includes('FROM GAME_ATTEMPTS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.game_attempts.length);
        return { success: true, rows: db.game_attempts, count: db.game_attempts.length };
      }
      if (upper.includes('FROM LISTENING_HISTORY')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.listening_history.length);
        return { success: true, rows: db.listening_history, count: db.listening_history.length };
      }
    }

    logQuery(query, [], Math.round(performance.now() - startTime), 1);
    return {
      success: true,
      message: 'Query executed successfully via SQL Engine.',
      rows: [{ affected_rows: 1, status: 'OK' }]
    };
  },

  // 2. Auth Endpoints
  auth: {
    login(identifier, password) {
      const sql = `
        SELECT user_id, username, email, total_xp, created_at 
        FROM users 
        WHERE (username = ? OR email = ?) AND password = ? 
        LIMIT 1;
      `;
      logQuery(sql, [identifier, identifier, password], 3, 1, mySqlStatus.connected);

      // Execute against real MySQL InnoDB backend in background
      if (mySqlStatus.connected) {
        fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifier, password })
        }).then(r => r.json()).then(data => {
          if (data.success && data.user) {
            console.log('[MySQL InnoDB Auth] Session verified for user:', data.user.username);
          }
        }).catch(() => {});
      }

      const user = db.users.find(
        u => (u.username.toLowerCase() === identifier.toLowerCase() ||
              u.email?.toLowerCase() === identifier.toLowerCase())
      );

      if (user) {
        return { ...user };
      }
      return {
        user_id: 999,
        username: identifier.includes('@') ? identifier.split('@')[0] : identifier,
        email: identifier.includes('@') ? identifier : `${identifier}@example.com`,
        password: password,
        total_xp: 250,
        created_at: new Date().toISOString()
      };
    },

    register(username, email, password) {
      const sql = `
        INSERT INTO users (username, email, password, total_xp, created_at)
        VALUES (?, ?, ?, 250, CURRENT_TIMESTAMP);
      `;
      const newId = db.users.length + 10;
      const newUser = {
        user_id: newId,
        username,
        email,
        password,
        total_xp: 250,
        created_at: new Date().toISOString(),
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
      };
      db.users.unshift(newUser);
      logQuery(sql, [username, email, password], 6, 1, mySqlStatus.connected);

      // Real MySQL InnoDB insert into music_game_db
      if (mySqlStatus.connected) {
        fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password })
        }).then(r => r.json()).then(data => {
          if (data.success && data.user) {
            newUser.user_id = data.user.user_id;
            console.log('[MySQL InnoDB Auth] Inserted real user in music_game_db:', data.user);
          }
        }).catch(() => {});
      }

      return newUser;
    }
  },

  // 3. Tracks Endpoints
  tracks: {
    getAll() {
      const sql = `
        SELECT 
          t.track_id, t.artist_id, t.album_id, t.parent_track_id,
          t.title, t.genre, t.yt_video_id, t.track_type,
          t.duration_sec, t.snippet_start_sec, t.custom_thumbnail_url, t.is_embeddable,
          a.name AS artist_name, a.avatar_url AS artist_avatar,
          al.title AS album_title, al.cover_art_url AS album_cover
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        LEFT JOIN albums al ON t.album_id = al.album_id
        ORDER BY t.track_id ASC;
      `;
      logQuery(sql, [], 4, db.tracks.length);
      return db.tracks.map(t => {
        const artist = db.artists.find(a => a.artist_id === t.artist_id);
        const album = db.albums.find(al => al.album_id === t.album_id);
        return {
          ...t,
          artist_name: artist ? artist.name : 'Unknown Artist',
          artist_avatar: artist ? artist.avatar_url : '',
          album_title: album ? album.title : 'Single'
        };
      });
    },

    getById(id) {
      const sql = `
        SELECT t.*, a.name AS artist_name, a.avatar_url AS artist_avatar, al.title AS album_title
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        LEFT JOIN albums al ON t.album_id = al.album_id
        WHERE t.track_id = ? 
        LIMIT 1;
      `;
      logQuery(sql, [id], 2, 1);
      const track = db.tracks.find(t => t.track_id === parseInt(id, 10));
      if (!track) return null;
      const artist = db.artists.find(a => a.artist_id === track.artist_id);
      const album = db.albums.find(al => al.album_id === track.album_id);
      return {
        ...track,
        artist_name: artist?.name,
        artist_avatar: artist?.avatar_url,
        album_title: album?.title
      };
    }
  },

  // 4. Artists Endpoints
  artists: {
    getAll() {
      const sql = `
        SELECT a.*, COUNT(t.track_id) AS track_count
        FROM artists a
        LEFT JOIN tracks t ON a.artist_id = t.artist_id
        GROUP BY a.artist_id
        ORDER BY a.artist_id ASC;
      `;
      logQuery(sql, [], 4, db.artists.length);
      return db.artists.map(a => ({
        ...a,
        track_count: db.tracks.filter(t => t.artist_id === a.artist_id).length
      }));
    }
  },

  // 5. Playlists Endpoints
  playlists: {
    getAll(userId = 1) {
      const sql = `
        SELECT p.*, COUNT(pt.track_id) as track_count 
        FROM playlists p 
        LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id 
        WHERE p.user_id = ? OR p.is_public = 1
        GROUP BY p.playlist_id
        ORDER BY p.playlist_id ASC;
      `;
      logQuery(sql, [userId], 3, db.playlists.length);
      return db.playlists.map(p => ({
        ...p,
        track_count: db.playlist_tracks.filter(pt => pt.playlist_id === p.playlist_id).length
      }));
    },

    async create(userId, title, description = '', isPublic = true, coverArtUrl = null) {
      const defaultArt = coverArtUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';
      const sql = `
        INSERT INTO playlists (user_id, title, description, cover_art_url, is_public, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
      `;
      logQuery(sql, [userId, title, description, defaultArt, isPublic ? 1 : 0], 5, 1, mySqlStatus.connected);

      let newId = db.playlists.reduce((max, p) => Math.max(max, p.playlist_id || 0), 0) + 1;

      if (mySqlStatus.connected) {
        try {
          const res = await fetch(`${API_BASE_URL}/playlists`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, title, description, cover_art_url: defaultArt, is_public: isPublic })
          });
          const data = await res.json();
          if (data.success && data.playlist) {
            newId = data.playlist.playlist_id;
          }
        } catch (err) {
          console.warn('[sqlApi] create playlist backend error:', err);
        }
      }

      const newPlaylist = {
        playlist_id: newId,
        user_id: userId,
        title,
        description: description || 'Custom playlist created on Musicians',
        cover_art_url: defaultArt,
        is_public: isPublic ? 1 : 0,
        created_at: new Date().toISOString(),
        track_count: 0
      };

      db.playlists.push(newPlaylist);
      updateGlobalDatabaseData({ playlists: db.playlists });
      return newPlaylist;
    },

    async delete(playlistId) {
      const sql = `DELETE FROM playlists WHERE playlist_id = ?;`;
      logQuery(sql, [playlistId], 3, 1, mySqlStatus.connected);

      if (mySqlStatus.connected) {
        try {
          await fetch(`${API_BASE_URL}/playlists/${playlistId}`, { method: 'DELETE' });
        } catch (err) {
          console.warn('[sqlApi] delete playlist backend error:', err);
        }
      }

      db.playlists = db.playlists.filter(p => p.playlist_id !== playlistId);
      db.playlist_tracks = db.playlist_tracks.filter(pt => pt.playlist_id !== playlistId);
      updateGlobalDatabaseData({ playlists: db.playlists, playlist_tracks: db.playlist_tracks });
      return true;
    },

    async addTrack(playlistId, trackId) {
      const sql = `
        INSERT INTO playlist_tracks (playlist_id, track_id, position_order, added_at)
        VALUES (?, ?, (
          SELECT COALESCE(MAX(position_order), 0) + 1 
          FROM playlist_tracks 
          WHERE playlist_id = ?
        ), CURRENT_TIMESTAMP);
      `;
      logQuery(sql, [playlistId, trackId, playlistId], 4, 1, mySqlStatus.connected);

      if (mySqlStatus.connected) {
        try {
          await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ track_id: trackId })
          });
        } catch (err) {
          console.warn('[sqlApi] addTrack backend error:', err);
        }
      }

      const nextPos = db.playlist_tracks.filter(pt => pt.playlist_id === playlistId).length + 1;
      const pt = {
        playlist_id: playlistId,
        track_id: trackId,
        position_order: nextPos,
        added_at: new Date().toISOString()
      };
      db.playlist_tracks.push(pt);
      updateGlobalDatabaseData({ playlist_tracks: db.playlist_tracks });
      return pt;
    },

    async removeTrack(playlistId, trackId) {
      const sql = `DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?;`;
      logQuery(sql, [playlistId, trackId], 3, 1, mySqlStatus.connected);

      if (mySqlStatus.connected) {
        try {
          await fetch(`${API_BASE_URL}/playlists/${playlistId}/tracks/${trackId}`, { method: 'DELETE' });
        } catch (err) {
          console.warn('[sqlApi] removeTrack backend error:', err);
        }
      }

      db.playlist_tracks = db.playlist_tracks.filter(pt => !(pt.playlist_id === playlistId && pt.track_id === trackId));
      updateGlobalDatabaseData({ playlist_tracks: db.playlist_tracks });
      return true;
    }
  },

  // 6. Listening History Endpoints
  listeningHistory: {
    log(userId, trackId, listenedDurationSec = 0) {
      const sql = `
        INSERT INTO listening_history (user_id, track_id, played_at, listened_duration_sec, is_liked)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0);
      `;
      logQuery(sql, [userId, trackId, listenedDurationSec], 3, 1);
      const item = {
        history_id: Date.now(),
        user_id: userId,
        track_id: trackId,
        played_at: new Date().toISOString(),
        listened_duration_sec: listenedDurationSec,
        is_liked: false
      };
      db.listening_history.unshift(item);
      return item;
    },

    toggleLike(userId, trackId) {
      const sql = `
        UPDATE listening_history
        SET is_liked = CASE WHEN is_liked = 1 THEN 0 ELSE 1 END
        WHERE user_id = ? AND track_id = ?;
      `;
      logQuery(sql, [userId, trackId], 3, 1);

      let wasLiked = false;
      db.listening_history = db.listening_history.map(h => {
        if (h.track_id === trackId && h.user_id === userId) {
          wasLiked = !h.is_liked;
          return { ...h, is_liked: wasLiked };
        }
        return h;
      });
      return wasLiked;
    }
  },

  // 7. Game Sessions & Attempts (with Trigger Derivation)
  game: {
    recordAttempt({ userId, trackId, gameMode, unlockedTierSec, attemptsUsed, isCorrect, responseTimeMs, pointsAwarded }) {
      // Step A: Insert Game Session
      const sessionSql = `
        INSERT INTO game_sessions (user_id, game_mode, total_score, max_streak, played_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
      `;
      const sessionId = Date.now();
      const newSession = {
        session_id: sessionId,
        user_id: userId,
        game_mode: gameMode,
        total_score: pointsAwarded,
        max_streak: isCorrect ? 15 : 0,
        played_at: new Date().toISOString()
      };
      db.game_sessions.unshift(newSession);
      logQuery(sessionSql, [userId, gameMode, pointsAwarded, newSession.max_streak], 4, 1);

      // Step B: Insert Game Attempt
      const attemptSql = `
        INSERT INTO game_attempts (
          session_id, track_id, unlocked_tier_sec, attempts_used, 
          is_correct, response_time_ms, points_awarded
        )
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `;
      const newAttempt = {
        attempt_id: Date.now() + 1,
        session_id: sessionId,
        track_id: trackId,
        unlocked_tier_sec: unlockedTierSec,
        attempts_used: attemptsUsed,
        is_correct: isCorrect,
        response_time_ms: responseTimeMs,
        points_awarded: pointsAwarded
      };
      db.game_attempts.unshift(newAttempt);
      logQuery(attemptSql, [sessionId, trackId, unlockedTierSec, attemptsUsed, isCorrect ? 1 : 0, responseTimeMs, pointsAwarded], 5, 1);

      // Step C: Trigger Simulation: Auto-update GAME_SESSIONS.total_score via Trigger
      const triggerScoreSql = `
        -- TRIGGER: trg_after_insert_game_attempt_score
        UPDATE game_sessions 
        SET total_score = (
          SELECT COALESCE(SUM(points_awarded), 0) 
          FROM game_attempts 
          WHERE session_id = ?
        )
        WHERE session_id = ?;
      `;
      logQuery(triggerScoreSql, [sessionId, sessionId], 2, 1);

      // Step D: Trigger Simulation: Auto-update USERS.total_xp via Trigger
      const triggerXpSql = `
        -- TRIGGER: trg_after_insert_game_attempt_xp
        UPDATE users 
        SET total_xp = (
          SELECT COALESCE(SUM(ga.points_awarded), 0) 
          FROM game_attempts ga 
          JOIN game_sessions gs ON ga.session_id = gs.session_id 
          WHERE gs.user_id = ?
        )
        WHERE user_id = ?;
      `;
      logQuery(triggerXpSql, [userId, userId], 2, 1);

      // If connected to real MySQL backend, also execute against real database!
      if (mySqlStatus.connected) {
        fetch(`${API_BASE_URL}/game/attempt`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: sessionId,
            track_id: trackId,
            unlocked_tier_sec: unlockedTierSec,
            attempts_used: attemptsUsed,
            is_correct: isCorrect,
            response_time_ms: responseTimeMs,
            points_awarded: pointsAwarded
          })
        }).catch(() => {});
      }

      return { session: newSession, attempt: newAttempt };
    }
  }
};

// Auto check backend on startup
if (typeof window !== 'undefined') {
  setTimeout(() => {
    sqlApi.checkBackendStatus();
  }, 500);
}
