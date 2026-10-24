import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'music_game_db'
  });

  console.log('Connected to MySQL database music_game_db');

  // 1. Add embed_url and iframe_code columns to tracks if they do not exist
  const [cols] = await conn.query("SHOW COLUMNS FROM tracks LIKE 'iframe_code'");
  if (cols.length === 0) {
    console.log('Adding embed_url and iframe_code columns to tracks table...');
    await conn.query(`
      ALTER TABLE tracks 
      ADD COLUMN embed_url TEXT AFTER yt_video_id, 
      ADD COLUMN iframe_code TEXT AFTER embed_url;
    `);
  }

  // 2. Populate embed_url and iframe_code for all 755 tracks
  console.log('Populating embed_url and iframe_code for all 755 tracks...');
  await conn.query(`
    UPDATE tracks 
    SET 
      embed_url = CONCAT('https://www.youtube-nocookie.com/embed/', yt_video_id),
      iframe_code = CONCAT(
        '<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/', 
        yt_video_id, 
        '" title="', 
        REPLACE(REPLACE(title, '"', '&quot;'), "'", '&#39;'), 
        '" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>'
      )
    WHERE yt_video_id IS NOT NULL;
  `);

  // 3. Populate artist avatar_url for all 419 artists
  console.log('Populating avatar_url for all artists from their tracks...');
  await conn.query(`
    UPDATE artists a
    SET avatar_url = (
      SELECT COALESCE(t.custom_thumbnail_url, CONCAT('https://img.youtube.com/vi/', t.yt_video_id, '/mqdefault.jpg'))
      FROM tracks t 
      WHERE t.artist_id = a.artist_id 
      LIMIT 1
    )
    WHERE a.avatar_url IS NULL;
  `);

  // Check how many artists have avatars now
  const [artistStats] = await conn.query(`
    SELECT COUNT(*) as total, COUNT(avatar_url) as with_avatar FROM artists;
  `);
  console.log('Artist Avatar Stats:', artistStats[0]);

  // Check tracks with iframe_code
  const [trackStats] = await conn.query(`
    SELECT COUNT(*) as total, COUNT(iframe_code) as with_iframe, COUNT(embed_url) as with_embed FROM tracks;
  `);
  console.log('Track Iframe Stats:', trackStats[0]);

  await conn.end();
  console.log('Migration completed successfully!');
}

migrate().catch(console.error);
