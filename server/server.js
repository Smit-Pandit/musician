import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  dbConfig,
  testConnection,
  updateDbConfig,
  query,
  getDbStats,
  initializeSchema
} from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// 1. HEALTH & CONNECTION STATUS
// -------------------------------------------------------------
app.get('/api/status', async (req, res) => {
  const conn = await testConnection();
  if (!conn.success) {
    return res.json({
      connected: false,
      engine: 'InnoDB (MySQL/MariaDB)',
      error: conn.error,
      code: conn.code,
      config: conn.config
    });
  }

  const stats = await getDbStats();
  res.json({
    connected: true,
    engine: 'InnoDB',
    database: conn.database,
    version: conn.version,
    durationMs: conn.durationMs,
    config: conn.config,
    stats: stats.success ? stats : null
  });
});

// Update credentials on the fly
app.post('/api/config', async (req, res) => {
  const { host, port, user, password, database } = req.body;
  const result = await updateDbConfig({
    host: host || 'localhost',
    port: port || 3306,
    user: user || 'root',
    password: password !== undefined ? password : '',
    database: database || 'music_game_db'
  });
  res.json(result);
});

// Initialize / Run schema.sql
app.post('/api/init-db', async (req, res) => {
  const result = await initializeSchema();
  res.json(result);
});

// -------------------------------------------------------------
// 2. RAW SQL QUERY RUNNER (For interactive SQL Console)
// -------------------------------------------------------------
app.post('/api/query', async (req, res) => {
  const { sql, params } = req.body;
  if (!sql || typeof sql !== 'string') {
    return res.status(400).json({ success: false, error: 'SQL query string required.' });
  }

  const result = await query(sql, params || []);
  res.json(result);
});

// -------------------------------------------------------------
// 3. TRACKS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/tracks', async (req, res) => {
  const sql = `
    SELECT 
      t.track_id,
      t.artist_id,
      t.album_id,
      t.parent_track_id,
      t.title,
      COALESCE(t.genre, 'Electronic') AS genre,
      t.yt_video_id,
      t.embed_url,
      t.iframe_code,
      t.iframe_code AS iframe,
      t.track_type,
      t.duration_sec,
      t.snippet_start_sec,
      COALESCE(t.custom_thumbnail_url, CONCAT('https://img.youtube.com/vi/', t.yt_video_id, '/mqdefault.jpg')) AS custom_thumbnail_url,
      t.is_embeddable,
      a.name AS artist_name,
      COALESCE(a.avatar_url, t.custom_thumbnail_url, CONCAT('https://img.youtube.com/vi/', t.yt_video_id, '/mqdefault.jpg')) AS artist_avatar,
      al.title AS album_title,
      COALESCE(al.cover_art_url, t.custom_thumbnail_url, CONCAT('https://img.youtube.com/vi/', t.yt_video_id, '/mqdefault.jpg')) AS album_cover
    FROM tracks t
    INNER JOIN artists a ON t.artist_id = a.artist_id
    LEFT JOIN albums al ON t.album_id = al.album_id
    ORDER BY t.track_id ASC;
  `;
  const result = await query(sql);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, tracks: result.results, durationMs: result.durationMs, sql });
});

app.get('/api/tracks/:id', async (req, res) => {
  const sql = `
    SELECT 
      t.*,
      a.name AS artist_name,
      a.avatar_url AS artist_avatar,
      al.title AS album_title
    FROM tracks t
    INNER JOIN artists a ON t.artist_id = a.artist_id
    LEFT JOIN albums al ON t.album_id = al.album_id
    WHERE t.track_id = ?
    LIMIT 1;
  `;
  const result = await query(sql, [req.params.id]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, track: result.results[0] || null, durationMs: result.durationMs, sql });
});

// -------------------------------------------------------------
// 4. ARTISTS & ALBUMS ENDPOINTS
// -------------------------------------------------------------
app.get('/api/artists', async (req, res) => {
  const sql = `
    SELECT 
      a.artist_id,
      a.name,
      a.yt_channel_id,
      a.verified_status,
      a.avatar_url,
      COUNT(t.track_id) AS track_count
    FROM artists a
    LEFT JOIN tracks t ON a.artist_id = t.artist_id
    GROUP BY a.artist_id, a.name, a.yt_channel_id, a.verified_status, a.avatar_url
    ORDER BY a.artist_id ASC;
  `;
  const result = await query(sql);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, artists: result.results, durationMs: result.durationMs, sql });
});

