const { MongoClient } = require('mongodb');

async function fixMainUser() {
  const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ متصل بقاعدة البيانات');
    
    // الاتصال بقاعدة بيانات الشركة
    const companyDb = client.db('company_nour');
    
    // جلب المستخدم الأساسي
    const mainUser = await companyDb.collection('users').findOne({ username: 'nour' });
    
    if (!mainUser) {
      console.log('❌ لم يتم العثور على المستخدم الأساسي');
      return;
    }
    
    console.log('📤 المستخدم الحالي:', {
      username: mainUser.username,
      role: mainUser.role,
      permissions: mainUser.permissions?.length || 0,
      isFirstUser: mainUser.isFirstUser
    });
    
    // قائمة كاملة بجميع الصلاحيات
    const allPermissions = [
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
    ];
    
    // تحديث المستخدم الأساسي بكل الصلاحيات
    const result = await companyDb.collection('users').updateOne(
      { _id: mainUser._id },
      {
        $set: {
          role: 'admin',
          permissions: allPermissions,
          permissionsByProject: {},
          permissionsByCompany: { '68f86f97a05ae9ba3e2f1dde': allPermissions },
          isFirstUser: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ تم تحديث المستخدم الأساسي بنجاح!');
    console.log('📋 الصلاحيات الممنوحة:', allPermissions.length, 'صلاحية');
    console.log('👑 الدور: admin');
    console.log('🔑 isFirstUser: true');
    
    console.log('\n🎉 المستخدم الأساسي الآن جاهز:');
    console.log('📧 الإيميل: nour@gmail.com');
    console.log('👤 اسم المستخدم: nour'); 
    console.log('🔑 كلمة المرور: 123456');
    console.log('🏢 الشركة: nour');
    console.log('🌐 الرابط: http://nour.taskon.local:4000/login.html');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
  }
}

fixMainUser();