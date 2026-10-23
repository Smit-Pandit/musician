import React from 'react';
import { X, Tv, ExternalLink, ShieldCheck, Play } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function VideoModal() {
  const { currentTrack, showVideoModal, setShowVideoModal } = useApp();

  if (!showVideoModal || !currentTrack) return null;

  return (
    <div className="modal-backdrop" onClick={() => setShowVideoModal(false)}>
      <div className="video-modal-container glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-box">
            <div className="modal-icon-badge yt-badge-icon">
              <Tv size={20} />
            </div>
            <div>
              <h3 className="modal-title">{currentTrack.title}</h3>
              <p className="modal-sub">
                {currentTrack.artist?.name} • YT Video ID: <code className="font-mono">{currentTrack.yt_video_id || currentTrack.youtube_video_id}</code>
              </p>
            </div>
          </div>
          <button
            className="modal-close-btn"
            onClick={() => setShowVideoModal(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="video-modal-body">
          <div className="iframe-wrapper">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${currentTrack.yt_video_id || currentTrack.youtube_video_id}?autoplay=1&enablejsapi=1`}
              title={currentTrack.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="youtube-iframe"
            ></iframe>
          </div>

          <div className="video-meta-box glass-panel">
            <div className="video-meta-info">
              <span className="badge badge-purple">{currentTrack.track_type.toUpperCase()}</span>
              <span className="badge badge-cyan">{currentTrack.genre}</span>
              <span className="meta-text">
                Snippet Start: {currentTrack.snippet_start_sec != null ? currentTrack.snippet_start_sec : (currentTrack.snippet_start_ms / 1000)}s
              </span>
            </div>
            <a
              href={`https://www.youtube.com/watch?v=${currentTrack.yt_video_id || currentTrack.youtube_video_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <ExternalLink size={14} /> Open in YouTube
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
