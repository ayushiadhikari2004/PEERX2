import React from 'react';
import './DashboardPage.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
};

const DashboardPage = ({
  user,
  stats,
  peers,
  files,
  activeTransfers,
  setView,
  formatSize,
  connectToPeer,
}) => {
  const displayPeers = peers?.length > 0
    ? peers.slice(0, 5).map((p, i) => ({
        name: p.peerName || p.username || p.name || `Peer ${i + 1}`,
        device: p.device || p.peerName || p.username || `Device ${i + 1}`,
        ...p,
      }))
    : [];

  const peersCount = peers?.length ?? 0;
  const firstName = user?.username?.split(' ')[0] || user?.username || 'User';
  const greeting = `${getGreeting()}, ${firstName}! 👋`;

  const storageUsed = formatSize(stats?.storageUsed ?? 0);
  const storageLimit = formatSize(stats?.storageLimit ?? 5e9);

  const recentFiles = (files || [])
    .slice(0, 5)
    .map(f => ({
      name: f.name,
      meta: formatTimeAgo(f.receivedAt),
      pill: 'downloaded',
    }));

  const hasActiveTransfers = Array.isArray(activeTransfers) && activeTransfers.length > 0;

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-main">
        <header className="page-header">
          <h1 className="page-greeting">{greeting}</h1>
          <p className="page-subtext">Here's what's happening with your P2P network today.</p>
        </header>

        <div className="stats-grid">
          <div className="stat-card clay-inset stat-groups">
            <div className="stat-icon stat-icon-orange">👥</div>
            <div className="stat-info">
              <span className="stat-number">{stats?.groupCount ?? 0}</span>
              <span className="stat-label">Groups</span>
            </div>
          </div>
          <div className="stat-card clay-inset stat-files">
            <div className="stat-icon stat-icon-blue">📄</div>
            <div className="stat-info">
              <span className="stat-number">{stats?.fileCount ?? 0}</span>
              <span className="stat-label">Files uploaded</span>
            </div>
          </div>
          <div className="stat-card clay-inset stat-peers">
            <div className="stat-icon stat-icon-green">💻</div>
            <div className="stat-info">
              <span className="stat-number">{stats?.peersOnline ?? peersCount ?? 0}</span>
              <span className="stat-label">Peers online</span>
            </div>
          </div>
          <div className="stat-card clay-inset stat-storage">
            <div className="stat-icon stat-icon-beige">💾</div>
            <div className="stat-info">
              <span className="stat-number">{storageUsed}</span>
              <span className="stat-label">Used of {storageLimit}</span>
            </div>
          </div>
        </div>

        <div className="quick-actions-row">
          <button className="quick-action-card clay-inset" onClick={() => setView("upload")}>
            <span className="qa-icon qa-pastel-blue">📤</span>
            <span>Upload Files</span>
          </button>
          <button className="quick-action-card clay-inset" onClick={() => setView("groups")}>
            <span className="qa-icon qa-pastel-green">➕</span>
            <span>Create Group</span>
          </button>
          <button className="quick-action-card clay-inset" onClick={() => setView("peers")}>
            <span className="qa-icon qa-pastel-orange">👥</span>
            <span>View Peers</span>
          </button>
          <button className="quick-action-card clay-inset" onClick={() => setView("transfers")}>
            <span className="qa-icon qa-pastel-beige">📋</span>
            <span>Transfer History</span>
          </button>
        </div>

        <section className="recent-activity-section">
          <h3>Recent Activity</h3>
          <div className="activity-list clay-inset">
            {recentFiles.length > 0 ? (
              recentFiles.map((a, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-doc-icon">📄</span>
                  <div className="activity-info">
                    <span className="activity-name">{a.name}</span>
                    <span className="activity-meta">{a.meta}</span>
                  </div>
                  <span className={`activity-pill ${a.pill}`}>
                    {a.pill.charAt(0).toUpperCase() + a.pill.slice(1)}
                  </span>
                </div>
              ))
            ) : (
              <div className="activity-empty">No shared files yet</div>
            )}
          </div>
        </section>
      </div>

      <aside className="dashboard-widgets">
        <div className="widget clay-inset peers-widget">
          <div className="widget-header">
            <div className="peers-status">
              <span className={`status-dot ${peersCount > 0 ? 'green' : ''}`}></span>
              <span>Peers Online</span>
            </div>
            <span className="peers-count">{peersCount} connected</span>
            <button className="add-peer-btn clay-pressed" onClick={() => setView("peers")}>Add Peer</button>
          </div>
          <div className="peers-list">
            {displayPeers.length > 0 ? (
              displayPeers.map((p, i) => (
                <div key={i} className="peer-profile">
                  <div className="peer-avatar">{p.name.charAt(0)}</div>
                  <div className="peer-details">
                    <span className="peer-device">{p.device}</span>
                    <span className="peer-online">Online</span>
                  </div>
                  <button
                    className="connect-btn clay-inset"
                    onClick={() => p.socketId && connectToPeer?.(p.socketId, p.name)}
                  >
                    Connect
                  </button>
                </div>
              ))
            ) : (
              <div className="peers-empty">No peers connected</div>
            )}
          </div>
        </div>

        <div className="widget clay-inset upload-widget">
          <h4>Upload Files to Peer</h4>
          <p className="widget-subtext">Send files directly to connected peers.</p>
          {hasActiveTransfers && (
            <div className="transfer-list">
              {activeTransfers.map((t, i) => (
                <div key={i} className="transfer-item">
                  <span className="transfer-name">{t.fileName || 'File'}</span>
                  <div className="progress-bar clay-inset">
                    <div
                      className="progress-fill"
                      style={{ width: `${t.progress ?? 0}%` }}
                    />
                  </div>
                  <span className="transfer-status">
                    {t.status || 'Transferring'} - {t.progress ?? 0}%
                  </span>
                </div>
              ))}
            </div>
          )}
          <label className="encryption-toggle">
            <input type="checkbox" defaultChecked />
            <span>Enable end-to-end encryption</span>
          </label>
          <button className="send-secure-btn clay-pressed" onClick={() => setView("upload")}>Send Files Securely</button>
        </div>
      </aside>
    </div>
  );
};

export default DashboardPage;
