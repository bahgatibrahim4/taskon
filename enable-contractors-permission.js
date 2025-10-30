const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB';
const DB_NAME = 'taskon';

async function enableContractorsPermission() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Get all users
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 Found ${users.length} users`);
    
    // Add contractors permission to all users
    for (const user of users) {
      const currentPermissions = user.permissions || [];
      
      if (!currentPermissions.includes('contractors')) {
        currentPermissions.push('contractors');
        
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { permissions: currentPermissions } }
        );
        
        console.log(`✅ Added 'contractors' permission to user: ${user.username} (${currentPermissions.length} total permissions)`);
      } else {
        console.log(`⏭️  User ${user.username} already has 'contractors' permission`);
      }
    }
    
    console.log('✅ Contractors permission enabled for all users!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

enableContractorsPermission();
