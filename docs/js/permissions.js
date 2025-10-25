/**
 * نظام إدارة الصلاحيات الشامل
 * يتحكم في جميع العمليات في المشروع
 */

// قائمة جميع الصلاحيات المتاحة في النظام
const ALL_PERMISSIONS = {
  // الصفحة الرئيسية - صلاحيات الكاردات
  'dashboard.view': 'عرض الصفحة الرئيسية',
  'dashboard.card.project': 'كارد المشروع',
  'dashboard.card.drawings': 'كارد المخططات',
  'dashboard.card.external': 'كارد التعاملات الخارجية',
  'dashboard.card.contractors': 'كارد عرض المقاولين',
  'dashboard.card.addExtract': 'كارد إضافة مستخلص',
  'dashboard.card.extracts': 'كارد قائمة المستخلصات',
  'dashboard.card.store': 'كارد المخزن',
  'dashboard.card.supplies': 'كارد التوريدات',
  'dashboard.card.purchases': 'كارد المشتريات',
  'dashboard.card.workers': 'كارد العمال',
  'dashboard.card.monthlyPay': 'كارد الشهريات',
  'dashboard.card.suppliers': 'كارد الموردين',
  'dashboard.card.equipment': 'كارد المعدات',
  'dashboard.card.receipts': 'كارد سندات الاستلام',
  'dashboard.card.users': 'كارد المستخدمين',
  
  // المستخلصات
  'extracts.view': 'عرض المستخلصات',
  'extracts.add': 'إضافة مستخلص',
  'extracts.edit_in_add': 'تعديل كامل في إضافة مستخلص',
  'extracts.edit': 'تعديل مستخلص موجود',
  'extracts.delete': 'حذف مستخلص',
  'extracts.print': 'طباعة مستخلص',
  'extracts.export': 'تصدير المستخلصات',
  
  // المقاولون
  'contractors.view': 'عرض المقاولين',
  'contractors.add': 'إضافة مقاول',
  'contractors.edit': 'تعديل مقاول',
  'contractors.delete': 'حذف مقاول',
  'contractors.materials': 'إدارة مواد المقاول',
  'contractors.export': 'تصدير المقاولين',
  
  // صفحة المقاول المفردة
  'contractor.view_summary': 'عرض ملخص المقاول',
  'contractor.view_contracts': 'عرض عقود المقاول',
  'contractor.view_works': 'عرض أعمال المقاول',
  'contractor.view_extracts': 'عرض مستخلصات المقاول',
  'contractor.view_deductions': 'عرض خصومات المقاول',
  'contractor.view_materials': 'عرض مواد المقاول',
  'contractor.add_contract': 'إضافة عقد للمقاول',
  'contractor.edit_contract': 'تعديل عقد المقاول',
  'contractor.delete_contract': 'حذف عقد المقاول',
  'contractor.export_contracts': 'تصدير عقود المقاول',
  'contractor.edit_signed_works': 'تعديل الأعمال الموقعة',
  'contractor.sort_works': 'ترتيب أعمال المقاول',
  'contractor.pull_works': 'سحب أعمال لمقاول آخر',
  'contractor.export_works': 'تصدير أعمال المقاول',
  'contractor.edit_extract_work': 'تعديل عمل في المستخلص',
  'contractor.delete_material': 'حذف مادة المقاول',
  
  // العمال
  'workers.view': 'عرض العمال',
  'workers.add': 'إضافة عامل',
  'workers.edit': 'تعديل عامل',
  'workers.delete': 'حذف عامل',
  'workers.export': 'تصدير العمال',
  
  // المخزن
  'store.view': 'عرض المخزن',
  'store.issue': 'صرف مواد',
  'store.export': 'تصدير المخزن',
  'store.reports': 'تقارير المخزن',
  'store.update': 'تحديث بيانات المخزن',
  
  // التوريدات
  'supplies.view': 'عرض التوريدات',
  'supplies.add': 'إضافة توريد',
  'supplies.edit': 'تعديل توريد',
  'supplies.delete': 'حذف توريد',
  'supplies.export': 'تصدير التوريدات',
  
  // الموردين
  'suppliers.view': 'عرض الموردين',
  'suppliers.add': 'إضافة مورد',
  'suppliers.edit': 'تعديل مورد',
  'suppliers.delete': 'حذف مورد',
  'suppliers.details': 'عرض تفاصيل المورد',
  'suppliers.payments': 'إدارة مدفوعات المورد',
  'suppliers.view_supplies': 'عرض توريدات المورد',
  'suppliers.view_accounts': 'عرض حسابات المورد',
  'suppliers.view_returns': 'عرض مرتجعات المورد',
  'suppliers.add_account': 'إضافة حساب للمورد',
  'suppliers.delete_payment': 'حذف دفعة من المورد',
  
  // المشتريات
  'purchases.view': 'عرض المشتريات',
  'purchases.add': 'إضافة مشتريات',
  'purchases.edit': 'تعديل مشتريات',
  'purchases.delete': 'حذف مشتريات',
  'purchases.returns': 'إدارة المرتجعات',
  'purchases.export': 'تصدير المشتريات',
  
  // المعدات
  'equipment.view': 'عرض المعدات',
  'equipment.add': 'إضافة معدات',
  'equipment.edit': 'تعديل معدات',
  'equipment.delete': 'حذف معدات',
  'equipment.export': 'تصدير المعدات',
  
  // سندات الاستلام
  'receipts.view': 'عرض سندات الاستلام',
  'receipts.add': 'إضافة سند',
  'receipts.edit': 'تعديل سند',
  'receipts.delete': 'حذف سند',
  'receipts.print': 'طباعة سند',
  'receipts.export': 'تصدير السندات',
  
  // المخططات
  'drawings.view': 'عرض المخططات',
  'drawings.add': 'إضافة مخطط',
  'drawings.edit': 'تعديل مخطط',
  'drawings.delete': 'حذف مخطط',
  'drawings.download': 'تحميل المخططات',
  
  // القبض الشهري
  'monthly-pay.view': 'عرض القبض الشهري',
  'monthly-pay.add': 'إضافة قبض',
  'monthly-pay.edit': 'تعديل قبض',
  'monthly-pay.delete': 'حذف قبض',
  'monthly-pay.export': 'تصدير القبض',
  
  // المشاريع
  'projects.view': 'عرض المشاريع',
  'projects.add': 'إضافة مشروع',
  'projects.edit': 'تعديل مشروع',
  'projects.delete': 'حذف مشروع',
  'projects.switch': 'التبديل بين المشاريع',
  
  // المستخدمين
  'users.view': 'عرض المستخدمين',
  'users.add': 'إضافة مستخدم',
  'users.edit': 'تعديل مستخدم',
  'users.delete': 'حذف مستخدم',
  'users.manage_permissions': 'إدارة صلاحيات المستخدمين',
  
  // التقارير
  'reports.view': 'عرض التقارير',
  'reports.export': 'تصدير التقارير',
  'reports.print': 'طباعة التقارير',
  
  // الإعدادات
  'settings.view': 'عرض الإعدادات',
  'settings.edit': 'تعديل الإعدادات',
  'settings.backup': 'النسخ الاحتياطي',
};

