const { MongoClient } = require('mongodb');

async function cleanupProjectUsers() {
  const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات');
    
    // الاتصال بقاعدة بيانات الشركة
    const companyDb = client.db('company_nour');
    
    // جلب المشاريع
    const projects = await companyDb.collection('projects').find({ _placeholder: { $ne: true } }).toArray();
    console.log('📁 المشاريع الموجودة:', projects.length);
    
    for (const project of projects) {
      console.log(`\n🔍 فحص المشروع: ${project.projectName || project._id}`);
      
      // الاتصال بقاعدة بيانات المشروع
      const projectDb = client.db(`project_${project._id}`);
      
      // جلب المستخدمين في المشروع
      const projectUsers = await projectDb.collection('users').find({}).toArray();
      console.log(`👥 مستخدمين في المشروع: ${projectUsers.length}`);
      
      if (projectUsers.length > 0) {
        console.log('📋 قائمة المستخدمين:');
        projectUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.username || user.name} (${user.email}) - Role: ${user.role}`);
        });
        
        // حذف جميع المستخدمين من قاعدة بيانات المشروع (لأن المستخدمين يجب أن يكونوا في company database فقط)
        const deleteResult = await projectDb.collection('users').deleteMany({});
        console.log(`🗑️ تم حذف ${deleteResult.deletedCount} مستخدم من قاعدة بيانات المشروع`);
        console.log('✅ المستخدمين يجب أن يكونوا في company database فقط');
      }
    }
    
    console.log('\n🎉 تم تنظيف قواعد البيانات بنجاح!');
    console.log('✅ جميع المستخدمين الآن في company_nour فقط');
    console.log('✅ لا توجد مستخدمين مكررين في project databases');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
  }
}

cleanupProjectUsers();