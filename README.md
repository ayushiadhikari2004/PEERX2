# 🚀 PeerX

> A secure, peer-to-peer file sharing platform with end-to-end encryption for local networks.

PeerX is a peer-to-peer file sharing platform that enables secure file sharing across devices on the same network. By leveraging WebRTC data channels, PeerX bypasses traditional server bottlenecks to transfer files directly between devices—meaning transfers are incredibly fast and your files never sit on a central server.

---

## ✨ Key Features

- ⚡️ **WebRTC Direct P2P File Sharing** - Files are sent directly between browsers bypassing the server.
- 📦 **Automated Chunking & Backpressure** - Large files are actively sliced into 16KB chunks to prevent memory leaks and ensure stable browser transmission.
- 📁 **Multi-File Batch Uploads** - Select and send multiple files sequentially using a robust, built-in queue system.
- 🔒 **End-to-End Encryption** - Secure transfers running natively in the browser.
- 🌐 **Automatic Peer Discovery** - Devices on the same WiFi network are discovered automatically via Socket.IO signaling.
- 👥 **Private Groups & Network Share** - Create secure hubs for selective sharing or broadcast to everyone on the network.
- 📊 **Real-time Transfer History** - Live visual progress bars and persistent logs for all sent and received files.
- 🎨 **Modern Glassmorphism UI** - Clean, responsive interface with beautiful dynamic React experiences.

---

## 🏗️ Architecture

PeerX combines a traditional server for user management and peer discovery with WebRTC for the heavy lifting of raw file transfers.

```text
       [React Frontend] <=====> [React Frontend]
        (Sender Peer)   WebRTC   (Receiver Peer)
         |     \        Direct        /      |
         |      \----| DataChannel |-----/       |
         |                                   |
         |----- (Socket.IO Signaling) -------|
                         |
             [Node.js / Express Server]
             (Authentication & Peer Discovery)
                         |
                     [MongoDB]
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v14 or higher)
- **MongoDB** (v6.0 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ayushiadhikari2004/PeerX.git
   cd PeerX
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend && npm install

   # Install frontend dependencies
   cd ../frontend && npm install
   cd ..
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in the `backend/` folder and assign your own `JWT_SECRET`.

4. **Start MongoDB**
   *(Ensure the `mongod` service is running in your OS)*

5. **Start the backend server & frontend client**
   ```bash
   # Terminal 1
   cd backend && node server.js

   # Terminal 2
   cd frontend && npm start
   ```

6. **Access PeerX**
   Local: `http://localhost:3000`

---

## 🌐 Testing on Multiple Devices (Local Network)

To truly experience WebRTC peer-to-peer transfers, test it across two devices (e.g., your laptop and your phone) connected to the same Wi-Fi router.

1. Find your hosting computer's Local IP address (e.g., `192.168.1.105`).
2. Update your `.env` file in `backend/` to allow CORS from your IP:
   ```env
   FRONTEND_URL=http://localhost:3000,http://192.168.1.105:3000
   ```
3. Update `.env` in `frontend/` (create if it doesn't exist) so the phone knows where the server is:
   ```env
   REACT_APP_API_URL=http://192.168.1.105:5000/api
   REACT_APP_SIGNALING_URL=http://192.168.1.105:5000
   ```
4. On your second device, open a browser and go to `http://192.168.1.105:3000`. You will both appear in the "Peers" tab!

---

## 🔧 Configuration (backend/.env)

| Variable              | Description                        | Default                      |
|-----------------------|------------------------------------|------------------------------|
| PORT                  | Backend server port                | 5000                         |
| MONGODB_URI           | MongoDB connection string          | mongodb://localhost:27017/peex |
| JWT_SECRET            | Secret key for JWT signing         | your-jwt-secret-here         |
| FRONTEND_URL          | Allowed frontend origins           | http://localhost:3000        |
| MAX_FILE_SIZE         | Max file upload size (bytes)       | 524288000                    |

---

## 👤 Author

**Ayushi Adhikari**
- GitHub: [@ayushiadhikari2004](https://github.com/ayushiadhikari2004)

---
<div align="center">
  <i>Empowering local networks with fast, direct, and private file sharing.</i>
</div>