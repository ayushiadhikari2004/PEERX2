import React from 'react';
import './PeerCard.css';

const PeerCard = ({ peer, onConnect, isConnecting }) => {
  return (
    <div className="peer-card fade-in">
      <div className="peer-header">
        <div className="peer-avatar">
          {peer.name ? peer.name.charAt(0).toUpperCase() : '💻'}
        </div>
        <div className="peer-info">
          <h3 className="peer-name">{peer.name || 'Unknown Device'}</h3>
          <div className="peer-status-row">
            <span className={`status-dot ${peer.isOnline ? 'online' : 'offline'}`} />
            <span className="peer-status-text">
              {peer.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="peer-details">
        <div className="detail-row">
          <span className="detail-label">ID:</span>
          <span className="detail-value truncate" title={peer.peerId}>{peer.peerId}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">IP:</span>
          <span className="detail-value">{peer.ip || 'Unknown'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Last Seen:</span>
          <span className="detail-value">{new Date(peer.lastSeen).toLocaleTimeString()}</span>
        </div>
      </div>
      
      {peer.isOnline && onConnect && (
        <button 
          className="peer-connect-btn"
          onClick={() => onConnect(peer.peerId, peer.name)}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect'}
        </button>
      )}
    </div>
  );
};

export default PeerCard;
