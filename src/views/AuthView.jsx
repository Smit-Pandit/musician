import React, { useState, useEffect } from 'react';
import {
  Zap,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  ArrowLeft,
  Music,
  Disc,
  Database
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

export default function AuthView({ initialMode = 'login' }) {
  const {
    currentPath,
    navigate,
    setActiveTab,
    currentUser,
    setCurrentUser,
    usersList,
    setUsersList
  } = useApp();

  // Mode: 'login' | 'register'
  const isRegister = currentPath === '/register' || initialMode === 'register';

  // Form State
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Synthwave');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'error', text }

  const genres = ['Synthwave', 'Cyberpunk', 'Lo-Fi Chill', 'Indie Rock', 'French House'];

  // Handle fast demo fill
  const handleDemoFill = (user) => {
    setUsername(user.username);
    setEmail(user.email);
    setPassword('demoPass123!');
    setStatusMessage({
      type: 'success',
      text: `Loaded credentials for @${user.username}`
    });
  };

  // Submit Handler (Mock authentication, not connected to database yet)
  const handleSubmit = (e) => {
    e.preventDefault();
    setStatusMessage(null);

    if (isRegister) {
      // Basic validation
      if (!username.trim() || !email.trim() || !password) {
        setStatusMessage({ type: 'error', text: 'Please fill out all required fields.' });
        return;
      }
      if (password !== confirmPassword) {
        setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
        return;
      }

      // Create new user via SQL (INSERT INTO users ...)
      const newUser = sqlApi.auth.register(username, email, password);
      newUser.favorite_genre = selectedGenre;

      setUsersList(prev => [newUser, ...prev]);
      setCurrentUser(newUser);

      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      setStatusMessage({
        type: 'success',
        text: `Welcome aboard, @${newUser.username}! +250 Starter XP awarded.`
      });

      setTimeout(() => {
        navigate('/');
        setActiveTab('profile');
      }, 1200);
    } else {
      // Login via SQL (SELECT * FROM users WHERE ...)
      if (!username.trim() && !email.trim()) {
        setStatusMessage({ type: 'error', text: 'Please enter your username or email.' });
        return;
      }

      const matchedUser = sqlApi.auth.login(username.trim() || email.trim(), password);

      setCurrentUser(matchedUser);

      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
      setStatusMessage({
        type: 'success',
        text: `Signed in successfully as @${matchedUser.username}! Redirecting...`
      });

      setTimeout(() => {
        navigate('/');
        setActiveTab('profile');
      }, 1000);
    }
  };

  return (
    <div className="auth-page-wrapper">
      {/* Top back navigation button */}
      <div className="auth-top-bar">
        <button
          className="btn-back-arena"
          onClick={() => {
            navigate('/');
            setActiveTab('game');
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Audio Arena</span>
        </button>

        <div className="auth-erd-tag">
          <Database size={14} />
          <span>USERS Table Auth Simulation</span>
        </div>
      </div>

      <div className="auth-card-container glass-panel">
        {/* Left Side: Brand Visual & Features Showcase */}
        <div className="auth-left-showcase">
          <div className="auth-brand-header">
            <div className="brand-icon-box">
              <Zap size={24} className="brand-icon" />
            </div>
            <div>
              <span className="auth-brand-title">SONIX</span>
              <span className="auth-brand-sub">MUSIC GUESSING &amp; STREAMING</span>
            </div>
          </div>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="auth-feat-icon">
                <Music size={18} />
              </div>
              <div>
                <h4 className="auth-feat-title">4-Tier Audio Snippets</h4>
                <p className="auth-feat-desc">
                  Identify mystery tracks from 0.5s to 5.0s audio hooks with live synthesized waveforms.
                </p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feat-icon">
                <Flame size={18} />
              </div>
              <div>
                <h4 className="auth-feat-title">Daily Streaks &amp; Derived XP</h4>
                <p className="auth-feat-desc">
                  Climb the global leaderboard with continuous game sessions and speed bonuses.
                </p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feat-icon">
                <Disc size={18} />
              </div>
              <div>
                <h4 className="auth-feat-title">Custom Playlists &amp; Remix Lineage</h4>
                <p className="auth-feat-desc">
                  Curate public/private mixtapes and explore parent track remix genealogy.
                </p>
              </div>
            </div>
          </div>

          {/* Equalizer animation banner */}
          <div className="auth-eq-box">
            <span className="eq-label">SYNTH ENGINE READY</span>
            <div className="waveform-container auth-eq-bars">
              {[0.4, 0.8, 0.3, 0.9, 0.6, 0.95, 0.5, 0.85, 0.7, 0.4, 0.88, 0.65].map(
                (h, idx) => (
                  <div
                    key={idx}
                    className="waveform-bar active playing"
                    style={{
                      height: `${h * 28}px`,
                      animationDelay: `${idx * 0.08}s`
                    }}
                  ></div>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form (Sign In / Register) */}
        <div className="auth-right-form-pane">
          {/* Mode Switcher Tabs */}
          <div className="auth-tabs-toggle">
            <button
              className={`auth-tab-btn ${!isRegister ? 'active' : ''}`}
              onClick={() => {
                navigate('/login');
                setStatusMessage(null);
              }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab-btn ${isRegister ? 'active' : ''}`}
              onClick={() => {
                navigate('/register');
                setStatusMessage(null);
              }}
            >
              Create Account
            </button>
          </div>

          <div className="auth-header-text">
            <h2 className="auth-heading">
              {isRegister ? 'Create Your Sonic Profile' : 'Welcome Back to Sonix'}
            </h2>
            <p className="auth-subheading">
              {isRegister
                ? 'Join players worldwide and test your audio recognition speed.'
                : 'Enter your credentials or pick a demo user to explore.'}
            </p>
          </div>

          {/* Quick Demo Fill Pills */}
          <div className="demo-fill-strip">
            <span className="demo-strip-label">Quick Fill Demo:</span>
            <div className="demo-pills">
              {usersList.slice(0, 3).map(u => (
                <button
                  key={u.user_id}
                  type="button"
                  className="demo-pill-btn"
                  onClick={() => handleDemoFill(u)}
                >
                  <img src={u.avatar_url} alt={u.username} className="demo-thumb" />
                  <span>@{u.username}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Status Toast */}
          {statusMessage && (
            <div className={`auth-status-toast status-${statusMessage.type}`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="auth-form-fields">
            {/* Username Field */}
            <div className="form-group">
              <label className="field-label">Username</label>
              <div className="field-input-box">
                <User size={16} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Alex_Synthwave"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="auth-input font-mono"
                  required
                />
              </div>
            </div>

            {/* Email Field (Required for Register, optional in login if username provided) */}
            {isRegister && (
              <div className="form-group">
                <label className="field-label">Email Address</label>
                <div className="field-input-box">
                  <Mail size={16} className="field-icon" />
                  <input
                    type="email"
                    placeholder="user@sonix.fm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="auth-input font-mono"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <div className="form-group">
              <div className="password-label-row">
                <label className="field-label">Password</label>
                {!isRegister && (
                  <span className="forgot-pass-link" onClick={() => alert('Demo mode: Click any Quick Fill Demo user above!')}>
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="field-input-box">
                <Lock size={16} className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input font-mono"
                  required
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register Only) */}
            {isRegister && (
              <div className="form-group">
                <label className="field-label">Confirm Password</label>
                <div className="field-input-box">
                  <Lock size={16} className="field-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="auth-input font-mono"
                    required
                  />
                </div>
              </div>
            )}

            {/* Starter Favorite Genre (Register Only) */}
            {isRegister && (
              <div className="form-group">
                <label className="field-label">Preferred Starter Genre</label>
                <div className="genre-pill-selector">
                  {genres.map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`genre-select-pill ${selectedGenre === g ? 'active' : ''}`}
                      onClick={() => setSelectedGenre(g)}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit CTA */}
            <button type="submit" className="btn-auth-submit btn-primary">
              <span>{isRegister ? 'Complete Registration & Claim 250 XP' : 'Sign In to Arena'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Footer Toggle text */}
          <div className="auth-pane-footer">
            {isRegister ? (
              <p className="auth-footer-text">
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    navigate('/login');
                    setStatusMessage(null);
                  }}
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="auth-footer-text">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => {
                    navigate('/register');
                    setStatusMessage(null);
                  }}
                >
                  Create Account (+250 XP)
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
