import React, { useState } from 'react';
import './GroupsPage.css';

const GroupsPage = ({
  groups,
  groupName,
  setGroupName,
  groupDesc,
  setGroupDesc,
  groupPrivacy,
  setGroupPrivacy,
  inviteCode,
  setInviteCode,
  createGroup,
  joinGroup,
  selectGroup,
  deleteGroup,
  leaveGroup,
  startEditGroup,
  loading
}) => {
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'create', 'join'

  return (
    <div className="groups-page fade-in">
      <div className="page-header">
        <h1 className="page-title">Groups</h1>
        <p className="muted">Manage your file sharing groups</p>
      </div>

      <div className="groups-tabs">
        <button 
          className={`group-tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          My Groups
        </button>
        <button 
          className={`group-tab ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create Group
        </button>
        <button 
          className={`group-tab ${activeTab === 'join' ? 'active' : ''}`}
          onClick={() => setActiveTab('join')}
        >
          Join via Code
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'list' && (
          <div className="groups-grid">
            {groups.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">👥</span>
                <h3>No Groups Yet</h3>
                <p>You haven't joined any groups yet. Create or join one to start sharing files.</p>
                <div className="empty-actions">
                  <button className="btn-primary" onClick={() => setActiveTab('create')}>Create Group</button>
                  <button className="btn-secondary" onClick={() => setActiveTab('join')}>Join Group</button>
                </div>
              </div>
            ) : (
              groups.map(group => (
                <div key={group.id} className="card group-card">
                  <div className="group-card-header">
                    <div className="group-icon">{group.name.charAt(0).toUpperCase()}</div>
                    <div className="group-title-area">
                      <h3 className="group-name">{group.name}</h3>
                      <span className={`privacy-badge ${group.isPrivate ? 'private' : 'public'}`}>
                        {group.isPrivate ? '🔒 Private' : '🌐 Public'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="group-desc">{group.description || 'No description provided.'}</p>
                  
                  <div className="group-meta">
                    <div className="meta-item">
                      <span className="meta-label">Code:</span>
                      <code className="invite-code">{group.inviteCode}</code>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Role:</span>
                      <span className="role-badge">{group.members?.find(m => m.user === group.owner)?.role || 'Member'}</span>
                    </div>
                  </div>

                  <div className="group-actions-footer">
                    <button 
                      className="group-action-btn primary"
                      onClick={() => selectGroup(group)}
                    >
                      <span>📁</span> Open
                    </button>
                    {group.owner ? ( // Just a placeholder logic for owner detection
                      <button 
                        className="group-action-btn default"
                        onClick={() => startEditGroup(group)}
                      >
                        <span>✏️</span> Edit
                      </button>
                    ) : null}
                    <button 
                      className="group-action-btn danger"
                      onClick={() => group.owner ? deleteGroup(group.id, group.name) : leaveGroup(group.id, group.name)}
                    >
                      {group.owner ? 'Trash' : 'Leave'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="card form-card">
            <h3>Create a New Group</h3>
            <p className="muted">Groups allow you to share files privately or publicly with a specific code.</p>
            <form onSubmit={createGroup} className="standard-form">
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  placeholder="e.g., Project Avalon"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  placeholder="What is this group for?"
                  value={groupDesc}
                  onChange={(e) => setGroupDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="privacy-toggle-box">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={groupPrivacy}
                    onChange={(e) => setGroupPrivacy(e.target.checked)}
                    className="toggle-checkbox"
                  />
                  <div className="toggle-text">
                    <strong>🔒 Private Group</strong>
                    <span className="muted">Only invited members can join with the code.</span>
                  </div>
                </label>
              </div>
              <button type="submit" className="btn-primary form-submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'join' && (
          <div className="card form-card">
            <h3>Join an Existing Group</h3>
            <p className="muted">Enter the invite code provided by the group owner.</p>
            <form onSubmit={joinGroup} className="standard-form">
              <div className="form-group">
                <label>Invite Code</label>
                <input
                  type="text"
                  placeholder="e.g., ABC123XYZ"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  style={{ textTransform: 'uppercase', letterSpacing: '2px', fontFamily: 'monospace' }}
                  required
                />
              </div>
              <button type="submit" className="btn-primary form-submit" disabled={loading}>
                {loading ? 'Joining...' : 'Join Group'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsPage;
