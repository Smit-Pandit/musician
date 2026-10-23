import React, { useState } from 'react';
import {
  ListMusic,
  Play,
  Pause,
  Plus,
  Lock,
  Globe,
  Trash2,
  Clock,
  Heart,
  Shuffle,
  Share2,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getFullPlaylist } from '../data/musicData';

export default function PlaylistsView() {
  const {
    playlists,
    selectedPlaylistId,
    setSelectedPlaylistId,
    playTrack,
    isPlaying,
    currentTrack,
    togglePlay,
    createPlaylist,
    listeningHistory,
    toggleLikeTrack
  } = useApp();

  const activePlaylist = getFullPlaylist(selectedPlaylistId) || getFullPlaylist(playlists[0]?.playlist_id);

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (newTitle.trim()) {
      const id = createPlaylist(newTitle.trim(), newDesc.trim(), isPublic);
      setSelectedPlaylistId(id);
      setIsCreating(false);
      setNewTitle('');
      setNewDesc('');
    }
  };

  if (!activePlaylist) return null;

  const totalDurationSec = activePlaylist.tracks.reduce(
    (acc, item) => acc + (item.track?.duration_sec || Math.floor((item.track?.duration_ms || 0) / 1000)),
    0
  );

  return (
    <div className="playlists-view">
      {/* Playlists Horizontal Shelf */}
      <div className="playlist-shelf-bar glass-panel">
        <div className="shelf-header">
          <span className="shelf-title">Select Playlist:</span>
          <button className="btn-primary-mini" onClick={() => setIsCreating(true)}>
            <Plus size={14} /> New
          </button>
        </div>
        <div className="shelf-list">
          {playlists.map(pl => (
            <button
              key={pl.playlist_id}
              className={`shelf-item-btn ${pl.playlist_id === activePlaylist.playlist_id ? 'active' : ''}`}
              onClick={() => setSelectedPlaylistId(pl.playlist_id)}
            >
              <img src={pl.cover_art_url} alt={pl.title} className="shelf-item-art" />
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

      {/* Create Modal Drawer */}
      {isCreating && (
        <div className="create-playlist-drawer glass-panel">
          <h3 className="drawer-title">Create New Sonic Playlist</h3>
          <form onSubmit={handleCreateSubmit} className="drawer-form">
            <input
              type="text"
              placeholder="Playlist Title (e.g. Neon Cyber Rush)..."
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
            <div className="drawer-checkbox-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={e => setIsPublic(e.target.checked)}
                />
                <span>Make Public (visible to other users on SONIX)</span>
              </label>
            </div>
            <div className="drawer-actions">
              <button type="submit" className="btn-primary">
                Save Playlist
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

      {/* Playlist Hero Detail */}
      <div className="playlist-hero glass-panel">
        <img
          src={activePlaylist.cover_art_url}
          alt={activePlaylist.title}
          className="playlist-hero-art"
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
          <p className="playlist-hero-desc">{activePlaylist.description}</p>

          <div className="playlist-hero-meta">
            <span className="creator-tag">
              Created by <strong>@{activePlaylist.user?.username || 'User'}</strong>
            </span>
            <span className="meta-bullet">•</span>
            <span>{activePlaylist.tracks.length} songs</span>
            <span className="meta-bullet">•</span>
            <span>
              {Math.floor(totalDurationSec / 60)} min {totalDurationSec % 60} sec
            </span>
          </div>

          <div className="playlist-actions-row">
            <button
              className="btn-primary"
              onClick={() => {
                if (activePlaylist.tracks.length > 0) {
                  playTrack(activePlaylist.tracks[0].track.track_id);
                }
              }}
            >
              <Play size={18} className="play-icon-offset" /> Play All
            </button>
          </div>
        </div>
      </div>

      {/* Playlist Tracks Table (PLAYLIST_TRACKS Junction Table) */}
      <div className="playlist-table-card glass-panel">
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
            {activePlaylist.tracks.map((item) => {
              const track = item.track;
              if (!track) return null;
              const isThisPlaying = isPlaying && currentTrack?.track_id === track.track_id;
              const isLiked = listeningHistory.some(h => h.track_id === track.track_id && h.is_liked);

              return (
                <tr key={item.position_order}>
                  <td className="font-mono position-col">
                    <span className="pos-number">{item.position_order}</span>
                    <button
                      className="btn-table-play"
                      onClick={() => {
                        if (isThisPlaying) togglePlay();
                        else playTrack(track.track_id);
                      }}
                    >
                      {isThisPlaying ? <Pause size={14} /> : <Play size={14} className="play-icon-offset" />}
                    </button>
                  </td>
                  <td>
                    <div className="table-track-cell">
                      <img
                        src={track.album?.cover_art_url || track.artist?.avatar_url}
                        alt={track.title}
                        className="table-thumb"
                      />
                      <span className="table-title">{track.title}</span>
                    </div>
                  </td>
                  <td>{track.artist?.name}</td>
                  <td><span className="badge badge-purple">{track.genre}</span></td>
                  <td className="font-mono text-muted text-sm">
                    {new Date(item.added_at).toLocaleDateString()}
                  </td>
                  <td className="font-mono">
                    {(() => {
                      const sec = track.duration_sec || Math.floor((track.duration_ms || 0) / 1000);
                      return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
                    })()}
                  </td>
                  <td>
                    <button
                      className={`btn-table-heart ${isLiked ? 'liked' : ''}`}
                      onClick={() => toggleLikeTrack(track.track_id)}
                    >
                      <Heart size={14} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : 'currentColor'} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
