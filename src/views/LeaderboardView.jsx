import React from 'react';
import { Trophy, Flame, Award, Zap, TrendingUp, Medal, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { USERS } from '../data/musicData';

export default function LeaderboardView() {
  const { currentUser, switchUser } = useApp();

  // Sort users by total XP descending
  const sortedUsers = [...USERS].sort((a, b) => b.total_xp - a.total_xp);

  return (
    <div className="leaderboard-view">
      {/* Leaderboard Header */}
      <div className="leaderboard-header glass-panel">
        <div className="header-icon-box">
          <Trophy size={28} className="trophy-gold" />
        </div>
        <div>
          <h1 className="header-title">Global Audio Grandmasters</h1>
          <p className="header-sub">
            Rankings derived dynamically from <code>USERS.total_xp</code>, Heardle win streaks, and session accuracy
          </p>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="podium-container">
        {/* Rank 2 */}
        {sortedUsers[1] && (
          <div className="podium-card rank-2 glass-panel">
            <div className="podium-medal silver">2</div>
            <img src={sortedUsers[1].avatar_url} alt={sortedUsers[1].username} className="podium-avatar" />
            <h3 className="podium-name">@{sortedUsers[1].username}</h3>
            <span className="podium-xp font-mono">{sortedUsers[1].total_xp.toLocaleString()} XP</span>
            <span className="badge badge-purple">{sortedUsers[1].rank_title}</span>
          </div>
        )}

        {/* Rank 1 */}
        {sortedUsers[0] && (
          <div className="podium-card rank-1 glass-panel">
            <div className="podium-crown">
              <Trophy size={24} />
            </div>
            <div className="podium-medal gold">1</div>
            <img src={sortedUsers[0].avatar_url} alt={sortedUsers[0].username} className="podium-avatar champ-avatar" />
            <h3 className="podium-name">@{sortedUsers[0].username}</h3>
            <span className="podium-xp champ-xp font-mono">{sortedUsers[0].total_xp.toLocaleString()} XP</span>
            <span className="badge badge-cyan">{sortedUsers[0].rank_title}</span>
          </div>
        )}

        {/* Rank 3 */}
        {sortedUsers[2] && (
          <div className="podium-card rank-3 glass-panel">
            <div className="podium-medal bronze">3</div>
            <img src={sortedUsers[2].avatar_url} alt={sortedUsers[2].username} className="podium-avatar" />
            <h3 className="podium-name">@{sortedUsers[2].username}</h3>
            <span className="podium-xp font-mono">{sortedUsers[2].total_xp.toLocaleString()} XP</span>
            <span className="badge badge-amber">{sortedUsers[2].rank_title}</span>
          </div>
        )}
      </div>

      {/* Full Leaderboard Table */}
      <div className="leaderboard-table-card glass-panel">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Rank Title</th>
              <th>Level</th>
              <th>Streak</th>
              <th>Win Ratio</th>
              <th>Derived Total XP</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user, idx) => {
              const isMe = user.user_id === currentUser.user_id;
              return (
                <tr key={user.user_id} className={isMe ? 'my-rank-row' : ''}>
                  <td className="rank-number-cell font-mono">
                    {idx === 0 && <span className="trophy-cell gold">🥇 1</span>}
                    {idx === 1 && <span className="trophy-cell silver">🥈 2</span>}
                    {idx === 2 && <span className="trophy-cell bronze">🥉 3</span>}
                    {idx > 2 && `#${idx + 1}`}
                  </td>
                  <td>
                    <div className="player-cell">
                      <img src={user.avatar_url} alt={user.username} className="player-cell-avatar" />
                      <div>
                        <span className="player-cell-name">@{user.username}</span>
                        {isMe && <span className="badge badge-green you-badge">YOU</span>}
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-purple">{user.rank_title}</span></td>
                  <td className="font-mono">Lvl {user.level}</td>
                  <td className="font-mono">
                    <span className="streak-tag">
                      <Flame size={13} /> {user.streak_days}d
                    </span>
                  </td>
                  <td className="font-mono">{user.accuracy}</td>
                  <td className="font-mono xp-cell">
                    <strong>{user.total_xp.toLocaleString()}</strong> XP
                  </td>
                  <td>
                    {!isMe && (
                      <button
                        className="btn-secondary btn-switch-fast"
                        onClick={() => switchUser(user.user_id)}
                      >
                        Simulate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
