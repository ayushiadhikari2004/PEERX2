# 🚀 Quick Start Guide - PersonalSpace Enhanced

## Prerequisites
- Node.js v14+
- MongoDB v6.0+ (running)
- npm or yarn

## Installation & Setup

### 1. Install Backend Dependencies
```powershell
cd "c:\Users\shail\Desktop\FY projects\project\backend"
npm install
```

### 2. Install Frontend Dependencies
```powershell
cd "c:\Users\shail\Desktop\FY projects\project\frontend"
npm install
```

### 3. Configure Environment
Create `.env` in backend folder (if not exists):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/personalspace
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=524288000
ENCRYPTION_ALGORITHM=aes-256-gcm
ENABLE_PEER_DISCOVERY=true
PEER_PORT=5001
NODE_ENV=development
```

### 4. Start MongoDB
```powershell
# Make sure MongoDB is running
mongod
```

### 5. Start Backend
```powershell
cd backend
node server.js
```

You should see:
```
✅ MongoDB Connected
🔍 Peer discovery active on UDP port 5001
============================================================

🚀 Local:    http://localhost:5000
🚀 Network:  http://192.168.x.x:5000
💬 WebSocket: Enabled for group chat
============================================================
```

### 6. Start Frontend (New Terminal)
```powershell
cd frontend
npm start
```

Frontend opens at `http://localhost:3000`

## 🎯 Testing New Features

### Test Folder Support
1. Create/join a group
2. Click "📁 New Folder"
3. Upload files to folder
4. Navigate folders via breadcrumb

### Test Encrypted Sharing
1. Open any file
2. Click 🔗 share button
3. Set password (optional) and expiry
4. Copy link
5. Open in incognito to test public access

### Test Full-Text Search
1. Upload PDF or Word document
2. Use search bar in group
3. Search by filename or document content
4. See instant results

### Test File Preview
1. Upload an image file
2. Click 👁️ preview icon
3. View in modal
4. Download from preview

### Test Group Roles
1. Create a group (you're admin)
2. Invite another user
3. Click "👥 Members"
4. Change member roles
5. Test permissions

### Test Group Chat
1. Open any group
2. Click "💬 Show Chat"
3. Send messages
4. Messages are encrypted end-to-end
5. Test with multiple users

### Test Multi-Network
1. Run on multiple devices (same WiFi)
2. Check "💻 Peers" page
3. Peers auto-discover
4. Connect and share via Network Share group

## 🔧 Troubleshooting

### Backend won't start
- Check MongoDB is running: `mongod`
- Check port 5000 is not in use
- Verify all npm packages installed

### Frontend can't connect
- Check backend is running on port 5000
- Check CORS settings allow your IP
- Open browser console for errors

### Peer discovery not working
- Ensure all devices on same WiFi network
- Check firewall allows UDP port 5001
- Check Windows Defender/Firewall settings

### WebSocket connection failed
- Backend must be running
- Check port 5000 is accessible
- Browser console will show connection errors

### File upload fails
- Check storage quota not exceeded
- Verify user is group member
- Check file size under 500MB limit

## 📊 Feature Checklist

✅ Folder creation and navigation  
✅ File upload to folders  
✅ Full-text search (PDF, Word, text)  
✅ Image file preview  
✅ Encrypted share links  
✅ Password-protected sharing  
✅ Group roles (Admin/Mod/Member)  
✅ Real-time group chat  
✅ Multi-network peer discovery  
✅ Member management UI  

## 🎨 UI Overview

### Dashboard
- Storage usage bar
- Quick stats (groups, files, peers)
- Quick action buttons

### Groups Page
- Create group form
- Join group with code
- List all groups with roles
- Network Share banner

### File Manager (Group View)
- Folder breadcrumb navigation
- Search bar (live search)
- Upload section
- Folder grid
- File grid with preview/share/download
- Group chat sidebar (toggle)
- Members modal with role management

### Peers Page
- Auto-discovered devices
- Connect to peers
- Open peer frontend
- Network status

## 🔐 Security Notes

1. All files encrypted with AES-256-GCM
2. Chat messages encrypted with AES-256-CBC
3. Share links use secure random tokens
4. Passwords hashed with bcrypt
5. JWT authentication for API
6. Role-based access control

## 📱 Accessing from Other Devices

1. Find your IP address:
```powershell
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.105)
```

2. On other devices, open:
```
http://YOUR_IP:3000
```

3. Backend auto-discovered via UDP broadcast

## 🆘 Need Help?

Check:
- Browser console (F12) for frontend errors
- Terminal logs for backend errors
- MongoDB connection status
- Network connectivity
- Firewall/antivirus settings

---

**You're all set! Enjoy your enhanced experience!** 🎉
