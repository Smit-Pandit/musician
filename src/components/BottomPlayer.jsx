import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Heart,
  Volume2,
  VolumeX,
  Tv,
  Code,
  Check
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { soundEngine } from '../services/soundEngine';
import { TRACKS } from '../data/musicData';

export default function BottomPlayer() {
  const location = useLocation();

  const {
    currentTrack,
    isPlaying,
    setIsPlaying,
    playTrack,
    waveformData,
    listeningHistory,
    toggleLikeTrack,
    navigateToArtist,
    setShowVideoModal,
    tracksList,
    playbackQueue
  } = useApp();

  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [actualDuration, setActualDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);

  const iframeRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const progressRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const allTracks = (tracksList && tracksList.length > 0) ? tracksList : TRACKS;
  const durationSec = actualDuration > 0 ? actualDuration : (currentTrack?.duration_sec || 215);

  // 1. Centralized Player Command Dispatcher (Supports both YT API & direct postMessage)
  const sendPlayerCommand = useCallback((func, args = []) => {
    // A. If YT.Player instance is attached and method exists
    if (ytPlayerRef.current && typeof ytPlayerRef.current[func] === 'function') {
      try {
        ytPlayerRef.current[func](...args);
        return;
      } catch (err) {
        // Fall through to postMessage fallback
      }
    }
    // B. Direct postMessage to iframe window (Works 100% on any YouTube embed with enablejsapi=1)
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: func,
            args: args
          }),
          '*'
        );
      } catch (err) {
        console.warn('postMessage failed:', err);
      }
    }
  }, []);

  // 2. Play Next / Previous Track
  const playNextTrack = useCallback(() => {
    if (!currentTrack) return;
    const queue = (playbackQueue && playbackQueue.length > 0) ? playbackQueue : allTracks;
    const idx = queue.findIndex(t => t.track_id === currentTrack.track_id);
    const nextIdx = (idx + 1) % queue.length;
    playTrack(queue[nextIdx].track_id);
  }, [allTracks, playbackQueue, currentTrack, playTrack]);

  const playPreviousTrack = useCallback(() => {
    if (!currentTrack) return;
    const queue = (playbackQueue && playbackQueue.length > 0) ? playbackQueue : allTracks;
    const idx = queue.findIndex(t => t.track_id === currentTrack.track_id);
    const prevIdx = (idx - 1 + queue.length) % queue.length;
    playTrack(queue[prevIdx].track_id);
  }, [allTracks, playbackQueue, currentTrack, playTrack]);

  // 3. Reset playback tracking on track change
  useEffect(() => {
    if (!currentTrack) return;
    setCurrentTime(0);
    setActualDuration(currentTrack.duration_sec || 0);
  }, [currentTrack?.track_id]);

  // 4. Synchronize Play / Pause State with YouTube Audio
  useEffect(() => {
    if (isPlaying) {
      soundEngine.stop(); // Stop any procedural synth so real audio streams cleanly
      sendPlayerCommand('playVideo');
    } else {
      sendPlayerCommand('pauseVideo');
    }
  }, [isPlaying, sendPlayerCommand]);

  // 5. Volume & Mute Synchronization
  useEffect(() => {
    sendPlayerCommand('setVolume', [isMuted ? 0 : volume * 100]);
    if (isMuted) {
      sendPlayerCommand('mute');
    } else {
      sendPlayerCommand('unMute');
    }
  }, [volume, isMuted, sendPlayerCommand]);

  // 6. YouTube Iframe Handshake & Event Listeners
  const handleIframeLoaded = () => {
    // Handshake to request YouTube infoDelivery stream
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'listening' }),
        '*'
      );
    }

    // Set initial volume
    sendPlayerCommand('setVolume', [isMuted ? 0 : volume * 100]);
    if (isMuted) {
      sendPlayerCommand('mute');
    } else {
      sendPlayerCommand('unMute');
    }

    // If currently marked playing, trigger play
    if (isPlayingRef.current) {
      setTimeout(() => {
        sendPlayerCommand('playVideo');
      }, 150);
    }

    // Try attaching window.YT.Player if library is loaded
    if (window.YT && window.YT.Player && iframeRef.current) {
      try {
        ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: (event) => {
              event.target.setVolume(isMuted ? 0 : volume * 100);
              const dur = event.target.getDuration();
              if (dur && dur > 0) setActualDuration(dur);
              if (isPlayingRef.current) {
                event.target.playVideo();
              }
            },
            onStateChange: (event) => {
              if (event.data === 1) { // PLAYING
                setIsPlaying(true);
                const dur = ytPlayerRef.current?.getDuration();
                if (dur && dur > 0) setActualDuration(dur);
              } else if (event.data === 2) { // PAUSED
                setIsPlaying(false);
              } else if (event.data === 0) { // ENDED
                playNextTrack();
              }
            }
          }
        });
      } catch (err) {
        // Player already attached or API busy
      }
    }
  };

  // 7. Receive postMessage events directly from YouTube embed
  useEffect(() => {
    const handleWindowMessage = (e) => {
      if (!e.origin || !e.origin.includes('youtube')) return;

      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data) return;

        // infoDelivery event contains continuous time, duration, and state
        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number' && !isDraggingRef.current) {
            setCurrentTime(data.info.currentTime);
          }
          if (typeof data.info.duration === 'number' && data.info.duration > 0) {
            setActualDuration(data.info.duration);
          }
          if (data.info.playerState === 1 && !isPlayingRef.current) {
            setIsPlaying(true);
          } else if (data.info.playerState === 2 && isPlayingRef.current) {
            setIsPlaying(false);
          } else if (data.info.playerState === 0) {
            playNextTrack();
          }
        } else if (data.event === 'onStateChange') {
          if (data.info === 1 && !isPlayingRef.current) {
            setIsPlaying(true);
          } else if (data.info === 2 && isPlayingRef.current) {
            setIsPlaying(false);
          } else if (data.info === 0) {
            playNextTrack();
          }
        }
      } catch (_) {
        // Ignore unparseable third-party messages
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [setIsPlaying, playNextTrack]);

  // 8. High-Frequency Smooth Timebar Ticker (250ms)
  useEffect(() => {
    let interval;
    if (isPlaying && !isDragging) {
      interval = setInterval(() => {
        if (isDraggingRef.current) return;

        // Check if YT.Player can supply exact hardware time
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const t = ytPlayerRef.current.getCurrentTime();
            const d = ytPlayerRef.current.getDuration();
            if (typeof t === 'number' && !isNaN(t) && t >= 0) {
              setCurrentTime(t);
            }
            if (typeof d === 'number' && !isNaN(d) && d > 0) {
              setActualDuration(d);
            }
            return;
          } catch (_) {}
        }

        // Fallback smooth advance
        setCurrentTime(prev => Math.min(durationSec, prev + 0.25));
      }, 250);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isDragging, durationSec]);

  if (!currentTrack) return null;

  const isLiked = listeningHistory.some(
    h => h.track_id === currentTrack.track_id && h.is_liked
  );

  // 9. Instant Play / Pause Toggle Button Handler
  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      sendPlayerCommand('pauseVideo');
    } else {
      // If song reached the end, restart from beginning
      if (currentTime >= durationSec - 1) {
        seekTo(0);
        setCurrentTime(0);
      }
      setIsPlaying(true);
      sendPlayerCommand('playVideo');
    }
  };

  // 10. Accurate Seeking Logic
  const seekTo = (seconds) => {
    sendPlayerCommand('seekTo', [seconds, true]);
  };

  // 11. Rock-Solid Pointer Drag & Click Scrubber
  const handlePointerDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    isDraggingRef.current = true;

    const updateSeekFromEvent = (clientX, commit = false) => {
      if (!progressRef.current) return;
      const rect = progressRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const targetSec = ratio * durationSec;
      setCurrentTime(targetSec);
      if (commit) {
        seekTo(targetSec);
      }
    };

    // Immediate seek on click / pointerdown
    updateSeekFromEvent(e.clientX, true);

    const onPointerMove = (moveEvent) => {
      moveEvent.preventDefault();
      updateSeekFromEvent(moveEvent.clientX, false);
    };

    const onPointerUp = (upEvent) => {
      setIsDragging(false);
      isDraggingRef.current = false;
      updateSeekFromEvent(upEvent.clientX, true);

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
  };

  // 12. Volume Slider & Mute
  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (isMuted) setIsMuted(false);
    sendPlayerCommand('setVolume', [newVol * 100]);
    sendPlayerCommand('unMute');
  };

  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      sendPlayerCommand('mute');
    } else {
      sendPlayerCommand('unMute');
      sendPlayerCommand('setVolume', [volume * 100]);
    }
  };

  const copyTrackIframe = () => {
    const videoId = currentTrack.yt_video_id || '';
    const iframeCode = currentTrack.iframe_code || `<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/${videoId}" title="${currentTrack.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedIframe(true);
    setTimeout(() => setCopiedIframe(false), 2000);
  };

  const formatTime = (sec) => {
    if (!sec || isNaN(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Image fallbacks for 100% visible graphics
  const ytThumb = currentTrack.yt_video_id ? `https://img.youtube.com/vi/${currentTrack.yt_video_id}/mqdefault.jpg` : null;
  const fallbackImg = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
  const trackThumb = currentTrack.custom_thumbnail_url || ytThumb || currentTrack.album?.cover_art_url || fallbackImg;
  const artistAvatar = currentTrack.artist?.avatar_url || currentTrack.artist_avatar || trackThumb || fallbackImg;

  const progressPercent = durationSec > 0 ? Math.min(100, Math.max(0, (currentTime / durationSec) * 100)) : 0;

  // In Audio Arena (/game or /arena), completely hide the bottom player so no mystery song details or answer leaks
  if (location.pathname.startsWith('/game') || location.pathname.startsWith('/arena')) {
    return null;
  }

  return (
    <div className="bottom-player-wrapper">
      {/* 100% INVISIBLE YOUTUBE AUDIO ENGINE
          Has real in-viewport dimensions so Chrome, Edge, and Safari never throttle audio */}
      <div className="audio-embed-host" aria-hidden="true">
        <iframe
          ref={iframeRef}
          id="yt-player-iframe"
          key={currentTrack.track_id}
          src={`https://www.youtube-nocookie.com/embed/${currentTrack.yt_video_id}?enablejsapi=1&playsinline=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&origin=${encodeURIComponent(window.location.origin)}`}
          title="YouTube Audio Engine"
          allow="autoplay"
          onLoad={handleIframeLoaded}
          style={{ width: '100%', height: '100%', border: 'none' }}
        />
      </div>

      <div className="bottom-player-content">
        {/* 1. Track Metadata Info & Visible Artist Picture */}
        <div className="player-track-meta">
          <div className="track-thumb-box">
            <img
              src={trackThumb}
              alt={currentTrack.title}
              className={`track-thumb ${isPlaying ? 'spinning-thumb' : ''}`}
              onError={(e) => { e.target.src = currentTrack.album?.cover_art_url || fallbackImg; }}
            />
            {isPlaying && <div className="thumb-eq-indicator"></div>}
          </div>

          <div className="track-text-details">
            <div className="track-title-row">
              <span className="player-title" title={currentTrack.title}>
                {currentTrack.title}
              </span>
              {currentTrack.track_type === 'remix' && (
                <span className="badge badge-purple player-type-badge">Remix</span>
              )}
            </div>

            {/* ARTIST ROW WITH VISIBLE ARTIST PICTURE */}
            <div className="track-artist-row">
              <div className="artist-avatar-bubble-wrap" title={`Artist: ${currentTrack.artist?.name || 'Artist'}`}>
                <img
                  src={artistAvatar}
                  alt={currentTrack.artist?.name || 'Artist'}
                  className="artist-avatar-bubble-img"
                  onError={(e) => { e.target.src = fallbackImg; }}
                />
              </div>
              <span
                className="player-artist clickable-link"
                onClick={() => navigateToArtist(currentTrack.artist_id)}
                title="View artist profile"
              >
                {currentTrack.artist?.name || currentTrack.artist_name || 'Featured Artist'}
              </span>
              <span className="meta-bullet">•</span>
              <span className="player-genre">{currentTrack.genre || 'Electronic'}</span>
            </div>
          </div>

          <button
            className={`btn-like-heart ${isLiked ? 'liked' : ''}`}
            title={isLiked ? 'Remove from liked' : 'Save to liked songs'}
            onClick={() => toggleLikeTrack(currentTrack.track_id)}
          >
            <Heart size={18} fill={isLiked ? '#dc2626' : 'none'} color={isLiked ? '#dc2626' : 'currentColor'} />
          </button>
        </div>

        {/* 2. Center: Controls & Perfect Working Timing Scrubber Bar */}
        <div className="player-center-controls">
          <div className="player-buttons-row">
            <button
              className="player-btn-secondary"
              title="Previous Track"
              onClick={playPreviousTrack}
            >
              <SkipBack size={18} />
            </button>

            <button
              id="bottom-player-toggle-play"
              className={`player-btn-play ${isPlaying ? 'is-playing' : ''}`}
              title={isPlaying ? 'Pause' : 'Play Music'}
              onClick={handleTogglePlay}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} className="play-icon-offset" />}
            </button>

            <button
              className="player-btn-secondary"
              title="Next Track"
              onClick={playNextTrack}
            >
              <SkipForward size={18} />
            </button>
          </div>

          {/* REAL WORKING TIMING BAR & SCRUBBER */}
          <div className="player-seek-wrapper">
            <span className="time-code font-mono">{formatTime(currentTime)}</span>

            <div
              ref={progressRef}
              className={`player-progress-container ${isDragging ? 'is-dragging' : ''}`}
              onPointerDown={handlePointerDown}
              title="Click or drag to seek anywhere along the track"
            >
              <div
                className="player-progress-fill"
                style={{ width: `${progressPercent}%` }}
              >
                <div className={`player-progress-dot ${isDragging ? 'dragging' : ''}`}></div>
              </div>

              {/* Underlying pulsating waveform animation */}
              <div
                className="waveform-container"
                style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }}
              >
                {waveformData.map((val, idx) => (
                  <div
                    key={idx}
                    className={`waveform-bar ${isPlaying ? 'active playing' : ''}`}
                    style={{
                      height: isPlaying ? `${Math.max(6, val * 22)}px` : '4px',
                      animationDelay: `${idx * 0.04}s`
                    }}
                  ></div>
                ))}
              </div>
            </div>

            <span className="time-code font-mono">{formatTime(durationSec)}</span>
          </div>
        </div>

        {/* 3. Right: Clean Tools & Volume (Video is 100% hidden in background) */}
        <div className="player-right-actions">
          {/* Quick Tools */}
          <button
            className="btn-yt-embed-preview"
            title="Watch full video in modal"
            onClick={() => setShowVideoModal(true)}
          >
            <Tv size={15} />
            <span className="hide-mobile">Video</span>
          </button>

          <button
            className="btn-copy-iframe-fast"
            title="Copy YouTube <iframe> for this song"
            onClick={copyTrackIframe}
          >
            {copiedIframe ? <Check size={14} color="#10b981" /> : <Code size={14} />}
            <span className="hide-mobile">{copiedIframe ? 'Copied' : 'Iframe'}</span>
          </button>

          {/* Volume Control */}
          <div className="player-volume-group">
            <button
              className="btn-volume-icon"
              onClick={handleToggleMute}
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
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="volume-slider"
              title="Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
