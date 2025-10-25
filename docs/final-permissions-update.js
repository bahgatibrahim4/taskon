const { MongoClient } = require('mongodb');

async function updateUserWithAllPermissions() {
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
      permissions: mainUser.permissions?.length || 0
    });
    
    // قائمة كاملة بجميع الصلاحيات من permissions.js
    const ALL_PERMISSIONS = [
      // الصفحة الرئيسية - صلاحيات الكاردات
      'dashboard.view', 'dashboard.card.project', 'dashboard.card.drawings', 'dashboard.card.external',
      'dashboard.card.contractors', 'dashboard.card.addExtract', 'dashboard.card.extracts',
      'dashboard.card.store', 'dashboard.card.supplies', 'dashboard.card.purchases',
      'dashboard.card.workers', 'dashboard.card.monthlyPay', 'dashboard.card.suppliers',
      'dashboard.card.equipment', 'dashboard.card.receipts', 'dashboard.card.users',
      
      // المستخلصات
      'extracts.view', 'extracts.add', 'extracts.edit_in_add', 'extracts.edit', 'extracts.delete',
      'extracts.print', 'extracts.export',
      
      // المقاولون
      'contractors.view', 'contractors.add', 'contractors.edit', 'contractors.delete',
      'contractors.materials', 'contractors.export',
      
      // العمال
      'workers.view', 'workers.add', 'workers.edit', 'workers.delete', 'workers.export',
      
      // المخزن
      'store.view', 'store.issue', 'store.export', 'store.reports', 'store.update',
      
      // التوريدات
      'supplies.view', 'supplies.add', 'supplies.edit', 'supplies.delete', 'supplies.export',
      
      // الموردين
      'suppliers.view', 'suppliers.add', 'suppliers.edit', 'suppliers.delete',
      'suppliers.details', 'suppliers.payments',
      
      // المشتريات
      'purchases.view', 'purchases.add', 'purchases.edit', 'purchases.delete',
      'purchases.returns', 'purchases.export',
      
      // المعدات
      'equipment.view', 'equipment.add', 'equipment.edit', 'equipment.delete', 'equipment.export',
      
      // سندات الاستلام
      'receipts.view', 'receipts.add', 'receipts.edit', 'receipts.delete',
      'receipts.print', 'receipts.export',
      
      // المخططات
      'drawings.view', 'drawings.add', 'drawings.edit', 'drawings.delete', 'drawings.download',
      
      // القبض الشهري
      'monthly-pay.view', 'monthly-pay.add', 'monthly-pay.edit', 'monthly-pay.delete', 'monthly-pay.export',
      
      // المشاريع
      'projects.view', 'projects.add', 'projects.edit', 'projects.delete', 'projects.switch',
      
      // المستخدمين
      'users.view', 'users.add', 'users.edit', 'users.delete', 'users.manage_permissions',
      
      // التقارير
      'reports.view', 'reports.export', 'reports.print',
      
      // الإعدادات
      'settings.view', 'settings.edit', 'settings.backup'
    ];
    
    console.log(`🔄 تحديث الصلاحيات... العدد الجديد: ${ALL_PERMISSIONS.length} صلاحية`);
    
    // تحديث المستخدم الأساسي بكل الصلاحيات
    const result = await companyDb.collection('users').updateOne(
      { _id: mainUser._id },
      {
        $set: {
          role: 'admin',
          permissions: ALL_PERMISSIONS,
          permissionsByProject: {},
          permissionsByCompany: { '68f86f97a05ae9ba3e2f1dde': ALL_PERMISSIONS },
          isFirstUser: true,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('✅ تم تحديث المستخدم الأساسي بنجاح!');
    console.log(`📋 إجمالي الصلاحيات الممنوحة: ${ALL_PERMISSIONS.length} صلاحية`);
    console.log('👑 الدور: admin');
    console.log('🔑 isFirstUser: true');
    
    // التأكد من النتيجة
    const updatedUser = await companyDb.collection('users').findOne({ username: 'nour' });
    console.log('\n📝 التحقق من المستخدم المحدث:');
    console.log(`✅ الصلاحيات الجديدة: ${updatedUser.permissions?.length || 0} صلاحية`);
    console.log(`✅ الدور: ${updatedUser.role}`);
    console.log(`✅ isFirstUser: ${updatedUser.isFirstUser}`);
    
    console.log('\n🎉 النظام جاهز تماماً مع كل الصلاحيات:');
    console.log('📧 الإيميل: nour@gmail.com');
    console.log('👤 اسم المستخدم: nour'); 
    console.log('🔑 كلمة المرور: 123456');
    console.log('🏢 الشركة: nour');
    console.log('🌐 الرابط: http://nour.taskon.local:4000/login.html');
    
  } catch (error) {
    console.error('❌ خطأ:', error);
  } finally {
    await client.close();
    console.log('🔌 تم قطع الاتصال');
    process.exit(0); // إنهاء العملية بنجاح
  }
}

updateUserWithAllPermissions();