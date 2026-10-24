import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Heart,
  Tv,
  Gamepad2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Code,
  Check,
  Disc,
  Clock3,
  ListPlus
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRACKS, ARTISTS, getTrackWithRelations } from '../data/musicData';

export default function DiscoverView({ globalSearchTerm = '' }) {
  const navigate = useNavigate();
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    listeningHistory,
    toggleLikeTrack,
    setShowVideoModal,
    setCurrentTrack,
    tracksList,
    artistsList,
    playlists,
    playlistTracks,
    addTrackToPlaylist
  } = useApp();

  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [copiedTrackId, setCopiedTrackId] = useState(null);
  const [activeDropdownTrackId, setActiveDropdownTrackId] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(30);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdownTrackId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const genres = [
    'ALL',
    'Electronic music',
    'Synthwave',
    'Hip hop music',
    'Pop music',
    'Independent music'
  ];

  const allArtists = (artistsList && artistsList.length > 0) ? artistsList : ARTISTS;
  const activeTracks = (tracksList && tracksList.length > 0) ? tracksList : TRACKS;

  // Spotlight Track (Nightcall or first track)
  const spotlightTrack = getTrackWithRelations(1) || (activeTracks[0] ? getTrackWithRelations(activeTracks[0].track_id) || activeTracks[0] : TRACKS[0]);

  // Filter tracks safely
  const filtered = activeTracks
    .map(t => getTrackWithRelations(t.track_id) || t)
    .filter(t => {
      if (!t) return false;
      const trackGenre = t.genre || 'Electronic';
      const matchesGenre = selectedGenre === 'ALL' || trackGenre.toLowerCase() === selectedGenre.toLowerCase();
      const query = (globalSearchTerm || '').toLowerCase().trim();
      const matchesSearch =
        !query ||
        (t.title || '').toLowerCase().includes(query) ||
        (t.artist?.name || t.artist_name || '').toLowerCase().includes(query) ||
        trackGenre.toLowerCase().includes(query);
      return matchesGenre && matchesSearch;
    });

  // Top 6 Quick Picks for Spotify-style top grid
  const quickPicks = filtered.slice(0, 6);

  const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return '3:30';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <motion.div
      className="spotify-discover-page"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* 1. TOP SPOTLIGHT HERO BANNER (Spotify Canvas Style) */}
      <section className="spotify-spotlight-hero">
        <div
          className="hero-ambient-backdrop"
          style={{
            backgroundImage: `url(${spotlightTrack.custom_thumbnail_url || (spotlightTrack.yt_video_id ? `https://img.youtube.com/vi/${spotlightTrack.yt_video_id}/maxresdefault.jpg` : spotlightTrack.album?.cover_art_url)})`
          }}
        ></div>
        <div className="hero-dark-overlay"></div>

        <div className="hero-inner-content">
          <div className="hero-badge-row">
            <span className="hero-pill-tag">
              <Sparkles size={13} /> EDITORIAL PICK
            </span>
            <span className="hero-genre-tag">{spotlightTrack.genre || 'Electronic'}</span>
          </div>

          <h1 className="hero-track-title">{spotlightTrack.title}</h1>
          <p className="hero-artist-meta">
            By{' '}
            <strong
              className="hero-artist-clickable"
              onClick={() => navigate(`/artist/${spotlightTrack.artist_id}`)}
            >
              {spotlightTrack.artist?.name || spotlightTrack.artist_name || 'Featured Artist'}
            </strong>{' '}
            • <span>{spotlightTrack.album?.title || 'Single'}</span> ({spotlightTrack.album?.release_year || '2024'})
          </p>

          <p className="hero-track-desc">
            Stream the authentic master recording in loss-free audio. Experience iconic basslines, analog synthesizers, and atmosphere.
          </p>

          <div className="hero-actions-row">
            <motion.button
              className="btn-spotify-hero-play"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (currentTrack?.track_id === spotlightTrack.track_id && isPlaying) {
                  togglePlay();
                } else {
                  playTrack(spotlightTrack.track_id);
                }
              }}
            >
              {currentTrack?.track_id === spotlightTrack.track_id && isPlaying ? (
                <>
                  <Pause size={18} fill="currentColor" /> Pause
                </>
              ) : (
                <>
                  <Play size={18} fill="currentColor" /> Play Spotlight
                </>
              )}
            </motion.button>

            <button
              className="btn-spotify-hero-secondary"
              onClick={() => {
                setCurrentTrack(spotlightTrack);
                setShowVideoModal(true);
              }}
            >
              <Tv size={16} /> Watch Video
            </button>

            <button
              className="btn-spotify-hero-arena"
              onClick={() => navigate('/game')}
            >
              <Gamepad2 size={16} /> Heardle Arena <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. SPOTIFY QUICK PICKS (2x3 Compact Grid) */}
      <section className="spotify-shelf-section">
        <h2 className="shelf-section-title">Quick Picks</h2>
        <div className="spotify-quick-picks-grid">
          {quickPicks.map((track) => {
            const isThisPlaying = currentTrack?.track_id === track.track_id && isPlaying;
            const thumb =
              track.custom_thumbnail_url ||
              (track.yt_video_id ? `https://img.youtube.com/vi/${track.yt_video_id}/mqdefault.jpg` : null) ||
              track.album?.cover_art_url ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';

            return (
              <motion.div
                key={track.track_id}
                className={`quick-pick-card group ${isThisPlaying ? 'is-active-pick' : ''}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  if (isThisPlaying) togglePlay();
                  else playTrack(track.track_id);
                }}
              >
                <img
                  src={thumb}
                  alt={track.title}
                  className="quick-pick-thumb"
                  onError={(e) => { e.currentTarget.src = track.album?.cover_art_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'; }}
                />
                <div className="quick-pick-info">
                  <span className="quick-pick-title">{track.title}</span>
                  <span className="quick-pick-artist">{track.artist?.name || track.artist_name || 'Artist'}</span>
                </div>
                <div className="quick-pick-play-btn">
                  {isThisPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED ARTISTS SHELF (Spotify Circular Cards) */}
      <section className="spotify-shelf-section">
        <div className="shelf-header-between">
          <h2 className="shelf-section-title">Popular Artists</h2>
          <button className="shelf-see-all-btn" onClick={() => navigate('/artist')}>
            See all
          </button>
        </div>

        <div className="spotify-artists-row">
          {allArtists.slice(0, 7).map((artist) => (
            <motion.div
              key={artist.artist_id}
              className="spotify-artist-card"
              whileHover={{ y: -4 }}
              onClick={() => navigate(`/artist/${artist.artist_id}`)}
            >
              <div className="artist-card-avatar-wrap">
                <img
                  src={artist.avatar_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400'}
                  alt={artist.name}
                  className="artist-card-avatar-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
                  }}
                />
              </div>
              <span className="artist-card-name">{artist.name}</span>
              <span className="artist-card-role">Artist</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. GENRE FILTER CHIPS */}
      <section className="genre-filter-shelf">
        <div className="genre-chips-scroll">
          {genres.map((g) => (
            <button
              key={g}
              className={`genre-chip-pill ${selectedGenre === g ? 'is-active-chip' : ''}`}
              onClick={() => setSelectedGenre(g)}
            >
              {g}
            </button>
          ))}
        </div>
      </section>

      {/* 5. TRENDING TRACKS TABLE (Spotify / YouTube Music Style) */}
      <section className="spotify-shelf-section">
        <div className="shelf-header-between">
          <div>
            <h2 className="shelf-section-title">Trending Tracks</h2>
            <p className="shelf-section-desc">Stream authentic audio directly in high fidelity</p>
          </div>
          <span className="tracks-count-pill font-mono">{filtered.length} Tracks</span>
        </div>

        <div className="spotify-tracks-table">
          {/* Table Header */}
          <div className="table-header-row font-mono">
            <span className="th-num">#</span>
            <span className="th-title">TITLE</span>
            <span className="th-album hide-mobile">ALBUM</span>
            <span className="th-genre hide-tablet">GENRE</span>
            <span className="th-duration"><Clock3 size={14} /></span>
            <span className="th-actions"></span>
          </div>

          {/* Table Rows */}
          <div className="table-rows-container">
            {filtered.slice(0, displayLimit).map((track, idx) => {
              const isThisPlaying = currentTrack?.track_id === track.track_id && isPlaying;
              const isCurrent = currentTrack?.track_id === track.track_id;
              const isLiked = listeningHistory.some((h) => h.track_id === track.track_id && h.is_liked);
              const thumb =
                track.custom_thumbnail_url ||
                (track.yt_video_id ? `https://img.youtube.com/vi/${track.yt_video_id}/mqdefault.jpg` : null) ||
                track.album?.cover_art_url ||
                'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';

              return (
                <div
                  key={track.track_id}
                  className={`spotify-track-row ${isCurrent ? 'is-current-track' : ''}`}
                  onClick={() => playTrack(track.track_id)}
                >
                  {/* # Column / Play button */}
                  <div className="td-num">
                    <span className="track-index-num font-mono">{idx + 1}</span>
                    <button
                      className="track-hover-play-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isThisPlaying) togglePlay();
                        else playTrack(track.track_id);
                      }}
                    >
                      {isThisPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                    </button>
                    {isThisPlaying && (
                      <div className="playing-bars-anim">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}
                  </div>

                  {/* Title & Artist Thumbnail */}
                  <div className="td-title">
                    <img
                      src={thumb}
                      alt={track.title}
                      className="track-table-thumb"
                      onError={(e) => { e.currentTarget.src = track.album?.cover_art_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500'; }}
                    />
                    <div className="track-table-names">
                      <span className={`track-primary-title ${isCurrent ? 'title-playing-red' : ''}`}>
                        {track.title}
                      </span>
                      <span
                        className="track-secondary-artist"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/artist/${track.artist_id}`);
                        }}
                      >
                        {track.artist?.name || track.artist_name || 'Featured Artist'}
                      </span>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="td-album hide-mobile">
                    <span>{track.album?.title || track.album_title || 'Single'}</span>
                  </div>

                  {/* Genre */}
                  <div className="td-genre hide-tablet">
                    <span className="genre-sub-pill">{track.genre || 'Electronic'}</span>
                  </div>

                  {/* Duration */}
                  <div className="td-duration font-mono">
                    {formatDuration(track.duration_sec || 215)}
                  </div>

                  {/* Actions (Heart, Add to Playlist, Copy Iframe) */}
                  <div className="td-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className={`row-heart-btn ${isLiked ? 'is-liked' : ''}`}
                      onClick={() => toggleLikeTrack(track.track_id)}
                      title={isLiked ? 'Unlike' : 'Like'}
                    >
                      <Heart size={16} fill={isLiked ? '#dc2626' : 'none'} color={isLiked ? '#dc2626' : 'currentColor'} />
                    </button>

                    <div className="row-add-playlist-wrap">
                      <button
                        className="row-add-playlist-btn"
                        title="Add to Playlist"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdownTrackId(prev => prev === track.track_id ? null : track.track_id);
                        }}
                      >
                        <ListPlus size={16} />
                      </button>

                      {activeDropdownTrackId === track.track_id && (
                        <div className="playlist-quick-dropdown" onClick={(e) => e.stopPropagation()}>
                          <div className="playlist-quick-title">ADD TO PLAYLIST</div>
                          {(!playlists || playlists.length === 0) ? (
                            <div style={{ padding: '8px 10px', fontSize: '0.78rem', color: '#a1a1aa' }}>
                              No playlists created yet.
                            </div>
                          ) : (
                            playlists.map((pl) => {
                              const inPlaylist = (playlistTracks || []).some(
                                pt => pt.playlist_id === pl.playlist_id && pt.track_id === track.track_id
                              );
                              return (
                                <button
                                  key={pl.playlist_id}
                                  className="playlist-quick-item"
                                  disabled={inPlaylist}
                                  onClick={async () => {
                                    await addTrackToPlaylist(pl.playlist_id, track.track_id);
                                    setActiveDropdownTrackId(null);
                                  }}
                                >
                                  <Disc size={13} />
                                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {pl.title}
                                  </span>
                                  {inPlaylist && <Check size={13} color="#10b981" />}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      className="row-copy-btn"
                      title="Copy YouTube <iframe> for this song"
                      onClick={() => {
                        const code =
                          track.iframe_code ||
                          `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${track.yt_video_id}" title="${track.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
                        navigator.clipboard.writeText(code);
                        setCopiedTrackId(track.track_id);
                        setTimeout(() => setCopiedTrackId(null), 2000);
                      }}
                    >
                      {copiedTrackId === track.track_id ? <Check size={14} color="#10b981" /> : <Code size={14} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length > displayLimit && (
            <div className="table-load-more-row">
              <button
                className="btn-load-more"
                onClick={() => setDisplayLimit((prev) => prev + 30)}
              >
                Load More Tracks
              </button>
            </div>
          )}
        </div>
      </section>
    </motion.div>
  );
}
