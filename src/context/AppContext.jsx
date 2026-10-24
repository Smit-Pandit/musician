import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import { sqlApi, subscribeToDataSync, subscribeToMySqlStatus } from '../services/sqlApi';

const AppContext = createContext();

export function AppProvider({ children }) {
  const reactNavigate = useNavigate();
  const location = useLocation();

  // Theme and Layout Studio State ("i wanna make more designs so keep that in mind")
  const [theme, setTheme] = useState('cyber-neon'); // 'cyber-neon' | 'tokyo-midnight' | 'obsidian-emerald'
  const [layoutMode, setLayoutMode] = useState('spotify-studio'); // 'spotify-studio' | 'arcade-hud' | 'full-focus'
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);
  const [isDesignStudioOpen, setIsDesignStudioOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isSqlConsoleOpen, setIsSqlConsoleOpen] = useState(false);

  // Path routing
  const currentPath = location.pathname;

  const navigate = (path) => {
    reactNavigate(path);
  };

  // Map route to activeTab
  const getTabFromPath = (path) => {
    if (path === '/' || path === '/discover') return 'discover';
    if (path.startsWith('/game') || path.startsWith('/arena')) return 'game';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/artist')) return 'artist';
    if (path.startsWith('/playlists')) return 'playlists';
    if (path.startsWith('/leaderboard')) return 'leaderboard';
    if (path.startsWith('/schema')) return 'schema';
    if (path.startsWith('/login')) return 'login';
    if (path.startsWith('/register')) return 'register';
    return 'discover';
  };

  const [activeTab, setActiveTabState] = useState(() => getTabFromPath(location.pathname));

  useEffect(() => {
    setActiveTabState(getTabFromPath(location.pathname));
  }, [location.pathname]);

  const setActiveTab = (tab) => {
    setActiveTabState(tab);
    switch (tab) {
      case 'discover':
        reactNavigate('/discover');
        break;
      case 'game':
        reactNavigate('/game');
        break;
      case 'profile':
        reactNavigate('/profile');
        break;
      case 'artist':
        reactNavigate('/artist');
        break;
      case 'playlists':
        reactNavigate('/playlists');
        break;
      case 'leaderboard':
        reactNavigate('/leaderboard');
        break;
      case 'schema':
        reactNavigate('/schema');
        break;
      case 'login':
        reactNavigate('/login');
        break;
      case 'register':
        reactNavigate('/register');
        break;
      default:
        reactNavigate('/');
    }
  };

  const [selectedArtistId, setSelectedArtistId] = useState(1);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(1);

  // Database Relational Collections (Synchronized with MySQL InnoDB music_game_db)
  const [tracksList, setTracksList] = useState(TRACKS);
  const [artistsList, setArtistsList] = useState(ARTISTS);
  const [albumsList, setAlbumsList] = useState(ALBUMS);

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
  const [currentTrack, setCurrentTrack] = useState(() => getTrackWithRelations(1) || TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [waveformData, setWaveformData] = useState(Array(16).fill(0.15));
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [playbackQueue, setPlaybackQueue] = useState([]);

  const [mySqlStatus, setMySqlStatus] = useState(() => ({ ...sqlApi.mySqlStatus }));

  // Connect & Synchronize with local MySQL InnoDB Backend
  useEffect(() => {
    const unsubStatus = subscribeToMySqlStatus((status) => {
      setMySqlStatus({ ...status });
    });

    const unsubData = subscribeToDataSync((synced) => {
      if (synced.tracks && synced.tracks.length > 0) {
        setTracksList([...synced.tracks]);
        setCurrentTrack(prev => {
          if (!prev) return getTrackWithRelations(synced.tracks[0].track_id);
          return getTrackWithRelations(prev.track_id) || synced.tracks[0];
        });
      }
      if (synced.artists && synced.artists.length > 0) {
        setArtistsList([...synced.artists]);
      }
      if (synced.albums && synced.albums.length > 0) {
        setAlbumsList([...synced.albums]);
      }
      if (synced.users && synced.users.length > 0) {
        setUsersList([...synced.users]);
        setCurrentUser(prev => synced.users.find(u => u.user_id === prev.user_id) || synced.users[0]);
      }
      if (synced.playlists && synced.playlists.length > 0) {
        setPlaylists([...synced.playlists]);
      }
      if (synced.playlist_tracks && synced.playlist_tracks.length > 0) {
        setPlaylistTracks([...synced.playlist_tracks]);
      }
    });

    sqlApi.checkBackendStatus();

    return () => {
      unsubStatus();
      unsubData();
    };
  }, []);

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

  // Play track helper (Plays authentic music in bottom player)
  const playTrack = (trackId, durationSec = null, newQueue = null) => {
    let trackRel = getTrackWithRelations(trackId);
    if (!trackRel && tracksList && tracksList.length > 0) {
      trackRel = tracksList.find(t => t.track_id === trackId);
    }
    if (!trackRel && TRACKS.length > 0) {
      trackRel = TRACKS.find(t => t.track_id === trackId);
    }
    if (!trackRel) return;

    if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
      setPlaybackQueue(newQueue);
    }

    setCurrentTrack(trackRel);
    setIsPlaying(true);
    soundEngine.stop(); // Stop procedural synth so real song plays in bottom player

    // Record listening history via SQL
    const totalSec = durationSec || trackRel.duration_sec || 180;
    const newHistory = sqlApi.listeningHistory.log(currentUser.user_id, trackId, totalSec);
    setListeningHistory(prev => [newHistory, ...prev]);
  };

  const pauseTrack = () => {
    soundEngine.stop();
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (isPlaying) {
      pauseTrack();
    } else if (currentTrack) {
      setIsPlaying(true);
    } else if (TRACKS[0]) {
      playTrack(TRACKS[0].track_id);
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

  // Add track to playlist
  const addTrackToPlaylist = async (playlistId, trackId) => {
    const newEntry = await sqlApi.playlists.addTrack(playlistId, trackId);
    setPlaylistTracks(prev => {
      const exists = prev.some(pt => pt.playlist_id === playlistId && pt.track_id === trackId);
      if (exists) return prev;
      return [...prev, newEntry];
    });
    setPlaylists(prev => prev.map(p => p.playlist_id === playlistId ? { ...p, track_count: (p.track_count || 0) + 1 } : p));
  };

  // Remove track from playlist
  const removeTrackFromPlaylist = async (playlistId, trackId) => {
    await sqlApi.playlists.removeTrack(playlistId, trackId);
    setPlaylistTracks(prev => prev.filter(pt => !(pt.playlist_id === playlistId && pt.track_id === trackId)));
    setPlaylists(prev => prev.map(p => p.playlist_id === playlistId ? { ...p, track_count: Math.max(0, (p.track_count || 1) - 1) } : p));
  };

  // Create new playlist
  const createPlaylist = async (title, description = '', isPublic = true, coverArtUrl = null) => {
    const newPlaylist = await sqlApi.playlists.create(currentUser.user_id, title, description, isPublic, coverArtUrl);
    setPlaylists(prev => [newPlaylist, ...prev]);
    return newPlaylist.playlist_id;
  };

  // Delete playlist
  const deletePlaylist = async (playlistId) => {
    await sqlApi.playlists.delete(playlistId);
    setPlaylists(prev => prev.filter(p => p.playlist_id !== playlistId));
    setPlaylistTracks(prev => prev.filter(pt => pt.playlist_id !== playlistId));
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
    reactNavigate(`/artist/${artistId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToPlaylist = (playlistId) => {
    setSelectedPlaylistId(playlistId);
    reactNavigate(`/playlists/${playlistId}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setTheme,
        sidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
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
        tracksList,
        setTracksList,
        artistsList,
        setArtistsList,
        albumsList,
        setAlbumsList,
        mySqlStatus,
        syncDatabase: () => sqlApi.syncDatabaseFromBackend(),
        currentTrack,
        setCurrentTrack,
        isPlaying,
        setIsPlaying,
        playTrack,
        pauseTrack,
        togglePlay,
        waveformData,
        showVideoModal,
        setShowVideoModal,
        playbackQueue,
        setPlaybackQueue,
        playlists,
        playlistTracks,
        listeningHistory,
        gameSessions,
        gameAttempts,
        toggleLikeTrack,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        createPlaylist,
        deletePlaylist,
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
