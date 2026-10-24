import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Eye,
  EyeOff,
  User,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Radio,
  Music
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sqlApi } from '../services/sqlApi';
import { soundEngine } from '../services/soundEngine';
import confetti from 'canvas-confetti';

export default function AuthView({ initialMode = 'login' }) {
  const {
    currentPath,
    navigate,
    setCurrentUser,
    usersList,
    setUsersList
  } = useApp();

  // Mode: 'login' | 'register'
  const [activeTab, setActiveTab] = useState(
    currentPath === '/register' || initialMode === 'register' ? 'register' : 'login'
  );

  useEffect(() => {
    if (currentPath === '/register') setActiveTab('register');
    if (currentPath === '/login') setActiveTab('login');
  }, [currentPath]);

  // Sign In State
  const [loginIdentifier, setLoginIdentifier] = useState('kai_beats');
  const [loginPassword, setLoginPassword] = useState('demoPass123!');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register State
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('Synthwave');

  // UI state
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeDemoPill, setActiveDemoPill] = useState(null);

  const starterGenres = ['Synthwave', 'Dark Electro', 'Cyberpunk', 'Lo-Fi Chill'];

  // Switch Tab
  const handleTabSwitch = (tab) => {
    try {
      soundEngine.playEntryChime();
    } catch {
      // fallback
    }
    setActiveTab(tab);
    setStatusMessage(null);
    if (tab === 'login') {
      window.history.replaceState(null, '', '/login');
    } else {
      window.history.replaceState(null, '', '/register');
    }
  };

  // Quick Demo Autofill
  const handleDemoFill = (user) => {
    try {
      soundEngine.playEntryChime();
    } catch {
      // fallback
    }
    setLoginIdentifier(user.username);
    setLoginPassword('demoPass123!');
    setActiveDemoPill(user.username);
    setTimeout(() => setActiveDemoPill(null), 800);

    setStatusMessage({
      type: 'success',
      text: `Loaded demo credentials for @${user.username}`
    });
  };

  // Login Submit
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword) {
      setStatusMessage({ type: 'error', text: 'Please enter your username and password.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      soundEngine.playEntryChime();
    } catch {
      // fallback
    }

    setTimeout(() => {
      const matchedUser = sqlApi.auth.login(loginIdentifier.trim(), loginPassword);
      setCurrentUser(matchedUser);

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#ff7878', '#991b1b', '#ffffff']
      });

      setStatusMessage({
        type: 'success',
        text: `Welcome back, @${matchedUser.username}! Entering studio...`
      });

      setTimeout(() => {
        navigate('/discover');
      }, 750);
    }, 400);
  };

  // Register Submit
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!regUsername.trim() || !regEmail.trim() || !regPassword) {
      setStatusMessage({ type: 'error', text: 'All registration fields are required.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      soundEngine.playEntryChime();
    } catch {
      // fallback
    }

    setTimeout(() => {
      const cleanUsername = regUsername.replace('@', '').trim();
      const newUser = sqlApi.auth.register(cleanUsername, regEmail.trim(), regPassword);
      newUser.favorite_genre = selectedGenre;
      newUser.display_name = cleanUsername;

      setUsersList(prev => [newUser, ...prev]);
      setCurrentUser(newUser);

      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#ef4444', '#ff7878', '#fbbf24', '#ffffff']
      });

      setStatusMessage({
        type: 'success',
        text: `Welcome @${cleanUsername}! +250 Starter XP unlocked.`
      });

      setTimeout(() => {
        navigate('/discover');
      }, 850);
    }, 450);
  };

  return (
    <div className="auth-clean-wrapper">
      {/* Subtle Atmospheric Ruby Glows & Micro Grid */}
      <div className="auth-clean-bg">
        <div className="clean-ruby-flare" />
        <div className="clean-micro-grid" />
      </div>

      {/* Top Navigation Strip */}
      <header className="auth-clean-nav">
        <button
          type="button"
          className="clean-back-btn font-mono"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={15} />
          <span>RETURN TO HOME</span>
        </button>

        <div className="clean-telemetry-tag font-mono">
          <span className="clean-red-pip" />
          <span>MUSICIANS // SECURE ACCESS</span>
        </div>
      </header>

      {/* Main Centered Luxury Card */}
      <main className="auth-clean-stage">
        <div className="auth-minimal-card">
          {/* Subtle Sleek Reticle Corners */}
          <div className="corner-bracket br-tl" />
          <div className="corner-bracket br-tr" />
          <div className="corner-bracket br-bl" />
          <div className="corner-bracket br-br" />

          {/* Brand Header */}
          <div className="minimal-card-header">
            <div className="minimal-brand-icon">
              <Radio size={18} className="text-crimson" />
            </div>
            <h1 className="minimal-brand-title font-syne">MUSICIANS</h1>
            <p className="minimal-brand-sub">
              {activeTab === 'login'
                ? 'Sign in to access high-fidelity streams & guessing arena'
                : 'Create your artist profile & claim +250 Starter XP'}
            </p>
          </div>

          {/* Clean Segmented Tab Switcher */}
          <div className="clean-tab-slider font-mono">
            <button
              type="button"
              className={`clean-tab-option ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`clean-tab-option ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => handleTabSwitch('register')}
            >
              Create Account
            </button>
          </div>

          {/* Status Toast */}
          {statusMessage && (
            <div className={`clean-toast toast-${statusMessage.type} font-mono`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 size={15} className="toast-icon" />
              ) : (
                <AlertCircle size={15} className="toast-icon" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* SIGN IN VIEW */}
          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="clean-form">
              {/* Quick Demo Fill Pills */}
              <div className="clean-demo-row">
                <span className="clean-demo-label font-mono">Quick demo:</span>
                <div className="clean-demo-pills">
                  {usersList.slice(0, 3).map(u => (
                    <button
                      key={u.user_id}
                      type="button"
                      className={`clean-demo-pill font-mono ${activeDemoPill === u.username ? 'active' : ''}`}
                      onClick={() => handleDemoFill(u)}
                    >
                      <img src={u.avatar_url} alt={u.username} className="demo-avatar-mini" />
                      <span>@{u.username}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Username/Email Input */}
              <div className="clean-field-group">
                <label className="clean-label font-mono" htmlFor="login-ident">
                  USERNAME OR EMAIL
                </label>
                <div className="clean-input-box">
                  <User size={15} className="clean-field-icon" />
                  <input
                    id="login-ident"
                    type="text"
                    className="clean-input font-mono"
                    placeholder="e.g. kai_beats"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="clean-field-group">
                <div className="clean-label-row font-mono">
                  <label className="clean-label" htmlFor="login-pwd">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    className="clean-forgot-btn"
                    onClick={() => {
                      alert('Demo Mode: Click any "Quick demo" pill above to autofill valid credentials instantly!');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="clean-input-box">
                  <Lock size={15} className="clean-field-icon" />
                  <input
                    id="login-pwd"
                    type={showLoginPassword ? 'text' : 'password'}
                    className="clean-input font-mono"
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="clean-eye-btn"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="clean-submit-btn font-mono"
              >
                <span>SIGN IN TO MUSICIANS</span>
                <ArrowRight size={15} />
              </button>
            </form>
          ) : (
            /* REGISTER VIEW (SAME SLEEK AESTHETIC) */
            <form onSubmit={handleRegisterSubmit} className="clean-form">
              {/* Username */}
              <div className="clean-field-group">
                <label className="clean-label font-mono" htmlFor="reg-user">
                  ARTIST HANDLE
                </label>
                <div className="clean-input-box">
                  <User size={15} className="clean-field-icon" />
                  <input
                    id="reg-user"
                    type="text"
                    className="clean-input font-mono"
                    placeholder="e.g. nova_sound"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Email */}
              <div className="clean-field-group">
                <label className="clean-label font-mono" htmlFor="reg-email">
                  EMAIL ADDRESS
                </label>
                <div className="clean-input-box">
                  <Mail size={15} className="clean-field-icon" />
                  <input
                    id="reg-email"
                    type="email"
                    className="clean-input font-mono"
                    placeholder="artist@musicians.io"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="clean-field-group">
                <label className="clean-label font-mono" htmlFor="reg-pwd">
                  MASTER KEY (PASSWORD)
                </label>
                <div className="clean-input-box">
                  <Lock size={15} className="clean-field-icon" />
                  <input
                    id="reg-pwd"
                    type={showRegPassword ? 'text' : 'password'}
                    className="clean-input font-mono"
                    placeholder="Min. 8 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="clean-eye-btn"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                  >
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Starter Genre Selection */}
              <div className="clean-field-group">
                <label className="clean-label font-mono">STARTER GENRE</label>
                <div className="clean-genre-pills font-mono">
                  {starterGenres.map(g => (
                    <button
                      key={g}
                      type="button"
                      className={`clean-genre-pill ${selectedGenre === g ? 'active' : ''}`}
                      onClick={() => {
                        try {
                          soundEngine.playEntryChime();
                        } catch {
                          // fallback
                        }
                        setSelectedGenre(g);
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reward Badge */}
              <div className="clean-reward-badge font-mono">
                <Sparkles size={14} className="text-crimson" />
                <span>+250 Starter XP awarded instantly</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="clean-submit-btn font-mono"
              >
                <span>CREATE ARTIST PROFILE</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* Footer Switch Prompt */}
          <div className="minimal-card-footer font-mono">
            {activeTab === 'login' ? (
              <p className="clean-switch-text">
                Need an account?{' '}
                <button
                  type="button"
                  className="clean-switch-btn"
                  onClick={() => handleTabSwitch('register')}
                >
                  Create Account (+250 XP)
                </button>
              </p>
            ) : (
              <p className="clean-switch-text">
                Already registered?{' '}
                <button
                  type="button"
                  className="clean-switch-btn"
                  onClick={() => handleTabSwitch('login')}
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Minimal Bottom Micro-Telemetry Footer */}
      <footer className="auth-clean-footer font-mono">
        <span>AES-256 ENCRYPTED</span>
        <span className="dot-divider">•</span>
        <span>LOSSLESS FLAC ENGINE</span>
        <span className="dot-divider">•</span>
        <span>MUSICIANS LAB</span>
      </footer>
    </div>
  );
}
