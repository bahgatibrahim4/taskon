const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB';

async function addTestContractor() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('taskon');
    
    // البيانات من الكونسول
    const projectId = '68fc6e077d38109fa5b10118';
    const companyId = '68fc69a0bcf50a5bf3162182';
    const companyName = 'balbuied';
    
    // إنشاء collection name للمشروع
    const collectionName = `contractors_${companyName}_${projectId}`;
    const contractorsCol = db.collection(collectionName);
    
    // مقاول تجريبي
    const testContractor = {
      name: 'محمد أحمد - مقاول تجريبي',
      phone: '0501234567',
      workItem: 'دهانات خارجية',
      projectId: projectId,
      companyId: companyId,
      company: companyName,
      contracts: [],
      manualWorks: [],
      materials: [],
      contractorDeductions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await contractorsCol.insertOne(testContractor);
    console.log('✅ تم إضافة المقاول التجريبي:', result.insertedId);
    console.log('📋 Collection:', collectionName);
    
    // التحقق من الإضافة
    const count = await contractorsCol.countDocuments({ projectId, companyId });
    console.log(`📊 عدد المقاولين في المشروع: ${count}`);
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
    console.log('🔌 تم إغلاق الاتصال');
  }
}

addTestContractor();
