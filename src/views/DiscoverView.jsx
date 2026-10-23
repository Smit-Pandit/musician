import React, { useState } from 'react';
import {
  Compass,
  Play,
  Pause,
  Heart,
  Plus,
  Tv,
  ListFilter,
  Grid,
  List,
  Flame,
  Gamepad2,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRACKS, getTrackWithRelations } from '../data/musicData';

export default function DiscoverView({ globalSearchTerm = '' }) {
  const {
    currentTrack,
    isPlaying,
    playTrack,
    togglePlay,
    listeningHistory,
    toggleLikeTrack,
    playlists,
    addTrackToPlaylist,
    navigateToArtist,
    setShowVideoModal,
    setActiveTab,
    setCurrentTrack
  } = useApp();

  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [viewStyle, setViewStyle] = useState('grid'); // 'grid' | 'list'
  const [playlistMenuTrackId, setPlaylistMenuTrackId] = useState(null);

  const genres = ['ALL', 'Synthwave', 'Chillwave', 'Synthpop', 'Cyberpunk', 'Dark Electronic', 'French House'];
  const trackTypes = ['ALL', 'official', 'video', 'indie', 'remix'];

  // Filter tracks
  const filtered = TRACKS.map(t => getTrackWithRelations(t.track_id)).filter(t => {
    const matchesGenre = selectedGenre === 'ALL' || t.genre.toLowerCase() === selectedGenre.toLowerCase();
    const matchesType = selectedType === 'ALL' || t.track_type.toLowerCase() === selectedType.toLowerCase();
    const query = globalSearchTerm.toLowerCase();
    const matchesSearch =
      !query ||
      t.title.toLowerCase().includes(query) ||
      t.artist?.name.toLowerCase().includes(query) ||
      t.genre.toLowerCase().includes(query);
    return matchesGenre && matchesType && matchesSearch;
  });

  return (
    <div className="discover-view">
      {/* Hero Discovery Banner */}
      <div className="discover-hero glass-panel">
        <div className="discover-hero-content">
          <span className="badge badge-cyan hero-tag">
            <Compass size={14} /> AUDIO REPOSITORY
          </span>
          <h1 className="hero-title">Explore Audio Tracks &amp; Remix Lineage</h1>
          <p className="hero-sub">
            Listen to synthesizer stems, trace cover/remix relationships via parent track keys, or launch directly into the Heardle guessing arena.
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="filter-bar glass-panel">
        <div className="filter-group">
          <span className="filter-label">Genre:</span>
          <div className="filter-chips">
            {genres.map(g => (
              <button
                key={g}
                className={`filter-chip ${selectedGenre === g ? 'active' : ''}`}
                onClick={() => setSelectedGenre(g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span className="filter-label">Track Type:</span>
          <div className="filter-chips">
            {trackTypes.map(type => (
              <button
                key={type}
                className={`filter-chip ${selectedType === type ? 'active' : ''}`}
                onClick={() => setSelectedType(type)}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="view-toggle-group">
          <button
            className={`btn-view-toggle ${viewStyle === 'grid' ? 'active' : ''}`}
            onClick={() => setViewStyle('grid')}
            title="Grid view"
          >
            <Grid size={16} />
          </button>
          <button
            className={`btn-view-toggle ${viewStyle === 'list' ? 'active' : ''}`}
            onClick={() => setViewStyle('list')}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Tracks Display: Grid or List */}
      {viewStyle === 'grid' ? (
        <div className="tracks-grid">
          {filtered.map(track => {
            const isThisPlaying = isPlaying && currentTrack?.track_id === track.track_id;
            const isLiked = listeningHistory.some(h => h.track_id === track.track_id && h.is_liked);

            return (
              <div key={track.track_id} className="track-card glass-panel">
                <div className="card-thumb-wrapper">
                  <img
                    src={track.album?.cover_art_url || track.artist?.avatar_url}
                    alt={track.title}
                    className="card-thumb"
                  />
                  <div className="card-overlay">
                    <button
                      className="btn-card-play"
                      onClick={() => {
                        if (isThisPlaying) togglePlay();
                        else playTrack(track.track_id);
                      }}
                    >
                      {isThisPlaying ? <Pause size={20} /> : <Play size={20} className="play-icon-offset" />}
                    </button>
                  </div>
                  <span className="card-genre-pill">{track.genre}</span>
                  {track.track_type === 'remix' && (
                    <span className="card-remix-pill">REMIX</span>
                  )}
                </div>

                <div className="card-details">
                  <h3 className="card-title">{track.title}</h3>
                  <p
                    className="card-artist clickable-link"
                    onClick={() => navigateToArtist(track.artist_id)}
                  >
                    {track.artist?.name}
                  </p>

                  {/* Self-FK parent track relationship display */}
                  {track.parentTrack && (
                    <div className="card-parent-lineage">
                      <span>Derived from: </span>
                      <strong>{track.parentTrack.title}</strong>
                    </div>
                  )}

                  <div className="card-actions-bar">
                    <button
                      className={`btn-card-action ${isLiked ? 'liked' : ''}`}
                      onClick={() => toggleLikeTrack(track.track_id)}
                      title="Like song"
                    >
                      <Heart size={16} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : 'currentColor'} />
                    </button>

                    <div className="dropdown-action-wrap">
                      <button
                        className="btn-card-action"
                        onClick={() =>
                          setPlaylistMenuTrackId(
                            playlistMenuTrackId === track.track_id ? null : track.track_id
                          )
                        }
                        title="Add to playlist"
                      >
                        <Plus size={16} />
                      </button>

                      {playlistMenuTrackId === track.track_id && (
                        <div className="mini-dropdown glass-panel">
                          <p className="mini-drop-title">Add to Playlist:</p>
                          {playlists.map(pl => (
                            <button
                              key={pl.playlist_id}
                              className="mini-drop-item"
                              onClick={() => {
                                addTrackToPlaylist(pl.playlist_id, track.track_id);
                                setPlaylistMenuTrackId(null);
                                alert(`Added "${track.title}" to "${pl.title}"!`);
                              }}
                            >
                              {pl.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      className="btn-card-action"
                      onClick={() => {
                        setCurrentTrack(track);
                        setShowVideoModal(true);
                      }}
                      title="Watch YT Video"
                    >
                      <Tv size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="tracks-list glass-panel">
          <table className="tracks-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Title &amp; Lineage</th>
                <th>Artist</th>
                <th>Album</th>
                <th>Genre</th>
                <th>Type</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((track, i) => {
                const isThisPlaying = isPlaying && currentTrack?.track_id === track.track_id;
                const isLiked = listeningHistory.some(h => h.track_id === track.track_id && h.is_liked);

                return (
                  <tr key={track.track_id}>
                    <td>
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
                        <div>
                          <span className="table-title">{track.title}</span>
                          {track.parentTrack && (
                            <span className="table-remix-sub">
                              Cover of: {track.parentTrack.title}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span
                        className="clickable-link"
                        onClick={() => navigateToArtist(track.artist_id)}
                      >
                        {track.artist?.name}
                      </span>
                    </td>
                    <td>{track.album?.title || 'Single'}</td>
                    <td><span className="badge badge-purple">{track.genre}</span></td>
                    <td><span className="badge badge-cyan">{track.track_type}</span></td>
                    <td className="font-mono">
                      {(() => {
                        const sec = track.duration_sec || Math.floor((track.duration_ms || 0) / 1000);
                        return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
                      })()}
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          className={`btn-table-heart ${isLiked ? 'liked' : ''}`}
                          onClick={() => toggleLikeTrack(track.track_id)}
                        >
                          <Heart size={14} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : 'currentColor'} />
                        </button>
                        <button
                          className="btn-table-action"
                          onClick={() => {
                            setCurrentTrack(track);
                            setShowVideoModal(true);
                          }}
                          title="Watch YT Video"
                        >
                          <Tv size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
