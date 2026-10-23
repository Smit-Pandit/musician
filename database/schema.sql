-- ========================================================
-- SONIX RELATIONAL DATABASE SCHEMA (DDL & TRIGGERS)
-- Implements exact Entity-Relationship Diagram specifications
-- ========================================================

-- Enable Foreign Key constraints
PRAGMA foreign_keys = ON;

-- 1. ARTISTS TABLE
CREATE TABLE IF NOT EXISTS artists (
    artist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    yt_channel_id VARCHAR(100) UNIQUE, -- Optional YT Channel ID
    verified_status BOOLEAN NOT NULL DEFAULT 0,
    avatar_url TEXT NOT NULL
);

-- 2. ALBUMS TABLE
CREATE TABLE IF NOT EXISTS albums (
    album_id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    release_year INTEGER NOT NULL,
    cover_art_url TEXT NOT NULL,
    album_type VARCHAR(20) NOT NULL CHECK (album_type IN ('album', 'ep', 'single')),
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE
);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Plain-text no auth as per schema note
    total_xp INTEGER NOT NULL DEFAULT 0, -- Derived via Trigger
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. TRACKS TABLE (Self-referencing parent_track_id for covers/remixes)
CREATE TABLE IF NOT EXISTS tracks (
    track_id INTEGER PRIMARY KEY AUTOINCREMENT,
    artist_id INTEGER NOT NULL,
    album_id INTEGER, -- Nullable for YT singles/covers
    parent_track_id INTEGER, -- Self-FK for Cover/Remix lineage
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100) NOT NULL,
    yt_video_id VARCHAR(11) NOT NULL UNIQUE, -- 11-char YT IFrame Video ID
    track_type VARCHAR(30) NOT NULL CHECK (track_type IN ('official_audio', 'music_video', 'remix', 'live_cover')),
    duration_sec INTEGER NOT NULL, -- Total track length in sec
    snippet_start_sec DECIMAL(6, 2) NOT NULL DEFAULT 0.00, -- Game Hook Start Sec (e.g. 27.50)
    custom_thumbnail_url TEXT, -- Nullable (Auto-uses YT thumb)
    is_embeddable BOOLEAN NOT NULL DEFAULT 1, -- True if YT IFrame allowed
    FOREIGN KEY (artist_id) REFERENCES artists(artist_id) ON DELETE CASCADE,
    FOREIGN KEY (album_id) REFERENCES albums(album_id) ON DELETE SET NULL,
    FOREIGN KEY (parent_track_id) REFERENCES tracks(track_id) ON DELETE SET NULL
);

