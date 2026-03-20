// Quick script to view database contents
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/decloud';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  const db = mongoose.connection.db;
  console.log('\n📊 Database:', db.databaseName);
  console.log('='.repeat(60));
  
  // View Users
  console.log('\n👤 USERS:');
  const users = await db.collection('users').find({}).toArray();
  users.forEach(u => {
    console.log(`   - ${u.username} (${u.email}) - ID: ${u._id}`);
  });
  
  // View Groups
  console.log('\n👥 GROUPS:');
  const groups = await db.collection('groups').find({}).toArray();
  groups.forEach(g => {
    console.log(`   - ${g.name}`);
    console.log(`     Code: ${g.inviteCode}`);
    console.log(`     Members: ${g.members?.length || 0}`);
    console.log(`     ID: ${g._id}`);
  });
  
  // View Files
  console.log('\n📁 FILES:');
  const files = await db.collection('files').find({}).limit(10).toArray();
  files.forEach(f => {
    console.log(`   - ${f.originalName} (${(f.size / 1024 / 1024).toFixed(2)} MB)`);
    console.log(`     Group: ${f.group}, Owner: ${f.owner}`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ View complete!');
  process.exit(0);
}).catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

