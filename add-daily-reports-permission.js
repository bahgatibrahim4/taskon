// سكربت لإضافة صلاحية التقارير اليومية لجميع المستخدمين
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://suhailardens:PASSsaudi1993@suhaijldb.ndw48.mongodb.net/SuhailJardens';

async function addDailyReportsPermission() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('SuhailJardens');
    const usersCollection = db.collection('users');
    
    // إضافة صلاحية التقارير اليومية لجميع المستخدمين
    const result = await usersCollection.updateMany(
      {}, // جميع المستخدمين
      { 
        $addToSet: { 
          permissions: "dashboard-card-daily-reports" 
        } 
      }
    );
    
    console.log(`✅ تم تحديث ${result.modifiedCount} مستخدم`);
    
    // عرض المستخدمين المحدثين
    const users = await usersCollection.find({}).toArray();
    console.log('\n📋 المستخدمين بعد التحديث:');
    users.forEach(user => {
      const hasPermission = user.permissions?.includes('dashboard-card-daily-reports');
      console.log(`   ${user.username}: ${hasPermission ? '✅' : '❌'} صلاحية التقارير اليومية`);
    });
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
  }
}

addDailyReportsPermission();