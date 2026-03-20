import React from 'react';
import './ChatPage.css';

const ChatPage = ({ groups, selectGroup, setView }) => {
  const chatGroups = groups?.filter(
    g => g.name !== '__NETWORK_SHARE__' && g.inviteCode !== 'NETWORK'
  ) || [];

  const openChat = (group) => {
    sessionStorage.setItem('peerx_open_chat', '1');
    selectGroup(group);
    setView('file_manager');
  };

  return (
    <div className="chat-page fade-in">
      <header className="chat-page-header">
        <h1>Group Chat</h1>
        <p>Select a group to open its chat and share files.</p>
      </header>

      <div className="chat-groups-list">
        {chatGroups.length > 0 ? (
          chatGroups.map((group) => (
            <div
              key={group.id || group._id}
              className="chat-group-card clay-inset"
              onClick={() => openChat(group)}
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
    </div>
  );
};

export default ChatPage;
