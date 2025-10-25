const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
const client = new MongoClient(uri);

async function checkCompanies() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db('company_db');
    const companiesCollection = db.collection('companies');
    
    const companies = await companiesCollection.find({}).toArray();
    
    console.log(`📊 عدد الشركات الموجودة: ${companies.length}\n`);
    
    if (companies.length === 0) {
      console.log('⚠️ لا توجد شركات في قاعدة البيانات!');
      console.log('💡 يجب إنشاء شركات جديدة أولاً.\n');
    } else {
      console.log('📋 قائمة الشركات:\n');
      companies.forEach((company, index) => {
        console.log(`${index + 1}. الشركة: ${company.companyName || 'غير محدد'}`);
        console.log(`   Subdomain: ${company.subdomain || 'غير محدد'}`);
        console.log(`   ID: ${company._id}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.close();
  }
}

checkCompanies();