-- 5. PLAYLISTS TABLE
CREATE TABLE IF NOT EXISTS playlists (
    playlist_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 6. PLAYLIST_TRACKS JUNCTION TABLE
CREATE TABLE IF NOT EXISTS playlist_tracks (
    playlist_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    position_order INTEGER NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, track_id),
    FOREIGN KEY (playlist_id) REFERENCES playlists(playlist_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
);

-- 7. LISTENING_HISTORY TABLE
CREATE TABLE IF NOT EXISTS listening_history (
    history_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL,
    played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    listened_duration_sec INTEGER NOT NULL DEFAULT 0,
    is_liked BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
);

-- 8. GAME_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS game_sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    game_mode VARCHAR(30) NOT NULL CHECK (game_mode IN ('daily', 'genre_rush', 'history')),
    total_score INTEGER NOT NULL DEFAULT 0, -- Derived via Trigger
    max_streak INTEGER NOT NULL DEFAULT 0,
    played_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 9. GAME_ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS game_attempts (
    attempt_id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    track_id INTEGER NOT NULL, -- Target YT IFrame Track
    unlocked_tier_sec DECIMAL(3, 1) NOT NULL CHECK (unlocked_tier_sec IN (0.1, 1.0, 2.0, 5.0)),
    attempts_used INTEGER NOT NULL CHECK (attempts_used BETWEEN 1 AND 4),
    is_correct BOOLEAN NOT NULL DEFAULT 0,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    points_awarded INTEGER NOT NULL CHECK (points_awarded IN (1000, 750, 500, 250, 0)),
    FOREIGN KEY (session_id) REFERENCES game_sessions(session_id) ON DELETE CASCADE,
    FOREIGN KEY (track_id) REFERENCES tracks(track_id) ON DELETE CASCADE
);

-- ========================================================
-- TRIGGERS TO MAINTAIN DERIVED FIELDS (total_score & total_xp)
-- ========================================================

-- Trigger 1: Auto-update GAME_SESSIONS.total_score after inserting a game attempt
CREATE TRIGGER IF NOT EXISTS trg_after_insert_game_attempt_score
AFTER INSERT ON game_attempts
BEGIN
    UPDATE game_sessions
    SET total_score = (
        SELECT COALESCE(SUM(points_awarded), 0)
        FROM game_attempts
        WHERE session_id = NEW.session_id
    )
    WHERE session_id = NEW.session_id;
END;

-- Trigger 2: Auto-update USERS.total_xp after inserting a game attempt
CREATE TRIGGER IF NOT EXISTS trg_after_insert_game_attempt_xp
AFTER INSERT ON game_attempts
BEGIN
    UPDATE users
    SET total_xp = (
        SELECT COALESCE(SUM(ga.points_awarded), 0)
        FROM game_attempts ga
        JOIN game_sessions gs ON ga.session_id = gs.session_id
        WHERE gs.user_id = (SELECT user_id FROM game_sessions WHERE session_id = NEW.session_id)
    )
    WHERE user_id = (SELECT user_id FROM game_sessions WHERE session_id = NEW.session_id);
END;

-- ========================================================
-- SEED DATA (DML)
-- ========================================================

-- Insert Artists
INSERT INTO artists (artist_id, name, yt_channel_id, verified_status, avatar_url) VALUES
(1, 'Kavinsky', 'UC_KavinskyOfficial', 1, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'),
(2, 'The Midnight', 'UCTheMidnightLA', 1, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80'),
(3, 'HOME', 'UCHomeOfficialChill', 1, 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80'),
(4, 'Gunship', 'UCGunshipMusicUK', 1, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80'),
(5, 'Lorn', 'UCLornOfficialDark', 1, 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80');

-- Insert Albums
INSERT INTO albums (album_id, artist_id, title, release_year, cover_art_url, album_type) VALUES
(1, 1, 'OutRun', 2013, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80', 'album'),
(2, 1, 'Reborn', 2022, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80', 'album'),
(3, 2, 'Endless Summer', 2016, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80', 'album'),
(4, 2, 'Days of Thunder EP', 2014, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80', 'ep'),
(5, 3, 'Odyssey', 2014, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80', 'album'),
(6, 4, 'Dark All Day', 2018, 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80', 'album'),
(7, 5, 'Ask the Dust', 2012, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80', 'album');

-- Insert Users
INSERT INTO users (user_id, username, email, password, total_xp, created_at) VALUES
(1, 'Alex_Synthwave', 'alex.synth@sonix.fm', 'synthPass80s', 15420, '2024-01-15 10:30:00'),
(2, 'Kai_BeatHunter', 'kai.beats@sonix.fm', 'lofiChills44', 9840, '2024-03-22 14:15:00'),
(3, 'Elena_Vibes', 'elena.v@sonix.fm', 'retroNeon99', 22100, '2023-11-04 08:20:00');

-- Insert Tracks (with parent_track_id lineage and exact new field names)
INSERT INTO tracks (track_id, artist_id, album_id, parent_track_id, title, genre, yt_video_id, track_type, duration_sec, snippet_start_sec, custom_thumbnail_url, is_embeddable) VALUES
(1, 1, 1, NULL, 'Nightcall', 'Synthwave', 'MV_3Dpw-BRY', 'official_audio', 259, 32.50, NULL, 1),
(2, 1, 1, 1, 'Nightcall (Dustin N''Guyen Remix)', 'Synthwave', '41_svUt5_e0', 'remix', 215, 45.00, NULL, 1),
(3, 3, 5, NULL, 'Resonance', 'Chillwave', '8GW6sLrK40k', 'official_audio', 212, 28.00, NULL, 1),
(4, 2, 3, NULL, 'Sunset', 'Synthpop', 'rDBbaGCCIhk', 'official_audio', 326, 54.00, NULL, 1),
(5, 2, 3, NULL, 'Vampires', 'Synthwave', 't4L_z3j3s_s', 'music_video', 317, 40.00, NULL, 1),
(6, 4, 6, NULL, 'Tech Noir', 'Cyberpunk', '-nC5TBv3sfU', 'official_audio', 298, 60.00, NULL, 1),
(7, 5, 7, NULL, 'Acid Rain', 'Dark Electronic', 'nxg4C365LbQ', 'music_video', 213, 18.00, NULL, 1),
(8, 1, 2, NULL, 'Cameo (feat. Kareen Guy)', 'French House', 'g7A2PqjK6_Q', 'live_cover', 254, 36.00, NULL, 1);

-- Insert Playlists
INSERT INTO playlists (playlist_id, user_id, title, is_public, created_at) VALUES
(1, 1, 'Midnight Tokyo Highway', 1, '2024-02-10 11:00:00'),
(2, 1, 'Cyberpunk Arcade Rush', 1, '2024-03-01 18:40:00'),
(3, 1, 'Study & Coding Lo-Fi', 0, '2024-04-12 09:15:00');

-- Insert Playlist Tracks
INSERT INTO playlist_tracks (playlist_id, track_id, position_order, added_at) VALUES
(1, 1, 1, '2024-02-10 11:05:00'),
(1, 3, 2, '2024-02-10 11:08:00'),
(1, 4, 3, '2024-02-10 11:12:00'),
(2, 5, 1, '2024-03-01 18:42:00'),
(2, 6, 2, '2024-03-01 18:45:00'),
(2, 2, 3, '2024-03-01 18:50:00'),
(3, 3, 1, '2024-04-12 09:20:00'),
(3, 7, 2, '2024-04-12 09:25:00');

-- Insert Listening History
INSERT INTO listening_history (history_id, user_id, track_id, played_at, listened_duration_sec, is_liked) VALUES
(101, 1, 1, '2026-10-23 16:45:00', 259, 1),
(102, 1, 3, '2026-10-23 15:20:00', 212, 1),
(103, 1, 6, '2026-10-22 21:10:00', 180, 0),
(104, 1, 4, '2026-10-22 19:05:00', 326, 1);

-- Insert Game Sessions
INSERT INTO game_sessions (session_id, user_id, game_mode, total_score, max_streak, played_at) VALUES
(501, 1, 'daily', 1000, 14, '2026-10-23 14:00:00'),
(502, 1, 'genre_rush', 750, 8, '2026-10-22 20:30:00'),
(503, 1, 'history', 500, 5, '2026-10-21 18:15:00');

-- Insert Game Attempts (matching 0.1, 1.0, 2.0, 5.0 tiers and 1000, 750, 500, 250, 0 points)
INSERT INTO game_attempts (attempt_id, session_id, track_id, unlocked_tier_sec, attempts_used, is_correct, response_time_ms, points_awarded) VALUES
(9001, 501, 1, 0.1, 1, 1, 1420, 1000),
(9002, 502, 5, 1.0, 2, 1, 3120, 750),
(9003, 503, 6, 2.0, 3, 0, 7800, 0);
