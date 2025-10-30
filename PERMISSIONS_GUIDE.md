# نظام الصلاحيات - دليل التنفيذ

## ✅ تم تفعيل الصلاحيات في:

### 1. **index.html (الصفحة الرئيسية)**
- ✅ إضافة `permissions-check.js`
- ✅ إضافة `data-permission` لجميع الكاردات
- ✅ نظام إخفاء الكاردات بناءً على الصلاحيات

### 2. **drawings.html (المخططات)**
- ✅ إضافة `permissions-check.js`
- ✅ حماية زر "إضافة مخطط" - `drawings-add`
- ✅ حماية زر "تعديل" - `drawings-edit`
- ✅ حماية زر "حذف" - `drawings-delete`
- ✅ فحص صلاحية الوصول للصفحة - `drawings-access`

### 3. **users.html (المستخدمين)**
- ✅ نظام صلاحيات شامل مع 10 تبويبات
- ✅ صلاحيات لجميع الصفحات
- ✅ صلاحيات كاردات الرئيسية

---

## 🔄 الصفحات المتبقية التي تحتاج ربط الصلاحيات:

### الأولوية العالية:
1. **add-extract.html** - صلاحيات إضافة المستخلصات
2. **list-extracts.html** - صلاحيات قائمة المستخلصات
3. **add-contractor.html** - صلاحيات إضافة مقاول
4. **list-contractors.html** - صلاحيات قائمة المقاولين

### الأولوية المتوسطة:
5. **store.html** - صلاحيات المخزن
6. **purchases.html** - صلاحيات المشتريات
7. **workers.html** - صلاحيات العمالة
8. **suppliers.html** - صلاحيات الموردين

### الأولوية المنخفضة:
9. **receipts.html** - صلاحيات الإيصالات
10. **equipments.html** - صلاحيات المعدات
11. **monthly-pay.html** - صلاحيات الرواتب

---

## 📋 خطوات ربط الصلاحيات لكل صفحة:

### 1. إضافة السكريبت في `<head>`:
```html
<script src="permissions-check.js"></script>
```

### 2. إضافة `data-permission` للأزرار:
```html
<!-- زر الإضافة -->
<button data-permission="page-add">إضافة</button>

<!-- زر التعديل -->
<button data-permission="page-edit" onclick="edit()">تعديل</button>

<!-- زر الحذف -->
<button data-permission="page-delete" onclick="delete()">حذف</button>
```

### 3. إخفاء الأزرار في JavaScript:
```javascript
// في دالة renderTable أو renderList
<button onclick="edit('${id}')" 
  data-permission="page-edit"
  ${!hasPermission('page-edit') ? 'style="display:none"' : ''}>
  تعديل
</button>
```

---

## 🎯 قائمة الصلاحيات الكاملة:

### المستخلصات:
- `add-extract-access` - الوصول لصفحة إضافة مستخلص
- `add-extract-create` - إنشاء مستخلص جديد
- `add-extract-edit` - تعديل المستخلص
- `add-extract-add-workitem` - إضافة بنود أعمال
- `add-extract-edit-workitem` - تعديل بنود الأعمال
- `add-extract-delete-workitem` - حذف بنود الأعمال
- `add-extract-add-lump` - إضافة مقطوعيات
- `add-extract-add-daily` - إضافة يوميات
- `add-extract-print` - طباعة المستخلص
- `list-extracts-access` - الوصول لقائمة المستخلصات
- `list-extracts-view` - عرض التفاصيل
- `list-extracts-edit` - تعديل المستخلصات
- `list-extracts-delete` - حذف المستخلصات
- `list-extracts-print` - طباعة المستخلصات

### المقاولين:
- `contractors-access` - الوصول للصفحة
- `contractors-view` - عرض المقاولين
- `contractors-add` - إضافة مقاول
- `contractors-edit` - تعديل بيانات المقاول
- `contractors-delete` - حذف مقاول
- `contractors-view-details` - عرض التفاصيل

### المخططات:
- `drawings-access` - الوصول للصفحة ✅
- `drawings-view` - عرض المخططات
- `drawings-add` - إضافة مخطط ✅
- `drawings-edit` - تعديل المخطط ✅
- `drawings-delete` - حذف مخطط ✅
- `drawings-download` - تحميل المخططات

### الموردين:
- `suppliers-access` - الوصول للصفحة
- `suppliers-view` - عرض الموردين
- `suppliers-add` - إضافة مورد
- `suppliers-edit` - تعديل بيانات المورد
- `suppliers-delete` - حذف مورد
- `suppliers-view-transactions` - عرض المعاملات