// الصلاحيات الافتراضية لكل دور
const DEFAULT_ROLE_PERMISSIONS = {
  'admin': Object.keys(ALL_PERMISSIONS), // المدير له كل الصلاحيات
  'manager': [
    // الصفحة الرئيسية - جميع الكاردات
    'dashboard.view', 'dashboard.card.project', 'dashboard.card.drawings', 'dashboard.card.external',
    'dashboard.card.contractors', 'dashboard.card.addExtract', 'dashboard.card.extracts',
    'dashboard.card.store', 'dashboard.card.supplies', 'dashboard.card.purchases',
    'dashboard.card.workers', 'dashboard.card.monthlyPay', 'dashboard.card.suppliers',
    'dashboard.card.equipment', 'dashboard.card.receipts', 'dashboard.card.users',
    // المستخلصات
    'extracts.view', 'extracts.add', 'extracts.edit', 'extracts.print', 'extracts.export',
    // المقاولون
    'contractors.view', 'contractors.add', 'contractors.edit', 'contractors.materials', 'contractors.export',
    // صفحة المقاول المفردة
    'contractor.view_summary', 'contractor.view_contracts', 'contractor.view_works', 'contractor.view_extracts',
    'contractor.view_deductions', 'contractor.view_materials', 'contractor.add_contract', 'contractor.edit_contract',
    'contractor.export_contracts', 'contractor.edit_signed_works', 'contractor.sort_works', 'contractor.export_works',
    // العمال
    'workers.view', 'workers.add', 'workers.edit', 'workers.export',
    // المخزن
    'store.view', 'store.issue', 'store.export', 'store.reports',
    // التوريدات
    'supplies.view', 'supplies.add', 'supplies.edit', 'supplies.export',
    // الموردين
    'suppliers.view', 'suppliers.details', 'suppliers.payments', 'suppliers.view_supplies', 
    'suppliers.view_accounts', 'suppliers.view_returns', 'suppliers.add_account', 'suppliers.delete_payment',
    // المشتريات
    'purchases.view', 'purchases.add', 'purchases.edit', 'purchases.returns', 'purchases.export',
    // المعدات
    'equipment.view', 'equipment.add', 'equipment.edit', 'equipment.export',
    // سندات الاستلام
    'receipts.view', 'receipts.add', 'receipts.edit', 'receipts.print', 'receipts.export',
    // المخططات
    'drawings.view', 'drawings.download',
    // القبض الشهري
    'monthly-pay.view', 'monthly-pay.add', 'monthly-pay.edit', 'monthly-pay.export',
    // المشاريع
    'projects.view', 'projects.switch',
    // التقارير
    'reports.view', 'reports.export', 'reports.print',
  ],
  'user': [
    // الصفحة الرئيسية - كاردات محدودة
    'dashboard.view', 'dashboard.card.extracts', 'dashboard.card.store', 
    'dashboard.card.contractors', 'dashboard.card.drawings',
    // المستخلصات
    'extracts.view', 'extracts.print',
    // المقاولون
    'contractors.view',
    // صفحة المقاول المفردة - عرض فقط
    'contractor.view_summary', 'contractor.view_contracts', 'contractor.view_works', 'contractor.view_extracts',
    'contractor.view_deductions', 'contractor.view_materials',
    // العمال
    'workers.view',
    // المخزن
    'store.view', 'store.reports',
    // التوريدات
    'supplies.view',
    // الموردين
    'suppliers.view', 'suppliers.details', 'suppliers.view_supplies', 
    'suppliers.view_accounts', 'suppliers.view_returns',
    // المشتريات
    'purchases.view',
    // المعدات
    'equipment.view',
    // سندات الاستلام
    'receipts.view', 'receipts.print',
    // المخططات
    'drawings.view',
    // القبض الشهري
    'monthly-pay.view',
    // المشاريع
    'projects.view',
    // التقارير
    'reports.view',
  ]
};

