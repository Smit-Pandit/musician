import React, { useState, Component } from 'react';
import { useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import BottomPlayer from './components/BottomPlayer';
import DesignSwitcherModal from './components/DesignSwitcherModal';
import SchemaModal from './components/SchemaModal';
import VideoModal from './components/VideoModal';
import SqlConsoleModal from './components/SqlConsoleModal';

// Views
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
    activeTab,
    layoutMode,
    currentPath,
    isSqlConsoleOpen,
    setIsSqlConsoleOpen
  } = useApp();
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const isAuthPage =
    currentPath === '/login' ||
    currentPath === '/register' ||
    activeTab === 'login' ||
    activeTab === 'register';

  if (isAuthPage) {
    return (
      <div className={`app-shell layout-${layoutMode}`}>
        <ErrorBoundary>
          <AuthView initialMode={currentPath === '/register' || activeTab === 'register' ? 'register' : 'login'} />
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

  const renderActiveView = () => {
    switch (activeTab) {
      case 'game':
        return <GameArenaView />;
      case 'profile':
        return <UserProfileView />;
      case 'discover':
        return <DiscoverView globalSearchTerm={globalSearchTerm} />;
      case 'artist':
        return <ArtistDetailView />;
      case 'playlists':
        return <PlaylistsView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'schema':
        return <SchemaView />;
      case 'login':
        return <AuthView initialMode="login" />;
      case 'register':
        return <AuthView initialMode="register" />;
      default:
        return <GameArenaView />;
    }
  };

  return (
    <div className={`app-shell layout-${layoutMode}`}>
      {/* Top Universal Navigation */}
      <Navbar onSearch={(term) => setGlobalSearchTerm(term)} />

      {/* Main Layout Area */}
      <div className="app-main-body">
        {/* Sidebar (hidden in full-focus mode) */}
        {layoutMode !== 'full-focus' && <Sidebar />}

        {/* Viewport Canvas */}
        <main className="app-content-viewport">
          <div className="viewport-inner">
            <ErrorBoundary>
              {renderActiveView()}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* Persistent Bottom Audio Player Deck */}
      <BottomPlayer />

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
