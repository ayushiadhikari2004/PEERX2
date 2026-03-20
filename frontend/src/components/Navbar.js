import React, { useState } from "react";

export default function Navbar({
  user,
  isDark,
  toggleTheme,
  toggleSidebar,
  onLogout,
  onProfileClick,
  onSettingsClick,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        {/* Hamburger Menu */}
        <button className="hamburger" onClick={toggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginRight: "1rem" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--color-primary-500)"/>
            <path d="M2 17L12 22L22 17" stroke="var(--color-primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="var(--color-primary-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="app-title" style={{ margin: 0, fontSize: "1.25rem", color: "var(--text-primary)" }}>PeerX</h1>
        </div>
        <input
          type="text"
          className="navbar-search"
          placeholder="🔍 Search files, groups..."
        />
      </div>

      <div className="navbar-right">
        {/* Theme Toggle */}
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {isDark ? "🌙" : "☀️"}
        </button>

        {/* User Menu */}
        <div className="user-menu-container">
          <button
            className="user-menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <div className="user-avatar">{user?.username?.charAt(0).toUpperCase()}</div>
            <span className="username">{user?.username}</span>
            <span className="dropdown-icon">▼</span>
          </button>

          {menuOpen && (
            <>
              <div
                className="menu-overlay"
                onClick={() => setMenuOpen(false)}
              />
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="dropdown-username">{user?.username}</div>
                    <div className="dropdown-email">{user?.email}</div>
                  </div>
                </div>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-item"
                  onClick={() => {
                    onProfileClick();
                    setMenuOpen(false);
                  }}
                >
                  <span>👤</span> My Profile
                </button>

                <button
                  className="dropdown-item"
                  onClick={() => {
                    onSettingsClick();
                    setMenuOpen(false);
                  }}
                >
                  <span>⚙️</span> Settings
                </button>

                <button className="dropdown-item">
                  <span>❓</span> Help & Support
                </button>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-item danger"
                  onClick={() => {
                    onLogout();
                    setMenuOpen(false);
                  }}
                >
                  <span>🚪</span> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}