const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = 5002;

// Keep track of connected peers
const peers = new Map();

io.on('connection', (socket) => {
  console.log(`📡 New signaling client connected: ${socket.id}`);

  // When a peer registers itself
  socket.on('register', (data) => {
    const { peerId, peerName } = data;
    peers.set(socket.id, { peerId, peerName, socketId: socket.id });
    console.log(`👤 Peer registered: ${peerName} (${peerId})`);
    
    // Broadcast updated peer list to everyone
    io.emit('peers-update', Array.from(peers.values()));
  });

  // WebRTC Signaling: Offer
  socket.on('webrtc-offer', (data) => {
    console.log(`📤 Sending offer from ${socket.id} to ${data.targetSocketId}`);
    socket.to(data.targetSocketId).emit('webrtc-offer', {
      offer: data.offer,
      senderSocketId: socket.id,
      senderName: peers.get(socket.id)?.peerName || 'Unknown Peer'
    });
  });

  // WebRTC Signaling: Answer
  socket.on('webrtc-answer', (data) => {
    console.log(`📥 Sending answer from ${socket.id} to ${data.targetSocketId}`);
    socket.to(data.targetSocketId).emit('webrtc-answer', {
      answer: data.answer,
      senderSocketId: socket.id
    });
  });

  // WebRTC Signaling: ICE Candidate
  socket.on('webrtc-ice-candidate', (data) => {
    console.log(`❄️ Sending ICE candidate from ${socket.id} to ${data.targetSocketId}`);
    socket.to(data.targetSocketId).emit('webrtc-ice-candidate', {
      candidate: data.candidate,
      senderSocketId: socket.id
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Signaling client disconnected: ${socket.id}`);
    peers.delete(socket.id);
    io.emit('peers-update', Array.from(peers.values()));
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`============================================================`);
  console.log(`🚀 WebRTC Signaling Server listening on port ${PORT}`);
  console.log(`============================================================`);
});
