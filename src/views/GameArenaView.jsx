import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Award,
  Zap,
  Volume2,
  Tv,
  Sparkles,
  Music,
  Share2,
  ChevronRight,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TRACKS, getTrackWithRelations } from '../data/musicData';
import { soundEngine } from '../services/soundEngine';

export default function GameArenaView() {
  const {
    currentUser,
    completeGameAttempt,
    navigateToArtist,
    setShowVideoModal,
    setCurrentTrack
  } = useApp();

  // Game Mode: 'daily' | 'genre_rush' | 'history' (from GAME_SESSIONS table)
  const [gameMode, setGameMode] = useState('daily');

  // Tier configuration as specified in GAME_ATTEMPTS ERD: 0.1s, 1.0s, 2.0s, 5.0s
  const TIERS = [
    { tier: 1, durationSec: 0.1, label: '0.1s', points: 1000 },
    { tier: 2, durationSec: 1.0, label: '1.0s', points: 750 },
    { tier: 3, durationSec: 2.0, label: '2.0s', points: 500 },
    { tier: 4, durationSec: 5.0, label: '5.0s', points: 250 }
  ];

  // Target song
  const [targetTrack, setTargetTrack] = useState(() => getTrackWithRelations(1));
  const [currentTierIndex, setCurrentTierIndex] = useState(0);
  const [attempts, setAttempts] = useState([]); // array of { text, trackId, isCorrect, artistMatch, skipped }
  const [isGameEnded, setIsGameEnded] = useState(false);
  const [gameResult, setGameResult] = useState(null); // 'won' | 'lost'

  // Playback state for the snippet
  const [isSnippetPlaying, setIsSnippetPlaying] = useState(false);
  const [snippetProgress, setSnippetProgress] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Search input state
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Initialize or reset game round
  const startNewGame = (mode = gameMode) => {
    soundEngine.stop();
    setIsSnippetPlaying(false);
    setSnippetProgress(0);
    setCurrentTierIndex(0);
    setAttempts([]);
    setIsGameEnded(false);
    setGameResult(null);
    setSearchQuery('');
    startTimeRef.current = Date.now();

    // Pick target track based on mode
    let candidate = TRACKS[0];
    if (mode === 'daily') {
      candidate = TRACKS[0]; // Nightcall for today
    } else if (mode === 'genre_rush') {
      const synthTracks = TRACKS.filter(t => t.genre.includes('Synth') || t.genre.includes('Cyber'));
      candidate = synthTracks[Math.floor(Math.random() * synthTracks.length)];
    } else {
      const chillTracks = TRACKS.filter(t => t.genre.includes('Chill') || t.genre.includes('House'));
      candidate = chillTracks[Math.floor(Math.random() * chillTracks.length)];
    }
    const fullTrack = getTrackWithRelations(candidate.track_id);
    setTargetTrack(fullTrack);
    setCurrentTrack(fullTrack);
  };

  useEffect(() => {
    startNewGame(gameMode);
    return () => soundEngine.stop();
  }, [gameMode]);

  // Play the unlocked snippet duration
  const playCurrentTierSnippet = () => {
    const tier = TIERS[currentTierIndex];
    if (isSnippetPlaying) {
      soundEngine.stop();
      setIsSnippetPlaying(false);
      setSnippetProgress(0);
      return;
    }

    setIsSnippetPlaying(true);
    setSnippetProgress(0);
    const stepInterval = 20;
    const totalMs = tier.durationSec * 1000;
    let elapsed = 0;

    const intervalId = setInterval(() => {
      elapsed += stepInterval;
      setSnippetProgress(Math.min(100, (elapsed / totalMs) * 100));
      if (elapsed >= totalMs) {
        clearInterval(intervalId);
      }
    }, stepInterval);

    soundEngine.playTrackSnippet(targetTrack, tier.durationSec, () => {
      setIsSnippetPlaying(false);
      setSnippetProgress(0);
      clearInterval(intervalId);
    });
  };

  // Skip turn (unlocks next audio tier)
  const handleSkip = () => {
    if (isGameEnded) return;
    soundEngine.stop();
    setIsSnippetPlaying(false);

    const newAttempts = [
      ...attempts,
      { text: 'Skipped to unlock next audio tier', isCorrect: false, skipped: true }
    ];
    setAttempts(newAttempts);

    if (currentTierIndex < TIERS.length - 1) {
      setCurrentTierIndex(prev => prev + 1);
    } else {
      // Reached limit -> game over
      endGame(false, newAttempts.length);
    }
  };

  // Submit song guess
  const handleSelectGuess = (track) => {
    if (isGameEnded) return;
    soundEngine.stop();
    setIsSnippetPlaying(false);
    setSearchQuery('');
    setIsDropdownOpen(false);

    const isCorrect = track.track_id === targetTrack.track_id;
    const isArtistMatch = track.artist_id === targetTrack.artist_id;

    const newAttempt = {
      text: `${track.title} — ${track.artist?.name || 'Unknown'}`,
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
    const responseTimeMs = Date.now() - startTimeRef.current;
    const tier = TIERS[currentTierIndex];
    const points = won ? tier.points : 0;

    completeGameAttempt({
      trackId: targetTrack.track_id,
      mode: gameMode,
      tierSec: tier.durationSec.toString(),
      attemptsUsed: attemptsCount,
      isCorrect: won,
      responseTimeMs,
      points
    });
  };

  // Filter tracks for autocomplete
  const filteredTracks = TRACKS.map(t => getTrackWithRelations(t.track_id)).filter(t => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.artist?.name.toLowerCase().includes(q) ||
      t.genre.toLowerCase().includes(q)
    );
  });

  return (
    <div className="game-arena-view">
      {/* Game Mode Selector Bar (Maps to GAME_SESSIONS.game_mode) */}
      <div className="game-header-bar glass-panel">
        <div className="game-modes-tabs">
          <button
            className={`game-mode-tab ${gameMode === 'daily' ? 'active' : ''}`}
            onClick={() => setGameMode('daily')}
          >
            <Sparkles size={16} />
            <span>Daily Mystery</span>
            <span className="mode-pill live-pill">Heardle #42</span>
          </button>
          <button
            className={`game-mode-tab ${gameMode === 'genre_rush' ? 'active' : ''}`}
            onClick={() => setGameMode('genre_rush')}
          >
            <Zap size={16} />
            <span>Synth & Cyber Rush</span>
          </button>
          <button
            className={`game-mode-tab ${gameMode === 'history' ? 'active' : ''}`}
            onClick={() => setGameMode('history')}
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
        {/* Tier Unlock Progress Bar (0.5s -> 1.0s -> 2.5s -> 5.0s) */}
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
                      />
                      <div className="auto-info">
                        <span className="auto-title">{t.title}</span>
                        <span className="auto-artist">{t.artist?.name} • {t.genre}</span>
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
                <strong>{targetTrack.artist?.name}</strong>.
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
                <RotateCcw size={16} /> Play Another Track
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowVideoModal(true)}
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
            />
            <div className="showcase-meta">
              <span className="showcase-sub">OFFICIAL TRACK REVEAL</span>
              <h2 className="showcase-title">{targetTrack.title}</h2>
              <p
                className="showcase-artist clickable-link"
                onClick={() => navigateToArtist(targetTrack.artist_id)}
              >
                {targetTrack.artist?.name}
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
              onClick={() => setShowVideoModal(true)}
            >
              <Tv size={16} /> Watch YouTube Video ({targetTrack.yt_video_id || targetTrack.youtube_video_id})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
