import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Play,
  Headphones,
  ArrowRight,
  Flame,
  Radio,
  Disc3
} from 'lucide-react';
import { TRACKS, getTrackWithRelations } from '../data/musicData';
import { useApp } from '../context/AppContext';

export default function LandingView() {
  const navigate = useNavigate();
  const { playTrack, tracksList } = useApp();

  const sourceTracks = (tracksList && tracksList.length > 0) ? tracksList : TRACKS;
  const showcaseTrackIds = [1, 3, 4, 7];
  const showcaseTracks = showcaseTrackIds.map(id => {
    return getTrackWithRelations(id) || sourceTracks.find(t => t.track_id === id);
  }).filter(Boolean);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="sleek-landing-container">
      {/* Dynamic ambient dark atmosphere */}
      <div className="landing-ambient-glow" />
      <div className="landing-radial-red-left" />
      <div className="landing-radial-red-right" />

      {/* Top Sleek Brand Navigation */}
      <header className="sleek-landing-nav">
        <div className="landing-brand-group" onClick={() => navigate('/discover')}>
          <div className="brand-dot-beacon">
            <span className="beacon-ping" />
            <Radio size={18} className="beacon-icon" />
          </div>
          <span className="brand-title-text">MUSICIANS</span>
          <span className="brand-tag-pill">STUDIO</span>
        </div>

        <div className="landing-nav-actions">
          <button
            className="landing-secondary-link"
            onClick={() => navigate('/login')}
          >
            Sign In
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            className="landing-primary-btn"
            onClick={() => navigate('/discover')}
          >
            Open Player <ArrowRight size={16} />
          </motion.button>
        </div>
      </header>

      {/* Hero Section */}
      <motion.main
        className="sleek-landing-hero"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Live Status Pill */}
        <motion.div variants={itemVariants} className="landing-badge-wrapper">
          <div className="live-curated-pill">
            <span className="pulse-red-dot" />
            <span className="pill-text">LOSSLESS MUSIC STREAMING &bull; GUESSING ARENA</span>
          </div>
        </motion.div>

        {/* Hero Title */}
        <motion.h1 variants={itemVariants} className="landing-headline">
          Hear The Beat In <br />
          <span className="text-gradient-red">Blood Red & Noir</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={itemVariants} className="landing-subtext">
          A sleek, high-fidelity music streaming ecosystem inspired by Spotify & YouTube Music.
          Immerse in curated playlists, high-energy tracks, and test your ears in the real-time Heardle Arena.
        </motion.p>

        {/* CTA Button Group */}
        <motion.div variants={itemVariants} className="landing-cta-cluster">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(220, 38, 38, 0.6)' }}
            whileTap={{ scale: 0.96 }}
            className="btn-hero-launch"
            onClick={() => navigate('/discover')}
          >
            <Play size={18} fill="#ffffff" />
            <span>Launch Web Player</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.96 }}
            className="btn-hero-secondary"
            onClick={() => navigate('/arena')}
          >
            <Flame size={18} className="text-red-500" />
            <span>Play Daily Arena</span>
          </motion.button>
        </motion.div>

        {/* Floating Showcase Music Cards */}
        <motion.div variants={itemVariants} className="showcase-cards-grid">
          {showcaseTracks.map((track) => {
            const thumb =
              track.custom_thumbnail_url ||
              (track.yt_video_id ? `https://img.youtube.com/vi/${track.yt_video_id}/mqdefault.jpg` : null) ||
              track.album?.cover_art_url ||
              track.album_cover ||
              track.cover_art_url ||
              'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';

            const artistName = track.artist?.name || track.artist_name || 'Featured Artist';

            return (
              <motion.div
                key={track.track_id}
                className="showcase-track-card"
                whileHover={{ y: -6, borderColor: 'rgba(220, 38, 38, 0.5)' }}
                transition={{ duration: 0.2 }}
                onClick={() => {
                  playTrack(track.track_id);
                  navigate('/discover');
                }}
              >
                <div className="showcase-cover-wrapper">
                  <img
                    src={thumb}
                    alt={track.title}
                    className="showcase-cover-img"
                    onError={(e) => {
                      e.currentTarget.src = track.album?.cover_art_url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500';
                    }}
                  />
                  <div className="showcase-card-overlay">
                    <div className="showcase-play-circle">
                      <Play size={16} fill="#ffffff" className="play-icon-offset" />
                    </div>
                  </div>
                </div>

                <div className="showcase-card-meta">
                  <span className="showcase-track-name">{track.title}</span>
                  <span className="showcase-artist-name">{artistName}</span>
                  <span className="showcase-genre-pill">{track.genre || 'Electronic'}</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Feature Highlights Grid */}
        <motion.div variants={itemVariants} className="landing-features-shelf">
          <div className="feature-pill-item">
            <Headphones size={20} className="feature-icon" />
            <div className="feature-info">
              <h4>Lossless Audio</h4>
              <p>Crystal clear streams rendered seamlessly.</p>
            </div>
          </div>

          <div className="feature-pill-item">
            <Flame size={20} className="feature-icon" />
            <div className="feature-info">
              <h4>Heardle Guessing Arena</h4>
              <p>4 audio snippet tiers from 0.1s to 5.0s to challenge your knowledge.</p>
            </div>
          </div>

          <div className="feature-pill-item">
            <Disc3 size={20} className="feature-icon" />
            <div className="feature-info">
              <h4>Custom Playlists</h4>
              <p>Build, curate, and replay your favorite sonic collections.</p>
            </div>
          </div>
        </motion.div>
      </motion.main>
    </div>
  );
}