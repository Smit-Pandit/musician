import React from 'react';
import {
  X,
  Palette,
  Layout,
  Check,
  Sparkles,
  Sliders,
  Moon,
  Sun,
  Eye,
  Layers
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DesignSwitcherModal() {
  const {
    isDesignStudioOpen,
    setIsDesignStudioOpen,
    theme,
    setTheme,
    layoutMode,
    setLayoutMode
  } = useApp();

  if (!isDesignStudioOpen) return null;

  const themes = [
    {
      id: 'cyber-neon',
      name: 'Cyber Neon Horizon',
      description: 'Deep OLED space, ultraviolet & electric cyan glow. Peak EDM & Synthwave vibe.',
      colors: ['#070913', '#8b5cf6', '#06b6d4', '#ec4899'],
      badge: 'Default / Popular'
    },
    {
      id: 'tokyo-midnight',
      name: 'Tokyo Midnight Lo-Fi',
      description: 'Moody indigo dusk with amber tape saturation and vintage rose accents.',
      colors: ['#0d0c15', '#f59e0b', '#f43f5e', '#a8a29e'],
      badge: 'Lo-Fi Chill'
    },
    {
      id: 'obsidian-emerald',
      name: 'Obsidian Studio Emerald',
      description: 'Ultra-luxurious dark obsidian glass with pure surgical emerald lasers.',
      colors: ['#080a0c', '#10b981', '#38bdf8', '#065f46'],
      badge: 'Pro Audio'
    }
  ];

  const layouts = [
    {
      id: 'spotify-studio',
      name: 'Studio Workstation Layout',
      description: 'Persistent sidebar, multi-tab main stage, and bottom waveform player deck.',
      icon: Layout
    },
    {
      id: 'arcade-hud',
      name: 'Arcade HUD Mode',
      description: 'High-focus gaming deck optimized for rapid Heardle song guessing and streaks.',
      icon: Layers
    },
    {
      id: 'full-focus',
      name: 'Minimalist Immersion',
      description: 'Distraction-free wide canvas with sleek floating controls.',
      icon: Eye
    }
  ];

  return (
    <div className="modal-backdrop" onClick={() => setIsDesignStudioOpen(false)}>
      <div className="design-modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge">
              <Palette size={20} />
            </div>
            <div>
              <h2 className="modal-title">Design Studio & Theme Engine</h2>
              <p className="modal-sub">
                Switch visual aesthetics and layout configurations instantly
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => setIsDesignStudioOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Theme Chooser */}
          <section className="design-section">
            <h3 className="section-label">
              <Sparkles size={16} /> Color Aesthetics & Lighting
            </h3>
            <div className="theme-grid">
              {themes.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <div
                    key={t.id}
                    className={`theme-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setTheme(t.id)}
                  >
                    <div className="theme-card-top">
                      <div className="theme-color-palette">
                        {t.colors.map((c, i) => (
                          <span
                            key={i}
                            className="color-dot"
                            style={{ backgroundColor: c }}
                          ></span>
                        ))}
                      </div>
                      <span className="theme-badge">{t.badge}</span>
                    </div>

                    <h4 className="theme-card-title">{t.name}</h4>
                    <p className="theme-card-desc">{t.description}</p>

                    <div className="theme-card-status">
                      {isSelected ? (
                        <span className="status-pill active-pill">
                          <Check size={14} /> Active Theme
                        </span>
                      ) : (
                        <span className="status-pill select-pill">Apply Theme</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Layout Mode Chooser */}
          <section className="design-section">
            <h3 className="section-label">
              <Sliders size={16} /> Viewport & Layout Architecture
            </h3>
            <div className="layout-grid">
              {layouts.map((l) => {
                const isSelected = layoutMode === l.id;
                const Icon = l.icon;
                return (
                  <div
                    key={l.id}
                    className={`layout-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setLayoutMode(l.id)}
                  >
                    <div className="layout-card-icon">
                      <Icon size={22} />
                    </div>
                    <div className="layout-card-body">
                      <h4 className="layout-card-title">{l.name}</h4>
                      <p className="layout-card-desc">{l.description}</p>
                    </div>
                    {isSelected && (
                      <div className="layout-check">
                        <Check size={16} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Note to the developer/user */}
          <div className="design-note-box glass-panel">
            <Sparkles size={18} className="note-icon" />
            <div>
              <p className="note-title">Designed for Seamless Customization</p>
              <p className="note-text">
                Every CSS token is scoped under dynamic variables (`--bg-primary`, `--accent-gradient`, `--border-hover`). You can easily craft and inject limitless new themes or responsive design variations into <code>src/index.css</code>.
              </p>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn-primary"
            onClick={() => setIsDesignStudioOpen(false)}
          >
            Apply & Close Studio
          </button>
        </div>
      </div>
    </div>
  );
}
