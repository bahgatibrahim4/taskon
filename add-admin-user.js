const { MongoClient } = require('mongodb');

async function addAdminUser() {
  const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات');
    
    // الاتصال بقاعدة بيانات الشركة
    const companyDb = client.db('company_nour');
    
    // جلب المشروع الموجود
    const projects = await companyDb.collection('projects').find({}).toArray();
    console.log('📁 المشاريع الموجودة:', projects.length);
    
    if (projects.length === 0) {
      console.log('❌ لا توجد مشاريع');
      return;
    }
    
    const project = projects[0]; // أول مشروع
    console.log('📁 سيتم إضافة المستخدم للمشروع:', project.projectName);
    
    // الاتصال بقاعدة بيانات المشروع
    const projectDb = client.db(`project_${project._id}`);
    
    // بيانات المستخدم الجديد
    const newUser = {
      name: 'مدير النظام',
      email: 'admin@system.com', 
      username: 'admin',
      password: '123456',
      role: 'admin',
      jobTitle: 'مدير النظام',
      permissions: [
        'dashboard.view', 'dashboard.card.project', 'dashboard.card.drawings', 'dashboard.card.external',
        'dashboard.card.contractors', 'dashboard.card.addExtract', 'dashboard.card.extracts',
        'dashboard.card.store', 'dashboard.card.supplies', 'dashboard.card.purchases',
        'dashboard.card.workers', 'dashboard.card.monthlyPay', 'dashboard.card.suppliers',
        'dashboard.card.equipment', 'dashboard.card.receipts', 'dashboard.card.users',
        'extracts.view', 'extracts.add', 'extracts.edit', 'extracts.delete', 'extracts.print', 'extracts.export',
        'contractors.view', 'contractors.add', 'contractors.edit', 'contractors.delete', 'contractors.materials', 'contractors.export',
        'workers.view', 'workers.add', 'workers.edit', 'workers.delete', 'workers.export',
        'store.view', 'store.issue', 'store.export', 'store.reports',
        'supplies.view', 'supplies.add', 'supplies.edit', 'supplies.delete', 'supplies.export',
        'suppliers.view', 'suppliers.add', 'suppliers.edit', 'suppliers.delete', 'suppliers.details', 'suppliers.payments',
        'purchases.view', 'purchases.add', 'purchases.edit', 'purchases.delete', 'purchases.returns', 'purchases.export',
        'equipment.view', 'equipment.add', 'equipment.edit', 'equipment.delete', 'equipment.export',
        'receipts.view', 'receipts.add', 'receipts.edit', 'receipts.delete', 'receipts.print', 'receipts.export',
        'drawings.view', 'drawings.upload', 'drawings.download', 'drawings.delete',
        'monthly-pay.view', 'monthly-pay.add', 'monthly-pay.edit', 'monthly-pay.delete', 'monthly-pay.export',
        'users.view', 'users.add', 'users.edit', 'users.delete', 'users.permissions',
        'project.view', 'project.edit', 'project.settings',
        'reports.view', 'reports.generate', 'reports.export'
      ],
      createdAt: new Date(),
      projectId: project._id.toString(),
      projectName: project.projectName
    };
    
    // إضافة المستخدم
    const result = await projectDb.collection('users').insertOne(newUser);
    console.log('✅ تم إضافة المستخدم بنجاح! ID:', result.insertedId);
    
    console.log('\n🎉 بيانات الدخول الجديدة:');
    console.log('📧 الإيميل: admin@system.com');
    console.log('👤 اسم المستخدم: admin'); 
    console.log('🔑 كلمة المرور: 123456');
    console.log('🏢 الشركة: nour');
    console.log('📁 المشروع:', project.projectName);
    console.log('🌐 الرابط: http://nour.taskon.local:4000/login.html');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
  }
}

addAdminUser();