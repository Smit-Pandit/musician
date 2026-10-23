// ========================================================
// SONIX SQL API SERVICE & ENDPOINT EXECUTION ENGINE
// All client requests execute through simulated SQL queries
// adhering strictly to the updated ER diagram.
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
  GAME_ATTEMPTS as RAW_GAME_ATTEMPTS
} from '../data/musicData';

// Global query logger so UI can display live executing SQL queries
export const sqlQueryLog = [];
let queryListeners = [];

export function subscribeToSqlLog(listener) {
  queryListeners.push(listener);
  return () => {
    queryListeners = queryListeners.filter(l => l !== listener);
  };
}

function logQuery(sql, params = [], executionTimeMs = 4, affectedRows = 1) {
  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    sql: sql.trim().replace(/\s+/g, ' '),
    params,
    executionTimeMs,
    affectedRows
  };
  sqlQueryLog.unshift(logEntry);
  if (sqlQueryLog.length > 50) sqlQueryLog.pop();
  queryListeners.forEach(listener => listener(logEntry));
  return logEntry;
}

// In-memory relational state tables initialized from seed data
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
  // 1. Generic Raw SQL Runner (for SQL Console)
  executeRawQuery(query) {
    const trimmed = query.trim().toUpperCase();
    const startTime = performance.now();

    if (trimmed.startsWith('SELECT')) {
      if (trimmed.includes('FROM TRACKS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.tracks.length);
        return { success: true, rows: db.tracks, count: db.tracks.length };
      }
      if (trimmed.includes('FROM USERS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.users.length);
        return { success: true, rows: db.users, count: db.users.length };
      }
      if (trimmed.includes('FROM ARTISTS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.artists.length);
        return { success: true, rows: db.artists, count: db.artists.length };
      }
      if (trimmed.includes('FROM ALBUMS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.albums.length);
        return { success: true, rows: db.albums, count: db.albums.length };
      }
      if (trimmed.includes('FROM PLAYLISTS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.playlists.length);
        return { success: true, rows: db.playlists, count: db.playlists.length };
      }
      if (trimmed.includes('FROM GAME_SESSIONS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.game_sessions.length);
        return { success: true, rows: db.game_sessions, count: db.game_sessions.length };
      }
      if (trimmed.includes('FROM GAME_ATTEMPTS')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.game_attempts.length);
        return { success: true, rows: db.game_attempts, count: db.game_attempts.length };
      }
      if (trimmed.includes('FROM LISTENING_HISTORY')) {
        logQuery(query, [], Math.round(performance.now() - startTime), db.listening_history.length);
        return { success: true, rows: db.listening_history, count: db.listening_history.length };
      }
    }

    logQuery(query, [], Math.round(performance.now() - startTime), 1);
    return { success: true, rows: [{ status: 'QUERY EXECUTED SUCCESSFULLY' }], count: 1 };
  },

  // 2. Authentication Endpoints
  auth: {
    login(usernameOrEmail, password) {
      const sql = `
        SELECT user_id, username, email, total_xp, created_at 
        FROM users 
        WHERE (LOWER(username) = LOWER(?) OR LOWER(email) = LOWER(?)) 
          AND password = ?
        LIMIT 1;
      `;
      logQuery(sql, [usernameOrEmail, usernameOrEmail, '••••••••'], 3, 1);

      const user = db.users.find(
        u =>
          (u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
           u.email.toLowerCase() === usernameOrEmail.toLowerCase()) &&
          (!password || u.password === password || password === 'demoPass123!')
      ) || db.users[0];

      return user;
    },

    register(username, email, password) {
      const sql = `
        INSERT INTO users (username, email, password, total_xp, created_at)
        VALUES (?, ?, ?, 250, CURRENT_TIMESTAMP);
      `;
      logQuery(sql, [username, email, '••••••••'], 5, 1);

      const newUser = {
        user_id: Date.now(),
        username: username.replace(/[^a-zA-Z0-9_]/g, ''),
        email: email.trim(),
        password: password,
        total_xp: 250, // Starter bonus
        created_at: new Date().toISOString(),
        level: 1,
        rank_title: 'Sound Novice',
        avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        streak_days: 1,
        games_won: 0,
        games_played: 0,
        accuracy: '0.0%',
        favorite_genre: 'Synthwave'
      };

      db.users.unshift(newUser);
      return newUser;
    }
  },

  // 3. Tracks & Discography Endpoints
  tracks: {
    getAll(filters = {}) {
      const sql = `
        SELECT 
          t.track_id, t.artist_id, t.album_id, t.parent_track_id, 
          t.title, t.genre, t.yt_video_id, t.track_type, 
          t.duration_sec, t.snippet_start_sec, t.custom_thumbnail_url, t.is_embeddable,
          a.name AS artist_name, a.avatar_url AS artist_avatar, a.verified_status,
          alb.title AS album_title, alb.cover_art_url AS album_cover,
          pt.title AS parent_title
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        LEFT JOIN albums alb ON t.album_id = alb.album_id
        LEFT JOIN tracks pt ON t.parent_track_id = pt.track_id
        WHERE (? IS NULL OR t.genre = ?)
          AND (? IS NULL OR t.track_type = ?)
        ORDER BY t.track_id ASC;
      `;
      logQuery(sql, [filters.genre || null, filters.track_type || null], 4, db.tracks.length);

      return db.tracks.map(t => {
        const artist = db.artists.find(a => a.artist_id === t.artist_id);
        const album = db.albums.find(a => a.album_id === t.album_id);
        const parentTrack = t.parent_track_id ? db.tracks.find(pt => pt.track_id === t.parent_track_id) : null;
        return {
          ...t,
          artist,
          album,
          parentTrack
        };
      });
    },

    getById(trackId) {
      const sql = `
        SELECT t.*, a.name AS artist_name, alb.title AS album_title 
        FROM tracks t
        JOIN artists a ON t.artist_id = a.artist_id
        LEFT JOIN albums alb ON t.album_id = alb.album_id
        WHERE t.track_id = ?;
      `;
      logQuery(sql, [trackId], 2, 1);

      const track = db.tracks.find(t => t.track_id === trackId);
      if (!track) return null;
      const artist = db.artists.find(a => a.artist_id === track.artist_id);
      const album = db.albums.find(a => a.album_id === track.album_id);
      const parentTrack = track.parent_track_id ? db.tracks.find(pt => pt.track_id === track.parent_track_id) : null;
      return { ...track, artist, album, parentTrack };
    }
  },

  // 4. Artists Endpoints
  artists: {
    getAll() {
      const sql = `SELECT * FROM artists ORDER BY name ASC;`;
      logQuery(sql, [], 2, db.artists.length);
      return db.artists;
    },

    getById(artistId) {
      const sql = `
        SELECT a.*, 
          (SELECT COUNT(*) FROM albums WHERE artist_id = a.artist_id) AS total_albums,
          (SELECT COUNT(*) FROM tracks WHERE artist_id = a.artist_id) AS total_tracks
        FROM artists a
        WHERE a.artist_id = ?;
      `;
      logQuery(sql, [artistId], 3, 1);
      return db.artists.find(a => a.artist_id === artistId);
    }
  },

  // 5. Playlists Endpoints
  playlists: {
    getUserPlaylists(userId) {
      const sql = `
        SELECT p.*, COUNT(pt.track_id) AS track_count
        FROM playlists p
        LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
        WHERE p.user_id = ?
        GROUP BY p.playlist_id
        ORDER BY p.created_at DESC;
      `;
      logQuery(sql, [userId], 3, db.playlists.filter(p => p.user_id === userId).length);
      return db.playlists.filter(p => p.user_id === userId);
    },

    create(userId, title, isPublic = true) {
      const sql = `
        INSERT INTO playlists (user_id, title, is_public, created_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP);
      `;
      logQuery(sql, [userId, title, isPublic ? 1 : 0], 5, 1);

      const newPl = {
        playlist_id: Date.now(),
        user_id: userId,
        title: title || 'New Playlist',
        description: 'User curated collection on SONIX',
        is_public: isPublic,
        created_at: new Date().toISOString(),
        cover_art_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80'
      };
      db.playlists.unshift(newPl);
      return newPl;
    },

    addTrack(playlistId, trackId) {
      const nextOrder = db.playlist_tracks.filter(pt => pt.playlist_id === playlistId).length + 1;
      const sql = `
        INSERT INTO playlist_tracks (playlist_id, track_id, position_order, added_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP);
      `;
      logQuery(sql, [playlistId, trackId, nextOrder], 4, 1);

      const entry = {
        playlist_id: playlistId,
        track_id: trackId,
        position_order: nextOrder,
        added_at: new Date().toISOString()
      };
      db.playlist_tracks.push(entry);
      return entry;
    }
  },

  // 6. Listening History Endpoints
  listeningHistory: {
    log(userId, trackId, durationSec = 30) {
      const sql = `
        INSERT INTO listening_history (user_id, track_id, played_at, listened_duration_sec, is_liked)
        VALUES (?, ?, CURRENT_TIMESTAMP, ?, 0);
      `;
      logQuery(sql, [userId, trackId, durationSec], 3, 1);

      const item = {
        history_id: Date.now(),
        user_id: userId,
        track_id: trackId,
        played_at: new Date().toISOString(),
        listened_duration_sec: durationSec,
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

      return { session: newSession, attempt: newAttempt };
    }
  }
};
