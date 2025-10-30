// نظام فحص الصلاحيات المركزي
(function() {
  'use strict';

  // الحصول على بيانات المستخدم من localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const permissions = user.permissions || [];

  // دالة للتحقق من وجود صلاحية معينة
  window.hasPermission = function(permission) {
    // إذا كان لديه صلاحية * (كل الصلاحيات)
    if (permissions.includes('*')) {
      return true;
    }
    return permissions.includes(permission);
  };

  // دالة للتحقق من وجود أي صلاحية من مجموعة
  window.hasAnyPermission = function(...perms) {
    return perms.some(p => permissions.includes(p));
  };

  // دالة للتحقق من وجود جميع الصلاحيات في مجموعة
  window.hasAllPermissions = function(...perms) {
    return perms.every(p => permissions.includes(p));
  };

  // دالة لإخفاء عنصر إذا لم تكن لديه الصلاحية
  window.hideIfNoPermission = function(element, permission) {
    if (!hasPermission(permission)) {
      element.style.display = 'none';
    }
  };

  // دالة لتعطيل عنصر إذا لم تكن لديه الصلاحية
  window.disableIfNoPermission = function(element, permission) {
    if (!hasPermission(permission)) {
      element.disabled = true;
      element.style.opacity = '0.5';
      element.style.cursor = 'not-allowed';
      element.title = 'ليس لديك صلاحية لهذا الإجراء';
    }
  };

  // فحص الصلاحيات للصفحة الحالية
  const currentPage = window.location.pathname.split('/').pop().replace('.html', '');
  
  const pagePermissions = {
    'add-extract': 'add-extract-access',
    'list-extracts': 'list-extracts-access',
    'add-contractor': 'contractors-access',
    'list-contractors': 'contractors-access',
    'contractor': 'contractors-access',
    'drawings': 'drawings-access',
    'suppliers': 'suppliers-access',
    'workers': 'workers-access',
    'monthly-pay': 'workers-monthly-pay',
    'store': 'store-access',
    'purchases': 'purchases-access',
    'receipts': 'receipts-access',
    'users': 'users-access',
    'equipments': 'store-access'
  };

  // التحقق من صلاحية الوصول للصفحة
  const requiredPermission = pagePermissions[currentPage];
  if (requiredPermission && !hasPermission(requiredPermission)) {
    // إذا لم يكن لديه صلاحية، أعد التوجيه للصفحة الرئيسية مع رسالة
    alert('⚠️ ليس لديك صلاحية للوصول إلى هذه الصفحة');
    window.location.href = 'index.html';
  }

  // فحص العناصر التي تحتاج صلاحيات عند تحميل الصفحة
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 فحص الصلاحيات للعناصر...');
    console.log('📋 الصلاحيات المتاحة:', permissions);
    
    // إخفاء الأزرار والعناصر بناءً على data-permission
    const elementsWithPermissions = document.querySelectorAll('[data-permission]');
    console.log(`📊 عدد العناصر التي تحتاج صلاحيات: ${elementsWithPermissions.length}`);
    
    elementsWithPermissions.forEach(element => {
      const permission = element.getAttribute('data-permission');
      const hasIt = hasPermission(permission);
      
      const elementId = element.id || element.className || element.tagName;
      console.log(`🔎 فحص عنصر: ${elementId} → صلاحية: ${permission} → متوفرة: ${hasIt}`);
      
      if (!hasIt) {
        element.style.display = 'none';
        console.log(`❌ إخفاء: ${elementId}`);
      } else {
        // تأكد من ظهور العنصر إذا كانت الصلاحية موجودة
        // لا نغير display إلا إذا كان مخفياً بالفعل
        if (element.style.display === 'none') {
          element.style.display = '';
        }
        console.log(`✅ إظهار: ${elementId}`);
      }
    });

    // تعطيل الأزرار بناءً على data-permission-required
    document.querySelectorAll('[data-permission-required]').forEach(element => {
      const permission = element.getAttribute('data-permission-required');
      disableIfNoPermission(element, permission);
    });
    
    console.log('✅ انتهى فحص الصلاحيات');
  });

  // تصدير الصلاحيات للاستخدام في الصفحات
  window.userPermissions = permissions;
  
  // دالة لتطبيق الصلاحيات على العناصر (يمكن استدعاؤها يدوياً)
  window.applyPermissions = function() {
    console.log('🔄 تطبيق الصلاحيات على العناصر...');
    
    const elementsWithPermissions = document.querySelectorAll('[data-permission]');
    console.log(`📊 عدد العناصر: ${elementsWithPermissions.length}`);
    
    elementsWithPermissions.forEach(element => {
      const permission = element.getAttribute('data-permission');
      const hasIt = hasPermission(permission);
      
      if (!hasIt) {
        element.style.display = 'none';
        console.log(`❌ إخفاء: ${permission}`);
      } else {
        if (element.style.display === 'none') {
          element.style.display = '';
        }
        console.log(`✅ إظهار: ${permission}`);
      }
    });
    
    console.log('✅ تم تطبيق الصلاحيات');
  };
  
  // دالة للتحقق من صلاحية الصفحة
  window.checkPagePermission = function(page) {
    const pagePerms = {
      'add-extract': 'add-extract-access',
      'list-extracts': 'list-extracts-access',
      'add-contractor': 'contractors-access',
      'list-contractors': 'contractors-access',
      'contractor': 'contractors-access',
      'drawings': 'drawings-access',
      'suppliers': 'suppliers-access',
      'workers': 'workers-access',
      'monthly-pay': 'workers-monthly-pay',
      'store': 'store-access',
      'purchases': 'purchases-access',
      'receipts': 'receipts-access',
      'users': 'users-access',
      'equipments': 'store-access',
      'daily-reports': 'daily-reports-access'
    };
    
    const requiredPerm = pagePerms[page];
    if (requiredPerm && !hasPermission(requiredPerm)) {
      alert('⚠️ ليس لديك صلاحية للوصول إلى هذه الصفحة');
      window.location.href = 'index.html';
    }
  };
  
  console.log('✅ نظام الصلاحيات تم تحميله بنجاح');
  console.log('📋 عدد الصلاحيات:', permissions.length);
})();
