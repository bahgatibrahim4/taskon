# 🔐 دليل تطبيق نظام الصلاحيات الشامل

## ✅ ما تم إنجازه

### 1. إنشاء ملف الصلاحيات المشترك (`js/permissions.js`)
- قائمة شاملة بجميع الصلاحيات لكل صفحات المشروع
- دوال للتحقق من الصلاحيات
- صلاحيات افتراضية لكل دور (admin, manager, user)

### 2. تحديث صفحة المستخدمين (`users.html`)
- واجهة شاملة لإدارة الصلاحيات
- تغطي جميع الصفحات والعمليات
- أزرار تحديد/إلغاء تحديد الكل

### 3. تحديث السيرفر (`server.js`)
- endpoint جاهز لتحديث الصلاحيات
- endpoint المرتجعات يدعم الفلترة بالشركة والمشروع

---

## 📋 كيفية تطبيق الصلاحيات على أي صفحة

### الخطوة 1: إضافة سكريبت الصلاحيات
```html
<head>
  ...
  <script src="js/permissions.js"></script>
</head>
```

### الخطوة 2: إضافة صلاحية للأزرار والعناصر
استخدم خاصية `data-permission` لأي عنصر تريد التحكم فيه:

```html
<!-- أزرار الإضافة -->
<button id="addPurchaseBtn" data-permission="purchases.add">
  <i class="fa fa-plus"></i> إضافة مشتريات
</button>

<!-- أزرار التعديل -->
<button onclick="editItem(id)" data-permission="purchases.edit">
  <i class="fa fa-edit"></i> تعديل
</button>

<!-- أزرار الحذف -->
<button onclick="deleteItem(id)" data-permission="purchases.delete">
  <i class="fa fa-trash"></i> حذف
</button>

<!-- أزرار التصدير -->
<button onclick="exportToExcel()" data-permission="purchases.export">
  <i class="fa fa-file-excel"></i> تصدير Excel
</button>
```

### الخطوة 3: تطبيق الصلاحيات عند تحميل الصفحة
```javascript
// في بداية السكريبت
window.addEventListener('DOMContentLoaded', () => {
  // تطبيق الصلاحيات على جميع الأزرار
  window.permissionsModule.applyPagePermissions();
  
  // أو يمكنك التحقق يدوياً
  const canAdd = window.permissionsModule.hasPermission('purchases.add');
  if (!canAdd) {
    document.getElementById('addPurchaseBtn').style.display = 'none';
  }
});
```

### الخطوة 4: التحقق من الصلاحيات في الدوال
```javascript
function openAddModal() {
  // التحقق من صلاحية الإضافة
  if (!window.permissionsModule.hasPermission('purchases.add')) {
    window.permissionsModule.showNoPermissionMessage();
    return;
  }
  
  // إذا كانت الصلاحية موجودة، افتح النافذة
  document.getElementById('addModal').style.display = 'flex';
}

function deleteItem(id) {
  // التحقق من صلاحية الحذف
  if (!window.permissionsModule.hasPermission('purchases.delete')) {
    alert('⚠️ ليس لديك صلاحية لحذف العناصر');
    return;
  }
  
  // تنفيذ عملية الحذف
  if (confirm('هل أنت متأكد من الحذف؟')) {
    // ...
  }
}
```

### الخطوة 5: التحقق من صلاحية الوصول للصفحة بالكامل
```javascript
// في بداية السكريبت - يمنع الوصول للصفحة إذا لم تكن الصلاحية موجودة
if (!window.permissionsModule.checkPageAccess('purchases.view')) {
  // سيتم إعادة التوجيه تلقائياً للصفحة الرئيسية
  return;
}
```

---

## 🎯 أمثلة تطبيقية

### مثال 1: صفحة المشتريات (purchases.html)

