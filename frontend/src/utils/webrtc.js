import { io } from 'socket.io-client';

const CHUNK_SIZE = 16384; // 16KB per chunk

class WebRTCHandler {
  constructor(
    signalingUrl,
    peerId,
    peerName,
    onPeersUpdate,
    onTransferProgress,
    onIncomingFileRequest,
    onFileReceived
  ) {
    this.socket = io(signalingUrl);
    this.peerId = peerId;
    this.peerName = peerName;
    this.onPeersUpdate = onPeersUpdate;
    this.onTransferProgress = onTransferProgress;
    this.onIncomingFileRequest = onIncomingFileRequest;
    this.onFileReceived = onFileReceived;
    
    // Map of SocketId -> RTCPeerConnection
    this.connections = new Map();
    // Map of SocketId -> RTCDataChannel
    this.dataChannels = new Map();

    // Map of transferId -> resolver(boolean)
    this.pendingFileResponses = new Map();
    // Map of targetSocketId -> promise chain (sequential file sending)
    this.outgoingQueues = new Map();

    this.setupSignaling();
  }

  setupSignaling() {
    this.socket.on('connect', () => {
      console.log('🔗 Connected to Signaling Server', this.socket.id);
      console.log('🔑 Emitting register:', { peerId: this.peerId, peerName: this.peerName });
      this.socket.emit('register', { peerId: this.peerId, peerName: this.peerName });
    });

    this.socket.on('peers-update', (peers) => {
      // Exclude ourselves
      const otherPeers = peers.filter(p => p.socketId !== this.socket.id);
      console.log('📡 peers-update received:', otherPeers);
      if (this.onPeersUpdate) this.onPeersUpdate(otherPeers);
    });

    this.socket.on('webrtc-offer', async ({ offer, senderSocketId, senderName }) => {
      console.log(`📥 Received offer from ${senderName} (${senderSocketId})`);
      const peerConnection = this.createPeerConnection(senderSocketId);
      
      // Handle receiving data channels
      peerConnection.ondatachannel = (event) => {
        const receiveChannel = event.channel;
        this.setupDataChannel(receiveChannel, senderSocketId, 'receiver');
      };

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      this.socket.emit('webrtc-answer', {
        answer,
        targetSocketId: senderSocketId
      });
    });

    this.socket.on('webrtc-answer', async ({ answer, senderSocketId }) => {
      console.log(`📥 Received answer from ${senderSocketId}`);
      const peerConnection = this.connections.get(senderSocketId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    this.socket.on('webrtc-ice-candidate', async ({ candidate, senderSocketId }) => {
      console.log(`❄️ Received ICE candidate from ${senderSocketId}`);
      const peerConnection = this.connections.get(senderSocketId);
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });

    this.socket.on('p2p-chat-message', (data) => {
      if (this.onChatMessage) {
        this.onChatMessage(data);
      }
    });
  }

  sendChatMessage(targetSocketId, message) {
    this.socket.emit('p2p-chat-message', { targetSocketId, message });
  }

  createPeerConnection(targetSocketId) {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
    };

    const peerConnection = new RTCPeerConnection(configuration);
    this.connections.set(targetSocketId, peerConnection);

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('webrtc-ice-candidate', {
          candidate: event.candidate,
          targetSocketId
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetSocketId}: ${peerConnection.connectionState}`);
      if (peerConnection.connectionState === 'disconnected' || peerConnection.connectionState === 'failed') {
        this.connections.delete(targetSocketId);
        this.dataChannels.delete(targetSocketId);
      }
    };

    return peerConnection;
  }

  setupDataChannel(channel, targetSocketId, role, onOpen) {
    this.dataChannels.set(targetSocketId, channel);

    let receiveBuffer = [];
    let receivedSize = 0;
    let expectedSize = 0;
    let expectedName = 'transfer_file';
    let startTime = 0;
    let lastProgressTime = 0;
    let totalChunks = 0;
    let receivedChunks = 0;

    // Receiver-side state: we only start collecting binary chunks after permission.
    let currentTransferId = null;
    let receiverAccepted = role === 'receiver' ? false : false;

    channel.onopen = () => {
      console.log(`📡 Data Channel Open (${role}) with ${targetSocketId}`);
      channel.binaryType = 'arraybuffer';
      if (typeof onOpen === 'function') onOpen();
    };

    channel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // Control messages (metadata + permission responses)
        try {
          const msg = JSON.parse(event.data);

          // Sender: wait for receiver permission
          if (msg.type === 'file-response') {
            const resolver = this.pendingFileResponses.get(msg.transferId);
            if (resolver) {
              this.pendingFileResponses.delete(msg.transferId);
              resolver(!!msg.accepted);
            }
            return;
          }

          // Receiver: file permission prompt on meta arrival
          if (msg.type === 'file-meta') {
            const transferId = msg.transferId;
            const name = msg.name;
            const size = msg.size;
            const mimeType = msg.mimeType || 'application/octet-stream';

            currentTransferId = transferId;
            receiverAccepted = false;

            expectedName = name;
            expectedSize = size;
            totalChunks = Math.ceil(expectedSize / CHUNK_SIZE);

            // Build accept/reject callbacks that the UI can call.
            const accept = () => {
              receiverAccepted = true;
              receiveBuffer = [];
              receivedSize = 0;
              receivedChunks = 0;
              startTime = Date.now();
              lastProgressTime = startTime;

              // Tell sender we accepted this file.
              sendJSON({ type: 'file-response', transferId, accepted: true });

              if (this.onTransferProgress) {
                this.onTransferProgress({
                  id: `${targetSocketId}_${transferId}_${expectedName}`,
                  fileName: expectedName,
                  progress: 0,
                  type: 'download',
                  status: 'metadata_received',
                  totalSize: expectedSize,
                  totalChunks,
                  processedChunks: 0,
                  speedBytesPerSec: 0,
                });
              }
            };

            const reject = () => {
              receiverAccepted = false;
              receiveBuffer = [];
              receivedSize = 0;
              receivedChunks = 0;

              sendJSON({ type: 'file-response', transferId, accepted: false });
            };

            const offerInfo = {
              fileId: transferId,
              senderId: targetSocketId, // sender socket id from receiver's perspective
              name,
              size,
              mimeType,
            };

            if (typeof this.onIncomingFileRequest === 'function') {
              this.onIncomingFileRequest(offerInfo, accept, reject);
            } else {
              // Fallback: auto-accept if no UI callback is provided.
              accept();
            }

            return;
          }
        } catch (e) {
          console.error('Error parsing DataChannel JSON:', e);
        }
      } else {
        // Binary chunk
        if (!receiverAccepted || currentTransferId === null) return;

        receiveBuffer.push(event.data);
        receivedSize += event.data.byteLength || event.data.size || 0;
        receivedChunks++;

        const now = Date.now();
        let speedBytesPerSec = 0;
        if (now - startTime > 0) {
          speedBytesPerSec = receivedSize / ((now - startTime) / 1000);
        }

        const progress = expectedSize > 0 ? Math.round((receivedSize / expectedSize) * 100) : 0;

        // Throttle UI updates slightly
        if (now - lastProgressTime > 100 || receivedSize === expectedSize) {
          lastProgressTime = now;
          if (this.onTransferProgress) {
            this.onTransferProgress({
              id: `${targetSocketId}_${currentTransferId}_${expectedName}`,
              fileName: expectedName,
              progress,
              type: 'download',
              status: receivedSize >= expectedSize ? 'complete' : 'receiving',
              receivedSize,
              totalSize: expectedSize,
              totalChunks,
              processedChunks: receivedChunks,
              speedBytesPerSec,
            });
          }
        }

        if (receivedSize >= expectedSize && expectedSize > 0) {
          console.log(`✅ File reception complete: ${expectedName}`);
          try {
            const blob = new Blob(receiveBuffer, { type: 'application/octet-stream' });

            // Allow app to persist into backend so it shows in receiver UI.
            if (typeof this.onFileReceived === 'function') {
              this.onFileReceived({
                name: expectedName,
                size: expectedSize,
                blob,
                mimeType: 'application/octet-stream',
              });
            }

            // Trigger download robustly (so user can access immediately)
            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = expectedName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
              document.body.removeChild(a);
              URL.revokeObjectURL(downloadUrl);
            }, 1000);
          } catch (e) {
            console.error('Download trigger failed:', e);
          }

          // Reset so receiver is ready for next transfer
          receiverAccepted = false;
          currentTransferId = null;
        }
      }
    };

    // Helper: send JSON reliably over the channel
    function sendJSON(payload) {
      try {
        if (channel.readyState === 'open') channel.send(JSON.stringify(payload));
      } catch (e) {
        console.error('sendJSON failed:', e);
      }
    }

    channel.onclose = () => {
      console.log(`📡 Data Channel Closed (${role}) with ${targetSocketId}`);
      this.dataChannels.delete(targetSocketId);
    };
  }

  async connectToPeer(targetSocketId) {
    if (this.connections.has(targetSocketId)) {
      console.log('Already connected or connecting to this peer.');
      return;
    }

    const peerConnection = this.createPeerConnection(targetSocketId);
    
    // As the caller, we create the data channel
    const dataChannel = peerConnection.createDataChannel('fileTransfer', {
      ordered: true // Reliable transfer
    });

    const openPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for DataChannel to open'));
      }, 15000);

      this.setupDataChannel(dataChannel, targetSocketId, 'sender', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    this.socket.emit('webrtc-offer', {
      offer,
      targetSocketId
    });

    return openPromise;
  }

  sendFile(targetSocketId, file) {
    const prev = this.outgoingQueues.get(targetSocketId) || Promise.resolve();
    const task = prev.then(() => this._sendFileInternal(targetSocketId, file));
    this.outgoingQueues.set(targetSocketId, task.catch(() => {}));
    return task;
  }

  async _sendFileInternal(targetSocketId, file) {
    const channel = this.dataChannels.get(targetSocketId);
    if (!channel || channel.readyState !== 'open') {
      throw new Error('Data channel is not open. Please connect first.');
    }

    const transferId =
      (typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

    // Ask receiver permission, then only start sending chunks after accepted.
    const accepted = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingFileResponses.delete(transferId);
        reject(new Error('Timed out waiting for receiver permission'));
      }, 30000);

      this.pendingFileResponses.set(transferId, (ok) => {
        clearTimeout(timeout);
        resolve(ok);
      });

      const meta = {
        type: 'file-meta',
        transferId,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
      };

      channel.send(JSON.stringify(meta));
    });

    if (!accepted) {
      if (this.onTransferProgress) {
        this.onTransferProgress({
          id: `${targetSocketId}_${transferId}_${file.name}`,
          fileName: file.name,
          progress: 0,
          type: 'upload',
          status: 'rejected',
          sentSize: 0,
          totalSize: file.size,
          totalChunks: Math.ceil(file.size / CHUNK_SIZE),
          processedChunks: 0,
          speedBytesPerSec: 0,
        });
      }
      return;
    }

    // Start chunk sending after permission.
    const fileReader = new FileReader();
    let offset = 0;
    let sentChunks = 0;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const startTime = Date.now();
    let lastProgressTime = startTime;

    const readSlice = (o) => {
      const slice = file.slice(o, o + CHUNK_SIZE);
      fileReader.readAsArrayBuffer(slice);
    };

    return await new Promise((resolve, reject) => {
      fileReader.onerror = (err) => reject(err);

      fileReader.onload = (e) => {
        try {
          channel.send(e.target.result);
        } catch (sendErr) {
          reject(sendErr);
          return;
        }

        offset += e.target.result.byteLength;
        sentChunks++;

        const now = Date.now();
        let speedBytesPerSec = 0;
        if (now - startTime > 0) {
          speedBytesPerSec = offset / ((now - startTime) / 1000);
        }

        const progress = Math.round((offset / file.size) * 100);
        if (now - lastProgressTime > 100 || offset >= file.size) {
          lastProgressTime = now;
          if (this.onTransferProgress) {
            this.onTransferProgress({
              id: `${targetSocketId}_${transferId}_${file.name}`,
              fileName: file.name,
              progress,
              type: 'upload',
              status: offset >= file.size ? 'complete' : 'sending',
              sentSize: offset,
              totalSize: file.size,
              totalChunks,
              processedChunks: sentChunks,
              speedBytesPerSec,
            });
          }
        }

        if (offset < file.size) {
          // Respect backpressure
          if (channel.bufferedAmount > channel.bufferedAmountLowThreshold) {
            channel.onbufferedamountlow = () => {
              channel.onbufferedamountlow = null;
              readSlice(offset);
            };
          } else {
            readSlice(offset);
          }
        } else {
          console.log(`✅ File sending complete: ${file.name}`);
          resolve();
        }
      };

      // Set a sensible low threshold for backpressure
      channel.bufferedAmountLowThreshold = CHUNK_SIZE * 4;
      readSlice(0);
    });
  }

  disconnect() {
    this.connections.forEach(pc => pc.close());
    this.connections.clear();
    this.dataChannels.clear();
    this.socket.disconnect();
  }
}

export default WebRTCHandler;
