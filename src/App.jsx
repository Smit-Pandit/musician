import React, { useState, Component } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomPlayer from './components/BottomPlayer';
import DesignSwitcherModal from './components/DesignSwitcherModal';
import SchemaModal from './components/SchemaModal';
import VideoModal from './components/VideoModal';
import SqlConsoleModal from './components/SqlConsoleModal';

// Views
import LandingView from './views/LandingView';
import GameArenaView from './views/GameArenaView';
import UserProfileView from './views/UserProfileView';
import DiscoverView from './views/DiscoverView';
import ArtistDetailView from './views/ArtistDetailView';
import PlaylistsView from './views/PlaylistsView';
import LeaderboardView from './views/LeaderboardView';
import SchemaView from './views/SchemaView';
import AuthView from './views/AuthView';

import './App.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>
          <h2>Something went wrong loading this view.</h2>
          <p style={{ color: '#94a3b8', marginTop: '8px' }}>{this.state.error?.message}</p>
          <button
            className="btn-primary"
            style={{ marginTop: '20px' }}
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Reload View
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const {
    layoutMode,
    isSqlConsoleOpen,
    setIsSqlConsoleOpen
  } = useApp();
  const location = useLocation();
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // 1. Landing Page (Home with "Press to Enter" button)
  if (location.pathname === '/') {
    return (
      <div className={`app-shell layout-${layoutMode} landing-shell`}>
        <ErrorBoundary>
          <LandingView />
        </ErrorBoundary>
        <DesignSwitcherModal />
        <SchemaModal />
        <SqlConsoleModal
          isOpen={isSqlConsoleOpen}
          onClose={() => setIsSqlConsoleOpen(false)}
        />
      </div>
    );
  }

  // 2. Auth Pages (/login and /register)
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  if (isAuthPage) {
    return (
      <div className={`app-shell layout-${layoutMode}`}>
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<AuthView initialMode="login" />} />
            <Route path="/register" element={<AuthView initialMode="register" />} />
          </Routes>
        </ErrorBoundary>
        <DesignSwitcherModal />
        <SchemaModal />
        <SqlConsoleModal
          isOpen={isSqlConsoleOpen}
          onClose={() => setIsSqlConsoleOpen(false)}
        />
      </div>
    );
  }

  // 3. Main Streaming Application
  return (
    <div className={`app-shell layout-${layoutMode}`}>
      {/* Top Universal Navigation */}
      <Navbar onSearch={(term) => setGlobalSearchTerm(term)} />

      {/* Main Layout Area */}
      <div className="app-main-body">
        {/* Sidebar (hidden in full-focus mode) */}
        {layoutMode !== 'full-focus' && <Sidebar />}

        {/* Viewport Canvas with URL Routes */}
        <main className="app-content-viewport">
          <div className="viewport-inner">
            <ErrorBoundary>
              <Routes>
                <Route path="/discover" element={<DiscoverView globalSearchTerm={globalSearchTerm} />} />
                <Route path="/stream" element={<DiscoverView globalSearchTerm={globalSearchTerm} />} />
                <Route path="/game" element={<GameArenaView />} />
                <Route path="/arena" element={<GameArenaView />} />
                <Route path="/profile" element={<UserProfileView />} />
                <Route path="/playlists" element={<PlaylistsView />} />
                <Route path="/playlists/:id" element={<PlaylistsView />} />
                <Route path="/artist" element={<ArtistDetailView />} />
                <Route path="/artist/:id" element={<ArtistDetailView />} />
                <Route path="/leaderboard" element={<LeaderboardView />} />
                <Route path="/schema" element={<SchemaView />} />
                <Route path="*" element={<DiscoverView globalSearchTerm={globalSearchTerm} />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Persistent Bottom Audio Player Deck (Hidden in Audio Arena so no mystery track or answer is revealed) */}
      {!location.pathname.startsWith('/game') && !location.pathname.startsWith('/arena') && <BottomPlayer />}

      {/* Modals & Studios */}
      <DesignSwitcherModal />
      <SchemaModal />
      <VideoModal />
      <SqlConsoleModal
        isOpen={isSqlConsoleOpen}
        onClose={() => setIsSqlConsoleOpen(false)}
      />
    </div>
  );
}
