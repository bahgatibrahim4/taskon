const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB';

async function setupDefaultData() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('taskon');
    
    // إنشاء الشركة الافتراضية
    const companiesCol = db.collection('companies');
    
    let company = await companiesCol.findOne({ subdomain: 'mycompany' });
    
    if (!company) {
      const companyData = {
        companyName: 'شركتي',
        subdomain: 'mycompany',
        email: 'admin@taskon.local',
        phone: '0500000000',
        address: 'السعودية',
        createdAt: new Date(),
        isActive: true
      };
      
      const result = await companiesCol.insertOne(companyData);
      company = { ...companyData, _id: result.insertedId };
      console.log('✅ تم إنشاء الشركة الافتراضية:', company._id);
    } else {
      console.log('ℹ️ الشركة موجودة بالفعل:', company._id);
    }
    
    // إنشاء المستخدم الافتراضي
    const usersCol = db.collection('users');
    
    let user = await usersCol.findOne({ email: 'admin@taskon.local' });
    
    if (!user) {
      const userData = {
        username: 'المدير',
        email: 'admin@taskon.local',
        password: 'admin123', // يمكنك تغيير كلمة المرور
        role: 'admin',
        permissions: ['*'],
        companyId: company._id.toString(),
        createdAt: new Date(),
        isActive: true
      };
      
      const result = await usersCol.insertOne(userData);
      console.log('✅ تم إنشاء المستخدم الافتراضي:', result.insertedId);
      console.log('📧 البريد: admin@taskon.local');
      console.log('🔑 كلمة المرور: admin123');
    } else {
      console.log('ℹ️ المستخدم موجود بالفعل:', user._id);
    }
    
    console.log('\n✅ ✅ ✅ الإعداد مكتمل! ✅ ✅ ✅');
    console.log('\n📋 بيانات الدخول:');
    console.log('   البريد: admin@taskon.local');
    console.log('   كلمة المرور: admin123');
    console.log('   الشركة: mycompany');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
    console.log('\n🔌 تم إغلاق الاتصال');
  }
}

setupDefaultData();