app.get('/api/albums', async (req, res) => {
  const sql = `
    SELECT 
      al.*,
      a.name AS artist_name
    FROM albums al
    INNER JOIN artists a ON al.artist_id = a.artist_id
    ORDER BY al.release_year DESC;
  `;
  const result = await query(sql);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, albums: result.results, durationMs: result.durationMs, sql });
});

// -------------------------------------------------------------
// 5. AUTH (LOGIN & REGISTER)
// -------------------------------------------------------------
app.post('/api/auth/login', async (req, res) => {
  const { identifier, password } = req.body;
  const sql = `
    SELECT user_id, username, email, total_xp, created_at
    FROM users
    WHERE (username = ? OR email = ?) AND password = ?
    LIMIT 1;
  `;
  const result = await query(sql, [identifier, identifier, password]);
  if (!result.success) return res.status(500).json(result);
  if (result.results.length === 0) {
    return res.status(401).json({ success: false, error: 'Invalid username/email or password.' });
  }
  res.json({ success: true, user: result.results[0], durationMs: result.durationMs, sql });
});

app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, error: 'All fields required.' });
  }

  const insertSql = `
    INSERT INTO users (username, email, password, total_xp, created_at)
    VALUES (?, ?, ?, 250, CURRENT_TIMESTAMP);
  `;
  const insertResult = await query(insertSql, [username, email, password]);
  if (!insertResult.success) {
    return res.status(400).json({ success: false, error: insertResult.error });
  }

  const selectSql = `SELECT user_id, username, email, total_xp, created_at FROM users WHERE user_id = ?;`;
  const userResult = await query(selectSql, [insertResult.results.insertId]);
  res.json({
    success: true,
    user: userResult.results[0],
    durationMs: insertResult.durationMs + userResult.durationMs,
    sql: insertSql
  });
});

app.get('/api/users', async (req, res) => {
  const sql = `
    SELECT user_id, username, email, total_xp, created_at
    FROM users
    ORDER BY total_xp DESC;
  `;
  const result = await query(sql);
  if (!result.success) return res.status(500).json(result);

  const defaultAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
  ];

  const usersWithAvatars = result.results.map((u, idx) => ({
    ...u,
    avatar_url: defaultAvatars[idx % defaultAvatars.length],
    level: Math.floor((u.total_xp || 0) / 500) + 1,
    rank_title: (u.total_xp || 0) >= 20000 ? 'Grandmaster Producer' : (u.total_xp || 0) >= 8000 ? 'Diamond Synthesizer' : (u.total_xp || 0) >= 1500 ? 'Gold Beatmaker' : 'Novice Listener',
    streak_days: (u.total_xp || 0) > 1000 ? 5 : 1,
    accuracy: (u.total_xp || 0) > 10000 ? '94%' : (u.total_xp || 0) > 1000 ? '82%' : '60%',
    favorite_genre: 'Electronic',
    games_won: Math.floor((u.total_xp || 0) / 300),
    games_played: Math.floor((u.total_xp || 0) / 250) + 1
  }));

  res.json({ success: true, users: usersWithAvatars, durationMs: result.durationMs, sql });
});

// -------------------------------------------------------------
// 6. GAME SESSIONS & ATTEMPTS (Triggers derive total_score & total_xp)
// -------------------------------------------------------------
app.post('/api/game/session', async (req, res) => {
  const { user_id, game_mode } = req.body;
  const sql = `
    INSERT INTO game_sessions (user_id, game_mode, total_score, max_streak, played_at)
    VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP);
  `;
  const result = await query(sql, [user_id || 1, game_mode || 'daily']);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, session_id: result.results.insertId, durationMs: result.durationMs, sql });
});

app.post('/api/game/attempt', async (req, res) => {
  const {
    session_id,
    track_id,
    unlocked_tier_sec,
    attempts_used,
    is_correct,
    response_time_ms,
    points_awarded
  } = req.body;

  const sql = `
    INSERT INTO game_attempts (
      session_id,
      track_id,
      unlocked_tier_sec,
      attempts_used,
      is_correct,
      response_time_ms,
      points_awarded
    ) VALUES (?, ?, ?, ?, ?, ?, ?);
  `;

  const result = await query(sql, [
    session_id || 501,
    track_id,
    unlocked_tier_sec,
    attempts_used,
    is_correct ? 1 : 0,
    response_time_ms || 0,
    points_awarded || 0
  ]);

  if (!result.success) return res.status(500).json(result);

  // Read updated total_score from game_sessions and total_xp from users (updated via InnoDB triggers)
  const [sessionRow] = (await query('SELECT total_score FROM game_sessions WHERE session_id = ?', [session_id])).results || [];
  const [userRow] = (await query(`
    SELECT u.total_xp 
    FROM users u
    JOIN game_sessions gs ON u.user_id = gs.user_id
    WHERE gs.session_id = ?
  `, [session_id])).results || [];

  res.json({
    success: true,
    attempt_id: result.results.insertId,
    total_score: sessionRow?.total_score ?? null,
    total_xp: userRow?.total_xp ?? null,
    durationMs: result.durationMs,
    sql
  });
});

