import { query } from './db.js';

async function seed() {
  console.log('🌱 Seeding local MySQL InnoDB database...');

  // 1. Artists
  const artistsSql = `
    INSERT INTO artists (artist_id, name, yt_channel_id, verified_status, avatar_url) VALUES
    (1, 'Kavinsky', 'UC_KavinskyOfficial', 1, 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80'),
    (2, 'The Midnight', 'UCTheMidnightLA', 1, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80'),
    (3, 'HOME', 'UCHomeOfficialChill', 1, 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80'),
    (4, 'Gunship', 'UCGunshipMusicUK', 1, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80'),
    (5, 'Lorn', 'UCLornOfficialDark', 1, 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80')
    ON DUPLICATE KEY UPDATE name=VALUES(name);
  `;
  await query(artistsSql);
  console.log('  ✅ Artists seeded');

  // 2. Albums
  const albumsSql = `
    INSERT INTO albums (album_id, artist_id, title, release_year, cover_art_url, album_type) VALUES
    (1, 1, 'OutRun', 2013, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80', 'album'),
    (2, 1, 'Reborn', 2022, 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80', 'album'),
    (3, 2, 'Endless Summer', 2016, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80', 'album'),
    (4, 2, 'Days of Thunder EP', 2014, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80', 'ep'),
    (5, 3, 'Odyssey', 2014, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80', 'album'),
    (6, 4, 'Dark All Day', 2018, 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80', 'album'),
    (7, 5, 'Ask the Dust', 2012, 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80', 'album')
    ON DUPLICATE KEY UPDATE title=VALUES(title);
  `;
  await query(albumsSql);
  console.log('  ✅ Albums seeded');

  // 3. Users
  const usersSql = `
    INSERT INTO users (user_id, username, email, password, total_xp, created_at) VALUES
    (1, 'Alex_Synthwave', 'alex.synth@sonix.fm', 'synthPass80s', 15420, '2024-01-15 10:30:00'),
    (2, 'Kai_BeatHunter', 'kai.beats@sonix.fm', 'lofiChills44', 9840, '2024-03-22 14:15:00'),
    (3, 'Elena_Vibes', 'elena.v@sonix.fm', 'retroNeon99', 22100, '2023-11-04 08:20:00')
    ON DUPLICATE KEY UPDATE username=VALUES(username);
  `;
  await query(usersSql);
  console.log('  ✅ Users seeded');

  // 4. Tracks
  const tracksSql = `
    INSERT INTO tracks (track_id, artist_id, album_id, parent_track_id, title, genre, yt_video_id, track_type, duration_sec, snippet_start_sec, custom_thumbnail_url, is_embeddable) VALUES
    (1, 1, 1, NULL, 'Nightcall', 'Synthwave', 'MV_3Dpw-BRY', 'official_audio', 259, 32.50, NULL, 1),
    (2, 1, 1, 1, 'Nightcall (Dustin N''Guyen Remix)', 'Synthwave', '41_svUt5_e0', 'remix', 215, 45.00, NULL, 1),
    (3, 3, 5, NULL, 'Resonance', 'Chillwave', '8GW6sLrK40k', 'official_audio', 212, 28.00, NULL, 1),
    (4, 2, 3, NULL, 'Sunset', 'Synthpop', 'rDBbaGCCIhk', 'official_audio', 326, 54.00, NULL, 1),
    (5, 2, 3, NULL, 'Vampires', 'Synthwave', 'NEcWmZKSid4', 'music_video', 317, 40.00, NULL, 1),
    (6, 4, 6, NULL, 'Tech Noir', 'Cyberpunk', '-nC5TBv3sfU', 'official_audio', 298, 60.00, NULL, 1),
    (7, 5, 7, NULL, 'Acid Rain', 'Dark Electronic', 'nxg4C365LbQ', 'music_video', 213, 18.00, NULL, 1),
    (8, 1, 2, NULL, 'Cameo (feat. Kareen Guy)', 'French House', 'JrwnyTFXV_4', 'live_cover', 254, 36.00, NULL, 1)
    ON DUPLICATE KEY UPDATE title=VALUES(title);
  `;
  await query(tracksSql);
  console.log('  ✅ Tracks seeded');

  // 5. Playlists
  const playlistsSql = `
    INSERT INTO playlists (playlist_id, user_id, title, description, cover_art_url, is_public, created_at) VALUES
    (1, 1, 'Midnight Tokyo Highway', 'Analog synthesizers, neon reflections, and late night solitary drives.', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500', 1, '2024-02-10 11:00:00'),
    (2, 1, 'Cyberpunk Arcade Rush', 'High-octane electronic and synthwave beats for gaming tournaments.', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500', 1, '2024-03-01 18:40:00'),
    (3, 1, 'Study & Coding Lo-Fi', 'Subtle analog frequencies, soft chillwave, and deep focus.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500', 0, '2024-04-12 09:15:00')
    ON DUPLICATE KEY UPDATE title=VALUES(title), description=VALUES(description), cover_art_url=VALUES(cover_art_url);
  `;
  await query(playlistsSql);
  console.log('  ✅ Playlists seeded');

  // 6. Playlist Tracks
  const playlistTracksSql = `
    INSERT INTO playlist_tracks (playlist_id, track_id, position_order, added_at) VALUES
    (1, 1, 1, '2024-02-10 11:05:00'),
    (1, 3, 2, '2024-02-10 11:08:00'),
    (1, 4, 3, '2024-02-10 11:12:00'),
    (2, 5, 1, '2024-03-01 18:42:00'),
    (2, 6, 2, '2024-03-01 18:45:00'),
    (2, 2, 3, '2024-03-01 18:50:00'),
    (3, 3, 1, '2024-04-12 09:20:00'),
    (3, 7, 2, '2024-04-12 09:25:00')
    ON DUPLICATE KEY UPDATE position_order=VALUES(position_order);
  `;
  await query(playlistTracksSql);
  console.log('  ✅ Playlist tracks seeded');

  // 7. Listening History
  const historySql = `
    INSERT INTO listening_history (history_id, user_id, track_id, played_at, listened_duration_sec, is_liked) VALUES
    (101, 1, 1, '2026-10-23 16:45:00', 259, 1),
    (102, 1, 3, '2026-10-23 15:20:00', 212, 1),
    (103, 1, 6, '2026-10-22 21:10:00', 180, 0),
    (104, 1, 4, '2026-10-22 19:05:00', 326, 1)
    ON DUPLICATE KEY UPDATE listened_duration_sec=VALUES(listened_duration_sec);
  `;
  await query(historySql);
  console.log('  ✅ Listening history seeded');

  // 8. Game Sessions
  const sessionsSql = `
    INSERT INTO game_sessions (session_id, user_id, game_mode, total_score, max_streak, played_at) VALUES
    (501, 1, 'daily', 1000, 14, '2026-10-23 14:00:00'),
    (502, 1, 'genre_rush', 750, 8, '2026-10-22 20:30:00'),
    (503, 1, 'history', 500, 5, '2026-10-21 18:15:00')
    ON DUPLICATE KEY UPDATE total_score=VALUES(total_score);
  `;
  await query(sessionsSql);
  console.log('  ✅ Game sessions seeded');

  // 9. Game Attempts
  const attemptsSql = `
    INSERT INTO game_attempts (attempt_id, session_id, track_id, unlocked_tier_sec, attempts_used, is_correct, response_time_ms, points_awarded) VALUES
    (9001, 501, 1, 0.1, 1, 1, 1420, 1000),
    (9002, 502, 5, 1.0, 2, 1, 3120, 750),
    (9003, 503, 6, 2.0, 3, 0, 7800, 0)
    ON DUPLICATE KEY UPDATE points_awarded=VALUES(points_awarded);
  `;
  await query(attemptsSql);
  console.log('  ✅ Game attempts seeded');

  console.log('✨ Seed complete! All tables in MySQL InnoDB have live data.');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