```html
<!DOCTYPE html>
<html lang="ar">
<head>
  ...
  <script src="js/permissions.js"></script>
</head>
<body>
  <!-- أزرار العمليات -->
  <div class="header-actions">
    <button onclick="openAddPurchaseModal()" data-permission="purchases.add">
      <i class="fa fa-plus"></i> إضافة
    </button>
    <button onclick="exportToExcel()" data-permission="purchases.export">
      <i class="fa fa-file-excel"></i> تصدير
    </button>
    <button onclick="toggleReturnsView()" data-permission="purchases.returns">
      <i class="fa fa-undo"></i> المرتجعات
    </button>
  </div>

  <!-- جدول المشتريات -->
  <table>
    <tbody>
      <!-- سيتم إضافة أزرار التعديل والحذف ديناميكياً حسب الصلاحيات -->
    </tbody>
  </table>

  <script>
    // التحقق من صلاحية الوصول للصفحة
    if (!window.permissionsModule.checkPageAccess('purchases.view')) {
      return;
    }

    // تطبيق الصلاحيات عند تحميل الصفحة
    window.addEventListener('DOMContentLoaded', () => {
      window.permissionsModule.applyPagePermissions();
      renderPurchases();
    });

    // عرض المشتريات مع أزرار حسب الصلاحيات
    function renderPurchases() {
      const canEdit = window.permissionsModule.hasPermission('purchases.edit');
      const canDelete = window.permissionsModule.hasPermission('purchases.delete');
      
      purchases.forEach(purchase => {
        let actionsHTML = '';
        
        if (canEdit) {
          actionsHTML += `
            <button onclick="editPurchase('${purchase._id}')" data-permission="purchases.edit">
              <i class="fa fa-edit"></i>
            </button>
          `;
        }
        
        if (canDelete) {
          actionsHTML += `
            <button onclick="deletePurchase('${purchase._id}')" data-permission="purchases.delete">
              <i class="fa fa-trash"></i>
            </button>
          `;
        }
        
        // إضافة الصف للجدول...
      });
    }

    // دالة الإضافة مع التحقق
    function openAddPurchaseModal() {
      if (!window.permissionsModule.hasPermission('purchases.add')) {
        window.permissionsModule.showNoPermissionMessage();
        return;
      }
      document.getElementById('purchaseModal').style.display = 'flex';
    }

    // دالة الحذف مع التحقق
    async function deletePurchase(id) {
      if (!window.permissionsModule.hasPermission('purchases.delete')) {
        alert('⚠️ ليس لديك صلاحية للحذف');
        return;
      }
      
      if (confirm('هل أنت متأكد؟')) {
        // تنفيذ الحذف...
      }
    }
  </script>
</body>
</html>
```

### مثال 2: صفحة المخزن (store.html)

```javascript
// في بداية store.html
window.addEventListener('DOMContentLoaded', () => {
  // التحقق من صلاحية العرض
  if (!window.permissionsModule.checkPageAccess('store.view')) {
    return;
  }
  
  // تطبيق الصلاحيات
  window.permissionsModule.applyPagePermissions();
  
  // إخفاء أزرار محددة حسب الصلاحيات
  if (!window.permissionsModule.hasPermission('store.issue')) {
    document.getElementById('openIssueModalBtn').style.display = 'none';
  }
  
  if (!window.permissionsModule.hasPermission('store.export')) {
    document.getElementById('exportExcelBtn').style.display = 'none';
  }
  
  if (!window.permissionsModule.hasPermission('store.reports')) {
    document.getElementById('storeReportBtn').style.display = 'none';
  }
});
```

---

## 📊 قائمة الصلاحيات المتاحة

### المستخلصات
- `extracts.view` - عرض المستخلصات
- `extracts.add` - إضافة مستخلص
- `extracts.edit` - تعديل مستخلص
- `extracts.delete` - حذف مستخلص
- `extracts.print` - طباعة مستخلص
- `extracts.export` - تصدير المستخلصات

### المقاولون
- `contractors.view` - عرض المقاولين
- `contractors.add` - إضافة مقاول
- `contractors.edit` - تعديل مقاول
- `contractors.delete` - حذف مقاول
- `contractors.materials` - إدارة مواد المقاول
- `contractors.export` - تصدير المقاولين

### العمال
- `workers.view` - عرض العمال
- `workers.add` - إضافة عامل
- `workers.edit` - تعديل عامل
- `workers.delete` - حذف عامل
- `workers.export` - تصدير العمال

### المخزن
- `store.view` - عرض المخزن
- `store.issue` - صرف مواد
- `store.export` - تصدير المخزن
- `store.reports` - تقارير المخزن
- `store.update` - تحديث بيانات المخزن

### التوريدات
- `supplies.view` - عرض التوريدات
- `supplies.add` - إضافة توريد
- `supplies.edit` - تعديل توريد
- `supplies.delete` - حذف توريد
- `supplies.export` - تصدير التوريدات