// جلب صلاحيات المستخدم الحالي (مرتبطة بالشركة والمشروع)
function getCurrentUserPermissions() {
  try {
    // البحث في currentUser أو user للتوافق
    const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
    const user = JSON.parse(userStr || '{}');
    const currentCompanyId = localStorage.getItem('currentCompanyId');
    const currentProjectId = localStorage.getItem('currentProjectId');
    
    console.log('🔍 Debug getCurrentUserPermissions:', {
      userRole: user.role,
      hasProjectId: !!user.projectId,
      currentProjectId: currentProjectId,
      hasPermissionsByProject: !!user.permissionsByProject,
      hasPermissions: !!user.permissions
    });
    
    // جلب الصلاحيات المخصصة حسب الشركة والمشروع (حتى للـ admin)
    if (user.permissionsByProject && currentProjectId) {
      // صلاحيات خاصة بالمشروع الحالي
      const projectPermissions = user.permissionsByProject[currentProjectId];
      if (projectPermissions && Array.isArray(projectPermissions) && projectPermissions.length > 0) {
        console.log(`✅ صلاحيات المشروع ${currentProjectId}:`, projectPermissions);
        return projectPermissions;
      }
    }
    
    if (user.permissionsByCompany && currentCompanyId) {
      // صلاحيات خاصة بالشركة الحالية
      const companyPermissions = user.permissionsByCompany[currentCompanyId];
      if (companyPermissions && Array.isArray(companyPermissions) && companyPermissions.length > 0) {
        console.log(`✅ صلاحيات الشركة ${currentCompanyId}:`, companyPermissions);
        return companyPermissions;
      }
    }
    
    // جلب الصلاحيات العامة
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      console.log('✅ صلاحيات عامة:', user.permissions);
      return user.permissions;
    }
    
    // إذا لم توجد صلاحيات مخصصة، استخدم الصلاحيات الافتراضية حسب الدور
    console.log('🔍 تحديد صلاحيات المستخدم:', {
      role: user.role,
      jobTitle: user.jobTitle,
      hasProjectId: !!user.projectId,
      isAdmin: user.role === 'admin',
      isManager: user.jobTitle === 'مدير المشروع',
      isCompanyUser: !user.projectId
    });
    
    // الـ admin أو مستخدم الشركة له كل الصلاحيات
    if (user.role === 'admin' || user.jobTitle === 'مدير المشروع' || !user.projectId) {
      console.log('✅ منح صلاحيات Admin كاملة');
      const allPermissions = Object.keys(ALL_PERMISSIONS);
      console.log('📋 عدد الصلاحيات الممنوحة:', allPermissions.length);
      return allPermissions;
    }
    
    console.log('📋 استخدام صلاحيات افتراضية للدور:', user.role);
    return DEFAULT_ROLE_PERMISSIONS[user.role] || DEFAULT_ROLE_PERMISSIONS['user'];
  } catch (error) {
    console.error('خطأ في جلب صلاحيات المستخدم:', error);
    return DEFAULT_ROLE_PERMISSIONS['user']; // صلاحيات محدودة في حالة الخطأ
  }
}

