// ERD-Compliant Mock Database Engine for SONIX
// Updated to adhere 1:1 to the revised SQL Relational Schema diagram

export const USERS = [
  {
    user_id: 1,
    username: "Alex_Synthwave",
    email: "alex.synth@sonix.fm",
    password: "synthPass80s", // Plain-text no auth as per ERD note
    total_xp: 15420, // Derived via Trigger
    created_at: "2024-01-15T10:30:00Z",
    level: 28,
    rank_title: "Audio Grandmaster",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    streak_days: 14,
    games_won: 89,
    games_played: 104,
    accuracy: "85.6%",
    favorite_genre: "Synthwave / Cyberpunk"
  },
  {
    user_id: 2,
    username: "Kai_BeatHunter",
    email: "kai.beats@sonix.fm",
    password: "lofiChills44",
    total_xp: 9840,
    created_at: "2024-03-22T14:15:00Z",
    level: 19,
    rank_title: "Sound Detective",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    streak_days: 6,
    games_won: 52,
    games_played: 68,
    accuracy: "76.4%",
    favorite_genre: "Lo-Fi / Chill"
  },
  {
    user_id: 3,
    username: "Elena_Vibes",
    email: "elena.v@sonix.fm",
    password: "retroNeon99",
    total_xp: 22100,
    created_at: "2023-11-04T08:20:00Z",
    level: 42,
    rank_title: "Sonic Legend",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    streak_days: 28,
    games_won: 142,
    games_played: 155,
    accuracy: "91.6%",
    favorite_genre: "Retro Electro"
  }
];

export const ARTISTS = [
  {
    artist_id: 1,
    name: "Kavinsky",
    yt_channel_id: "UC_KavinskyOfficial", // Optional YT Channel ID
    verified_status: true,
    avatar_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
    header_banner: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=1200&auto=format&fit=crop&q=80",
    subscribers: "1.45M",
    monthly_listeners: "3,892,100",
    bio: "French house and synthwave artist widely known for his cinematic zombie-driver persona and soundtracking iconic neo-noir cinema."
  },
  {
    artist_id: 2,
    name: "The Midnight",
    yt_channel_id: "UCTheMidnightLA",
    verified_status: true,
    avatar_url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80",
    header_banner: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    subscribers: "980K",
    monthly_listeners: "2,420,000",
    bio: "Los Angeles-based synthwave duo fusing 1980s retro aesthetics, soaring saxophone hooks, and cinematic modern indie pop."
  },
  {
    artist_id: 3,
    name: "HOME",
    yt_channel_id: "UCHomeOfficialChill",
    verified_status: true,
    avatar_url: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80",
    header_banner: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&auto=format&fit=crop&q=80",
    subscribers: "1.89M",
    monthly_listeners: "4,150,000",
    bio: "Electronic music producer Randy Goffe from Florida, creator of the immortal chillwave and synth classic 'Resonance'."
  },
  {
    artist_id: 4,
    name: "Gunship",
    yt_channel_id: "UCGunshipMusicUK",
    verified_status: true,
    avatar_url: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80",
    header_banner: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1200&auto=format&fit=crop&q=80",
    subscribers: "620K",
    monthly_listeners: "1,290,000",
    bio: "British synthwave titans blending cyberpunk dystopias, vocal harmonies, analog tape warmth, and pixel-art visuals."
  },
  {
    artist_id: 5,
    name: "Lorn",
    yt_channel_id: "UCLornOfficialDark",
    verified_status: true,
    avatar_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=400&auto=format&fit=crop&q=80",
    header_banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    subscribers: "740K",
    monthly_listeners: "1,980,000",
    bio: "Marcos Ortega, American electronic composer creating dense, monolithic basslines, eerie melancholia, and experimental tape textures."
  }
];

