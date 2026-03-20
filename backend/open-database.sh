#!/bin/bash
# Script to open MongoDB database

echo "🔍 Opening MongoDB Database..."
echo ""

# Get database name from .env or use default
if [ -f .env ]; then
    DB_NAME=$(grep MONGODB_URI .env | cut -d'/' -f4 | cut -d' ' -f1)
else
    DB_NAME="decloud"
fi

echo "📊 Database: $DB_NAME"
echo "🔗 Connection: mongodb://localhost:27017/$DB_NAME"
echo ""

# Check if mongosh (new) or mongo (old) is available
if command -v mongosh &> /dev/null; then
    echo "✅ Using mongosh (MongoDB Shell 6.0+)"
    echo ""
    echo "Connecting to database..."
    mongosh "mongodb://localhost:27017/$DB_NAME"
elif command -v mongo &> /dev/null; then
    echo "✅ Using mongo (MongoDB Shell)"
    echo ""
    echo "Connecting to database..."
    mongo "$DB_NAME"
else
    echo "❌ MongoDB shell not found!"
    echo ""
    echo "💡 Options:"
    echo "   1. Install MongoDB Shell: https://www.mongodb.com/try/download/shell"
    echo "   2. Use MongoDB Compass (GUI): https://www.mongodb.com/products/compass"
    echo "   3. Connection string: mongodb://localhost:27017/$DB_NAME"
    exit 1
fi

