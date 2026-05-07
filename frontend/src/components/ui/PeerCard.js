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
          <span className="detail-label">Network:</span>
          <span className="detail-value badge-blue">WebRTC Direct</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Security:</span>
          <span className="detail-value badge-green">E2E Encrypted</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Protocol:</span>
          <span className="detail-value badge-purple">P2P Channel</span>
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
