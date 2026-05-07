import React, { useState } from 'react';
import './ChatPage.css';
import PeerChat from '../components/PeerChat';

const ChatPage = ({ groups, peers, user, webrtc, p2pMessages, setP2pMessages, selectGroup, setView }) => {
  const [selectedPeerId, setSelectedPeerId] = useState(null);

  // Always find the freshest peer object from the network to avoid stale socket IDs
  const activePeer = selectedPeerId ? peers?.find(p => p.peerId === selectedPeerId || p.socketId === selectedPeerId) : null;

  if (activePeer) {
    return (
      <div className="chat-page fade-in" style={{ maxWidth: '100%' }}>
        <PeerChat 
          peer={activePeer} 
          user={user} 
          webrtc={webrtc} 
          p2pMessages={p2pMessages} 
          setP2pMessages={setP2pMessages} 
          onBack={() => setSelectedPeerId(null)} 
        />
      </div>
    );
  } else if (selectedPeerId) {
    // Peer disconnected
    return (
      <div className="chat-page fade-in" style={{ maxWidth: '100%' }}>
        <div className="chat-header">
           <button onClick={() => setSelectedPeerId(null)} className="btn-secondary" style={{ padding: '4px 8px' }}>← Back</button>
           <h3>Peer Disconnected</h3>
        </div>
      </div>
    );
  }

  const chatGroups = groups?.filter(
    g => g.name !== '__NETWORK_SHARE__' && g.inviteCode !== 'NETWORK'
  ) || [];

  const openGroupChat = (group) => {
    sessionStorage.setItem('peerx_open_chat', '1');
    selectGroup(group);
    setView('file_manager');
  };

  const openPeerChat = (peer) => {
    setSelectedPeerId(peer.peerId || peer.socketId);
  };

  return (
    <div className="chat-page fade-in">
      <header className="chat-page-header">
        <h1>Chat</h1>
        <p>Select a peer or a group to start chatting.</p>
      </header>

      <div className="chat-sections">
        <section className="chat-section">
          <h2>Peers Online ({peers?.length || 0})</h2>
          <div className="chat-groups-list">
            {peers?.length > 0 ? (
              peers.map((peer) => (
                <div
                  key={peer.peerId || peer.socketId}
                  className="chat-group-card clay-inset"
                  onClick={() => openPeerChat(peer)}
                >
                  <span className="chat-group-icon">👤</span>
                  <div className="chat-group-info">
                    <strong>{peer.peerName || peer.name}</strong>
                    <span className="chat-group-meta">Online now</span>
                  </div>
                  <button className="open-chat-btn clay-pressed">Chat</button>
                </div>
              ))
            ) : (
              <div className="chat-empty" style={{ padding: '2rem' }}>
                <p>No peers online in your network.</p>
              </div>
            )}
          </div>
        </section>

        <section className="chat-section">
          <h2>Your Groups</h2>
          <div className="chat-groups-list">
            {chatGroups.length > 0 ? (
              chatGroups.map((group) => (
                <div
                  key={group.id || group._id}
                  className="chat-group-card clay-inset"
                  onClick={() => openGroupChat(group)}
                >
                  <span className="chat-group-icon">💬</span>
                  <div className="chat-group-info">
                    <strong>{group.name}</strong>
                    <span className="chat-group-meta">
                      {group.memberCount ?? group.members?.length ?? 0} members
                    </span>
                  </div>
                  <button className="open-chat-btn clay-pressed">Open Chat</button>
                </div>
              ))
            ) : (
              <div className="chat-empty">
                <p>No groups yet. Create or join a group to start chatting.</p>
                <button className="btn-primary" onClick={() => setView('groups')}>
                  Go to Groups
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ChatPage;
