# 🔔 نظام الإشعارات - دليل الاستخدام

## نظرة عامة
نظام إشعارات متكامل يتيح إرسال إشعارات للمستخدمين عند تنفيذ عمليات مختلفة (إضافة، تعديل، حذف) في الصفحات المختلفة.

---

## المكونات الرئيسية

### 1. قاعدة البيانات
- **Collection:** `notifications` - تخزين الإشعارات
- **Collection:** `notification_settings` - تخزين إعدادات الإشعارات

### 2. APIs الرئيسية

#### إدارة الإشعارات
```javascript
POST   /notifications                      // إنشاء إشعار
GET    /notifications/:userId              // جلب إشعارات مستخدم
GET    /notifications/:userId/unread-count // عدد الإشعارات غير المقروءة
PUT    /notifications/:id/read             // تعليم إشعار كمقروء
PUT    /notifications/:userId/read-all     // تعليم الكل كمقروء
DELETE /notifications/:id                  // حذف إشعار
DELETE /notifications/:userId/clear-read   // مسح الإشعارات المقروءة
```

#### إعدادات الإشعارات
```javascript
POST   /notification-settings              // حفظ الإعدادات
GET    /notification-settings               // جلب الإعدادات
```

### 3. الواجهات

#### مركز التحكم في الإشعارات
**الملف:** `notifications-center.html`

**المميزات:**
- ✅ تفعيل/تعطيل كل نوع إشعار
- 👥 اختيار المستخدمين المحددين لكل إشعار
- 🔐 فلترة المستخدمين حسب الصلاحيات تلقائياً
- 📊 إحصائيات (عدد الإشعارات المفعّلة)
- 💾 حفظ الإعدادات على السيرفر

#### أيقونة الإشعارات في الشريط العلوي
**الملف:** `components/main-navbar.html`

**المميزات:**
- 🔔 أيقونة جرس الإشعارات
- 🔴 Badge يظهر عدد الإشعارات غير المقروءة
- 📋 قائمة منسدلة لعرض آخر 20 إشعار
- ✅ تعليم الكل كمقروء
- 🗑️ مسح الإشعارات المقروءة
- 🔄 تحديث تلقائي كل 30 ثانية

---

## أنواع الإشعارات المتاحة

### المستخلصات
- `extract-add` - إضافة مستخلص (الصلاحية: extracts-view)
- `extract-edit` - تعديل مستخلص (الصلاحية: extracts-edit)
- `extract-delete` - حذف مستخلص (الصلاحية: extracts-delete)

### المقاولين
- `contractor-add` - إضافة مقاول (الصلاحية: contractors-view)
- `contractor-edit` - تعديل مقاول (الصلاحية: contractors-edit)
- `contractor-delete` - حذف مقاول (الصلاحية: contractors-delete)

### القبض الشهري
- `pay-add` - إضافة قبض (الصلاحية: workers-monthly-pay-view)
- `pay-save` - حفظ الشهر (الصلاحية: workers-monthly-pay-edit)
- `pay-delete` - حذف قبض (الصلاحية: workers-monthly-pay-delete)

### العمال
- `worker-add` - إضافة عامل (الصلاحية: workers-add)
- `worker-edit` - تعديل عامل (الصلاحية: workers-edit)
- `worker-delete` - حذف عامل (الصلاحية: workers-delete)

### المشتريات والموردين
- `purchase-add` - إضافة مشتريات (الصلاحية: purchases-view)
- `supplier-add` - إضافة مورد (الصلاحية: suppliers-view)

---

## كيفية الاستخدام

### 1. إعداد الإشعارات (مسؤول النظام)

1. افتح `notifications-center.html`
2. لكل نوع إشعار:
   - فعّل/عطّل الإشعار باستخدام المفتاح
   - اختر المستخدمين الذين سيستلمون الإشعار
   - (سيظهر فقط المستخدمين الذين لديهم الصلاحية المطلوبة)
3. اضغط **حفظ الإعدادات**

### 2. إضافة إشعار في صفحة جديدة

#### مثال: إضافة إشعار عند حفظ مستخلص

```javascript
// في نهاية دالة حفظ المستخلص
if (res.ok) {
  const result = await res.json();
  
  // إرسال إشعار
  if (window.sendNotification) {
    await window.sendNotification(
      'extract-add',                          // نوع الإشعار
      `تم إضافة مستخلص رقم ${extractNumber}`, // نص الرسالة
      'extracts',                             // الصفحة المصدر
      result._id                              // معرف العنصر
    );
  }
  
  alert('تم الحفظ بنجاح');
}
```

#### مثال: إضافة إشعار عند تعديل مقاول

