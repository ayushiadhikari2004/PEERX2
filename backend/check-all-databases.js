// Check all databases on MongoDB to see if there are multiple databases
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decloud';

// Extract base URI (without database name)
const baseUri = MONGODB_URI.replace(/\/[^\/]+$/, '');

console.log('🔍 Checking all databases on MongoDB...\n');
console.log('📊 Base Connection:', baseUri);
console.log('');

mongoose
  .connect(baseUri + '/admin', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(async () => {
    const adminDb = mongoose.connection.db.admin();
    
    // List all databases
    const result = await adminDb.listDatabases();
    
    console.log('📁 All Databases Found:');
    console.log('='.repeat(60));
    
    for (const dbInfo of result.databases) {
      if (dbInfo.name !== 'admin' && dbInfo.name !== 'local' && dbInfo.name !== 'config') {
        console.log(`\n📊 Database: ${dbInfo.name}`);
        console.log(`   Size: ${(dbInfo.sizeOnDisk / 1024 / 1024).toFixed(2)} MB`);
        
        // Connect to this database and check collections
        const db = mongoose.connection.useDb(dbInfo.name);
        try {
          const collections = await db.listCollections().toArray();
          console.log(`   Collections: ${collections.length}`);
          
          // Count documents in key collections
          if (collections.some(c => c.name === 'users')) {
            const userCount = await db.collection('users').countDocuments();
            console.log(`   👤 Users: ${userCount}`);
          }
          if (collections.some(c => c.name === 'groups')) {
            const groupCount = await db.collection('groups').countDocuments();
            console.log(`   👥 Groups: ${groupCount}`);
          }
          if (collections.some(c => c.name === 'files')) {
            const fileCount = await db.collection('files').countDocuments();
            console.log(`   📁 Files: ${fileCount}`);
          }
        } catch (err) {
          console.log(`   (Could not access collections)`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 If you see multiple databases, the other PC might be using a different one!');
    console.log('💡 Make sure both PCs use the same MONGODB_URI in backend/.env');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });

