# تحسينات صفحة إضافة المستخلص (add-extract.html)

## التاريخ: 30 أكتوبر 2025

## المشاكل التي تم حلها ✅

### 1. إصلاح مشاكل JSON.parse
تم إضافة validation كامل لجميع الـ fetch calls:
- ✅ التحقق من `response.ok` قبل محاولة parse
- ✅ التحقق من `content-type` للتأكد أن الـ response JSON فعلياً
- ✅ إضافة error logging واضح لتسهيل التشخيص

### 2. الدوال المُصلحة
#### في add-extract.html:
- ✅ `loadContractors()` - validation كامل + error handling
- ✅ `loadWorkItemsOptions()` - validation كامل
- ✅ `contractorSelect change event` - validation لكل fetch calls (سطر 1605 و 1627)
- ✅ `extractForm submit` - validation + error handling محسّن (سطر 3107)
- ✅ `materials dropdown fetch` - validation كامل (سطر 2284)
- ✅ `maxTotalPercent fetch` - validation كامل (سطر 3256)

### 3. نظام الصلاحيات
- ✅ إضافة `checkPagePermission('add-extract')` في DOMContentLoaded
- ✅ منع الوصول للمستخدمين بدون صلاحية
- ✅ التحقق من الصلاحية قبل تحميل أي بيانات

### 4. Server Endpoints الجديدة

#### في server.js:
تم إضافة 4 endpoints جديدة:

1. **PUT /contractors/:id/materials/deduct**
   - خصم المواد (تحديد المادة كمستخدمة في مستخلص)
   - حفظ رقم المستخلص والتاريخ
   ```javascript
   Body: {
     name: "اسم المادة",
     deductedInExtractNumber: "رقم المستخلص",
     deductedDate: "التاريخ"
   }
   ```

2. **POST /drafts**
   - حفظ المسودة
   ```javascript
   Body: {
     contractorId: "معرف المقاول",
     draftData: { ... }
   }
   ```

3. **GET /drafts/:contractorId**
   - جلب المسودة المحفوظة لمقاول محدد

4. **DELETE /drafts/:contractorId**
   - حذف المسودة

### 5. Error Handling المحسّن
- رسائل خطأ واضحة في console.error
- معالجة أفضل لحالات فشل الشبكة
- منع crash الصفحة عند استقبال HTML بدل JSON
- رسائل مفيدة للمستخدم عند حدوث أخطاء

## التحسينات الإضافية

### 1. Response Validation Pattern
تم تطبيق نفس الـ pattern في كل fetch:
```javascript
const res = await fetch(url);

if (!res.ok) {
  throw new Error(`HTTP error! status: ${res.status}`);
}

const contentType = res.headers.get('content-type');
if (!contentType || !contentType.includes('application/json')) {
  throw new Error('Response is not JSON');
}

const data = await res.json();
```

### 2. Consistent Error Handling
```javascript
try {
  // fetch and process
} catch (err) {
  console.error('Specific error message:', err);
  // User-friendly fallback
}
```

## التأثير على الأداء
- ✅ منع أخطاء JSON.parse التي تسبب crash
- ✅ تحسين تجربة المستخدم مع رسائل خطأ واضحة
- ✅ حماية من HTML errors (مثل 502 Bad Gateway)
- ✅ تسجيل أفضل للأخطاء لتسهيل الصيانة

## التوافق مع النظام الجديد
- ✅ متوافق مع نظام الصلاحيات الجديد
- ✅ متوافق مع النظام الجديد للـ API
- ✅ يستخدم نفس الـ pattern المتبع في باقي الصفحات
- ✅ جاهز للنشر على Railway

## الملفات المعدلة
1. `add-extract.html` - 130 سطر تم تعديلهم
2. `server.js` - تم إضافة 123 سطر جديد

## Commits
- `cd6ab22` - Fix add-extract.html: Add response validation and permissions check
- `c90497f` - Complete add-extract.html fixes and add missing server endpoints

## ملاحظات مهمة
⚠️ **المسودات حالياً:**
- الـ endpoints موجودة لكن تحتاج collection منفصل في MongoDB
- حالياً تستخدم localStorage في المتصفح
- يُفضل إنشاء `drafts` collection في المستقبل

⚠️ **خصم المواد:**
- يتم تلقائياً عند حفظ المستخلص
- يُحفظ رقم المستخلص في بيانات المادة
- المواد المخصومة لا تظهر في القوائم الجديدة

## الخطوات التالية (اختياري)
1. إنشاء `drafts` collection في MongoDB
2. ربط نظام المسودات بالـ database
3. إضافة إشعارات عند خصم المواد
4. تحسين UI لعرض حالة المواد (متاحة/مخصومة)

---
**الحالة:** ✅ جاهز للاستخدام
**التاريخ:** 30 أكتوبر 2025
**المطور:** GitHub Copilot