```javascript
// في نهاية دالة تحديث المقاول
if (finalRes.ok) {
  // إرسال إشعار
  if (window.sendNotification) {
    await window.sendNotification(
      'contractor-edit',
      `تم تعديل بيانات المقاول: ${contractorName}`,
      'contractors',
      contractorId
    );
  }
  
  alert('تم التعديل بنجاح');
}
```

#### مثال: إضافة إشعار عند حذف عامل

```javascript
// عند حذف عامل
async function deleteWorker(workerId, workerName) {
  const res = await fetch(`/workers/${workerId}`, {
    method: 'DELETE'
  });
  
  if (res.ok) {
    // إرسال إشعار
    if (window.sendNotification) {
      await window.sendNotification(
        'worker-delete',
        `تم حذف العامل: ${workerName}`,
        'workers',
        workerId
      );
    }
    
    alert('تم الحذف بنجاح');
  }
}
```

---

## آلية عمل النظام

### 1. إرسال الإشعار
```
الصفحة → window.sendNotification()
         ↓
    جلب الإعدادات من السيرفر
         ↓
    فحص: هل الإشعار مفعّل؟
         ↓
    جلب قائمة المستخدمين المحددين
         ↓
    إرسال إشعار لكل مستخدم
         ↓
    حفظ في قاعدة البيانات
```

### 2. استقبال الإشعار
```
المستخدم يفتح أي صفحة
         ↓
    التحقق من الإشعارات غير المقروءة
         ↓
    عرض العدد في badge الجرس
         ↓
    المستخدم يضغط على الجرس
         ↓
    عرض قائمة الإشعارات
         ↓
    النقر على إشعار → تعليمه كمقروء
```

### 3. الفلترة حسب الصلاحيات
```
نوع الإشعار → الصلاحية المطلوبة
         ↓
    جلب جميع المستخدمين
         ↓
    فلترة المستخدمين حسب الصلاحية
         ↓
    عرض فقط المستخدمين المؤهلين
         ↓
    اختيار المستخدمين المحددين
```

---

## التخصيص والإضافات

### إضافة نوع إشعار جديد

#### 1. في `notifications-center.html`
أضف في قائمة `notificationPermissions`:
```javascript
const notificationPermissions = {
  // ... الإشعارات الموجودة
  'new-type': 'required-permission', // نوع جديد
};
```

#### 2. في HTML (notifications-center.html)
أضف card جديد:
```html
<div class="notification-card" data-type="new-type">
  <div class="card-header">
    <div class="card-title">
      <span>🆕</span>
      <span>عنوان الإشعار</span>
    </div>
    <div class="toggle-switch"></div>
  </div>
  <div class="card-description">
    وصف الإشعار
  </div>
  <!-- سيتم إضافة users-selector تلقائياً -->
</div>
```

#### 3. في الصفحة المطلوبة
استخدم `window.sendNotification()`:
```javascript
await window.sendNotification(
  'new-type',
  'رسالة الإشعار',
  'source-page',
  'item-id'
);
```

#### 4. في `main-navbar.html`
أضف أيقونة للنوع الجديد في دالة `getNotificationIcon()`:
```javascript
function getNotificationIcon(type) {
  const icons = {
    // ... الأيقونات الموجودة
    'new-type': '🆕'
  };
  return icons[type] || '📢';
}
```

---

## الملفات المعدّلة

### ملفات السيرفر
- ✅ `server.js` - إضافة APIs الإشعارات والإعدادات

### ملفات الواجهة
- ✅ `notifications-center.html` - مركز التحكم
- ✅ `components/main-navbar.html` - أيقونة وقائمة الإشعارات
- ✅ `add-extract.html` - مثال: إشعار إضافة مستخلص
- ✅ `extract.html` - مثال: إشعار تعديل مستخلص

---

## الصيانة والتطوير المستقبلي

### تحسينات مقترحة
- [ ] Real-time notifications باستخدام WebSocket
- [ ] إشعارات سطح المكتب (Desktop Notifications)
- [ ] فلترة الإشعارات حسب النوع/التاريخ
- [ ] صفحة سجل الإشعارات الكامل
- [ ] إحصائيات متقدمة عن الإشعارات

### أفضل الممارسات
1. ✅ دائماً تحقق من وجود `window.sendNotification` قبل الاستخدام
2. ✅ أرسل رسائل واضحة ومفيدة
3. ✅ حدد الصفحة المصدر و ID العنصر للربط
4. ✅ لا ترسل إشعارات للعمليات البسيطة جداً
5. ✅ اختبر الإشعارات بعد كل إضافة

---

## الدعم والمساعدة

إذا واجهت مشاكل:
1. تحقق من console المتصفح للأخطاء
2. تأكد من تشغيل السيرفر بشكل صحيح
3. تحقق من الصلاحيات في `users.html`
4. راجع الإعدادات في `notifications-center.html`

---

**تم التطوير بواسطة:** GitHub Copilot 🤖
**التاريخ:** أكتوبر 2025
