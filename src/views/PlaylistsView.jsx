import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ListMusic,
  Play,
  Pause,
  Plus,
  Lock,
  Globe,
  Trash2,
  Heart,
  Search,
  Check,
  Music,
  X,
  Share2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRACKS, getTrackWithRelations } from '../data/musicData';

const COVER_PRESETS = [
  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'
];

export default function PlaylistsView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    playlists,
    playlistTracks,
    tracksList,
    selectedPlaylistId,
    setSelectedPlaylistId,
    playTrack,
    isPlaying,
    currentTrack,
    togglePlay,
    createPlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    listeningHistory,
    toggleLikeTrack
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedPresetArt, setSelectedPresetArt] = useState(COVER_PRESETS[0]);

  // Add Songs Drawer State
  const [isAddSongsOpen, setIsAddSongsOpen] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Active playlist resolution
  const activeId = id ? parseInt(id, 10) : (playlists[0]?.playlist_id || selectedPlaylistId);
  const activePlaylist = playlists.find(p => p.playlist_id === activeId) || playlists[0] || null;

  // Active tracks resolution
  const activeTracks = activePlaylist
    ? playlistTracks
        .filter(pt => pt.playlist_id === activePlaylist.playlist_id)
        .sort((a, b) => a.position_order - b.position_order)
        .map(pt => {
          const fullTrack =
            pt.track ||
            (tracksList || []).find(t => t.track_id === pt.track_id) ||
            getTrackWithRelations(pt.track_id) ||
            TRACKS.find(t => t.track_id === pt.track_id);
          return {
            ...pt,
            track: fullTrack
          };
        })
    : [];

  const totalDurationSec = activeTracks.reduce((acc, item) => {
    return acc + (item.track?.duration_sec || 210);
  }, 0);

  // Filter 755 catalog tracks for adding to playlist
  const catalogPool = (tracksList && tracksList.length > 0) ? tracksList : TRACKS;
  const filteredCatalog = songSearchQuery.trim()
    ? catalogPool.filter(t => {
        const q = songSearchQuery.toLowerCase();
        return (
          (t.title || '').toLowerCase().includes(q) ||
          (t.artist?.name || t.artist_name || '').toLowerCase().includes(q) ||
          (t.genre || '').toLowerCase().includes(q)
        );
      }).slice(0, 20)
    : catalogPool.slice(0, 15);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newId = await createPlaylist(newTitle.trim(), newDesc.trim(), isPublic, selectedPresetArt);
    setSelectedPlaylistId(newId);
    setIsCreating(false);
    setNewTitle('');
    setNewDesc('');
    navigate(`/playlists/${newId}`);
  };

  const handleDeletePlaylist = async () => {
    if (!activePlaylist) return;
    if (window.confirm(`Are you sure you want to delete "${activePlaylist.title}"?`)) {
      await deletePlaylist(activePlaylist.playlist_id);
      const remaining = playlists.filter(p => p.playlist_id !== activePlaylist.playlist_id);
      if (remaining.length > 0) {
        navigate(`/playlists/${remaining[0].playlist_id}`);
      } else {
        navigate('/playlists');
      }
    }
  };

  const handleSharePlaylist = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // If no playlists exist at all
  if (!activePlaylist && playlists.length === 0) {
    return (
      <div className="playlists-view">
        <div className="empty-playlist-hero glass-panel" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <ListMusic size={64} style={{ color: '#8b5cf6', margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>Your Playlist Library is Empty</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto 24px' }}>
            Build your personalized sonic realms. Group your favorite high-octane synthwave, cyberpunk beats, or chill frequencies.
          </p>
          <button className="btn-primary" onClick={() => setIsCreating(true)}>
            <Plus size={18} /> Create Your First Playlist
          </button>
        </div>

        {isCreating && (
          <div className="create-playlist-drawer glass-panel" style={{ marginTop: '24px' }}>
            <h3 className="drawer-title">Create New Sonic Playlist</h3>
            <form onSubmit={handleCreateSubmit} className="drawer-form">
              <input
                type="text"
                placeholder="Playlist Title (e.g. Neon Cyber Highway)..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="drawer-input"
                required
              />
              <input
                type="text"
                placeholder="Description..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="drawer-input"
              />
              <div className="drawer-actions">
                <button type="submit" className="btn-primary">Save Playlist</button>
                <button type="button" className="btn-secondary" onClick={() => setIsCreating(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="playlists-view">
      {/* 1. Playlists Horizontal Shelf */}
      <div className="playlist-shelf-bar glass-panel">
        <div className="shelf-header">
          <span className="shelf-title">PLAYLISTS ({playlists.length})</span>
          <button className="btn-primary-mini" onClick={() => setIsCreating(true)}>
            <Plus size={14} /> New
          </button>
        </div>
        <div className="shelf-list">
          {playlists.map(pl => (
            <button
              key={pl.playlist_id}
              className={`shelf-item-btn ${pl.playlist_id === activePlaylist?.playlist_id ? 'active' : ''}`}
              onClick={() => navigate(`/playlists/${pl.playlist_id}`)}
            >
              <img
                src={pl.cover_art_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'}
                alt={pl.title}
                className="shelf-item-art"
                onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100'; }}
              />
              <div className="shelf-item-info">
                <span className="shelf-item-title">{pl.title}</span>
                <span className="shelf-item-badge">
                  {pl.is_public ? 'Public' : 'Private'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Create Modal Drawer */}
      {isCreating && (
        <div className="create-playlist-drawer glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="drawer-title">Create New Sonic Playlist</h3>
            <button className="btn-table-remove" onClick={() => setIsCreating(false)}>
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleCreateSubmit} className="drawer-form">
            <input
              type="text"
              placeholder="Playlist Title (e.g. Tokyo Midnight Drives)..."
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="drawer-input"
              required
            />
            <input
              type="text"
              placeholder="Description (Optional)..."
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="drawer-input"
            />

            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Choose Cover Preset:
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                {COVER_PRESETS.map((preset, idx) => (
                  <img
                    key={idx}
                    src={preset}
                    alt={`Preset ${idx + 1}`}
                    onClick={() => setSelectedPresetArt(preset)}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '8px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: selectedPresetArt === preset ? '2px solid #8b5cf6' : '2px solid transparent',
                      transform: selectedPresetArt === preset ? 'scale(1.08)' : 'none',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="drawer-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                />
                <span>Make Public (visible to other users on Musicians)</span>
              </label>
            </div>

            <div className="drawer-actions">
              <button type="submit" className="btn-primary">
                Save & Create Playlist
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Playlist Hero Detail */}
      {activePlaylist && (
        <div className="playlist-hero glass-panel">
          <img
            src={activePlaylist.cover_art_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'}
            alt={activePlaylist.title}
            className="playlist-hero-art"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500'; }}
          />
          <div className="playlist-hero-details">
            <div className="playlist-type-tag-row">
              <span className="playlist-pill-type">PLAYLIST</span>
              {activePlaylist.is_public ? (
                <span className="badge badge-cyan">
                  <Globe size={12} /> PUBLIC
                </span>
              ) : (
                <span className="badge badge-amber">
                  <Lock size={12} /> PRIVATE
                </span>
              )}
            </div>

            <h1 className="playlist-hero-title">{activePlaylist.title}</h1>
            <p className="playlist-hero-desc">{activePlaylist.description || 'Custom playlist on Musicians'}</p>

            <div className="playlist-hero-meta">
              <span className="creator-tag">
                Created by <strong>@{activePlaylist.username || activePlaylist.user?.username || 'Alex_Synthwave'}</strong>
              </span>
              <span className="meta-bullet">•</span>
              <span>{activeTracks.length} songs</span>
              <span className="meta-bullet">•</span>
              <span>
                {Math.floor(totalDurationSec / 60)} min {totalDurationSec % 60} sec
              </span>
            </div>

            <div className="playlist-actions-row" style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '12px' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  if (activeTracks.length > 0 && activeTracks[0].track) {
                    const queueTracks = activeTracks.map(item => item.track).filter(Boolean);
                    playTrack(activeTracks[0].track.track_id, null, queueTracks);
                  }
                }}
                disabled={activeTracks.length === 0}
              >
                <Play size={18} className="play-icon-offset" /> Play All
              </button>

              <button
                className="btn-secondary"
                onClick={() => setIsAddSongsOpen(prev => !prev)}
              >
                <Plus size={16} /> {isAddSongsOpen ? 'Close Song Search' : 'Add Songs to Playlist'}
              </button>

              <button
                className="btn-secondary"
                onClick={handleSharePlaylist}
                title="Copy link to playlist"
              >
                {copiedLink ? <Check size={16} color="#10b981" /> : <Share2 size={16} />}
                <span>{copiedLink ? 'Copied Link!' : 'Share'}</span>
              </button>

              <button
                className="btn-danger-outline"
                onClick={handleDeletePlaylist}
                title="Delete this playlist"
              >
                <Trash2 size={16} /> Delete Playlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Add Songs Search Drawer (Add any of the 755 songs to this playlist) */}
      {isAddSongsOpen && activePlaylist && (
        <div className="add-songs-drawer glass-panel">
          <div className="add-songs-header">
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>Add Tracks from Catalog to "{activePlaylist.title}"</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Search across all 755 songs in the database by title, artist, or genre.
              </p>
            </div>
            <button className="btn-table-remove" onClick={() => setIsAddSongsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="add-songs-search-box">
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search song title, artist, or genre (e.g. Daft Punk, Synthwave, Hip Hop)..."
              value={songSearchQuery}
              onChange={(e) => setSongSearchQuery(e.target.value)}
              className="add-songs-search-input"
              autoFocus
            />
            {songSearchQuery && (
              <button
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setSongSearchQuery('')}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="add-songs-results-list">
            {filteredCatalog.map(t => {
              const isInPlaylist = activeTracks.some(pt => pt.track_id === t.track_id);
              const thumb =
                t.custom_thumbnail_url ||
                (t.yt_video_id ? `https://img.youtube.com/vi/${t.yt_video_id}/mqdefault.jpg` : null) ||
                t.album?.cover_art_url ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';

              return (
                <div key={t.track_id} className="add-song-row-item">
                  <div className="add-song-item-meta">
                    <img
                      src={thumb}
                      alt={t.title}
                      className="add-song-item-thumb"
                      onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'; }}
                    />
                    <div>
                      <span className="add-song-item-title">{t.title}</span>
                      <span className="add-song-item-sub">
                        {t.artist?.name || t.artist_name || 'Artist'} • <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>{t.genre || 'Electronic'}</span>
                      </span>
                    </div>
                  </div>

                  {isInPlaylist ? (
                    <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> In Playlist
                    </span>
                  ) : (
                    <button
                      className="btn-primary-mini"
                      onClick={() => addTrackToPlaylist(activePlaylist.playlist_id, t.track_id)}
                    >
                      <Plus size={14} /> Add
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Playlist Tracks Table (PLAYLIST_TRACKS Junction Table) */}
      <div className="playlist-table-card glass-panel">
        {activeTracks.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <Music size={42} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>No songs in this playlist yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
              Click the button below to browse and add songs from your library.
            </p>
            <button className="btn-primary" onClick={() => setIsAddSongsOpen(true)}>
              <Plus size={16} /> Add Songs Now
            </button>
          </div>
        ) : (
          <table className="tracks-table">
            <thead>
              <tr>
                <th># Order</th>
                <th>Title</th>
                <th>Artist</th>
                <th>Genre</th>
                <th>Added Date</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeTracks.map((item, index) => {
                const track = item.track;
                if (!track) return null;
                const isThisPlaying = isPlaying && currentTrack?.track_id === track.track_id;
                const isLiked = listeningHistory.some(h => h.track_id === track.track_id && h.is_liked);

                const thumb =
                  track.custom_thumbnail_url ||
                  (track.yt_video_id ? `https://img.youtube.com/vi/${track.yt_video_id}/mqdefault.jpg` : null) ||
                  track.album?.cover_art_url ||
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';

                return (
                  <tr key={`${activePlaylist.playlist_id}-${track.track_id}-${index}`}>
                    <td className="font-mono position-col">
                      <span className="pos-number">{item.position_order || index + 1}</span>
                      <button
                        className="btn-table-play"
                        onClick={() => {
                          if (isThisPlaying) {
                            togglePlay();
                          } else {
                            const queueTracks = activeTracks.map(t => t.track).filter(Boolean);
                            playTrack(track.track_id, null, queueTracks);
                          }
                        }}
                      >
                        {isThisPlaying ? <Pause size={14} /> : <Play size={14} className="play-icon-offset" />}
                      </button>
                    </td>
                    <td>
                      <div className="table-track-cell">
                        <img
                          src={thumb}
                          alt={track.title}
                          className="table-thumb"
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'; }}
                        />
                        <span className="table-title">{track.title}</span>
                      </div>
                    </td>
                    <td>{track.artist?.name || track.artist_name || 'Featured Artist'}</td>
                    <td><span className="badge badge-purple">{track.genre || 'Electronic'}</span></td>
                    <td className="font-mono text-muted text-sm">
                      {item.added_at ? new Date(item.added_at).toLocaleDateString() : 'Recently'}
                    </td>
                    <td className="font-mono">
                      {(() => {
                        const sec = track.duration_sec || 210;
                        return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
                      })()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          className={`btn-table-heart ${isLiked ? 'liked' : ''}`}
                          onClick={() => toggleLikeTrack(track.track_id)}
                          title={isLiked ? 'Unlike' : 'Like'}
                        >
                          <Heart size={14} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : 'currentColor'} />
                        </button>

                        <button
                          className="btn-table-remove"
                          onClick={() => removeTrackFromPlaylist(activePlaylist.playlist_id, track.track_id)}
                          title="Remove from this playlist"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
