// Script to check MongoDB database connection
require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 Checking Database Connection...\n');

// Get the connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decloud';

console.log('📊 Database Configuration:');
console.log('   MONGODB_URI:', MONGODB_URI);
console.log('   (from .env file or default)\n');

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    console.log('✅ MongoDB Connected Successfully!\n');
    
    const db = mongoose.connection.db;
    console.log('📊 Database Information:');
    console.log('   Database Name:', db.databaseName);
    console.log('   Host:', mongoose.connection.host);
    console.log('   Port:', mongoose.connection.port);
    console.log('   Connection State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    
    // List collections
    try {
      const collections = await db.listCollections().toArray();
      console.log('\n📁 Collections in Database:');
      if (collections.length === 0) {
        console.log('   (No collections found - database is empty)');
      } else {
        collections.forEach(col => {
          console.log(`   - ${col.name}`);
        });
      }
    } catch (err) {
      console.log('   (Could not list collections)');
    }
    
    // Count documents in key collections
    console.log('\n📈 Document Counts:');
    try {
      const users = await db.collection('users').countDocuments();
      const groups = await db.collection('groups').countDocuments();
      const files = await db.collection('files').countDocuments();
      console.log(`   Users: ${users}`);
      console.log(`   Groups: ${groups}`);
      console.log(`   Files: ${files}`);
    } catch (err) {
      console.log('   (Could not count documents)');
    }
    
    console.log('\n✅ Database check complete!');
    console.log('\n💡 To use this database on another PC:');
    console.log(`   Set MONGODB_URI="${MONGODB_URI}" in backend/.env`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed!\n');
    console.error('Error:', err.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure MongoDB is running');
    console.error('   2. Check if the connection string is correct');
    console.error('   3. Verify network/firewall settings');
    console.error('   4. Check MongoDB authentication credentials');
    process.exit(1);
  });

