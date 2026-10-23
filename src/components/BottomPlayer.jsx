import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Volume2,
  VolumeX,
  Tv,
  Maximize2,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BottomPlayer() {
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    playTrack,
    waveformData,
    listeningHistory,
    toggleLikeTrack,
    navigateToArtist,
    setShowVideoModal
  } = useApp();

  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  if (!currentTrack) return null;

  const isLiked = listeningHistory.some(
    h => h.track_id === currentTrack.track_id && h.is_liked
  );

  return (
    <div className="bottom-player-wrapper">
      <div className="bottom-player-content">
        {/* Track Metadata Info */}
        <div className="player-track-meta">
          <div className="track-thumb-box">
            <img
              src={currentTrack.album?.cover_art_url || currentTrack.artist?.avatar_url}
              alt={currentTrack.title}
              className={`track-thumb ${isPlaying ? 'spinning-thumb' : ''}`}
            />
            {isPlaying && <div className="thumb-eq-indicator"></div>}
          </div>

          <div className="track-text-details">
            <div className="track-title-row">
              <span className="player-title">{currentTrack.title}</span>
              {currentTrack.track_type === 'remix' && (
                <span className="badge badge-purple player-type-badge">Remix</span>
              )}
            </div>
            <div className="track-artist-row">
              <span
                className="player-artist clickable-link"
                onClick={() => navigateToArtist(currentTrack.artist_id)}
              >
                {currentTrack.artist?.name}
              </span>
              <span className="meta-bullet">•</span>
              <span className="player-genre">{currentTrack.genre}</span>
            </div>
          </div>

          <button
            className={`btn-like-heart ${isLiked ? 'liked' : ''}`}
            title={isLiked ? 'Remove from liked' : 'Save to liked songs'}
            onClick={() => toggleLikeTrack(currentTrack.track_id)}
          >
            <Heart size={18} fill={isLiked ? '#ec4899' : 'none'} color={isLiked ? '#ec4899' : 'currentColor'} />
          </button>
        </div>

        {/* Center: Controls & Audio Waveform Visualizer */}
        <div className="player-center-controls">
          <div className="player-buttons-row">
            <button
              className="player-btn-secondary"
              title="Previous Snippet"
              onClick={() => playTrack(Math.max(1, currentTrack.track_id - 1))}
            >
              <SkipBack size={18} />
            </button>

            <button
              className={`player-btn-play ${isPlaying ? 'is-playing' : ''}`}
              title={isPlaying ? 'Pause' : 'Play Snippet'}
              onClick={togglePlay}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="play-icon-offset" />}
            </button>

            <button
              className="player-btn-secondary"
              title="Next Track"
              onClick={() => playTrack((currentTrack.track_id % 8) + 1)}
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* Synchronized Real-time Frequency Waveform */}
          <div className="player-waveform-box">
            <span className="time-code">0:00</span>
            <div className="waveform-container">
              {waveformData.map((val, idx) => (
                <div
                  key={idx}
                  className={`waveform-bar ${isPlaying ? 'active playing' : ''}`}
                  style={{
                    height: isPlaying ? `${Math.max(12, val * 38)}px` : '6px',
                    animationDelay: `${idx * 0.04}s`
                  }}
                ></div>
              ))}
            </div>
            <span className="time-code">
              {(() => {
                const totalSec = currentTrack.duration_sec || Math.floor((currentTrack.duration_ms || 0) / 1000);
                return `${Math.floor(totalSec / 60)}:${String(totalSec % 60).padStart(2, '0')}`;
              })()}
            </span>
          </div>
        </div>

        {/* Right Action Tools: YouTube Video Embed & Volume */}
        <div className="player-right-actions">
          {/* YouTube Video Embed Modal Trigger */}
          <button
            className="btn-yt-embed-preview"
            title="Open YouTube Official Video Embed"
            onClick={() => setShowVideoModal(true)}
          >
            <Tv size={16} />
            <span className="yt-embed-text hide-mobile">YT Video</span>
          </button>

          {/* Volume Slider */}
          <div className="player-volume-group">
            <button
              className="btn-volume-icon"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setVolume(parseFloat(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              className="volume-slider"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
