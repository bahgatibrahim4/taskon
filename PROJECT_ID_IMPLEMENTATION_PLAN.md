# خطة تطبيق ProjectID في كل المشروع

## 🎯 الهدف
إضافة `projectId` في جميع العمليات (إضافة/تعديل/حذف/جلب) لضمان عزل بيانات كل مشروع

## 📋 خطة العمل

### 1. السيرفر (server.js)
- ✅ إضافة middleware لاستخراج `projectId` من headers
- ✅ تحديث جميع GET endpoints لتفلتر حسب `projectId`
- ✅ تحديث جميع POST endpoints لإضافة `projectId` تلقائياً
- ✅ تحديث PUT/DELETE للتحقق من `projectId`

### 2. الصفحات الرئيسية

#### المستخلصات (Extracts)
- `add-extract.html` - إضافة مستخلص
- `list-extracts.html` - عرض المستخلصات
- `extract.html` - تفاصيل المستخلص

#### المقاولون (Contractors)
- `add-contractor.html` - إضافة مقاول
- `list-contractors.html` - عرض المقاولين
- `contractor.html` - تفاصيل المقاول

#### العمال (Workers)
- `workers.html` - إدارة العمال

#### المخزن (Store)
- `store.html` - المخزن
- `store-report.html` - تقارير المخزن

#### التوريدات (Supplies)
- `supplies.html` - التوريدات
- `suppliers.html` - الموردين
- `supplier-details.html` - تفاصيل المورد

#### المشتريات (Purchases)
- `purchases.html` - المشتريات

#### المعدات (Equipment)
- `equipments.html` - المعدات

#### سندات الاستلام (Receipts)
- `receipts.html` - سندات الاستلام

#### الدفعات (Payments)
- `monthly-pay.html` - الدفعات الشهرية
- `month-details.html` - تفاصيل الشهر

### 3. التنفيذ

#### الخطوة 1: إضافة Middleware في السيرفر
```javascript
// Middleware لإضافة projectId من headers
app.use((req, res, next) => {
  const projectId = req.headers['x-project-id'] || req.query.projectId;
  if (projectId) {
    req.projectId = projectId;
  }
  next();
});
```

#### الخطوة 2: إنشاء دالة مساعدة في كل صفحة
```javascript
// في كل صفحة HTML
const currentProjectId = localStorage.getItem('currentProjectId');

// دالة مساعدة للـ fetch مع projectId
async function fetchWithProject(url, options = {}) {
  options.headers = {
    ...options.headers,
    'X-Project-ID': currentProjectId,
    'Content-Type': 'application/json'
  };
  return fetch(url, options);
}
```

#### الخطوة 3: تحديث كل endpoint
- GET: إضافة `?projectId=${currentProjectId}`
- POST: إضافة `projectId` في body
- PUT/DELETE: التحقق من `projectId`

## 📊 الأولويات

### 🔴 عالية (High Priority)
1. المستخلصات - الأكثر استخداماً
2. المقاولون - مرتبط بالمستخلصات
3. العمال - بيانات أساسية

### 🟡 متوسطة (Medium Priority)
4. المخزن والتوريدات
5. المعدات
6. سندات الاستلام

### 🟢 منخفضة (Low Priority)
7. الدفعات الشهرية
8. التقارير

## ✅ الحالة الحالية
- ✅ المستخدمون (Users) - تم إضافة projectIds
- ✅ المشاريع (Projects) - تم إضافة companyId
- ⏳ باقي الصفحات - قيد التنفيذ
