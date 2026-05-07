import React, { useState, useEffect, useRef } from 'react';
import './GroupChat.css'; // Reuse existing chat styles

const PeerChat = ({ peer, user, webrtc, p2pMessages, setP2pMessages, onBack }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Filter messages that belong to the conversation with this peer
  const conversationMessages = p2pMessages.filter(
    (msg) => msg.targetSocketId === peer.socketId || msg.senderSocketId === peer.socketId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !webrtc) return;

    // Send via signaling server
    webrtc.sendChatMessage(peer.socketId, newMessage.trim());

    // Optimistically add to local state
    setP2pMessages((prev) => [
      ...prev,
      {
        message: newMessage.trim(),
        senderSocketId: webrtc.socket?.id || user.id,
        targetSocketId: peer.socketId,
        senderName: user.username,
        timestamp: Date.now(),
        isOwn: true
      }
    ]);

    setNewMessage('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="group-chat peer-chat-container">
      <div className="chat-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={onBack} className="btn-secondary" style={{ padding: '4px 8px' }}>← Back</button>
        <div>
          <h3>💬 Chat with {peer.peerName || peer.name}</h3>
          <small className="status-online">● Online (P2P)</small>
        </div>
      </div>

      <div className="chat-messages">
        {conversationMessages.length === 0 ? (
          <div className="chat-empty">
            <p>No messages yet. Say hello to {peer.peerName || peer.name}!</p>
          </div>
        ) : (
          conversationMessages.map((msg, idx) => {
            const isOwn = msg.isOwn || msg.senderSocketId === (webrtc.socket?.id || user.id);
            return (
              <div
                key={idx}
                className={`chat-message ${isOwn ? 'own-message' : ''}`}
              >
                <div className="message-sender">{isOwn ? 'You' : msg.senderName}</div>
                <div className="message-content">{msg.message}</div>
                <div className="message-time">{formatTime(msg.timestamp)}</div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={!newMessage.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

export default PeerChat;
