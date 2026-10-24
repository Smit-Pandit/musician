import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Flame,
  Award,
  Zap,
  Tv,
  Sparkles,
  ChevronRight,
  TrendingUp,
  Clock,
  Shuffle,
  Lock,
  Music,
  HelpCircle,
  Radio
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRACKS, getTrackWithRelations } from '../data/musicData';


// Normalizes track objects so tracks from MySQL (/api/tracks) and mock data have consistent structure
function normalizeTrack(t) {
  if (!t) return null;
  const artistName = t.artist?.name || t.artist_name || 'Unknown Artist';
  const artistAvatar =
    t.artist?.avatar_url ||
    t.artist_avatar ||
    t.custom_thumbnail_url ||
    (t.yt_video_id ? `https://img.youtube.com/vi/${t.yt_video_id}/mqdefault.jpg` : null) ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400';
  const albumTitle = t.album?.title || t.album_title || 'Single';
  const albumCover =
    t.album?.cover_art_url ||
    t.album_cover ||
    t.custom_thumbnail_url ||
    (t.yt_video_id ? `https://img.youtube.com/vi/${t.yt_video_id}/mqdefault.jpg` : null) ||
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';

  return {
    ...t,
    artist_name: artistName,
    album_title: albumTitle,
    artist: {
      artist_id: t.artist_id,
      name: artistName,
      avatar_url: artistAvatar
    },
    album: {
      album_id: t.album_id,
      title: albumTitle,
      cover_art_url: albumCover
    }
  };
}

// Randomly picks a candidate track based on game mode without repeating in the same session
function pickRandomTrack(allTracks, mode, playedIds = new Set()) {
  const pool = (allTracks && allTracks.length > 0) ? allTracks : TRACKS;
  let filtered = pool;

  if (mode === 'genre_rush') {
    const synthTracks = pool.filter(t => {
      const g = (t.genre || '').toLowerCase();
      return g.includes('synth') || g.includes('cyber') || g.includes('electronic') || g.includes('dance') || g.includes('techno');
    });
    if (synthTracks.length > 0) filtered = synthTracks;
  } else if (mode === 'history') {
    const chillTracks = pool.filter(t => {
      const g = (t.genre || '').toLowerCase();
      return g.includes('chill') || g.includes('house') || g.includes('pop') || g.includes('hip') || g.includes('indie') || g.includes('ambient');
    });
    if (chillTracks.length > 0) filtered = chillTracks;
  }

  // Avoid songs already played in current session
  const unplayedPool = filtered.filter(t => !playedIds.has(t.track_id));
  const candidatePool = unplayedPool.length > 0 ? unplayedPool : filtered;

  const randomIdx = Math.floor(Math.random() * candidatePool.length);
  const chosen = candidatePool[randomIdx] || candidatePool[0] || pool[0];
  const withRelations = getTrackWithRelations(chosen.track_id) || chosen;
  return normalizeTrack(withRelations);
}