### العمالة:
- `workers-access` - الوصول للصفحة
- `workers-view` - عرض العمالة
- `workers-add` - إضافة عامل
- `workers-edit` - تعديل بيانات العامل
- `workers-delete` - حذف عامل
- `workers-monthly-pay` - رواتب شهرية

### المخزن:
- `store-access` - الوصول للصفحة
- `store-view` - عرض المخزون
- `store-add-item` - إضافة صنف
- `store-edit-item` - تعديل الصنف
- `store-delete-item` - حذف صنف
- `store-add-quantity` - إضافة كمية
- `store-withdraw` - صرف من المخزن
- `store-reports` - تقارير المخزن

### المشتريات:
- `purchases-access` - الوصول للصفحة
- `purchases-view` - عرض المشتريات
- `purchases-add` - إضافة مشترى
- `purchases-edit` - تعديل المشترى
- `purchases-delete` - حذف مشترى

### الإيصالات:
- `receipts-access` - الوصول للصفحة
- `receipts-view` - عرض الإيصالات
- `receipts-add` - إنشاء إيصال
- `receipts-edit` - تعديل الإيصال
- `receipts-delete` - حذف إيصال
- `receipts-print` - طباعة الإيصالات

### المستخدمين:
- `users-access` - الوصول للصفحة
- `users-view` - عرض المستخدمين
- `users-add` - إضافة مستخدم
- `users-edit` - تعديل المستخدم
- `users-delete` - حذف مستخدم
- `users-manage-permissions` - إدارة الصلاحيات

### كاردات الرئيسية:
- `dashboard-card-extracts` - كارد المستخلصات ✅
- `dashboard-card-contractors` - كارد المقاولين ✅
- `dashboard-card-drawings` - كارد المخططات ✅
- `dashboard-card-suppliers` - كارد الموردين ✅
- `dashboard-card-workers` - كارد العمالة ✅
- `dashboard-card-store` - كارد المخزن ✅
- `dashboard-card-purchases` - كارد المشتريات ✅
- `dashboard-card-receipts` - كارد الإيصالات ✅
- `dashboard-card-equipments` - كارد المعدات ✅
- `dashboard-card-users` - كارد المستخدمين ✅
- `dashboard-card-project-info` - كارد معلومات المشروع ✅
- `dashboard-card-monthly-pay` - كارد الرواتب الشهرية ✅

### إحصائيات الرئيسية:
- `dashboard-stats-total-budget` - الميزانية الإجمالية
- `dashboard-stats-spent` - المصروفات
- `dashboard-stats-remaining` - الرصيد المتبقي
- `dashboard-stats-progress` - نسبة الإنجاز

---

## 🔧 الدوال المساعدة المتاحة (من permissions-check.js):

```javascript
// فحص صلاحية واحدة
hasPermission('drawings-add')

// فحص أي صلاحية من مجموعة
hasAnyPermission('drawings-add', 'drawings-edit')

// فحص جميع الصلاحيات
hasAllPermissions('drawings-add', 'drawings-edit')

// إخفاء عنصر
hideIfNoPermission(element, 'drawings-add')

// تعطيل عنصر
disableIfNoPermission(button, 'drawings-edit')

// الحصول على جميع صلاحيات المستخدم
window.userPermissions
```

---

## ✨ المميزات المطبقة:

1. ✅ نظام صلاحيات مركزي
2. ✅ فحص تلقائي عند تحميل الصفحة
3. ✅ إعادة توجيه عند عدم وجود صلاحية
4. ✅ إخفاء/إظهار العناصر بناءً على الصلاحيات
5. ✅ تعطيل الأزرار عند عدم وجود صلاحية
6. ✅ رسائل تنبيه عند محاولة الوصول بدون صلاحية
7. ✅ نظام تبويبات متطور في صفحة المستخدمين
8. ✅ صلاحيات تفصيلية لكل صفحة
9. ✅ صلاحيات خاصة بكاردات الرئيسية

---

## 📝 ملاحظات مهمة:

1. تأكد من إضافة `<script src="permissions-check.js"></script>` في كل صفحة
2. استخدم نفس أسماء الصلاحيات الموجودة في users.html
3. يجب تحديث صلاحيات المستخدم من صفحة users.html
4. الصلاحيات تُحفظ في localStorage
5. عند تسجيل الخروج، يتم مسح جميع البيانات

---

تم إنشاء هذا الملف في: 26 أكتوبر 2025
