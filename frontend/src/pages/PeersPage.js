import React from 'react';
import PeerCard from '../components/ui/PeerCard';
import './PeersPage.css';

const PeersPage = ({ peers, connectToPeer, loading }) => {
  return (
    <div className="peers-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Network Peers</h1>
        <p className="muted">Discover and connect to devices via the signaling server</p>
      </div>

      <div className="peers-grid">
        {peers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📡</span>
            <h3>No Peers Found</h3>
            <p>Scanning the signaling server... Make sure other devices are connected.</p>
          </div>
        ) : (
          peers.map(peer => (
            <PeerCard 
              key={peer.peerId || peer.socketId} 
              peer={{
                  id: peer.peerId || peer.socketId,
                  name: peer.peerName || peer.name || "Unknown Peer",
                  ip: peer.ip || "Direct Client",
                  isOnline: true
              }} 
              onConnect={() => connectToPeer(peer.peerId || peer.socketId, peer.peerName || peer.name)}
              isConnecting={loading}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default PeersPage;
