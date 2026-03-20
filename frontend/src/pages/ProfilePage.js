import React from 'react';
import './ProfilePage.css';

const ProfilePage = ({ user, stats, formatSize, toggleTheme, isDark, onLogout }) => {
  const storageUsed = formatSize(stats?.storageUsed ?? 0);
  const storageLimit = formatSize(stats?.storageLimit ?? 5e9);
  const storagePct = stats?.storageLimit
    ? Math.min(100, Math.round((stats.storageUsed / stats.storageLimit) * 100))
    : 0;

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="profile-page fade-in">
      <header className="profile-header">
        <h1>Profile</h1>
        <p>Manage your account and preferences.</p>
      </header>

      <div className="profile-card clay-inset">
        <div className="profile-avatar">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div className="profile-info">
          <h2>{user?.username}</h2>
          <p className="profile-email">{user?.email}</p>
          <span className="profile-meta">Member since {memberSince}</span>
        </div>
      </div>

      <section className="profile-section">
        <h3>Storage</h3>
        <div className="storage-bar clay-inset">
          <div
            className="storage-fill"
            style={{ width: `${storagePct}%` }}
          />
        </div>
        <p className="storage-text">
          {storageUsed} of {storageLimit} used
        </p>
      </section>

      <section className="profile-section">
        <h3>Appearance</h3>
        <div className="theme-row">
          <span>Theme</span>
          <button
            className="theme-toggle-btn clay-pressed"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </section>

      <div className="profile-actions">
        <button
          className="logout-btn"
          onClick={onLogout}
        >
          Sign out
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
