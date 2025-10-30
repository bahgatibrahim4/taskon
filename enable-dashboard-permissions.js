const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";

async function enableDashboardPermissions() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات');
    
    const db = client.db('taskon');
    const usersCollection = db.collection('users');
    
    // قائمة صلاحيات Dashboard Cards
    const dashboardPermissions = [
      'dashboard-card-project-info',
      'dashboard-card-drawings',
      'dashboard-card-daily-reports',
      'dashboard-card-suppliers',
      'dashboard-card-contractors',
      'dashboard-card-extracts',
      'dashboard-card-store',
      'dashboard-card-purchases',
      'dashboard-card-workers',
      'dashboard-card-equipments',
      'dashboard-card-receipts',
      'dashboard-card-users',
      'dashboard-card-monthly-pay',
      'dashboard-card-vouchers'
    ];
    
    // جلب جميع المستخدمين
    const users = await usersCollection.find({}).toArray();
    console.log(`📊 عدد المستخدمين: ${users.length}`);
    
    // تحديث كل مستخدم
    for (const user of users) {
      const currentPermissions = user.permissions || [];
      const newPermissions = [...new Set([...currentPermissions, ...dashboardPermissions])];
      
      await usersCollection.updateOne(
        { _id: user._id },
        { $set: { permissions: newPermissions } }
      );
      
      console.log(`✅ تم تحديث صلاحيات المستخدم: ${user.username || user.email}`);
      console.log(`   - الصلاحيات السابقة: ${currentPermissions.length}`);
      console.log(`   - الصلاحيات الجديدة: ${newPermissions.length}`);
    }
    
    console.log('\n🎉 تم تفعيل جميع صلاحيات Dashboard Cards لجميع المستخدمين!');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
    console.log('🔌 تم قطع الاتصال بقاعدة البيانات');
  }
}

enableDashboardPermissions();
