import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generate() {
  const res = await fetch('http://localhost:5000/api/tracks');
  const data = await res.json();
  const tracks = data.tracks || [];

  console.log(`Processing ${tracks.length} tracks from music_game_db...`);

  const songItems = tracks.map((t, idx) => {
    const videoId = t.yt_video_id || '';
    const cleanTitle = (t.title || 'Untitled').replace(/"/g, '&quot;');
    const cleanArtist = (t.artist_name || 'Unknown Artist').replace(/"/g, '&quot;');
    const startSec = Math.floor(parseFloat(t.snippet_start_sec || 0));

    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    const embedUrlWithStart = startSec > 0 ? `${embedUrl}?start=${startSec}` : embedUrl;
    const iframeCode = `<iframe width="560" height="315" src="${embedUrl}" title="${cleanTitle} - ${cleanArtist}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    const iframeWithStart = `<iframe width="560" height="315" src="${embedUrlWithStart}" title="${cleanTitle} - ${cleanArtist}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;

    return {
      index: idx + 1,
      track_id: t.track_id,
      title: t.title,
      artist: t.artist_name,
      genre: t.genre || 'Electronic',
      duration_sec: t.duration_sec,
      snippet_start_sec: startSec,
      yt_video_id: videoId,
      youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
      embed_url: embedUrl,
      embed_url_with_start: embedUrlWithStart,
      iframe: iframeCode,
      iframe_with_start: iframeWithStart
    };
  });

  // 1. Write JSON file to public/
  const publicDir = path.resolve(__dirname, '../public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const jsonFilePath = path.join(publicDir, 'songs_iframes.json');
  fs.writeFileSync(jsonFilePath, JSON.stringify(songItems, null, 2), 'utf8');
  console.log(`✅ Saved complete JSON catalog (${songItems.length} songs) to: ${jsonFilePath}`);

  // 2. Generate Interactive HTML Directory
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sonix — All 755 Songs Iframe Directory</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-base: #060609;
      --bg-card: rgba(15, 15, 23, 0.75);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-crimson: rgba(239, 68, 68, 0.35);
      --crimson: #ef4444;
      --crimson-glow: rgba(239, 68, 68, 0.18);
      --text-main: #f1f5f9;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-base);
      color: var(--text-main);
      font-family: 'Space Grotesk', -apple-system, sans-serif;
      padding: 2.5rem 1.5rem 5rem;
      min-height: 100vh;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-end;
      gap: 1.5rem;
    }
    .header-titles h1 {
      font-size: 2.2rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #ef4444 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.4rem;
    }
    .header-titles p {
      color: var(--text-muted);
      font-size: 0.95rem;
    }
    .stats-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid var(--border-crimson);
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #fca5a5;
    }
    .search-bar-wrap {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      position: sticky;
      top: 1rem;
      z-index: 100;
      background: rgba(6, 6, 9, 0.92);
      backdrop-filter: blur(16px);
      padding: 0.75rem;
      border-radius: 12px;
      border: 1px solid var(--border-subtle);
    }
    .search-input {
      flex: 1;
      background: rgba(18, 18, 26, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 8px;
      padding: 0.85rem 1.25rem;
      color: #fff;
      font-family: inherit;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
    }
    .search-input:focus {
      border-color: var(--crimson);
      box-shadow: 0 0 0 3px var(--crimson-glow);
    }
    .btn {
      background: var(--crimson);
      color: #fff;
      border: none;
      padding: 0.85rem 1.4rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn:hover {
      background: #dc2626;
      box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: var(--text-main);
      border: 1px solid var(--border-subtle);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: none;
    }
    .table-container {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      overflow: hidden;
      backdrop-filter: blur(12px);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }
    th {
      background: rgba(10, 10, 16, 0.95);
      padding: 1rem 1.25rem;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border-subtle);
    }
    td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      vertical-align: middle;
    }
    tr:hover td {
      background: rgba(239, 68, 68, 0.03);
    }
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .badge {
      display: inline-block;
      padding: 0.2rem 0.55rem;
      border-radius: 4px;
      font-size: 0.72rem;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .badge-genre {
      color: #93c5fd;
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.25);
    }
    .badge-yt {
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.25);
    }
    .iframe-code-box {
      background: rgba(0, 0, 0, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      padding: 0.55rem 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      color: #cbd5e1;
      max-width: 500px;
      overflow-x: auto;
      white-space: nowrap;
    }
    .copy-btn {
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #f87171;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .copy-btn:hover {
      background: rgba(239, 68, 68, 0.28);
      border-color: #ef4444;
      color: #fff;
    }
    .preview-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: #e2e8f0;
      padding: 0.45rem 0.85rem;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.15s;
      white-space: nowrap;
    }
    .preview-btn:hover {
      background: rgba(255, 255, 255, 0.16);
      color: #fff;
    }
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.88);
      backdrop-filter: blur(12px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1.5rem;
    }
    .modal-box {
      background: #0d0d14;
      border: 1px solid var(--border-crimson);
      border-radius: 16px;
      max-width: 840px;
      width: 100%;
      overflow: hidden;
      box-shadow: 0 25px 50px -12px rgba(0,0,0,0.8), 0 0 35px var(--crimson-glow);
    }
    .modal-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-subtle);
    }
    .modal-head h3 {
      font-size: 1.15rem;
      font-weight: 600;
    }
    .close-modal-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      font-size: 1.6rem;
      cursor: pointer;
      line-height: 1;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .aspect-video {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      border-radius: 8px;
      overflow: hidden;
      background: #000;
    }
    .aspect-video iframe {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      border: none;
    }
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #ef4444;
      color: #fff;
      padding: 0.8rem 1.4rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.88rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.6);
      display: none;
      z-index: 2000;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="header-titles">
        <h1>Sonix — 755 Songs Iframe Catalog</h1>
        <p>Complete directory of all tracks extracted from <code>music_game_db.tracks</code> with ready-to-use YouTube iframes</p>
      </div>
      <div class="stats-pill">
        <span>755 Songs</span> • <span>InnoDB Database</span> • <span>YouTube CDN</span>
      </div>
    </header>

    <div class="search-bar-wrap">
      <input type="text" id="searchInput" class="search-input" placeholder="Search by song title, artist, genre, or YouTube video ID..." />
      <button class="btn" onclick="copyAllIframes()">📋 Copy All 755 Iframes</button>
      <a href="/songs_iframes.json" download class="btn btn-secondary">⬇ Download JSON</a>
      <a href="/" class="btn btn-secondary">← Back to App</a>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 60px;">#</th>
            <th style="width: 250px;">Title & Artist</th>
            <th style="width: 140px;">Genre</th>
            <th style="width: 140px;">YouTube ID</th>
            <th>Ready-to-use HTML &lt;iframe&gt;</th>
            <th style="width: 180px; text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody id="tracksTbody">
          <!-- Rendered via JS -->
        </tbody>
      </table>
    </div>
  </div>

  <div id="previewModal" class="modal-overlay" onclick="closePreview()">
    <div class="modal-box" onclick="event.stopPropagation()">
      <div class="modal-head">
        <h3 id="modalSongTitle">Track Preview</h3>
        <button class="close-modal-btn" onclick="closePreview()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="aspect-video" id="iframeContainer"></div>
      </div>
    </div>
  </div>

  <div id="toast" class="toast">Iframe code copied to clipboard!</div>

  <script>
    let allSongs = [];
    fetch('/songs_iframes.json')
      .then(r => r.json())
      .then(data => {
        allSongs = data;
        renderTable(allSongs);
      });

    function renderTable(songs) {
      const tbody = document.getElementById('tracksTbody');
      tbody.innerHTML = songs.map(s => \`
        <tr>
          <td class="font-mono" style="color: var(--text-dim);">\${s.index}</td>
          <td>
            <div style="font-weight: 600; color: #fff; margin-bottom: 3px;">\${s.title}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">\${s.artist}</div>
          </td>
          <td><span class="badge badge-genre font-mono">\${s.genre}</span></td>
          <td>
            <a href="\${s.youtube_url}" target="_blank" class="badge badge-yt font-mono" style="text-decoration: none;">
              \${s.yt_video_id} ↗
            </a>
          </td>
          <td>
            <div class="iframe-code-box" title="\${s.iframe}">\${escapeHtml(s.iframe)}</div>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.5rem;">
              <button class="copy-btn" onclick="copyIframe('\${s.yt_video_id}')">Copy &lt;/&gt;</button>
              <button class="preview-btn" onclick="openPreview('\${s.yt_video_id}', '\${escapeHtml(s.title)}')">Preview ▶</button>
            </div>
          </td>
        </tr>
      \`).join('');
    }

    function escapeHtml(str) {
      return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    document.getElementById('searchInput').addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = allSongs.filter(s => 
        (s.title || '').toLowerCase().includes(q) ||
        (s.artist || '').toLowerCase().includes(q) ||
        (s.genre || '').toLowerCase().includes(q) ||
        (s.yt_video_id || '').toLowerCase().includes(q)
      );
      renderTable(filtered);
    });

    function copyIframe(ytId) {
      const song = allSongs.find(s => s.yt_video_id === ytId);
      if (!song) return;
      navigator.clipboard.writeText(song.iframe).then(() => {
        showToast('Copied iframe for: ' + song.title);
      });
    }

    function copyAllIframes() {
      const allCodes = allSongs.map(s => '<!-- ' + s.title + ' - ' + s.artist + ' -->\\n' + s.iframe).join('\\n\\n');
      navigator.clipboard.writeText(allCodes).then(() => {
        showToast('Copied all 755 song iframes to clipboard!');
      });
    }

    function openPreview(ytId, title) {
      document.getElementById('modalSongTitle').textContent = title;
      document.getElementById('iframeContainer').innerHTML = \`
        <iframe src="https://www.youtube-nocookie.com/embed/\${ytId}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      \`;
      document.getElementById('previewModal').style.display = 'flex';
    }

    function closePreview() {
      document.getElementById('previewModal').style.display = 'none';
      document.getElementById('iframeContainer').innerHTML = '';
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.display = 'block';
      setTimeout(() => { t.style.display = 'none'; }, 2500);
    }
  </script>
</body>
</html>`;

  const htmlFilePath = path.join(publicDir, 'all_song_iframes.html');
  fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
  console.log(`✅ Saved complete HTML catalog to: ${htmlFilePath}`);
}

generate().catch(err => {
  console.error('Error generating iframes:', err);
});