// -------------------------------------------------------------
// 7. LISTENING HISTORY & LIKES
// -------------------------------------------------------------
app.get('/api/history', async (req, res) => {
  const userId = req.query.user_id || 1;
  const sql = `
    SELECT 
      lh.history_id,
      lh.played_at,
      lh.listened_duration_sec,
      lh.is_liked,
      t.*,
      a.name AS artist_name
    FROM listening_history lh
    INNER JOIN tracks t ON lh.track_id = t.track_id
    INNER JOIN artists a ON t.artist_id = a.artist_id
    WHERE lh.user_id = ?
    ORDER BY lh.played_at DESC
    LIMIT 50;
  `;
  const result = await query(sql, [userId]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, history: result.results, durationMs: result.durationMs, sql });
});

app.post('/api/history', async (req, res) => {
  const { user_id, track_id, listened_duration_sec, is_liked } = req.body;
  const sql = `
    INSERT INTO listening_history (user_id, track_id, listened_duration_sec, is_liked, played_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
  `;
  const result = await query(sql, [
    user_id || 1,
    track_id,
    listened_duration_sec || 0,
    is_liked ? 1 : 0
  ]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, history_id: result.results.insertId, durationMs: result.durationMs, sql });
});

app.post('/api/history/toggle-like', async (req, res) => {
  const { user_id, track_id, is_liked } = req.body;
  const sql = `
    UPDATE listening_history 
    SET is_liked = ?
    WHERE user_id = ? AND track_id = ?
    ORDER BY played_at DESC
    LIMIT 1;
  `;
  const result = await query(sql, [is_liked ? 1 : 0, user_id || 1, track_id]);
  res.json({ success: true, affectedRows: result.results?.affectedRows || 0, durationMs: result.durationMs, sql });
});

// -------------------------------------------------------------
// 8. PLAYLISTS
// -------------------------------------------------------------
app.get('/api/playlists', async (req, res) => {
  const sql = `
    SELECT 
      p.playlist_id,
      p.user_id,
      p.title,
      p.description,
      p.cover_art_url,
      p.is_public,
      p.created_at,
      u.username,
      COUNT(pt.track_id) AS track_count
    FROM playlists p
    INNER JOIN users u ON p.user_id = u.user_id
    LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
    GROUP BY p.playlist_id, p.user_id, p.title, p.description, p.cover_art_url, p.is_public, p.created_at, u.username
    ORDER BY p.playlist_id ASC;
  `;
  const result = await query(sql);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, playlists: result.results, durationMs: result.durationMs, sql });
});

app.get('/api/playlists/:id', async (req, res) => {
  const playlistId = req.params.id;
  const sql = `
    SELECT 
      p.playlist_id,
      p.user_id,
      p.title,
      p.description,
      p.cover_art_url,
      p.is_public,
      p.created_at,
      u.username,
      COUNT(pt.track_id) AS track_count
    FROM playlists p
    INNER JOIN users u ON p.user_id = u.user_id
    LEFT JOIN playlist_tracks pt ON p.playlist_id = pt.playlist_id
    WHERE p.playlist_id = ?
    GROUP BY p.playlist_id, p.user_id, p.title, p.description, p.cover_art_url, p.is_public, p.created_at, u.username
    LIMIT 1;
  `;
  const result = await query(sql, [playlistId]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, playlist: result.results[0] || null, durationMs: result.durationMs, sql });
});

