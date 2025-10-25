// سكريبت لحذف جميع البيانات من قاعدة البيانات القديمة
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";

async function clearOldData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('company_db');
    
    // قائمة بجميع الـ Collections
    const collections = [
      'extracts',
      'contractors',
      'users',
      'supplies',
      'suppliers',
      'purchases',
      'store',
      'workers',
      'monthlyPays',
      'pays',
      'chats',
      'notifications',
      'equipment',
      'contractor_issues',
      'purchase_returns',
      'external_services',
      'receipts',
      'drawings',
      'projects',
      'project_data',
      'contract_addons',
      'supply_addons',
      'letters',
      'estimates'
    ];
    
    console.log('\n🗑️  بدء حذف البيانات القديمة...\n');
    
    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`✅ تم حذف ${result.deletedCount} مستند من ${collectionName}`);
        } else {
          console.log(`⚪ ${collectionName} - فارغ بالفعل`);
        }
      } catch (err) {
        console.error(`❌ خطأ في حذف ${collectionName}:`, err.message);
      }
    }
    
    // الإبقاء فقط على companies و platform_admins
    console.log('\n📋 الإبقاء على:');
    console.log('   ✅ companies - معلومات الشركات');
    console.log('   ✅ platform_admins - مسؤولي المنصة');
    
    console.log('\n✨ تم الانتهاء! قاعدة البيانات جاهزة للنظام الجديد.\n');
    
  } catch (err) {
    console.error('❌ خطأ:', err);
  } finally {
    await client.close();
  }
}

// تشغيل السكريبت
clearOldData();
