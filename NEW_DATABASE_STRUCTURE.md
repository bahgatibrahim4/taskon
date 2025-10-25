# 🏗️ هيكل قاعدة البيانات الجديد

## المفهوم
كل **مشروع** له **قاعدة بيانات خاصة بيه** منفصلة تماماً.

---

## 📊 التقسيم

### 1️⃣ **قاعدة بيانات الشركة**
```
company_<subdomain>
  └── projects (Collection)
      - قائمة المشاريع
```

**مثال:**
```
company_mosbah
  └── projects
      - { _id: "67123abc", projectName: "مشروع العمارة", ... }
      - { _id: "67123def", projectName: "مشروع الفيلا", ... }
```

---

### 2️⃣ **قاعدة بيانات كل مشروع**
```
project_<projectId>
  ├── users               - مستخدمين المشروع
  ├── contractors         - المقاولين
  ├── extracts            - المستخلصات
  ├── workers             - العمال
  ├── store               - المخزن
  ├── supplies            - التوريدات
  ├── suppliers           - الموردين
  ├── purchases           - المشتريات
  ├── monthlyPays         - القبض الشهري
  ├── pays                - القبض
  ├── equipment           - المعدات
  ├── receipts            - الإيصالات
  ├── drawings            - المخططات
  ├── contractAddons      - ملاحق العقود
  ├── supplyAddons        - ملاحق التوريد
  ├── letters             - الخطابات
  ├── estimates           - التقديرات
  ├── chats               - المحادثات
  └── notifications       - الإشعارات
```

**مثال:**
```
project_67123abc
  ├── users
  │   - { username: "احمد", role: "admin", ... }
  │   - { username: "محمد", role: "user", ... }
  │
  ├── contractors
  │   - { name: "مقاول البناء", ... }
  │
  └── extracts
      - { number: 1, contractor: "...", ... }
```

---

## 🔌 استخدام الـ API

### الطريقة القديمة ❌
```javascript
GET /users
GET /contractors
GET /extracts
```

### الطريقة الجديدة ✅
```javascript
// Users
GET    /projects/:projectId/users
POST   /projects/:projectId/users
PUT    /projects/:projectId/users/:userId/permissions
DELETE /projects/:projectId/users/:userId

// Contractors
GET    /projects/:projectId/contractors
GET    /projects/:projectId/contractors/:id
POST   /projects/:projectId/contractors
PUT    /projects/:projectId/contractors/:id
DELETE /projects/:projectId/contractors/:id

// Extracts
GET    /projects/:projectId/extracts
GET    /projects/:projectId/extracts/:id
POST   /projects/:projectId/extracts
PUT    /projects/:projectId/extracts/:id
DELETE /projects/:projectId/extracts/:id
```

---

## 💻 استخدام في الكود (Server)

### الحصول على Project Database
```javascript
const projectDb = req.getProjectDb(projectId);

// استخدام Collections
const users = await projectDb.users.find().toArray();
const contractors = await projectDb.contractors.find().toArray();
const extracts = await projectDb.extracts.find().toArray();
```

### مثال كامل
```javascript
app.get('/projects/:projectId/workers', async (req, res) => {
  const { projectId } = req.params;
  
  const projectDb = req.getProjectDb(projectId);
  if (!projectDb) {
    return res.status(400).json({ error: 'Invalid project ID' });
  }
  
  const workers = await projectDb.workers.find().toArray();
  res.json(workers);
});
```

---

## 📝 ملاحظات مهمة

### ✅ المميزات
1. **عزل كامل** - كل مشروع منفصل تماماً
2. **أمان أعلى** - لا يمكن الوصول لبيانات مشروع من مشروع آخر
3. **سهولة النسخ الاحتياطي** - يمكن عمل backup لمشروع واحد
4. **المرونة** - يمكن حذف/نقل/أرشفة مشروع كامل بسهولة
5. **الأداء** - كل مشروع له indexes خاصة به

### ⚠️ يجب تحديثه
الصفحات التالية تحتاج تحديث للـ API الجديد:
- [ ] `users.html`
- [ ] `contractors.html`
- [ ] `extracts.html`
- [ ] `workers.html`
- [ ] `store.html`
- [ ] `supplies.html`
- [ ] `suppliers.html`
- [ ] `purchases.html`
- [ ] `equipment.html`
- [ ] `receipts.html`
- [ ] `drawings.html`
- [ ] `monthly-pay.html`

---

## 🚀 الخطوات القادمة

1. ✅ إنشاء Project APIs (Users, Contractors, Extracts) - **تم**
2. ⏳ إضافة باقي الـ APIs (Workers, Store, Supplies, إلخ)
3. ⏳ تحديث الصفحات الـ HTML لاستخدام الـ APIs الجديدة
4. ⏳ إضافة Project Selector في الـ Frontend
5. ⏳ Migration script لنقل البيانات القديمة

---

## 📌 مثال عملي

### إنشاء مشروع جديد
```javascript
POST /projects
{
  "projectName": "مشروع العمارة السكنية",
  "projectCode": "PRJ-001",
  "location": "القاهرة",
  "startDate": "2025-01-01"
}

// Response:
{
  "success": true,
  "projectId": "67123abc"
}
```

### إضافة مستخدم للمشروع
```javascript
POST /projects/67123abc/users
{
  "username": "ahmed",
  "password": "123456",
  "email": "ahmed@example.com",
  "jobTitle": "مهندس موقع"
}

// Response:
{
  "success": true,
  "userId": "user123",
  "isFirstUser": true  // أول مستخدم = مدير
}
```

### جلب مقاولين المشروع
```javascript
GET /projects/67123abc/contractors

// Response:
[
  {
    "_id": "cont1",
    "name": "مقاول البناء",
    "projectId": "67123abc",
    ...
  }
]
```
