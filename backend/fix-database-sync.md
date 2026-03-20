# Database Sync Issue - Fix Guide

## Problem
The other PC's data is not showing up because it's using a **different database name**.

## Current Situation
- **This PC (Host)**: Using `personalspace` database
- **Other PC**: Probably using `decloud` database (the default)

## Solution: Make Both PCs Use the Same Database

### Step 1: Check Other PC's Database
On the other PC, run:
```bash
cd backend
node check-database.js
```

This will show what database it's using.

### Step 2: Update Other PC's .env File
On the other PC, edit `backend/.env` and set:
```env
MONGODB_URI=mongodb://localhost:27017/personalspace
```

**OR** if you want to use `decloud` instead, update THIS PC's `.env`:
```env
MONGODB_URI=mongodb://localhost:27017/decloud
```

### Step 3: Restart Backend on Both PCs
After changing the .env file, restart the backend server.

### Step 4: Verify
Run on both PCs:
```bash
cd backend
node check-database.js
```

Both should show the **same database name**.

## Important Notes

1. **Both PCs must use the SAME database name** to see each other's data
2. **Both PCs must connect to the SAME MongoDB instance** (same host/IP)
3. If MongoDB is on a different PC, use that PC's IP address:
   - `mongodb://192.168.X.X:27017/personalspace`

## Quick Fix Commands

### Option A: Use personalspace (current database)
On other PC:
```bash
cd backend
echo "MONGODB_URI=mongodb://localhost:27017/personalspace" > .env
```

### Option B: Use decloud (default)
On this PC:
```bash
cd backend
echo "MONGODB_URI=mongodb://localhost:27017/decloud" > .env
```

Then restart both backend servers.

