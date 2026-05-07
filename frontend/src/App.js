import React, { useState, useEffect } from "react";
import axios from "axios";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

// Layout & Pages
import Layout from "./components/layout/Layout";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import FilesPage from "./pages/FilesPage";
import PeersPage from "./pages/PeersPage";
import UploadPage from "./pages/UploadPage";
import TransfersPage from "./pages/TransfersPage";
import GroupsPage from "./pages/GroupsPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import FileManager from "./components/FileManager";
import WebRTCHandler from "./utils/webrtc";

import "./App.css";

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getAPIBaseURL = () => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol || 'http:';
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return `${protocol}//${hostname}:5000/api`;
};

const BASE_API = getAPIBaseURL();
axios.defaults.baseURL = BASE_API;
const API = axios.create({ baseURL: BASE_API, withCredentials: true });

function AppContent() {
  const { toggleTheme, isDark, setTheme } = useTheme();
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  
  // Navigation State
  const [view, setView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Form states
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  
  // Global App States
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Data states
  const [files, setFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('peerx_files');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeTransfers, setActiveTransfers] = useState(() => {
    try {
      const saved = localStorage.getItem('peerx_transfers');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('peerx_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('peerx_transfers', JSON.stringify(activeTransfers));
  }, [activeTransfers]);
  const [peers, setPeers] = useState([]);
  const [stats, setStats] = useState({ fileCount: 0, peersOnline: 0 });

  // Groups State
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupPrivacy, setGroupPrivacy] = useState(true);
  const [inviteCode, setInviteCode] = useState("");


  // WebRTC
  const [webrtc, setWebrtc] = useState(null);
  const [webrtcPeers, setWebrtcPeers] = useState([]);
  const [incomingOffers, setIncomingOffers] = useState([]);
  const [p2pMessages, setP2pMessages] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  /** ======================
   *  INIT & REAL-TIME
   ======================== */
  useEffect(() => {
    if (token) {
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        API.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      }
    }
  }, [token]);

  // Keep dashboard metrics updated
  useEffect(() => {
    if (!user) return;
    fetchStats();
    const interval = setInterval(() => fetchStats(), 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchPeers = async () => {
    try {
      const res = await API.get("/peers");
      setPeers(res.data);
    } catch (err) {}
  };

  const fetchStats = async () => {
    try {
      const res = await API.get("/stats/dashboard");
      setStats({
        fileCount: res.data.fileCount || 0,
        groupCount: res.data.groupCount || 0,
        peersOnline: res.data.peersOnline || 0,
        storageUsed: res.data.storageUsed || 0,
        storageLimit: res.data.storageLimit || 5e9,
      });
    } catch (err) {
      console.error("Fetch stats failed:", err?.response?.data || err?.message || err);
    }
  };

  // Persist received P2P files into backend (so they appear in FileManager lists).
  const importReceivedFileToNetworkShare = async ({ name, blob, mimeType }) => {
    try {
      // Ensure the user is in the network share group.
      await API.post("/groups/join-network").catch(() => {});

      const gRes = await API.get("/groups");
      const networkGroup = gRes.data.find(
        (g) => g.name === "__NETWORK_SHARE__" || g.inviteCode === "NETWORK"
      );

      if (!networkGroup) {
        notify("Network Share group not found. Cannot persist received file.", "error");
        return;
      }

      const groupId = networkGroup.id || networkGroup._id;
      const folderId = "";

      const fileObj = new File([blob], name, { type: mimeType || "application/octet-stream" });
      const formData = new FormData();
      formData.append("file", fileObj);
      formData.append("groupId", groupId);
      formData.append("folderId", folderId);
      formData.append("tags", JSON.stringify(["p2p", "received"]));

      await API.post("/files/upload", formData);
      notify(`Received via P2P: ${name}`, "success");
    } catch (err) {
      console.error("Failed to persist received P2P file:", err);
      notify("P2P received, but saving to your library failed.", "error");
    }
  };

  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchPeers();
      }, 5000);
      
      // Initialize WebRTC on the main server port
      // WebRTC signaling must be shared by both peers (same Socket.IO server),
      // while API calls can still point to the receiver's own backend for storage.
      const signalingUrl = process.env.REACT_APP_SIGNALING_URL || getAPIBaseURL().replace('/api', '');
      const handler = new WebRTCHandler(
        signalingUrl,
        user.id || user._id,
        user.username,
        (peersList) => {
          setWebrtcPeers(peersList);
        },
        (progressUpdate) => {
          setActiveTransfers(prev => {
            const index = prev.findIndex(t => t.id === progressUpdate.id);
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = progressUpdate;
              // Add to local files if complete (both uploads and downloads)
              if (progressUpdate.status === 'complete') {
                  setFiles(curr => {
                      const exists = curr.find(f => f.name === progressUpdate.fileName && f.type === progressUpdate.type);
                      if (!exists) {
                          return [{
                              id: Date.now() + Math.random(),
                              name: progressUpdate.fileName,
                              size: progressUpdate.totalSize,
                              type: progressUpdate.type,
                              receivedAt: new Date().toISOString()
                          }, ...curr];
                      }
                      return curr;
                  });
              }
              return updated;
            } else {
              // Now we safely keep complete instances that finish immediately
              return [...prev, progressUpdate];
            }
          });
        },
        (offerInfo, acceptCallback, rejectCallback) => {
           setIncomingOffers(prev => {
             // Avoid duplicate prompts
             if (prev.find(o => o.id === offerInfo.fileId)) return prev;
             return [...prev, {
               id: offerInfo.fileId,
               senderId: offerInfo.senderId,
               fileName: offerInfo.name,
               fileSize: offerInfo.size,
               accept: acceptCallback,
               reject: rejectCallback
             }];
           });
        },
        importReceivedFileToNetworkShare
      );
      handler.onChatMessage = (msgData) => {
        console.log("📥 P2P Message Received in App.js:", msgData);
        setP2pMessages((prev) => {
          return [...prev, msgData];
        });
        
        // Always show the popup notification
        notify(`New message from ${msgData.senderName}: ${msgData.message}`, "success");
        
        // Increment unread count (we can't easily check `view` here due to closure, 
        // so we'll just increment it and clear it when the user opens the Chat view)
        setUnreadChatCount(prev => prev + 1);
      };

      handler.socket.on('file:uploaded', (data) => {
        if (data.uploader !== (user.id || user._id)) {
          notify(`New file uploaded to group: ${data.file?.originalName || 'Unknown'}`, "success");
        }
      });

      setWebrtc(handler);

      return () => {
        clearInterval(interval);
        handler.disconnect();
      };
    }
  }, [user]); // user is enough dependency here since we just want it once on login


  const clearTransfer = (id) => setActiveTransfers(curr => curr.filter(t => t.id !== id));

  /** ======================
   *  NOTIFICATIONS
   ======================== */
  const notify = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  /** ======================
   *  API FETCHERS
   ======================== */
  const fetchUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data);
      if (res.data.theme) setTheme(res.data.theme);

      // Ensure user is part of the automatic Network Share group
      await API.post("/groups/join-network").catch(() => {});
      
      const pRes = await API.get("/peers");
      setPeers(pRes.data);

      const gRes = await API.get("/groups");
      setGroups(gRes.data);
      await fetchStats();
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) logout();
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await API.get("/groups");
      setGroups(res.data);
    } catch (err) {}
  };

  const createGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/groups/create", { name: groupName, description: groupDesc, isPrivate: groupPrivacy });
      setGroupName(""); setGroupDesc(""); setGroupPrivacy(true);
      notify("Group created!");
      fetchGroups();
    } catch (err) {
      notify(err.response?.data?.error || "Error", "error");
    }
    setLoading(false);
  };

  const joinGroup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/groups/join", { inviteCode });
      setInviteCode("");
      notify("Joined group!");
      fetchGroups();
    } catch (err) {
      notify(err.response?.data?.error || "Error", "error");
    }
    setLoading(false);
  };

  const deleteGroup = async (id, name) => {
    if (!window.confirm(`Delete group ${name}?`)) return;
    setLoading(true);
    try {
      await API.delete(`/groups/${id}`);
      notify("Group deleted");
      fetchGroups();
      if (selectedGroup?.id === id || selectedGroup?._id === id) {
          setView("groups");
          setSelectedGroup(null);
      }
    } catch (err) {
      notify("Delete failed", "error");
    }
    setLoading(false);
  };

  const leaveGroup = async (id, name) => {
    if (!window.confirm(`Leave group ${name}?`)) return;
    setLoading(true);
    try {
      await API.post(`/groups/${id}/leave`);
      notify("Left group");
      fetchGroups();
      if (selectedGroup?.id === id || selectedGroup?._id === id) {
          setView("groups");
          setSelectedGroup(null);
      }
    } catch (err) {
      notify("Leave failed", "error");
    }
    setLoading(false);
  };

  /** ======================
   *  AUTH COMMANDS
   ======================== */
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const data = isLogin
        ? { email: loginEmail, password: loginPassword }
        : { username: regUsername, email: regEmail, password: regPassword };

      const res = await API.post(endpoint, data);

      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      setUser(res.data.user);
      setView("dashboard");
      notify("Welcome!");
    } catch (err) {
      notify(err.response?.data?.error || "Authentication failed", "error");
    }
    setLoading(false);
  };

  const handleThemeToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    toggleTheme();
    if (user) {
      API.patch("/auth/settings", { theme: newTheme }).catch(() => {});
    }
  };

  const logout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    delete API.defaults.headers.common["Authorization"];
    notify("Logged out");
  };

  /** ======================
   *  PEER LOGIC
   ======================== */
  const connectToPeer = async (peerId, peerName) => {
    setLoading(true);
    try {
      if (webrtc) {
        const targetWrtpPeer = webrtcPeers.find(p => p.peerId === peerId || p.socketId === peerId || p.peerName === peerName);
        if (targetWrtpPeer) {
          await webrtc.connectToPeer(targetWrtpPeer.socketId);
          notify(`Connected WebRTC Data channel to ${peerName}!`);
        } else {
           notify("Peer not found in active WebRTC signaling.", "error");
        }
      } else {
          notify("WebRTC not initialized.", "error");
      }
    } catch (err) {
      console.error(err);
      notify("Failed to connect via WebRTC", "error");
    }
    setLoading(false);
  };

  const connectAndSendFile = async (peerId, peerName, file) => {
    setLoading(true);
    try {
      if (webrtc) {
        const targetWrtpPeer = webrtcPeers.find(p => p.peerId === peerId || p.socketId === peerId || p.peerName === peerName);
        if (targetWrtpPeer) {
          notify(`Connecting to ${peerName} to send file...`);
          await webrtc.connectToPeer(targetWrtpPeer.socketId);
          webrtc.sendFile(targetWrtpPeer.socketId, file);
          setView("transfers");
        } else {
          notify("Peer not found in active WebRTC signaling.", "error");
        }
      } else {
        notify("WebRTC not initialized.", "error");
      }
    } catch (err) {
      console.error(err);
      notify("Failed to initiate transfer", "error");
    }
    setLoading(false);
  };

  /** ======================
   *  TRANSFERS & FILES LOGIC
   ======================== */
  const deleteFile = async (id) => {
    if (!window.confirm("Delete this local file record?")) return;
    setFiles(curr => curr.filter(f => f.id !== id));
    notify("Local file record deleted");
  };

  /** ======================
   *  FORMATTERS
   ======================== */
  const formatSize = (bytes) => {
    if (!bytes) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(2)} KB`;
  };
  
  const formatDate = (d) => new Date(d).toLocaleString();


  /** ======================
   *  RENDER APP
   ======================== */
  if (!token || !user) {
    return (
      <AuthPage 
        isLogin={isLogin} setIsLogin={setIsLogin}
        loginEmail={loginEmail} setLoginEmail={setLoginEmail}
        loginPassword={loginPassword} setLoginPassword={setLoginPassword}
        regUsername={regUsername} setRegUsername={setRegUsername}
        regEmail={regEmail} setRegEmail={setRegEmail}
        regPassword={regPassword} setRegPassword={setRegPassword}
        handleAuth={handleAuth} loading={loading}
        notification={notification}
      />
    );
  }

  return (
    <Layout
      user={user}
      isDark={isDark}
      toggleTheme={handleThemeToggle}
      onLogout={logout}
      onProfileClick={() => setView("profile")}
      onSettingsClick={() => setView("settings")}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      view={view}
      setView={(v) => {
        setView(v);
        if (v === 'chat') setUnreadChatCount(0);
      }}
      groups={groups}
      peers={webrtcPeers.length > 0 ? webrtcPeers : peers}
      selectedGroup={selectedGroup}
      selectGroup={(g) => { setSelectedGroup(g); setView("file_manager"); }}
      activeTransfers={activeTransfers.length}
      unreadChatCount={unreadChatCount}
    >

      {view === "dashboard" && (
        <DashboardPage 
          user={user}
          stats={stats} 
          peers={webrtcPeers.length > 0 ? webrtcPeers : peers}
          groups={groups}
          files={files}
          activeTransfers={activeTransfers}
          setView={setView}
          selectGroup={(g) => { setSelectedGroup(g); setView("file_manager"); }}
          fetchStats={fetchStats}
          formatSize={formatSize}
          connectToPeer={connectToPeer}
        />
      )}

      {view === "files" && (
        <FilesPage
          files={files}
          deleteFile={deleteFile}
          formatSize={formatSize}
          formatDate={formatDate}
        />
      )}

      {view === "peers" && (
        <PeersPage
          peers={webrtcPeers.length > 0 ? webrtcPeers : peers} // prefer webrtc signalling server peers
          connectToPeer={connectToPeer}
          onSendFile={connectAndSendFile}
          loading={loading}
        />
      )}

      {view === "groups" && (
        <GroupsPage
          groups={groups}
          groupName={groupName}
          setGroupName={setGroupName}
          groupDesc={groupDesc}
          setGroupDesc={setGroupDesc}
          groupPrivacy={groupPrivacy}
          setGroupPrivacy={setGroupPrivacy}
          inviteCode={inviteCode}
          setInviteCode={setInviteCode}
          createGroup={createGroup}
          joinGroup={joinGroup}
          deleteGroup={deleteGroup}
          leaveGroup={leaveGroup}
          selectGroup={(g) => { setSelectedGroup(g); setView("file_manager"); }}
          loading={loading}
        />
      )}

      {view === "file_manager" && selectedGroup && (
        <FileManager
          group={selectedGroup}
          user={user}
          onBack={() => setView("groups")}
          webrtcPeers={webrtcPeers}
          webrtc={webrtc}
          API={API}
          BASE_API={BASE_API}
          notify={notify}
        />
      )}
      
      {view === "upload" && (
          <UploadPage 
            peers={webrtcPeers}
            webrtc={webrtc}
            notify={notify}
            setView={setView}
          />
      )}

      {view === "transfers" && (
          <TransfersPage activeTransfers={activeTransfers} clearTransfer={clearTransfer} />
      )}

      {view === "chat" && (
        <ChatPage
          groups={groups}
          peers={webrtcPeers.length > 0 ? webrtcPeers : peers}
          user={user}
          webrtc={webrtc}
          p2pMessages={p2pMessages}
          setP2pMessages={setP2pMessages}
          selectGroup={(g) => { setSelectedGroup(g); setView("file_manager"); }}
          setView={setView}
        />
      )}

      {view === "profile" && (
        <ProfilePage
          user={user}
          stats={stats}
          formatSize={formatSize}
          toggleTheme={handleThemeToggle}
          isDark={isDark}
          onLogout={logout}
        />
      )}

      {/* Incoming File Offers */}
      <div className="incoming-offers-container" style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {incomingOffers.map(offer => {
            const senderName = webrtcPeers.find(p => p.socketId === offer.senderId)?.peerName || offer.senderId;
            const sizeMB = (offer.fileSize / (1024 * 1024)).toFixed(2);
            return (
              <div key={offer.id} className="offer-toast card fade-in" style={{ padding: '15px', borderLeft: '4px solid var(--primary-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                 <h4 style={{ margin: '0 0 5px 0' }}>Incoming File Transfer</h4>
                 <p style={{ margin: '0 0 5px 0' }}><strong>{senderName}</strong> wants to send you:</p>
                 <p className="offer-filename" style={{ margin: '0 0 10px 0', wordBreak: 'break-all' }}>{offer.fileName} <span className="muted">({sizeMB} MB)</span></p>
                 <div className="offer-actions" style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-primary" onClick={() => { offer.accept(); setIncomingOffers(prev => prev.filter(o => o.id !== offer.id)); }}>Accept</button>
                    <button className="btn-secondary" onClick={() => { offer.reject(); setIncomingOffers(prev => prev.filter(o => o.id !== offer.id)); }}>Decline</button>
                 </div>
              </div>
            );
        })}
      </div>

      {/* Global Notification */}
      {notification && (
        <div className={`notification ${notification.type}`}>
          {notification.msg}
        </div>
      )}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
