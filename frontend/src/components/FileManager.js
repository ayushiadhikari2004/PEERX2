import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import './FileManager.css';
import GroupChat from './GroupChat';
import UploadDropzone from './ui/UploadDropzone';

const FileManager = ({ group, user, API, BASE_API, onBack, notify }) => {
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  
  // New folder
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  // File preview
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Share link
  const [shareFile, setShareFile] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharePassword, setSharePassword] = useState('');
  const [shareExpiry, setShareExpiry] = useState('24');
  const [shareMaxDownloads, setShareMaxDownloads] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);
  
  // Group members & roles
  const [showMembers, setShowMembers] = useState(false);
  const [members, setMembers] = useState([]);
  
  // Show chat - open by default when navigating from Chat page
  const [showChat, setShowChat] = useState(() => {
    const shouldOpen = sessionStorage.getItem('peerx_open_chat');
    if (shouldOpen) {
      sessionStorage.removeItem('peerx_open_chat');
      return true;
    }
    return false;
  });

  // Watch for sessionStorage navigation events when group context changes
  useEffect(() => {
    const shouldOpen = sessionStorage.getItem('peerx_open_chat');
    if (shouldOpen) {
      sessionStorage.removeItem('peerx_open_chat');
      setShowChat(true);
    }
  }, [group]);

  // WebSocket connection
  const socketRef = useRef(null);

  // ===== P2P WebRTC state =====
  const [p2pRoomId, setP2pRoomId] = useState('');
  const [p2pStatus, setP2pStatus] = useState('Disconnected');
  const [p2pLog, setP2pLog] = useState([]);
  const [p2pSendProgress, setP2pSendProgress] = useState({ pct: 0, text: '0%', details: '' });
  const [p2pRecvProgress, setP2pRecvProgress] = useState({ pct: 0, text: '0%', details: '' });
  const [p2pReceivingFileName, setP2pReceivingFileName] = useState('');
  const [p2pDownloadUrl, setP2pDownloadUrl] = useState(null);

  const pcRef = useRef(null);
  const dataChannelRef = useRef(null);
  const isPoliteRef = useRef(false);

  const CHUNK_SIZE = 256 * 1024;
  const MAX_BUFFERED_AMOUNT = 16 * 1024 * 1024;
  const CHUNK_ACK_TIMEOUT_MS = 8000;
  const MAX_CHUNK_RETRIES = 5;

  const sendStateRef = useRef({
    file: null,
    offset: 0,
    totalChunks: 0,
    sentChunks: 0,
    inFlightChunkIndex: null,
    inFlightChunkData: null,
    retries: 0,
    ackTimer: null,
  });

  const recvStateRef = useRef({
    meta: null,
    receivedChunks: 0,
    chunks: [],
  });

  useEffect(() => {
    if (group) {
      fetchFolders();
      fetchFiles();
    }
  }, [group, currentFolder]);

  // Poll for file updates more frequently (every 2 seconds) to catch files from other PCs
  // This is needed because each PC has its own backend, so WebSocket events don't cross boundaries
  useEffect(() => {
    if (!group) return;

    console.log('🔄 Starting file polling for group:', group.id || group._id);
    
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for file updates...');
      fetchFiles();
    }, 2000); // Poll every 2 seconds

    // Also refresh when the tab becomes visible (user switches back to the tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Tab became visible, refreshing files...');
        fetchFiles();
        fetchFolders();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Refresh on window focus
    const handleFocus = () => {
      console.log('🎯 Window focused, refreshing files...');
      fetchFiles();
      fetchFolders();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      console.log('🛑 Stopping file polling');
      clearInterval(pollInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // Note: fetchFiles and fetchFolders are not in deps because they use latest state from closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, currentFolder]);

  // WebSocket connection and event listeners
  useEffect(() => {
    if (!group || !user) return;

    // Get the WebSocket URL (same host as API but without /api)
    let wsUrl = BASE_API.replace(/\/api\/?$/, '');
    // If BASE_API doesn't have /api, use it as is
    if (wsUrl === BASE_API && !BASE_API.endsWith('/api')) {
      wsUrl = BASE_API;
    }
    // Ensure we have a valid URL
    if (!wsUrl.startsWith('http')) {
      // Fallback: construct from window location
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const hostname = window.location.hostname;
      wsUrl = `${protocol}//${hostname}:5000`;
    }
    
    console.log('🔌 Connecting to WebSocket:', wsUrl);
    
    // Connect to Socket.IO server
    const token = localStorage.getItem('token');
    socketRef.current = io(wsUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: token
      }
    });

    socketRef.current.on('connect', () => {
      console.log('✅ WebSocket connected:', socketRef.current.id);
      
      // Join the group room
      const groupId = group.id || group._id;
      const userId = user.id || user._id;
      
      socketRef.current.emit('join:group', { groupId, userId });
      console.log(`📡 Joined group room: group-${groupId}`);
    });

    socketRef.current.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
    });

    // Listen for file upload events
    socketRef.current.on('file:uploaded', (data) => {
      console.log('📁 File uploaded event received:', data);
      // Refresh the file list to show the new file
      fetchFiles();
      // Show notification if file was uploaded by another user
      if (data.uploader !== (user.id || user._id)) {
        notify(`New file uploaded: ${data.file?.originalName || 'Unknown'}`, 'success');
      }
    });

    // Listen for file deletion events
    socketRef.current.on('file:deleted', (data) => {
      console.log('🗑️ File deleted event received:', data);
      // Refresh the file list
      fetchFiles();
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        const groupId = group.id || group._id;
        socketRef.current.emit('leave:group', { groupId });
        socketRef.current.disconnect();
        console.log('🔌 WebSocket disconnected and cleaned up');
      }
    };
    // Note: fetchFiles is not in dependencies because it's recreated every render
    // and uses the latest group/currentFolder from closure. The WebSocket connection
    // is recreated when group/user changes, ensuring fresh closures.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group, user, BASE_API, notify]);

  // ===== Helpers for P2P UI =====
  const appendP2pLog = (msg) => {
    setP2pLog((prev) => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] ${msg}`,
    ].slice(-200));
  };

  const updateSendProgress = () => {
    const s = sendStateRef.current;
    if (!s.file) {
      setP2pSendProgress({ pct: 0, text: '0%', details: '' });
      return;
    }
    const pct = s.totalChunks ? Math.round((s.sentChunks / s.totalChunks) * 100) : 0;
    setP2pSendProgress({
      pct,
      text: `${pct}%`,
      details: `${s.sentChunks}/${s.totalChunks} chunks`,
    });
  };

  const updateRecvProgress = () => {
    const r = recvStateRef.current;
    if (!r.meta) {
      setP2pRecvProgress({ pct: 0, text: '0%', details: '' });
      return;
    }
    const pct = r.meta.totalChunks
      ? Math.round((r.receivedChunks / r.meta.totalChunks) * 100)
      : 0;
    setP2pRecvProgress({
      pct,
      text: `${pct}%`,
      details: `${r.receivedChunks}/${r.meta.totalChunks} chunks`,
    });
  };

  const resetP2pState = () => {
    sendStateRef.current = {
      file: null,
      offset: 0,
      totalChunks: 0,
      sentChunks: 0,
      inFlightChunkIndex: null,
      inFlightChunkData: null,
      retries: 0,
      ackTimer: null,
    };
    recvStateRef.current = {
      meta: null,
      receivedChunks: 0,
      chunks: [],
    };
    setP2pDownloadUrl(null);
    setP2pReceivingFileName('');
    updateSendProgress();
    updateRecvProgress();
  };

  // ===== WebRTC core =====
  const ensurePeerConnection = () => {
    if (pcRef.current) return pcRef.current;

    const config = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };
    const pc = new RTCPeerConnection(config);
    pcRef.current = pc;

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && p2pRoomId) {
        socketRef.current.emit('p2p:signal', {
          roomId: p2pRoomId,
          data: { type: 'ice-candidate', candidate: event.candidate },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'connected') {
        setP2pStatus('Connected');
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        setP2pStatus('Disconnected');
      }
    };

    pc.ondatachannel = (event) => {
      appendP2pLog('DataChannel received from remote.');
      setupDataChannel(event.channel);
    };

    return pc;
  };

  const setupDataChannel = (channel) => {
    dataChannelRef.current = channel;
    channel.binaryType = 'arraybuffer';

    channel.onopen = () => {
      appendP2pLog('DataChannel open.');
      setP2pStatus('Connected');
    };

    channel.onclose = () => {
      appendP2pLog('DataChannel closed.');
      setP2pStatus('Disconnected');
    };

    channel.onerror = (err) => {
      appendP2pLog(`DataChannel error: ${err.message || err.toString()}`);
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        handleControlMessage(event.data);
      } else {
        handleBinaryChunk(event.data);
      }
    };

    channel.bufferedAmountLowThreshold = MAX_BUFFERED_AMOUNT / 2;
    channel.onbufferedamountlow = () => {
      const s = sendStateRef.current;
      if (s.file && s.inFlightChunkIndex === null) {
        sendNextChunk();
      }
    };
  };

  const makeOffer = async () => {
    const pc = ensurePeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    if (socketRef.current && p2pRoomId) {
      socketRef.current.emit('p2p:signal', {
        roomId: p2pRoomId,
        data: { type: 'offer', sdp: offer },
      });
      appendP2pLog('Sent offer.');
    }
  };

  const handleSignalingData = async (data) => {
    const pc = ensurePeerConnection();
    if (data.type === 'offer') {
      appendP2pLog('Received offer.');
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      if (socketRef.current && p2pRoomId) {
        socketRef.current.emit('p2p:signal', {
          roomId: p2pRoomId,
          data: { type: 'answer', sdp: answer },
        });
        appendP2pLog('Sent answer.');
      }
    } else if (data.type === 'answer') {
      appendP2pLog('Received answer.');
      await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    } else if (data.type === 'ice-candidate') {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (e) {
        console.error('Error adding ICE candidate', e);
      }
    }
  };

  // ===== Control message protocol (JSON over DataChannel) =====
  const sendControlMessage = (obj) => {
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== 'open') return;
    channel.send(JSON.stringify(obj));
  };

  const handleControlMessage = (jsonStr) => {
    let msg;
    try {
      msg = JSON.parse(jsonStr);
    } catch {
      return;
    }

    switch (msg.type) {
      case 'file-meta': {
        const meta = {
          name: msg.name,
          size: msg.size,
          chunkSize: msg.chunkSize,
          totalChunks: msg.totalChunks,
        };
        recvStateRef.current = {
          meta,
          receivedChunks: 0,
          chunks: new Array(meta.totalChunks),
        };
        setP2pReceivingFileName(meta.name);
        appendP2pLog(
          `Receiving file: ${meta.name} (${Math.round(meta.size / 1024)} KB)`
        );
        updateRecvProgress();
        setP2pDownloadUrl(null);
        break;
      }

      case 'chunk-ack':
        handleChunkAck(msg.index);
        break;

      case 'transfer-complete':
        appendP2pLog('Sender indicates transfer complete.');
        break;

      default:
        break;
    }
  };

  // ===== Sending side: chunking + retry =====
  const clearAckTimer = () => {
    const s = sendStateRef.current;
    if (s.ackTimer) {
      clearTimeout(s.ackTimer);
      s.ackTimer = null;
    }
  };

  const startAckTimer = (index) => {
    clearAckTimer();
    sendStateRef.current.ackTimer = setTimeout(() => {
      appendP2pLog(`ACK timeout for chunk ${index}, retrying...`);
      retryCurrentChunk();
    }, CHUNK_ACK_TIMEOUT_MS);
  };

  const retryCurrentChunk = () => {
    const s = sendStateRef.current;
    const channel = dataChannelRef.current;
    if (s.inFlightChunkIndex === null || !s.inFlightChunkData || !channel) return;
    if (channel.readyState !== 'open') return;

    if (s.retries >= MAX_CHUNK_RETRIES) {
      appendP2pLog(
        `Chunk ${s.inFlightChunkIndex} failed after ${MAX_CHUNK_RETRIES} retries. Aborting transfer.`
      );
      sendStateRef.current.file = null;
      return;
    }

    if (channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      setTimeout(retryCurrentChunk, 1000);
      return;
    }

    s.retries += 1;
    appendP2pLog(
      `Resending chunk ${s.inFlightChunkIndex} (attempt ${s.retries}).`
    );
    try {
      channel.send(s.inFlightChunkData);
    } catch (e) {
      appendP2pLog(
        `Retry send error for chunk ${s.inFlightChunkIndex}: ${
          e.message || e.toString()
        }`
      );
      setTimeout(retryCurrentChunk, 2000);
      return;
    }
    startAckTimer(s.inFlightChunkIndex);
  };

  const handleChunkAck = (index) => {
    const s = sendStateRef.current;
    if (s.inFlightChunkIndex === null || index !== s.inFlightChunkIndex) return;

    clearAckTimer();
    s.sentChunks += 1;
    s.inFlightChunkIndex = null;
    s.inFlightChunkData = null;
    s.retries = 0;
    updateSendProgress();

    if (s.sentChunks >= s.totalChunks) {
      appendP2pLog('File transfer completed on sender side.');
      sendStateRef.current.file = null;
      return;
    }

    sendNextChunk();
  };

  const sendNextChunk = () => {
    const s = sendStateRef.current;
    const channel = dataChannelRef.current;
    if (!s.file || s.inFlightChunkIndex !== null || !channel) return;
    if (channel.readyState !== 'open') return;

    if (channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
      appendP2pLog('Backpressure: delaying send until bufferedAmount is lower.');
      return;
    }

    if (s.offset >= s.file.size) {
      appendP2pLog('All chunks queued / sent. Waiting for final acks.');
      sendControlMessage({ type: 'transfer-complete' });
      return;
    }

    const index = s.sentChunks;
    const slice = s.file.slice(s.offset, s.offset + CHUNK_SIZE);
    const reader = new FileReader();

    reader.onerror = (err) => {
      appendP2pLog(`FileReader error: ${err?.message || 'read error'}`);
    };

    reader.onload = () => {
      const arrayBuffer = reader.result;
      try {
        channel.send(arrayBuffer);
      } catch (e) {
        appendP2pLog(
          `Send error for chunk ${index}: ${e.message || e.toString()}`
        );
        sendStateRef.current.inFlightChunkIndex = index;
        sendStateRef.current.inFlightChunkData = arrayBuffer;
        sendStateRef.current.retries = 0;
        startAckTimer(index);
        return;
      }

      sendStateRef.current.inFlightChunkIndex = index;
      sendStateRef.current.inFlightChunkData = arrayBuffer;
      sendStateRef.current.retries = 0;
      startAckTimer(index);
      sendStateRef.current.offset += slice.size;
      appendP2pLog(
        `Chunk ${index + 1}/${s.totalChunks} sent (${Math.round(
          slice.size / 1024
        )} KB).`
      );
    };

    reader.readAsArrayBuffer(slice);
  };

  const startFileTransferP2p = (file) => {
    if (!file) {
      notify('Select a file to send over P2P', 'error');
      return;
    }
    const channel = dataChannelRef.current;
    if (!channel || channel.readyState !== 'open') {
      notify('P2P DataChannel is not open yet', 'error');
      return;
    }

    resetP2pState();
    sendStateRef.current.file = file;
    sendStateRef.current.offset = 0;
    sendStateRef.current.totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    sendStateRef.current.sentChunks = 0;
    updateSendProgress();

    sendControlMessage({
      type: 'file-meta',
      name: file.name,
      size: file.size,
      chunkSize: CHUNK_SIZE,
      totalChunks: sendStateRef.current.totalChunks,
    });

    appendP2pLog(
      `Starting transfer: ${file.name}, ${Math.round(
        file.size / 1024
      )} KB in ${sendStateRef.current.totalChunks} chunks.`
    );

    sendNextChunk();
  };

  // ===== Receiving side: binary chunks & reconstruction =====
  const handleBinaryChunk = (arrayBuffer) => {
    const r = recvStateRef.current;
    if (!r.meta) {
      appendP2pLog('Received binary chunk before metadata; ignoring.');
      return;
    }

    const index = r.receivedChunks;
    r.chunks[index] = arrayBuffer;
    r.receivedChunks += 1;
    updateRecvProgress();

    sendControlMessage({ type: 'chunk-ack', index });

    appendP2pLog(
      `Received chunk ${index + 1}/${r.meta.totalChunks} (${Math.round(
        arrayBuffer.byteLength / 1024
      )} KB).`
    );

    if (r.receivedChunks === r.meta.totalChunks) {
      appendP2pLog('All chunks received, reconstructing file.');
      const blob = new Blob(r.chunks, { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      setP2pDownloadUrl(url);
    }
  };

  // ===== P2P room join / signaling wiring =====
  const joinP2pRoom = () => {
    if (!socketRef.current) {
      notify('Socket not connected yet', 'error');
      return;
    }
    const room = p2pRoomId || group.inviteCode || group.id;
    setP2pRoomId(room);
    socketRef.current.emit('p2p:join-room', room);
    appendP2pLog(`Joined P2P room: ${room}`);
  };

  // Attach P2P-related Socket.IO listeners once socket exists
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleRoomInfo = ({ numClients }) => {
      appendP2pLog(`P2P room has ${numClients} client(s).`);
      isPoliteRef.current = numClients > 1;
    };

    const handleReady = () => {
      appendP2pLog('P2P room ready for negotiation.');
      const pc = ensurePeerConnection();
      if (!isPoliteRef.current) {
        const channel = pc.createDataChannel('fileData', { ordered: true });
        setupDataChannel(channel);
        makeOffer();
      }
    };

    const handleSignal = async ({ data }) => {
      await handleSignalingData(data);
    };

    socket.on('p2p:room-info', handleRoomInfo);
    socket.on('p2p:ready', handleReady);
    socket.on('p2p:signal', handleSignal);

    return () => {
      socket.off('p2p:room-info', handleRoomInfo);
      socket.off('p2p:ready', handleReady);
      socket.off('p2p:signal', handleSignal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  const fetchFolders = async () => {
    try {
      const res = await API.get(`/folders/group/${group.id}`, {
        params: { parentId: currentFolder?.id || '' }
      });
      setFolders(res.data);
    } catch (err) {
      console.error('Fetch folders error:', err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await API.get(`/files/group/${group.id}`, {
        params: { folderId: currentFolder?._id || '' }
      });
      setFiles(res.data);
    } catch (err) {
      console.error('Fetch files error:', err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await API.get(`/groups/${group.id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error('Fetch members error:', err);
    }
  };

  const createFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    
    setLoading(true);
    try {
      await API.post('/folders/create', {
        name: newFolderName,
        parentId: currentFolder?._id || null,
        groupId: group.id
      });
      setNewFolderName('');
      setShowNewFolder(false);
      notify('Folder created!');
      fetchFolders();
    } catch (err) {
      notify('Failed to create folder', 'error');
    }
    setLoading(false);
  };

  const deleteFolder = async (folderId, folderName) => {
    if (!window.confirm(`Delete folder "${folderName}" and all its contents?`)) return;
    
    setLoading(true);
    try {
      await API.delete(`/folders/${folderId}`);
      notify('Folder deleted');
      fetchFolders();
    } catch (err) {
      notify('Failed to delete folder', 'error');
    }
    setLoading(false);
  };

  const uploadFileToFolder = async (e, filesToUpload) => {
    e.preventDefault();
    if (!filesToUpload || filesToUpload.length === 0) return notify('Select a file', 'error');

    setLoading(true);
    let successCount = 0;

    for (const currentFile of filesToUpload) {
      const formData = new FormData();
      formData.append('file', currentFile);
      formData.append('groupId', group.id);
      formData.append('folderId', currentFolder?._id || '');
      formData.append('tags', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)));

      try {
        await API.post('/files/upload', formData);
        successCount++;
      } catch (err) {
        notify(err.response?.data?.error || `Failed to upload ${currentFile.name}`, 'error');
      }
    }

    if (successCount > 0) {
      notify(`Successfully uploaded ${successCount} file(s)!`);
      setUploadFile(null);
      setTags('');
      fetchFiles();
    }
    setLoading(false);
  };

  const downloadFile = async (id, name) => {
    try {
      const res = await API.get(`/files/download/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      notify('Downloaded!');
    } catch (err) {
      notify('Download failed', 'error');
    }
  };

  const deleteFile = async (id) => {
    if (!window.confirm('Delete this file?')) return;

    try {
      await API.delete(`/files/${id}`);
      notify('File deleted');
      fetchFiles();
    } catch (err) {
      notify('Delete failed', 'error');
    }
  };

  const searchFiles = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const res = await API.get('/files/search', {
        params: { query, groupId: group.id }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchFiles(query);
  };

  const openPreview = async (file) => {
    setPreviewFile(file);
    setShowPreview(true);
  };

  const createShareLink = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post(`/files/${shareFile._id}/share`, {
        password: sharePassword || undefined,
        expiresIn: parseInt(shareExpiry),
        maxDownloads: shareMaxDownloads ? parseInt(shareMaxDownloads) : undefined
      });
      
      setGeneratedLink(res.data);
      notify('Share link created!');
    } catch (err) {
      notify('Failed to create share link', 'error');
    }
    setLoading(false);
  };

  const updateMemberRole = async (userId, newRole) => {
    setLoading(true);
    try {
      await API.patch(`/groups/${group.id}/members/${userId}/role`, { role: newRole });
      notify('Role updated!');
      fetchMembers();
    } catch (err) {
      notify('Failed to update role', 'error');
    }
    setLoading(false);
  };

  const removeMember = async (userId, username) => {
    if (!window.confirm(`Remove ${username} from group?`)) return;
    
    setLoading(true);
    try {
      await API.delete(`/groups/${group.id}/members/${userId}`);
      notify('Member removed');
      fetchMembers();
    } catch (err) {
      notify('Failed to remove member', 'error');
    }
    setLoading(false);
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    const gb = bytes / (1024 * 1024 * 1024);
    
    if (gb >= 1) return `${gb.toFixed(2)} GB`;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const formatDate = (d) => new Date(d).toLocaleString();

  const isNetworkShare = group.name === '__NETWORK_SHARE__' || group.inviteCode === 'NETWORK';
  const canModerate = ['admin', 'moderator'].includes(group.role);
  const isAdmin = group.role === 'admin' || group.isCreator;

  return (
    <div className="file-manager">
      <div className="file-manager-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <div className="file-manager-title">
          <h2>{isNetworkShare ? '🌐 Network Share' : `📁 ${group.name}`}</h2>
          <p className="muted">
            🔒 End-to-end encrypted • {group.memberCount} members • Role: {group.role}
          </p>
        </div>
        <div className="file-manager-actions">
          <button 
            onClick={() => {
              fetchFiles();
              fetchFolders();
              notify('Refreshed!', 'success');
            }} 
            className="btn-secondary"
            title="Refresh file list"
          >
            🔄 Refresh
          </button>
          <button onClick={() => setShowMembers(true)} className="btn-secondary">
            👥 Members
          </button>
          <button onClick={() => setShowChat(!showChat)} className="btn-primary">
            💬 {showChat ? 'Hide Chat' : 'Show Chat'}
          </button>
        </div>
      </div>

      <div className="file-manager-body">
        <div className={`file-manager-main ${showChat ? 'with-chat' : ''}`}>
          {/* Breadcrumb */}
          <div className="folder-breadcrumb">
            <button onClick={() => setCurrentFolder(null)} className="breadcrumb-btn">
              🏠 Root
            </button>
            {currentFolder && (
              <>
                <span> / </span>
                <span className="breadcrumb-current">{currentFolder.name}</span>
              </>
            )}
          </div>

          {/* Search */}
          <div className="search-bar">
            <input
              type="text"
              placeholder="🔍 Search files by name, content, or tags..."
              value={searchQuery}
              onChange={handleSearch}
              className="search-input"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSearchResults([]); }} className="clear-search">
                ✕
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results ({searchResults.length})</h3>
              <div className="files-grid">
                {searchResults.map(file => (
                  <div key={file._id} className="file-card">
                    <div className="file-icon">📄</div>
                    <div className="file-name">{file.originalName}</div>
                    <div className="file-meta">
                      {formatSize(file.size)} • {file.owner?.username}
                    </div>
                    <div className="file-actions">
                      {file.hasPreview && (
                        <button onClick={() => openPreview(file)} className="btn-icon">👁️</button>
                      )}
                      <button onClick={() => downloadFile(file._id, file.originalName)} className="btn-icon">
                        ⬇️
                      </button>
                      <button onClick={() => { setShareFile(file); setShowShareModal(true); }} className="btn-icon">
                        🔗
                      </button>
                      {(file.owner?._id === user.id || canModerate) && (
                        <button onClick={() => deleteFile(file._id)} className="btn-icon danger">🗑️</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Section */}
          {!searchQuery && (
            <div className="upload-section">
              <UploadDropzone
                onUpload={uploadFileToFolder}
                tags={tags}
                setTags={setTags}
                loading={loading}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={() => setShowNewFolder(true)} className="btn-secondary">
                  📁 New Folder
                </button>
              </div>
            </div>
          )}

          {/* P2P Section (Network Share only) */}
          {isNetworkShare && (
            <div className="p2p-section card">
              <h3>🔀 Peer-to-Peer Transfer (WebRTC)</h3>
              <p className="muted">
                Connect two browsers in the same Network Share and transfer files directly
                using WebRTC data channels (no server-side file forwarding).
              </p>

              <div className="p2p-row">
                <div className="p2p-field">
                  <label>Room ID</label>
                  <input
                    type="text"
                    value={p2pRoomId || group.inviteCode || group.id}
                    onChange={(e) => setP2pRoomId(e.target.value)}
                    placeholder="Shared room ID"
                  />
                </div>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={joinP2pRoom}
                >
                  Join P2P Room
                </button>
                <span className="p2p-status">Status: {p2pStatus}</span>
              </div>

              <div className="p2p-row">
                <div className="p2p-field">
                  <label>Select file to send (P2P)</label>
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        startFileTransferP2p(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="p2p-progress">
                <div className="p2p-progress-block">
                  <strong>Send progress</strong>
                  <div className="p2p-progress-bar">
                    <div
                      className="p2p-progress-inner"
                      style={{ width: `${p2pSendProgress.pct}%` }}
                    />
                  </div>
                  <div className="p2p-progress-label">
                    <span>{p2pSendProgress.text}</span>
                    <span>{p2pSendProgress.details}</span>
                  </div>
                </div>

                <div className="p2p-progress-block">
                  <strong>Receive progress</strong>
                  <div className="p2p-progress-bar">
                    <div
                      className="p2p-progress-inner"
                      style={{ width: `${p2pRecvProgress.pct}%` }}
                    />
                  </div>
                  <div className="p2p-progress-label">
                    <span>{p2pRecvProgress.text}</span>
                    <span>{p2pRecvProgress.details}</span>
                  </div>
                  {p2pReceivingFileName && (
                    <div className="p2p-file-name">
                      Receiving: <strong>{p2pReceivingFileName}</strong>
                    </div>
                  )}
                  {p2pDownloadUrl && (
                    <div className="p2p-download">
                      <a href={p2pDownloadUrl} download={p2pReceivingFileName || 'file'}>
                        ⬇️ Download received file
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="p2p-log">
                <strong>Transfer log</strong>
                <div className="p2p-log-box">
                  {p2pLog.map((line, idx) => (
                    <div key={idx} className="p2p-log-line">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Folders */}
          {!searchQuery && folders.length > 0 && (
            <div className="folders-section">
              <h3>📁 Folders</h3>
              <div className="folders-grid">
                {folders.map(folder => (
                  <div key={folder._id} className="folder-card" onClick={() => setCurrentFolder(folder)}>
                    <div className="folder-icon">📁</div>
                    <div className="folder-name">{folder.name}</div>
                    <div className="folder-meta">{formatDate(folder.createdAt)}</div>
                    {(folder.owner === user.id || canModerate) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFolder(folder._id, folder.name);
                        }}
                        className="folder-delete"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files */}
          {!searchQuery && (
            <div className="files-section">
              <h3>📄 Files</h3>
              {files.length === 0 ? (
                <p className="empty">No files in this folder.</p>
              ) : (
                <div className="files-grid">
                  {files.map(file => (
                    <div key={file._id} className="file-card">
                      <div className="file-icon">
                        {file.mimeType?.startsWith('image/') ? '🖼️' :
                         file.mimeType?.startsWith('video/') ? '🎥' :
                         file.mimeType?.startsWith('audio/') ? '🎵' :
                         file.mimeType?.includes('pdf') ? '📕' :
                         file.mimeType?.includes('word') ? '📘' : '📄'}
                      </div>
                      <div className="file-name">{file.originalName}</div>
                      <div className="file-meta">
                        {formatSize(file.size)} • {file.owner?.username}<br />
                        {formatDate(file.uploadedAt)}
                      </div>
                      {file.tags && file.tags.length > 0 && (
                        <div className="file-tags">
                          {file.tags.map((tag, idx) => (
                            <span key={idx} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="file-actions">
                        {file.hasPreview && (
                          <button onClick={() => openPreview(file)} className="btn-icon" title="Preview">
                            👁️
                          </button>
                        )}
                        <button onClick={() => downloadFile(file._id, file.originalName)} className="btn-icon" title="Download">
                          ⬇️
                        </button>
                        <button onClick={() => { setShareFile(file); setShowShareModal(true); }} className="btn-icon" title="Share">
                          🔗
                        </button>
                        {(file.owner?._id === user.id || canModerate) && (
                          <button onClick={() => deleteFile(file._id)} className="btn-icon danger" title="Delete">
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="chat-sidebar">
            <GroupChat group={group} user={user} API_BASE={BASE_API} />
          </div>
        )}
      </div>

      {/* New Folder Modal */}
      {showNewFolder && (
        <div className="modal-overlay" onClick={() => setShowNewFolder(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>📁 New Folder</h3>
            <form onSubmit={createFolder}>
              <input
                type="text"
                placeholder="Folder name"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                autoFocus
                required
              />
              <div className="modal-actions">
                <button type="submit" disabled={loading} className="btn-primary">Create</button>
                <button type="button" onClick={() => setShowNewFolder(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {showPreview && previewFile && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div className="modal-content preview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>👁️ File Preview</h3>
            <p className="muted">{previewFile.originalName}</p>
            {previewFile.hasPreview ? (
              <img
                src={`${BASE_API}/files/${previewFile._id}/preview`}
                alt={previewFile.originalName}
                className="preview-image"
              />
            ) : (
              <p className="muted">No preview available for this file type.</p>
            )}
            <div className="modal-actions">
              <button onClick={() => downloadFile(previewFile._id, previewFile.originalName)} className="btn-primary">
                Download
              </button>
              <button onClick={() => setShowPreview(false)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Link Modal */}
      {showShareModal && shareFile && (
        <div className="modal-overlay" onClick={() => { setShowShareModal(false); setGeneratedLink(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>🔗 Share File</h3>
            <p className="muted">{shareFile.originalName}</p>
            
            {!generatedLink ? (
              <form onSubmit={createShareLink}>
                <div className="form-group">
                  <label>🔒 Password (optional)</label>
                  <input
                    type="password"
                    placeholder="Leave empty for no password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label>⏰ Expires in (hours)</label>
                  <select value={shareExpiry} onChange={(e) => setShareExpiry(e.target.value)}>
                    <option value="1">1 hour</option>
                    <option value="6">6 hours</option>
                    <option value="24">24 hours</option>
                    <option value="168">7 days</option>
                    <option value="720">30 days</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>📊 Max downloads (optional)</label>
                  <input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={shareMaxDownloads}
                    onChange={(e) => setShareMaxDownloads(e.target.value)}
                    min="1"
                  />
                </div>
                
                <div className="modal-actions">
                  <button type="submit" disabled={loading} className="btn-primary">
                    Generate Link
                  </button>
                  <button type="button" onClick={() => { setShowShareModal(false); setGeneratedLink(null); }} className="btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="share-link-result">
                <div className="share-link-box">
                  <code>{generatedLink.url}</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink.url);
                      notify('Link copied!');
                    }}
                    className="copy-btn"
                  >
                    📋 Copy
                  </button>
                </div>
                <p className="muted">
                  {generatedLink.expiresAt && `Expires: ${formatDate(generatedLink.expiresAt)}`}
                  {generatedLink.maxDownloads && ` • Max downloads: ${generatedLink.maxDownloads}`}
                </p>
                <button onClick={() => { setShowShareModal(false); setGeneratedLink(null); }} className="btn-primary">
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembers && (
        <div className="modal-overlay" onClick={() => setShowMembers(false)}>
          <div className="modal-content members-modal" onClick={(e) => e.stopPropagation()}>
            <h3>👥 Group Members</h3>
            <button onClick={fetchMembers} className="refresh-btn">🔄 Refresh</button>
            
            <div className="members-list">
              {members.map(member => (
                <div key={member.userId._id} className="member-item">
                  <div className="member-info">
                    <strong>{member.userId.username}</strong>
                    <small className="muted">{member.userId.email}</small>
                  </div>
                  
                  <div className="member-role">
                    {isAdmin && member.userId._id !== group.creator?._id ? (
                      <select
                        value={member.role}
                        onChange={(e) => updateMemberRole(member.userId._id, e.target.value)}
                        className="role-select"
                      >
                        <option value="member">Member</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span className={`role-badge role-${member.role}`}>
                        {member.role}
                        {member.userId._id === group.creator?._id && ' 👑'}
                      </span>
                    )}
                  </div>
                  
                  {isAdmin && member.userId._id !== user.id && member.userId._id !== group.creator?._id && (
                    <button
                      onClick={() => removeMember(member.userId._id, member.userId.username)}
                      className="btn-danger-small"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button onClick={() => setShowMembers(false)} className="btn-secondary">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