app.get('/api/playlists/:id/tracks', async (req, res) => {
  const playlistId = req.params.id;
  const sql = `
    SELECT 
      pt.playlist_id,
      pt.track_id,
      pt.position_order,
      pt.added_at,
      t.title,
      t.duration_sec,
      t.genre,
      t.yt_video_id,
      COALESCE(t.custom_thumbnail_url, CONCAT('https://img.youtube.com/vi/', t.yt_video_id, '/mqdefault.jpg')) AS custom_thumbnail_url,
      a.name AS artist_name,
      a.avatar_url AS artist_avatar,
      al.title AS album_title,
      al.cover_art_url AS album_cover
    FROM playlist_tracks pt
    INNER JOIN tracks t ON pt.track_id = t.track_id
    LEFT JOIN artists a ON t.artist_id = a.artist_id
    LEFT JOIN albums al ON t.album_id = al.album_id
    WHERE pt.playlist_id = ?
    ORDER BY pt.position_order ASC;
  `;
  const result = await query(sql, [playlistId]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, tracks: result.results, durationMs: result.durationMs, sql });
});

app.post('/api/playlists', async (req, res) => {
  const { user_id, title, description, cover_art_url, is_public } = req.body;
  const defaultArt = cover_art_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500';
  const sql = `
    INSERT INTO playlists (user_id, title, description, cover_art_url, is_public, created_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP);
  `;
  const result = await query(sql, [
    user_id || 1,
    title || 'New Playlist',
    description || 'Custom playlist created on Musicians',
    defaultArt,
    is_public !== false ? 1 : 0
  ]);
  if (!result.success) return res.status(500).json(result);

  const newPlaylist = {
    playlist_id: result.results.insertId,
    user_id: user_id || 1,
    title: title || 'New Playlist',
    description: description || 'Custom playlist created on Musicians',
    cover_art_url: defaultArt,
    is_public: is_public !== false ? 1 : 0,
    created_at: new Date().toISOString(),
    track_count: 0
  };
  res.json({ success: true, playlist: newPlaylist, durationMs: result.durationMs, sql });
});

app.put('/api/playlists/:id', async (req, res) => {
  const playlistId = req.params.id;
  const { title, description, is_public, cover_art_url } = req.body;
  const sql = `
    UPDATE playlists 
    SET title = COALESCE(?, title),
        description = COALESCE(?, description),
        is_public = COALESCE(?, is_public),
        cover_art_url = COALESCE(?, cover_art_url)
    WHERE playlist_id = ?;
  `;
  const result = await query(sql, [title, description, is_public !== undefined ? (is_public ? 1 : 0) : null, cover_art_url, playlistId]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, affectedRows: result.results.affectedRows, durationMs: result.durationMs, sql });
});

app.delete('/api/playlists/:id', async (req, res) => {
  const playlistId = req.params.id;
  const sql = `DELETE FROM playlists WHERE playlist_id = ?;`;
  const result = await query(sql, [playlistId]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, affectedRows: result.results.affectedRows, durationMs: result.durationMs, sql });
});

app.post('/api/playlists/:id/tracks', async (req, res) => {
  const playlistId = req.params.id;
  const { track_id } = req.body;
  if (!track_id) return res.status(400).json({ success: false, error: 'track_id is required' });

  const sql = `
    INSERT INTO playlist_tracks (playlist_id, track_id, position_order, added_at)
    VALUES (?, ?, (
      SELECT COALESCE(MAX(sub.position_order), 0) + 1 
      FROM (SELECT position_order FROM playlist_tracks WHERE playlist_id = ?) AS sub
    ), CURRENT_TIMESTAMP);
  `;
  const result = await query(sql, [playlistId, track_id, playlistId]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, affectedRows: result.results.affectedRows, durationMs: result.durationMs, sql });
});

app.delete('/api/playlists/:id/tracks/:trackId', async (req, res) => {
  const { id: playlistId, trackId } = req.params;
  const sql = `DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?;`;
  const result = await query(sql, [playlistId, trackId]);
  if (!result.success) return res.status(500).json(result);
  res.json({ success: true, affectedRows: result.results.affectedRows, durationMs: result.durationMs, sql });
});


// Start Express server
app.listen(PORT, async () => {
  console.log(`\n======================================================`);
  console.log(`  🎵 Musicians MySQL InnoDB Backend API Server`);
  console.log(`  🚀 http://localhost:${PORT}`);
  console.log(`======================================================`);
  const status = await testConnection();
  if (status.success) {
    console.log(`  ✅ Connected to MySQL InnoDB! [${status.database}]`);
  } else {
    console.log(`  ⚠️  MySQL Not Connected yet: ${status.error}`);
    console.log(`  💡 Update your credentials in .env or via the UI modal`);
  }
  console.log(`======================================================\n`);
});