export const ALBUMS = [
  {
    album_id: 1,
    artist_id: 1,
    title: "OutRun",
    release_year: 2013,
    cover_art_url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=80",
    album_type: "album" // album | ep | single
  },
  {
    album_id: 2,
    artist_id: 1,
    title: "Reborn",
    release_year: 2022,
    cover_art_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80",
    album_type: "album"
  },
  {
    album_id: 3,
    artist_id: 2,
    title: "Endless Summer",
    release_year: 2016,
    cover_art_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80",
    album_type: "album"
  },
  {
    album_id: 4,
    artist_id: 2,
    title: "Days of Thunder EP",
    release_year: 2014,
    cover_art_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80",
    album_type: "ep"
  },
  {
    album_id: 5,
    artist_id: 3,
    title: "Odyssey",
    release_year: 2014,
    cover_art_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    album_type: "album"
  },
  {
    album_id: 6,
    artist_id: 4,
    title: "Dark All Day",
    release_year: 2018,
    cover_art_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80",
    album_type: "album"
  },
  {
    album_id: 7,
    artist_id: 5,
    title: "Ask the Dust",
    release_year: 2012,
    cover_art_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=80",
    album_type: "album"
  }
];

export const TRACKS = [
  {
    track_id: 1,
    artist_id: 1,
    album_id: 1,
    parent_track_id: null,
    title: "Nightcall",
    genre: "Synthwave",
    yt_video_id: "MV_3Dpw-BRY", // 11-char YT IFrame Video ID
    track_type: "official_audio", // official_audio | music_video | remix | live_cover
    duration_sec: 259, // Total track length in sec
    snippet_start_sec: 32.50, // Game Hook Start Sec
    custom_thumbnail_url: null,
    is_embeddable: true,
    synthPattern: {
      bpm: 104,
      notes: [220, 220, 261.63, 293.66, 261.63, 220, 196, 220],
      waveType: "sawtooth",
      bassFreq: 55,
      vibAmount: 3.5
    }
  },
  {
    track_id: 2,
    artist_id: 1,
    album_id: 1,
    parent_track_id: 1, // Self-FK for Cover/Remix lineage
    title: "Nightcall (Dustin N'Guyen Remix)",
    genre: "Synthwave",
    yt_video_id: "41_svUt5_e0",
    track_type: "remix",
    duration_sec: 215,
    snippet_start_sec: 45.00,
    custom_thumbnail_url: null,
    is_embeddable: true,
    synthPattern: {
      bpm: 118,
      notes: [220, 246.94, 261.63, 329.63, 293.66, 261.63, 220, 246.94],
      waveType: "square",
      bassFreq: 65.4,
      vibAmount: 4.0
    }
  },
  {
    track_id: 3,
    artist_id: 3,
    album_id: 5,
    parent_track_id: null,
    title: "Resonance",
    genre: "Chillwave",
    yt_video_id: "8GW6sLrK40k",
    track_type: "official_audio",
    duration_sec: 212,
    snippet_start_sec: 28.00,
    custom_thumbnail_url: null,
    is_embeddable: true,
    synthPattern: {
      bpm: 85,
      notes: [329.63, 392.00, 440.00, 493.88, 440.00, 392.00, 329.63, 293.66],
      waveType: "sine",
      bassFreq: 82.4,
      vibAmount: 2.0
    }
  },
  {
    track_id: 4,
    artist_id: 2,
    album_id: 3,
    parent_track_id: null,
    title: "Sunset",
    genre: "Synthpop",
    yt_video_id: "rDBbaGCCIhk",
    track_type: "official_audio",
    duration_sec: 326,
    snippet_start_sec: 54.00,
    custom_thumbnail_url: null,
    is_embeddable: true,
    synthPattern: {
      bpm: 120,
      notes: [261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 329.63, 293.66],
      waveType: "triangle",
      bassFreq: 65.4,
      vibAmount: 3.0
    }
  },
  {
    track_id: 5,
    artist_id: 2,
    album_id: 3,
    parent_track_id: null,
    title: "Vampires",
    genre: "Synthwave",
    yt_video_id: "t4L_z3j3s_s",
    track_type: "music_video",
    duration_sec: 317,
    snippet_start_sec: 40.00,
    custom_thumbnail_url: null,
    is_embeddable: true,
    synthPattern: {
      bpm: 112,
      notes: [196.00, 220.00, 261.63, 293.66, 329.63, 293.66, 261.63, 220.00],
      waveType: "sawtooth",
      bassFreq: 49.0,
      vibAmount: 4.5
    }
  },
  {
    track_id: 6,
    artist_id: 4,
    album_id: 6,
    parent_track_id: null,
    title: "Tech Noir",
    genre: "Cyberpunk",
    yt_video_id: "-nC5TBv3sfU",
    track_type: "official_audio",
    duration_sec: 298,
    snippet_start_sec: 60.00,
    custom_thumbnail_url: null,
    is_embeddable: true,
    synthPattern: {
      bpm: 100,
      notes: [146.83, 174.61, 220.00, 261.63, 220.00, 174.61, 164.81, 146.83],
      waveType: "sawtooth",
      bassFreq: 36.7,
      vibAmount: 5.0
    }
  },
  {
    track_id: 7,
    artist_id: 5,
    album_id: 7,
    parent_track_id: null,
    title: "Acid Rain",
    genre: "Dark Electronic",
    yt_video_id: "nxg4C365LbQ",
    track_type: "music_video",
    duration_sec: 213,
    snippet_start_sec: 18.00,
    custom_thumbnail_url: null,
    is_embeddable: true,
    synthPattern: {
      bpm: 74,
      notes: [130.81, 164.81, 196.00, 164.81, 130.81, 123.47, 110.00, 123.47],
      waveType: "triangle",
      bassFreq: 32.7,
      vibAmount: 6.0
    }
  },
  {
    track_id: 8,
    artist_id: 1,
    album_id: 2,
    parent_track_id: null,
    title: "Cameo (feat. Kareen Guy)",
    genre: "French House",
    yt_video_id: "g7A2PqjK6_Q",
    track_type: "live_cover",
    duration_sec: 254,
    snippet_start_sec: 36.00,
    custom_thumbnail_url: null,
    is_embeddable: true,
    synthPattern: {
      bpm: 124,
      notes: [261.63, 311.13, 392.00, 466.16, 392.00, 311.13, 261.63, 233.08],
      waveType: "square",
      bassFreq: 65.4,
      vibAmount: 3.0
    }
  }
];