### الموردين
- `suppliers.view` - عرض الموردين
- `suppliers.add` - إضافة مورد
- `suppliers.edit` - تعديل مورد
- `suppliers.delete` - حذف مورد
- `suppliers.details` - عرض تفاصيل المورد
- `suppliers.payments` - إدارة مدفوعات المورد

### المشتريات
- `purchases.view` - عرض المشتريات
- `purchases.add` - إضافة مشتريات
- `purchases.edit` - تعديل مشتريات
- `purchases.delete` - حذف مشتريات
- `purchases.returns` - إدارة المرتجعات
- `purchases.export` - تصدير المشتريات

### المعدات
- `equipment.view` - عرض المعدات
- `equipment.add` - إضافة معدات
- `equipment.edit` - تعديل معدات
- `equipment.delete` - حذف معدات
- `equipment.export` - تصدير المعدات

### سندات الاستلام
- `receipts.view` - عرض سندات الاستلام
- `receipts.add` - إضافة سند
- `receipts.edit` - تعديل سند
- `receipts.delete` - حذف سند
- `receipts.print` - طباعة سند
- `receipts.export` - تصدير السندات

### المخططات
- `drawings.view` - عرض المخططات
- `drawings.add` - إضافة مخطط
- `drawings.edit` - تعديل مخطط
- `drawings.delete` - حذف مخطط
- `drawings.download` - تحميل المخططات

### القبض الشهري
- `monthly-pay.view` - عرض القبض الشهري
- `monthly-pay.add` - إضافة قبض
- `monthly-pay.edit` - تعديل قبض
- `monthly-pay.delete` - حذف قبض
- `monthly-pay.export` - تصدير القبض

### المشاريع
- `projects.view` - عرض المشاريع
- `projects.add` - إضافة مشروع
- `projects.edit` - تعديل مشروع
- `projects.delete` - حذف مشروع
- `projects.switch` - التبديل بين المشاريع

### المستخدمين
- `users.view` - عرض المستخدمين
- `users.add` - إضافة مستخدم
- `users.edit` - تعديل مستخدم
- `users.delete` - حذف مستخدم
- `users.permissions` - إدارة صلاحيات المستخدمين

### التقارير
- `reports.view` - عرض التقارير
- `reports.export` - تصدير التقارير
- `reports.print` - طباعة التقارير

### الإعدادات
- `settings.view` - عرض الإعدادات
- `settings.edit` - تعديل الإعدادات
- `settings.backup` - النسخ الاحتياطي

---

## 🚀 الخطوات التالية

### ✅ تم إنجازه
1. ✅ إنشاء ملف الصلاحيات المشترك `js/permissions.js`
2. ✅ تحديث صفحة المستخدمين بواجهة شاملة
3. ✅ تحديث السيرفر لدعم الصلاحيات والفلترة

### 📝 يحتاج للتطبيق
4. ⏳ تطبيق النظام على كل صفحة من صفحات المشروع:
   - إضافة `<script src="js/permissions.js"></script>`
   - إضافة `data-permission` للأزرار
   - إضافة التحقق في الدوال

---

## 💡 نصائح مهمة

1. **استخدم `data-permission` دائماً** على الأزرار والروابط المهمة
2. **تحقق من الصلاحية في الدوال** قبل تنفيذ أي عملية حساسة
3. **استخدم `checkPageAccess`** للصفحات الحساسة
4. **المدير (admin) له كل الصلاحيات** بشكل تلقائي
5. **يمكن تخصيص الصلاحيات** لكل مستخدم من صفحة المستخدمين

---

## ❓ أسئلة شائعة

**س: كيف أضيف صلاحية جديدة؟**  
ج: افتح `js/permissions.js` وأضف الصلاحية في `ALL_PERMISSIONS`

**س: كيف أخفي زر بناءً على صلاحية؟**  
ج: أضف `data-permission="permission.name"` للزر، وسيتم إخفاؤه تلقائياً

**س: هل يمكن التحقق من عدة صلاحيات؟**  
ج: نعم، استخدم `hasAnyPermission()` أو `hasAllPermissions()`

**س: كيف أمنع الوصول لصفحة بالكامل؟**  
ج: استخدم `checkPageAccess('permission.name')` في بداية السكريبت