// التحقق من صلاحية معينة
function hasPermission(permission) {
  const userPermissions = getCurrentUserPermissions();
  const hasAccess = userPermissions.includes(permission);
  
  // للتصحيح - يمكن إزالته لاحقاً
  if (!hasAccess) {
    console.log(`❌ لا توجد صلاحية: ${permission}`);
    console.log('الصلاحيات المتاحة:', userPermissions);
    console.log('نوع البيانات:', typeof userPermissions, Array.isArray(userPermissions));
  } else {
    console.log(`✅ تم العثور على صلاحية: ${permission}`);
  }
  
  return hasAccess;
}

// التحقق من عدة صلاحيات (أي صلاحية منها)
function hasAnyPermission(...permissions) {
  return permissions.some(permission => hasPermission(permission));
}

// التحقق من عدة صلاحيات (كل الصلاحيات)
function hasAllPermissions(...permissions) {
  return permissions.every(permission => hasPermission(permission));
}

// إخفاء عنصر بناءً على الصلاحية
function hideIfNoPermission(elementId, permission) {
  if (!hasPermission(permission)) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'none';
    }
  }
}

// تعطيل عنصر بناءً على الصلاحية
function disableIfNoPermission(elementId, permission) {
  if (!hasPermission(permission)) {
    const element = document.getElementById(elementId);
    if (element) {
      element.disabled = true;
      element.style.opacity = '0.5';
      element.style.cursor = 'not-allowed';
      element.title = 'ليس لديك صلاحية لهذا الإجراء';
    }
  }
}

// إخفاء أزرار متعددة بناءً على الصلاحيات
function applyPermissionsToButtons() {
  const elements = document.querySelectorAll('[data-permission]');
  let hiddenCount = 0;
  
  elements.forEach(element => {
    const permission = element.getAttribute('data-permission');
    if (!hasPermission(permission)) {
      element.style.display = 'none';
      hiddenCount++;
    }
  });
  
  console.log(`🔒 تم إخفاء ${hiddenCount} عنصر من ${elements.length} بناءً على الصلاحيات`);
}

// تطبيق الصلاحيات عند تحميل الصفحة
function applyPagePermissions() {
  // إخفاء العناصر التي تحتاج صلاحيات
  applyPermissionsToButtons();
  
  // إضافة مستمعات الأحداث لمنع العمليات غير المصرح بها
  document.addEventListener('click', function(e) {
    const target = e.target.closest('[data-permission]');
    if (target) {
      const permission = target.getAttribute('data-permission');
      if (!hasPermission(permission)) {
        e.preventDefault();
        e.stopPropagation();
        alert('⚠️ ليس لديك صلاحية لتنفيذ هذا الإجراء');
        return false;
      }
    }
  }, true);
}

// عرض رسالة عدم وجود صلاحية
function showNoPermissionMessage() {
  alert('⚠️ ليس لديك صلاحية للوصول إلى هذه الصفحة أو تنفيذ هذا الإجراء');
}

// التحقق من صلاحية الوصول للصفحة
function checkPageAccess(requiredPermission) {
  if (!hasPermission(requiredPermission)) {
    showNoPermissionMessage();
    // إعادة التوجيه للصفحة الرئيسية
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1500);
    return false;
  }
  return true;
}

// إعادة تحميل صلاحيات المستخدم من السيرفر
async function refreshUserPermissions() {
  try {
    const userStr = localStorage.getItem('currentUser') || localStorage.getItem('user');
    const user = JSON.parse(userStr || '{}');
    if (!user._id) {
      console.warn('لا يوجد مستخدم مسجل دخول');
      return false;
    }
    
    const response = await fetch(`/users/${user._id}`);
    if (response.ok) {
      const updatedUser = await response.json();
      if (updatedUser && updatedUser._id) {
        // تحديث بيانات المستخدم في localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        console.log('✅ تم تحديث صلاحيات المستخدم');
        return true;
      }
    }
  } catch (error) {
    console.error('خطأ في تحديث الصلاحيات:', error);
  }
  return false;
}

// تصدير الدوال
if (typeof window !== 'undefined') {
  window.permissionsModule = {
    ALL_PERMISSIONS,
    DEFAULT_ROLE_PERMISSIONS,
    getCurrentUserPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hideIfNoPermission,
    disableIfNoPermission,
    applyPermissionsToButtons,
    applyPagePermissions,
    showNoPermissionMessage,
    checkPageAccess,
    refreshUserPermissions
  };
  
  // تطبيق الصلاحيات تلقائياً عند تحميل الصفحة
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // انتظر قليلاً لضمان تحميل كل العناصر
      setTimeout(() => {
        applyPagePermissions();
      }, 100);
    });
  } else {
    // إذا كانت الصفحة محملة بالفعل
    setTimeout(() => {
      applyPagePermissions();
    }, 100);
  }
}