export const PLAYLISTS = [
  {
    playlist_id: 1,
    user_id: 1,
    title: "Midnight Tokyo Highway",
    is_public: true,
    created_at: "2024-02-10T11:00:00Z",
    description: "Analog synthesizers, neon reflections, and late night solitary drives.",
    cover_art_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=500&auto=format&fit=crop&q=80"
  },
  {
    playlist_id: 2,
    user_id: 1,
    title: "Cyberpunk Arcade Rush",
    is_public: true,
    created_at: "2024-03-01T18:40:00Z",
    description: "High-octane electronic and synthwave beats for gaming tournaments.",
    cover_art_url: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&auto=format&fit=crop&q=80"
  },
  {
    playlist_id: 3,
    user_id: 1,
    title: "Study & Coding Lo-Fi",
    is_public: false,
    created_at: "2024-04-12T09:15:00Z",
    description: "Subtle analog frequencies, soft chillwave, and deep focus.",
    cover_art_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500&auto=format&fit=crop&q=80"
  }
];

export const PLAYLIST_TRACKS = [
  { playlist_id: 1, track_id: 1, position_order: 1, added_at: "2024-02-10T11:05:00Z" },
  { playlist_id: 1, track_id: 3, position_order: 2, added_at: "2024-02-10T11:08:00Z" },
  { playlist_id: 1, track_id: 4, position_order: 3, added_at: "2024-02-10T11:12:00Z" },
  { playlist_id: 2, track_id: 5, position_order: 1, added_at: "2024-03-01T18:42:00Z" },
  { playlist_id: 2, track_id: 6, position_order: 2, added_at: "2024-03-01T18:45:00Z" },
  { playlist_id: 2, track_id: 2, position_order: 3, added_at: "2024-03-01T18:50:00Z" },
  { playlist_id: 3, track_id: 3, position_order: 1, added_at: "2024-04-12T09:20:00Z" },
  { playlist_id: 3, track_id: 7, position_order: 2, added_at: "2024-04-12T09:25:00Z" }
];

