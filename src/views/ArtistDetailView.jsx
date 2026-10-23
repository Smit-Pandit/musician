import React, { useState } from 'react';
import {
  CheckCircle,
  Play,
  Pause,
  Tv,
  Disc,
  Heart,
  GitBranch,
  ExternalLink,
  Users,
  Radio,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ARTISTS,
  ALBUMS,
  TRACKS,
  getArtistById,
  getTrackWithRelations
} from '../data/musicData';

export default function ArtistDetailView() {
  const {
    selectedArtistId,
    setSelectedArtistId,
    playTrack,
    isPlaying,
    currentTrack,
    togglePlay,
    listeningHistory,
    toggleLikeTrack,
    setShowVideoModal,
    setCurrentTrack
  } = useApp();

  const artist = getArtistById(selectedArtistId) || ARTISTS[0];
  const albums = ALBUMS.filter(a => a.artist_id === artist.artist_id);
  const tracks = TRACKS.filter(t => t.artist_id === artist.artist_id).map(t =>
    getTrackWithRelations(t.track_id)
  );

  // Group albums by type: album, ep, single
  const studioAlbums = albums.filter(a => a.album_type === 'album');
  const eps = albums.filter(a => a.album_type === 'ep');
  const singles = albums.filter(a => a.album_type === 'single');

  // Find tracks with parent track lineage (remixes/covers)
  const remixTracks = tracks.filter(t => t.parent_track_id != null);

  return (
    <div className="artist-view">
      {/* Other Artists Switcher Bar */}
      <div className="artist-quick-selector glass-panel">
        <span className="selector-title">Browse Verified Artists:</span>
        <div className="artists-pill-row">
          {ARTISTS.map(a => (
            <button
              key={a.artist_id}
              className={`artist-pill-btn ${a.artist_id === artist.artist_id ? 'active' : ''}`}
              onClick={() => setSelectedArtistId(a.artist_id)}
            >
              <img src={a.avatar_url} alt={a.name} className="artist-pill-thumb" />
              <span>{a.name}</span>
              {a.verified_status && <CheckCircle size={12} className="verified-icon" />}
            </button>
          ))}
        </div>
      </div>

      {/* Artist Hero Banner */}
      <div
        className="artist-hero-card glass-panel"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(14, 18, 34, 0.4), rgba(7, 9, 19, 0.95)), url(${artist.header_banner})`
        }}
      >
        <div className="artist-hero-body">
          <div className="artist-avatar-wrap">
            <img src={artist.avatar_url} alt={artist.name} className="artist-big-avatar" />
          </div>

          <div className="artist-info-meta">
            <div className="artist-title-row">
              <span className="artist-tag">ARTIST PROFILE</span>
              {artist.verified_status && (
                <span className="badge badge-purple verified-badge">
                  <CheckCircle size={13} /> Verified Creator
                </span>
              )}
            </div>

            <h1 className="artist-hero-name">{artist.name}</h1>

            <div className="artist-stats-row">
              <span className="artist-stat">
                <strong>{artist.monthly_listeners}</strong> Monthly Listeners
              </span>
              <span className="meta-bullet">•</span>
              <span className="artist-stat">
                <strong>{artist.subscribers}</strong> YouTube Subscribers
              </span>
              <span className="meta-bullet">•</span>
              <span className="artist-yt-channel font-mono">
                YT Channel: {artist.youtube_channel_id}
              </span>
            </div>

            <p className="artist-bio-text">{artist.bio}</p>

            <div className="artist-cta-row">
              <button
                className="btn-primary"
                onClick={() => {
                  if (tracks.length > 0) playTrack(tracks[0].track_id);
                }}
              >
                <Play size={18} className="play-icon-offset" /> Play Top Tracks
              </button>
              <a
                href={`https://youtube.com/${artist.youtube_channel_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <Tv size={16} /> Official YouTube Channel
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Tracks & Stem Player */}
      <div className="artist-section glass-panel">
        <div className="artist-section-header">
          <h2 className="section-title">Popular Discography Tracks</h2>
          <span className="section-meta">{tracks.length} tracks registered</span>
        </div>

        <div className="artist-tracks-table">
          {tracks.map((track, idx) => {
            const isThisPlaying = isPlaying && currentTrack?.track_id === track.track_id;
            const isLiked = listeningHistory.some(h => h.track_id === track.track_id && h.is_liked);

            return (
              <div key={track.track_id} className="artist-track-row">
                <span className="track-index font-mono">{idx + 1}</span>
                <button
                  className="btn-row-play"
                  onClick={() => {
                    if (isThisPlaying) togglePlay();
                    else playTrack(track.track_id);
                  }}
                >
                  {isThisPlaying ? <Pause size={15} /> : <Play size={15} className="play-icon-offset" />}
                </button>
                <img
                  src={track.album?.cover_art_url || artist.avatar_url}
                  alt={track.title}
                  className="row-art"
                />
                <div className="row-meta">
                  <span className="row-title">{track.title}</span>
                  <span className="row-sub">
                    {track.album?.title || 'Single'} • {track.genre}
                  </span>
                </div>

                <div className="row-tags">
                  <span className="badge badge-purple">{track.track_type}</span>
                </div>

                <span className="row-duration font-mono">
                  {(() => {
                    const sec = track.duration_sec || Math.floor((track.duration_ms || 0) / 1000);
                    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
                  })()}
                </span>

                <div className="row-actions">
                  <button
                    className={`btn-row-heart ${isLiked ? 'liked' : ''}`}
                    onClick={() => toggleLikeTrack(track.track_id)}
                  >
                    <Heart size={15} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : 'currentColor'} />
                  </button>
                  <button
                    className="btn-row-tv"
                    onClick={() => {
                      setCurrentTrack(track);
                      setShowVideoModal(true);
                    }}
                    title="Watch Official Video"
                  >
                    <Tv size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Remix & Cover Lineage Section (Mapping parent_track_id Self-FK) */}
      <div className="artist-section glass-panel">
        <div className="artist-section-header">
          <div>
            <h2 className="section-title">
              <GitBranch size={18} className="title-icon" /> Remix &amp; Cover Lineage
            </h2>
            <p className="section-sub">
              Visualizing the self-referencing foreign key (<code>parent_track_id</code>) in the <code>TRACKS</code> table
            </p>
          </div>
        </div>

        <div className="lineage-tree-container">
          <div className="lineage-root-card glass-panel">
            <span className="lineage-pill root-pill">Original Parent Track (PK: 1)</span>
            <div className="lineage-card-body">
              <Disc size={20} className="lineage-disc-icon" />
              <div>
                <h4 className="lineage-song-title">Nightcall (Official)</h4>
                <p className="lineage-artist-sub">Kavinsky • OutRun (2013)</p>
              </div>
            </div>
          </div>

          <div className="lineage-branch-connector">
            <div className="lineage-line"></div>
            <span className="lineage-branch-label">Derives From Remix (1:N)</span>
          </div>

          <div className="lineage-derived-card glass-panel">
            <span className="lineage-pill derived-pill">
              Remix Track (PK: 2, parent_track_id: 1)
            </span>
            <div className="lineage-card-body">
              <Disc size={20} className="lineage-disc-icon derived-disc" />
              <div>
                <h4 className="lineage-song-title">Nightcall (Dustin N'Guyen Remix)</h4>
                <p className="lineage-artist-sub">Dustin N'Guyen / Kavinsky • Synthwave</p>
              </div>
            </div>
            <button
              className="btn-secondary lineage-play-btn"
              onClick={() => playTrack(2)}
            >
              <Play size={14} /> Play Remix Snippet
            </button>
          </div>
        </div>
      </div>

      {/* Albums Discography Grid */}
      <div className="artist-section glass-panel">
        <div className="artist-section-header">
          <h2 className="section-title">Studio Albums &amp; EPs (ALBUMS Table)</h2>
          <span className="section-meta">{albums.length} releases</span>
        </div>

        <div className="albums-showcase-grid">
          {albums.map(album => (
            <div key={album.album_id} className="album-card glass-panel">
              <div className="album-cover-box">
                <img src={album.cover_art_url} alt={album.title} className="album-cover" />
                <span className="album-type-badge">{album.album_type.toUpperCase()}</span>
              </div>
              <div className="album-card-body">
                <h4 className="album-title">{album.title}</h4>
                <p className="album-year">{album.release_year}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