export default function GameArenaView() {
  const {
    currentUser,
    completeGameAttempt,
    navigateToArtist,
    setShowVideoModal,
    setCurrentTrack,
    tracksList,
    isPlaying,
    pauseTrack,
    playTrack
  } = useApp();

  // Full database catalog state
  const [catalog, setCatalog] = useState(() => (tracksList && tracksList.length > 8) ? tracksList : TRACKS);

  // Game Mode: 'daily' | 'genre_rush' | 'history' (from GAME_SESSIONS table)
  const [gameMode, setGameMode] = useState('daily');
  const [roundNumber, setRoundNumber] = useState(1);
  const playedTrackIdsRef = useRef(new Set());
  const hasLoadedDbTracksRef = useRef(false);

  // Tier configuration: 1.0s, 2.0s, 3.5s, 5.0s audible playback
  // Maps to DB CHECK constraint (0.1, 1.0, 2.0, 5.0) via dbTierSec
  const TIERS = [
    { tier: 1, durationSec: 1.0, label: '1.0s', points: 1000, dbTierSec: '0.1' },
    { tier: 2, durationSec: 2.0, label: '2.0s', points: 750, dbTierSec: '1.0' },
    { tier: 3, durationSec: 3.5, label: '3.5s', points: 500, dbTierSec: '2.0' },
    { tier: 4, durationSec: 5.0, label: '5.0s', points: 250, dbTierSec: '5.0' }
  ];

  // Target mystery song initialized randomly from available tracks
  const [targetTrack, setTargetTrack] = useState(() => {
    const all = (tracksList && tracksList.length > 0) ? tracksList : TRACKS;
    return pickRandomTrack(all, 'daily') || normalizeTrack(TRACKS[0]);
  });
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const [attempts, setAttempts] = useState([]); // array of { text, trackId, isCorrect, artistMatch, skipped }
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'won' | 'lost'

  // Playback state for the snippet
  const [isSnippetPlaying, setIsSnippetPlaying] = useState(false);
  const [isAudioBuffering, setIsAudioBuffering] = useState(false);
  const [snippetProgress, setSnippetProgress] = useState(0);
  const startTimeRef = useRef(0);

  // Hidden YouTube IFrame ref for authentic Arena audio snippets
  const arenaIframeRef = useRef(null);
  const snippetTimerRef = useRef(null);
  const snippetTimeoutRef = useRef(null);

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Dispatch commands directly to hidden Arena YouTube audio player
  const sendArenaCommand = useCallback((func, args = []) => {
    if (arenaIframeRef.current?.contentWindow) {
      try {
        arenaIframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch (err) {
        console.warn('Arena postMessage error:', err);
      }
    }
  }, []);

  // Stop snippet audio from YouTube cleanly
  const stopSnippetAudio = useCallback(() => {
    sendArenaCommand('pauseVideo');
    setIsSnippetPlaying(false);
    setIsAudioBuffering(false);
    setSnippetProgress(0);
    if (snippetTimerRef.current) clearInterval(snippetTimerRef.current);
    if (snippetTimeoutRef.current) clearTimeout(snippetTimeoutRef.current);
  }, [sendArenaCommand]);

  // Mask the browser / Windows OS media notification so song details are NEVER leaked
  const maskMediaSession = useCallback(() => {
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Mystery Song • Audio Arena',
          artist: 'Secret Artist (Guess to Reveal)',
          album: 'Musicians Arena Challenge',
          artwork: [
            {
              src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
              sizes: '512x512',
              type: 'image/jpeg'
            }
          ]
        });
      } catch (_) {}
    }
  }, []);

  // Listen for YouTube IFrame playback events to synchronize real audio playback
  useEffect(() => {
    const handleYouTubeMessage = (e) => {
      if (!e.origin || !e.origin.includes('youtube')) return;
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (!data) return;

        let playerState = null;
        if (data.event === 'infoDelivery' && data.info && typeof data.info.playerState === 'number') {
          playerState = data.info.playerState;
        } else if (data.event === 'onStateChange' && typeof data.info === 'number') {
          playerState = data.info;
        }

        if (playerState === 1) { // 1 = PLAYING (Audible music is actively flowing!)
          setIsAudioBuffering(false);
          maskMediaSession();
        } else if (playerState === 3) { // 3 = BUFFERING
          setIsAudioBuffering(true);
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleYouTubeMessage);
    return () => window.removeEventListener('message', handleYouTubeMessage);
  }, [maskMediaSession]);

  // Mask media session on mount & whenever target track changes during active play
  useEffect(() => {
    if (!isGameEnded) {
      maskMediaSession();
    }
  }, [maskMediaSession, targetTrack, isGameEnded]);

  // Initialize or reset game round with a brand new random song from database
  const startNewGame = useCallback((mode = gameMode) => {
    stopSnippetAudio();
    maskMediaSession();
    setCurrentTierIndex(0);
    setAttempts([]);
    setIsGameEnded(false);
    setGameResult(null);
    setSearchQuery('');
    startTimeRef.current = Date.now();

    const pool = (catalog && catalog.length > 0) ? catalog : ((tracksList && tracksList.length > 0) ? tracksList : TRACKS);
    const nextTrack = pickRandomTrack(pool, mode, playedTrackIdsRef.current);
    if (nextTrack) {
      playedTrackIdsRef.current.add(nextTrack.track_id);
      if (playedTrackIdsRef.current.size >= pool.length) {
        playedTrackIdsRef.current.clear();
        playedTrackIdsRef.current.add(nextTrack.track_id);
      }
      setTargetTrack(nextTrack);
      // NOTE: We deliberately do NOT call setCurrentTrack(nextTrack) here!
      // Calling setCurrentTrack would override the bottom player and spoil the mystery answer.
    }
    setRoundNumber(prev => prev + 1);
  }, [catalog, gameMode, maskMediaSession, stopSnippetAudio, tracksList]);

  // Ensure full 755 database catalog is loaded from backend API
  useEffect(() => {
    if (tracksList && tracksList.length > 8) {
      setCatalog(tracksList);
    } else {
      fetch('http://localhost:5000/api/tracks')
        .then(r => r.json())
        .then(data => {
          if (data?.success && Array.isArray(data.tracks) && data.tracks.length > 0) {
            setCatalog(data.tracks);
          }
        })
        .catch(err => console.warn('Arena could not fetch /api/tracks:', err));
    }
  }, [tracksList]);

  // Refresh target track once full DB tracks become available if started with initial 8 seeds
  useEffect(() => {
    if (catalog && catalog.length > 8 && !hasLoadedDbTracksRef.current) {
      hasLoadedDbTracksRef.current = true;
      startNewGame(gameMode);
    }
  }, [catalog, gameMode, startNewGame]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    return () => {
      stopSnippetAudio();
    };
  }, [stopSnippetAudio]);

  // Play snippet of specific duration (1.0s, 2.0s, 3.5s, 5.0s)
  const playCurrentTierSnippet = () => {
    const tier = TIERS[currentTierIndex];
    if (isSnippetPlaying) {
      stopSnippetAudio();
      return;
    }

    // Pause persistent bottom player so two songs do not overlap
    if (isPlaying) {
      pauseTrack();
    }

    maskMediaSession();
    setIsSnippetPlaying(true);
    setIsAudioBuffering(true);
    setSnippetProgress(0);

    const stepInterval = 25;
    const totalMs = tier.durationSec * 1000;
    let elapsed = 0;

    if (snippetTimerRef.current) clearInterval(snippetTimerRef.current);
    if (snippetTimeoutRef.current) clearTimeout(snippetTimeoutRef.current);

    // 1. Play real audio from Arena YouTube Iframe
    const startSec = Math.floor(parseFloat(targetTrack?.snippet_start_sec || 0));
    sendArenaCommand('seekTo', [startSec, true]);
    sendArenaCommand('unMute');
    sendArenaCommand('setVolume', [100]);
    sendArenaCommand('playVideo');

    // 2. Smooth progress bar ticker
    snippetTimerRef.current = setInterval(() => {
      elapsed += stepInterval;
      setSnippetProgress(Math.min(100, (elapsed / totalMs) * 100));
      if (elapsed >= totalMs) {
        clearInterval(snippetTimerRef.current);
      }
    }, stepInterval);

    // 3. Stop exactly when the tier duration finishes
    snippetTimeoutRef.current = setTimeout(() => {
      stopSnippetAudio();
    }, totalMs);
  };

  // Skip turn (unlocks next audio tier)
  const handleSkip = () => {
    if (isGameEnded) return;
    stopSnippetAudio();

    const newAttempts = [
      ...attempts,
      { text: 'Skipped to unlock next audio tier', isCorrect: false, skipped: true }
    ];
    setAttempts(newAttempts);

    if (currentTierIndex < TIERS.length - 1) {
      setCurrentTierIndex(prev => prev + 1);
    } else {
      endGame(false, newAttempts.length);
    }
  };

  // Submit song guess
  const handleSelectGuess = (track) => {
    if (isGameEnded) return;
    stopSnippetAudio();
    setSearchQuery('');
    setIsDropdownOpen(false);

    const isCorrect = track.track_id === targetTrack.track_id;
    const isArtistMatch =
      track.artist_id === targetTrack.artist_id ||
      (track.artist_name && targetTrack.artist_name && track.artist_name.toLowerCase() === targetTrack.artist_name.toLowerCase());

    const newAttempt = {
      text: `${track.title} — ${track.artist?.name || track.artist_name || 'Unknown'}`,
      trackId: track.track_id,
      isCorrect,
      artistMatch: isArtistMatch && !isCorrect,
      skipped: false
    };

    const updatedAttempts = [...attempts, newAttempt];
    setAttempts(updatedAttempts);

    if (isCorrect) {
      endGame(true, updatedAttempts.length);
    } else if (currentTierIndex < TIERS.length - 1) {
      setCurrentTierIndex(prev => prev + 1);
    } else {
      endGame(false, updatedAttempts.length);
    }
  };

  // End game logic
  const endGame = (won, attemptsCount) => {
    setIsGameEnded(true);
    setGameResult(won ? 'won' : 'lost');
    const responseTimeMs = Date.now() - (startTimeRef.current || Date.now());
    const tier = TIERS[currentTierIndex];
    const points = won ? tier.points : 0;

    // Update MediaSession with revealed song details upon round completion
    if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: targetTrack.title,
          artist: targetTrack.artist?.name || targetTrack.artist_name || 'Artist',
          album: targetTrack.album?.title || targetTrack.album_title || 'Musicians Music',
          artwork: [
            {
              src: targetTrack.album?.cover_art_url || targetTrack.artist?.avatar_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
              sizes: '512x512',
              type: 'image/jpeg'
            }
          ]
        });
      } catch (_) {}
    }

    completeGameAttempt({
      trackId: targetTrack.track_id,
      mode: gameMode,
      tierSec: tier.dbTierSec || '1.0',
      attemptsUsed: attemptsCount,
      isCorrect: won,
      responseTimeMs,
      points
    });
  };

  // Filter tracks for autocomplete across all 755 catalog tracks
  const activeCatalog = (catalog && catalog.length > 0) ? catalog : ((tracksList && tracksList.length > 0) ? tracksList : TRACKS);
  const filteredTracks = activeCatalog.map(normalizeTrack).filter(t => {
    if (!t) return false;
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    const g = (t.genre || '').toLowerCase();
    return (
      (t.title || '').toLowerCase().includes(q) ||
      (t.artist?.name || t.artist_name || '').toLowerCase().includes(q) ||
      g.includes(q)
    );
  }).slice(0, 15);

  return (
    <div className="game-arena-view">
      {/* 100% Invisible dedicated YouTube Audio Engine for Arena snippets
          Maintains 2px in viewport so Chrome and Edge media subsystems never suspend audio */}
      <div
        className="arena-audio-host"
        aria-hidden="true"
        style={{
          position: 'fixed',
          bottom: 0,
          right: 0,
          width: 2,
          height: 2,
          opacity: 0.0001,
          pointerEvents: 'none',
          zIndex: -9999,
          overflow: 'hidden'
        }}
      >
        {targetTrack?.yt_video_id && (
          <iframe
            ref={arenaIframeRef}
            key={targetTrack.track_id}
            src={`https://www.youtube-nocookie.com/embed/${targetTrack.yt_video_id}?enablejsapi=1&playsinline=1&controls=0&disablekb=1&fs=0&rel=0&iv_load_policy=3&origin=${encodeURIComponent(window.location.origin)}`}
            title="Arena Audio Engine"
            allow="autoplay"
            onLoad={() => {
              arenaIframeRef.current?.contentWindow?.postMessage(
                JSON.stringify({ event: 'listening' }),
                '*'
              );
              sendArenaCommand('setVolume', [100]);
              sendArenaCommand('unMute');
              maskMediaSession();
            }}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        )}
      </div>

      {/* Game Mode Selector Bar (Maps to GAME_SESSIONS.game_mode) */}
      <div className="game-header-bar glass-panel">
        <div className="game-modes-tabs">
          <button
            className={`game-mode-tab ${gameMode === 'daily' ? 'active' : ''}`}
            onClick={() => {
              setGameMode('daily');
              startNewGame('daily');
            }}
          >
            <Sparkles size={16} />
            <span>Daily Mystery</span>
            <span className="mode-pill live-pill">Round #{roundNumber}</span>
          </button>
          <button
            className={`game-mode-tab ${gameMode === 'genre_rush' ? 'active' : ''}`}
            onClick={() => {
              setGameMode('genre_rush');
              startNewGame('genre_rush');
            }}
          >
            <Zap size={16} />
            <span>Synth & Cyber Rush</span>
          </button>
          <button
            className={`game-mode-tab ${gameMode === 'history' ? 'active' : ''}`}
            onClick={() => {
              setGameMode('history');
              startNewGame('history');
            }}
          >
            <Clock size={16} />
            <span>Listening Vault</span>
          </button>
        </div>

        <div className="game-stats-pill">
          <div className="stat-item" title="Player Streak">
            <Flame size={16} className="stat-flame" />
            <span>{currentUser.streak_days} Streak</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item" title="Accuracy Rate">
            <TrendingUp size={16} className="stat-trend" />
            <span>{currentUser.accuracy}</span>
          </div>
        </div>
      </div>

      {/* Main Arena Box */}
      <div className="arena-card glass-panel">
        {/* Mystery Vinyl & Secret Identity HUD */}
        <div className="mystery-track-hero glass-panel">
          <div className="mystery-vinyl-box">
            <div className={`mystery-vinyl ${isSnippetPlaying ? 'is-spinning' : ''}`}>
              <div className="vinyl-groove groove-1"></div>
              <div className="vinyl-groove groove-2"></div>
              <div className="vinyl-groove groove-3"></div>
              <div className="vinyl-center-label">
                {isGameEnded ? (
                  <img
                    src={targetTrack.album?.cover_art_url || targetTrack.artist?.avatar_url}
                    alt="Cover"
                    className="revealed-center-thumb"
                  />
                ) : (
                  <div className="mystery-question-glyph">
                    <HelpCircle size={24} className="glyph-pulse" />
                  </div>
                )}
              </div>
            </div>
            {isSnippetPlaying && <div className="vinyl-soundwave-ring"></div>}
          </div>

          <div className="mystery-meta-info">
            <div className="mystery-badges-row">
              <span className="badge badge-amber">
                <Sparkles size={12} /> Mystery Round #{roundNumber}
              </span>
              <span className="badge badge-purple">
                <Music size={12} /> {targetTrack.genre || 'Electronic'}
              </span>
              <span className="badge badge-cyan">
                <Lock size={12} /> {isGameEnded ? 'Identity Revealed' : 'Track Identity Hidden'}
              </span>
            </div>

            <div className="mystery-track-title-row">
              <h2 className="mystery-main-title">
                {isGameEnded ? (
                  <span className="text-revealed">{targetTrack.title}</span>
                ) : (
                  <span className="text-censored">
                    <Lock size={18} className="lock-inline" /> •••••••••••••••• (Secret Track)
                  </span>
                )}
              </h2>
            </div>

            <p className="mystery-artist-subtitle">
              {isGameEnded ? (
                <span className="text-revealed-artist">
                  by {targetTrack.artist?.name || targetTrack.artist_name}
                </span>
              ) : (
                <span className="text-censored-artist">
                  Artist: •••••••••••• (Guess who!)
                </span>
              )}
            </p>

            <div className="mystery-status-pill">
              <Radio size={14} className={isSnippetPlaying ? 'icon-pulse-active' : ''} />
              <span>
                {isSnippetPlaying
                  ? (isAudioBuffering ? 'Buffering audio snippet from YouTube...' : `Playing Tier ${currentTierIndex + 1} (${TIERS[currentTierIndex].label})`)
                  : (isGameEnded ? 'Round Complete! You can listen below or play another song.' : `Press Play to listen to ${TIERS[currentTierIndex].label} audio snippet`)}
              </span>
            </div>
          </div>
        </div>

        {/* Tier Unlock Progress Bar (1.0s -> 2.0s -> 3.5s -> 5.0s) */}
        <div className="tier-progression-section">
          <div className="tier-label-row">
            <span className="tier-meta-label">AUDIO SNIPPET TIERS (MAX 4 ATTEMPTS)</span>
            <span className="current-unlocked-tag">
              Tier {currentTierIndex + 1}: {TIERS[currentTierIndex].label} unlocked
            </span>
          </div>

          <div className="tier-track-meter">
            {TIERS.map((tier, idx) => {
              const isUnlocked = idx <= currentTierIndex;
              const isCurrent = idx === currentTierIndex;
              return (
                <div
                  key={tier.tier}
                  className={`tier-segment ${isUnlocked ? 'unlocked' : ''} ${isCurrent ? 'current' : ''}`}
                  style={{ flex: tier.durationSec }}
                >
                  <span className="tier-time-tag">{tier.label}</span>
                  <span className="tier-pts-tag">{tier.points} XP</span>
                </div>
              );
            })}
          </div>

          {/* Snippet Playhead Progress */}
          <div className="snippet-progress-rail">
            <div
              className="snippet-progress-fill"
              style={{ width: `${snippetProgress}%` }}
            ></div>
          </div>
        </div>

        {/* Big Snippet Playback Action Bar */}
        <div className="snippet-controls-box">
          <button
            className={`btn-big-play ${isSnippetPlaying ? 'is-playing' : ''}`}
            onClick={playCurrentTierSnippet}
          >
            {isSnippetPlaying ? <Pause size={24} /> : <Play size={24} className="play-icon-offset" />}
            <span className="btn-play-label">
              {isSnippetPlaying
                ? 'Listening to Snippet...'
                : `Play ${TIERS[currentTierIndex].label} Audio Snippet`}
            </span>
          </button>

          <button
            className="btn-skip-tier"
            onClick={handleSkip}
            disabled={isGameEnded}
            title="Skip to unlock more audio"
          >
            <SkipForward size={18} />
            <span>Skip (+Next Tier)</span>
          </button>

          <button
            className="btn-skip-tier btn-reroll"
            onClick={() => startNewGame(gameMode)}
            title="Roll another random song from database"
          >
            <Shuffle size={17} />
            <span>New Song</span>
          </button>
        </div>

        {/* 4 Guess Attempt Cards (from GAME_ATTEMPTS) */}
        <div className="guess-slots-container">
          {[0, 1, 2, 3].map((slotIdx) => {
            const attempt = attempts[slotIdx];
            if (!attempt) {
              return (
                <div key={slotIdx} className="guess-slot empty-slot">
                  <span className="slot-number">{slotIdx + 1}</span>
                  <span className="slot-placeholder">Empty attempt slot</span>
                </div>
              );
            }
            if (attempt.skipped) {
              return (
                <div key={slotIdx} className="guess-slot skipped-slot">
                  <span className="slot-number">{slotIdx + 1}</span>
                  <span className="slot-text">SKIPPED (Unlocked {TIERS[slotIdx]?.label})</span>
                  <SkipForward size={16} className="slot-icon skip-icon" />
                </div>
              );
            }
            if (attempt.isCorrect) {
              return (
                <div key={slotIdx} className="guess-slot correct-slot">
                  <span className="slot-number">{slotIdx + 1}</span>
                  <span className="slot-text">{attempt.text}</span>
                  <CheckCircle2 size={18} className="slot-icon correct-icon" />
                </div>
              );
            }
            return (
              <div key={slotIdx} className="guess-slot wrong-slot">
                <span className="slot-number">{slotIdx + 1}</span>
                <span className="slot-text">{attempt.text}</span>
                {attempt.artistMatch ? (
                  <span className="badge badge-amber slot-hint">Correct Artist!</span>
                ) : (
                  <XCircle size={18} className="slot-icon wrong-icon" />
                )}
              </div>
            );
          })}
        </div>

        {/* Search & Submit Input */}
        {!isGameEnded ? (
          <div className="search-guess-container">
            <div className="guess-input-box">
              <input
                type="text"
                className="guess-input"
                placeholder="Search song title or artist name to guess..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
              />
            </div>

            {/* Autocomplete Dropdown */}
            {isDropdownOpen && searchQuery.trim().length > 0 && (
              <div className="guess-autocomplete-dropdown glass-panel">
                {filteredTracks.length === 0 ? (
                  <div className="no-matches-item">No tracks matching "{searchQuery}"</div>
                ) : (
                  filteredTracks.map(t => (
                    <div
                      key={t.track_id}
                      className="autocomplete-item"
                      onClick={() => handleSelectGuess(t)}
                    >
                      <img
                        src={t.album?.cover_art_url || t.artist?.avatar_url}
                        alt={t.title}
                        className="auto-art"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';
                        }}
                      />
                      <div className="auto-info">
                        <span className="auto-title">{t.title}</span>
                        <span className="auto-artist">{t.artist?.name || t.artist_name} • {t.genre}</span>
                      </div>
                      <ChevronRight size={16} className="auto-arrow" />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          /* Victory / Defeat Outcome Banner */
          <div className={`game-outcome-banner ${gameResult === 'won' ? 'outcome-won' : 'outcome-lost'}`}>
            <div className="outcome-icon-box">
              {gameResult === 'won' ? (
                <Award size={36} className="outcome-award" />
              ) : (
                <RotateCcw size={36} className="outcome-retry" />
              )}
            </div>

            <div className="outcome-text-box">
              <h3 className="outcome-heading">
                {gameResult === 'won' ? 'INCREDIBLE AUDIO DETECTIVE!' : 'BETTER LUCK NEXT ROUND!'}
              </h3>
              <p className="outcome-sub">
                The mystery song was <strong>"{targetTrack.title}"</strong> by{' '}
                <strong>{targetTrack.artist?.name || targetTrack.artist_name}</strong>.
              </p>
              <div className="outcome-badges">
                {gameResult === 'won' && (
                  <span className="badge badge-green">
                    +{TIERS[currentTierIndex].points} Total XP
                  </span>
                )}
                <span className="badge badge-purple">
                  Unlocked Tier: {TIERS[currentTierIndex].label}
                </span>
                <span className="badge badge-cyan">{targetTrack.genre}</span>
              </div>
            </div>

            <div className="outcome-actions">
              <button
                className="btn-primary"
                onClick={() => startNewGame(gameMode)}
              >
                <RotateCcw size={16} /> Next Mystery Song
              </button>
              <button
                className="btn-secondary"
                onClick={() => playTrack(targetTrack.track_id)}
                title="Play full song in bottom deck player"
              >
                <Play size={16} /> Listen in Bottom Deck
              </button>
              <button
                className="btn-secondary"
                onClick={() => {
                  setCurrentTrack(targetTrack);
                  setShowVideoModal(true);
                }}
              >
                <Tv size={16} /> Reveal Official YT Video
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Target Track Reveal & Embedded Video Preview when ended */}
      {isGameEnded && (
        <div className="revealed-track-showcase glass-panel">
          <div className="showcase-left">
            <img
              src={targetTrack.album?.cover_art_url || targetTrack.artist?.avatar_url}
              alt={targetTrack.title}
              className="showcase-art"
              onError={(e) => {
                e.currentTarget.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';
              }}
            />
            <div className="showcase-meta">
              <span className="showcase-sub">OFFICIAL TRACK REVEAL</span>
              <h2 className="showcase-title">{targetTrack.title}</h2>
              <p
                className="showcase-artist clickable-link"
                onClick={() => navigateToArtist(targetTrack.artist_id)}
              >
                {targetTrack.artist?.name || targetTrack.artist_name}
              </p>
              {targetTrack.parentTrack && (
                <p className="remix-lineage-note">
                  * Remix lineage from original: "{targetTrack.parentTrack.title}"
                </p>
              )}
            </div>
          </div>

          <div className="showcase-yt-preview">
            <button
              className="btn-primary"
              onClick={() => {
                setCurrentTrack(targetTrack);
                setShowVideoModal(true);
              }}
            >
              <Tv size={16} /> Watch YouTube Video ({targetTrack.yt_video_id || targetTrack.youtube_video_id})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