export const LISTENING_HISTORY = [
  {
    history_id: 101,
    user_id: 1,
    track_id: 1,
    played_at: "2026-10-23T16:45:00Z",
    listened_duration_sec: 259, // in seconds as per ERD
    is_liked: true
  },
  {
    history_id: 102,
    user_id: 1,
    track_id: 3,
    played_at: "2026-10-23T15:20:00Z",
    listened_duration_sec: 212,
    is_liked: true
  },
  {
    history_id: 103,
    user_id: 1,
    track_id: 6,
    played_at: "2026-10-22T21:10:00Z",
    listened_duration_sec: 180,
    is_liked: false
  },
  {
    history_id: 104,
    user_id: 1,
    track_id: 4,
    played_at: "2026-10-22T19:05:00Z",
    listened_duration_sec: 326,
    is_liked: true
  }
];

export const GAME_SESSIONS = [
  {
    session_id: 501,
    user_id: 1,
    game_mode: "daily",
    total_score: 1000, // Derived via Trigger
    max_streak: 14,
    played_at: "2026-10-23T14:00:00Z"
  },
  {
    session_id: 502,
    user_id: 1,
    game_mode: "genre_rush",
    total_score: 750,
    max_streak: 8,
    played_at: "2026-10-22T20:30:00Z"
  },
  {
    session_id: 503,
    user_id: 1,
    game_mode: "history",
    total_score: 500,
    max_streak: 5,
    played_at: "2026-10-21T18:15:00Z"
  }
];

export const GAME_ATTEMPTS = [
  {
    attempt_id: 9001,
    session_id: 501,
    track_id: 1, // Target YT IFrame Track
    unlocked_tier_sec: "0.1", // 0.1 | 1.0 | 2.0 | 5.0
    attempts_used: 1, // 1 to 4
    is_correct: true,
    response_time_ms: 1420,
    points_awarded: 1000 // 1000 | 750 | 500 | 250 | 0
  },
  {
    attempt_id: 9002,
    session_id: 502,
    track_id: 5,
    unlocked_tier_sec: "1.0",
    attempts_used: 2,
    is_correct: true,
    response_time_ms: 3120,
    points_awarded: 750
  },
  {
    attempt_id: 9003,
    session_id: 503,
    track_id: 6,
    unlocked_tier_sec: "2.0",
    attempts_used: 3,
    is_correct: false,
    response_time_ms: 7800,
    points_awarded: 0
  }
];

// Helper functions for joining relational data
export function getArtistById(artistId) {
  return ARTISTS.find(a => a.artist_id === artistId);
}

export function getAlbumById(albumId) {
  return ALBUMS.find(a => a.album_id === albumId);
}

export function getTrackWithRelations(trackId) {
  const track = TRACKS.find(t => t.track_id === trackId);
  if (!track) return null;
  const artist = getArtistById(track.artist_id);
  const album = getAlbumById(track.album_id);
  const parentTrack = track.parent_track_id ? TRACKS.find(t => t.track_id === track.parent_track_id) : null;
  return {
    ...track,
    artist,
    album,
    parentTrack
  };
}

export function getFullPlaylist(playlistId) {
  const playlist = PLAYLISTS.find(p => p.playlist_id === playlistId);
  if (!playlist) return null;
  const playlistTracks = PLAYLIST_TRACKS
    .filter(pt => pt.playlist_id === playlistId)
    .sort((a, b) => a.position_order - b.position_order)
    .map(pt => ({
      ...pt,
      track: getTrackWithRelations(pt.track_id)
    }));
  const user = USERS.find(u => u.user_id === playlist.user_id);
  return {
    ...playlist,
    user,
    tracks: playlistTracks
  };
}
