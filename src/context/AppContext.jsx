import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  USERS,
  ARTISTS,
  ALBUMS,
  TRACKS,
  PLAYLISTS,
  PLAYLIST_TRACKS,
  LISTENING_HISTORY,
  GAME_SESSIONS,
  GAME_ATTEMPTS,
  getTrackWithRelations
} from '../data/musicData';
import { soundEngine } from '../services/soundEngine';
import { sqlApi } from '../services/sqlApi';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Theme and Layout Studio State ("i wanna make more designs so keep that in mind")
  const [theme, setTheme] = useState('cyber-neon'); // 'cyber-neon' | 'tokyo-midnight' | 'obsidian-emerald'
  const [layoutMode, setLayoutMode] = useState('spotify-studio'); // 'spotify-studio' | 'arcade-hud' | 'full-focus'
  const [isDesignStudioOpen, setIsDesignStudioOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isSqlConsoleOpen, setIsSqlConsoleOpen] = useState(false);

  // Browser pathname routing (/login, /register, or main views)
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState(null, '', path);
    setCurrentPath(path);
  };

  // Active view navigation
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'profile' | 'discover' | 'artist' | 'playlists' | 'leaderboard' | 'schema'
  const [selectedArtistId, setSelectedArtistId] = useState(1);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(1);

  // User state (selectable demo accounts)
  const [currentUser, setCurrentUser] = useState(USERS[0]);
  const [usersList, setUsersList] = useState(USERS);

  // Interactive Playlists & History
  const [playlists, setPlaylists] = useState(PLAYLISTS);
  const [playlistTracks, setPlaylistTracks] = useState(PLAYLIST_TRACKS);
  const [listeningHistory, setListeningHistory] = useState(LISTENING_HISTORY);
  const [gameSessions, setGameSessions] = useState(GAME_SESSIONS);
  const [gameAttempts, setGameAttempts] = useState(GAME_ATTEMPTS);

  // Bottom Persistent Music Player
  const [currentTrack, setCurrentTrack] = useState(() => getTrackWithRelations(1));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [waveformData, setWaveformData] = useState(Array(16).fill(0.15));
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Sync theme to root html element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Waveform visualization ticker when playing
  useEffect(() => {
    let animId;
    if (isPlaying) {
      const updateWaveform = () => {
        setWaveformData(soundEngine.getWaveformData());
        animId = requestAnimationFrame(updateWaveform);
      };
      animId = requestAnimationFrame(updateWaveform);
    } else {
      setWaveformData(Array(16).fill(0.15));
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isPlaying]);

  // Play track helper
  const playTrack = (trackId, durationSec = 15) => {
    const trackRel = getTrackWithRelations(trackId);
    if (!trackRel) return;
    setCurrentTrack(trackRel);
    setIsPlaying(true);

    // Record listening history via SQL
    const newHistory = sqlApi.listeningHistory.log(currentUser.user_id, trackId, durationSec);
    setListeningHistory(prev => [newHistory, ...prev]);

    soundEngine.playTrackSnippet(trackRel, durationSec, () => {
      setIsPlaying(false);
    });
  };

  const pauseTrack = () => {
    soundEngine.stop();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      playTrack(currentTrack.track_id);
    }
  };

  const toggleLikeTrack = (trackId) => {
    sqlApi.listeningHistory.toggleLike(currentUser.user_id, trackId);
    setListeningHistory(prev =>
      prev.map(item =>
        item.track_id === trackId ? { ...item, is_liked: !item.is_liked } : item
      )
    );
  };

  // Add track to playlist via SQL
  const addTrackToPlaylist = (playlistId, trackId) => {
    const newEntry = sqlApi.playlists.addTrack(playlistId, trackId);
    setPlaylistTracks(prev => [...prev, newEntry]);
  };

  // Create new playlist via SQL
  const createPlaylist = (title, description, isPublic = true) => {
    const newPlaylist = sqlApi.playlists.create(currentUser.user_id, title, isPublic);
    setPlaylists(prev => [newPlaylist, ...prev]);
    return newPlaylist.playlist_id;
  };

  // Record Game Attempt via SQL (triggers derived total_score and total_xp)
  const completeGameAttempt = ({ trackId, mode, tierSec, attemptsUsed, isCorrect, responseTimeMs, points }) => {
    const { session: newSession, attempt: newAttempt } = sqlApi.game.recordAttempt({
      userId: currentUser.user_id,
      trackId,
      gameMode: mode,
      unlockedTierSec: tierSec,
      attemptsUsed,
      isCorrect,
      responseTimeMs,
      pointsAwarded: points
    });

    setGameSessions(prev => [newSession, ...prev]);
    setGameAttempts(prev => [newAttempt, ...prev]);

    // Update user stats
    const updatedXP = currentUser.total_xp + points;
    const updatedUser = {
      ...currentUser,
      total_xp: updatedXP,
      level: Math.floor(updatedXP / 500) + 1,
      streak_days: isCorrect ? currentUser.streak_days + 1 : 0,
      games_won: isCorrect ? currentUser.games_won + 1 : currentUser.games_won,
      games_played: currentUser.games_played + 1
    };

    setCurrentUser(updatedUser);
    setUsersList(prev => prev.map(u => u.user_id === updatedUser.user_id ? updatedUser : u));

    if (isCorrect) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  // User switcher
  const switchUser = (userId) => {
    const user = usersList.find(u => u.user_id === userId);
    if (user) {
      setCurrentUser(user);
    }
  };

  const navigateToArtist = (artistId) => {
    setSelectedArtistId(artistId);
    setActiveTab('artist');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPlaylist = (playlistId) => {
    setSelectedPlaylistId(playlistId);
    setActiveTab('playlists');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        layoutMode,
        setLayoutMode,
        isDesignStudioOpen,
        setIsDesignStudioOpen,
        isSchemaModalOpen,
        setIsSchemaModalOpen,
        isSqlConsoleOpen,
        setIsSqlConsoleOpen,
        sqlApi,
        currentPath,
        navigate,
        activeTab,
        setActiveTab,
        selectedArtistId,
        setSelectedArtistId,
        selectedPlaylistId,
        setSelectedPlaylistId,
        currentUser,
        setCurrentUser,
        usersList,
        setUsersList,
        switchUser,
        currentTrack,
        setCurrentTrack,
        isPlaying,
        playTrack,
        pauseTrack,
        togglePlay,
        waveformData,
        showVideoModal,
        setShowVideoModal,
        playlists,
        playlistTracks,
        listeningHistory,
        gameSessions,
        gameAttempts,
        toggleLikeTrack,
        addTrackToPlaylist,
        createPlaylist,
        completeGameAttempt,
        navigateToArtist,
        navigateToPlaylist
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
