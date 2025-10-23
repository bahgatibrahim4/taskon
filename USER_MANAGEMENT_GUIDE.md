# 🎯 نظام إدارة المستخدمين والمشاريع - دليل الاستخدام

## 📋 نظرة عامة

تم تنفيذ نظام كامل لإدارة الشركات والمستخدمين والمشاريع بصلاحيات محددة:

```
🏢 Company (شركة)
  └── 👤 Admin User (مدير الشركة) - يرى كل المشاريع
       ├── 📁 Project 1
       │    ├── 👤 User A (يرى Project 1 فقط)
       │    └── 👤 User B (يرى Project 1 فقط)
       └── 📁 Project 2
            └── 👤 User C (يرى Project 2 فقط)
```

---

## ✅ الميزات المنفذة

### 1. إنشاء Admin تلقائياً عند إضافة شركة
عند إنشاء شركة جديدة:
- ✅ يتم إنشاء مستخدم Admin تلقائياً
- ✅ Username: `admin_{subdomain}`
- ✅ Password: `123456` (افتراضي - يجب تغييره)
- ✅ Role: `admin`
- ✅ يرى **جميع المشاريع** للشركة

### 2. نظام الأدوار (Roles)
- **Admin** (`role: 'admin'`)
  - يرى جميع المشاريع
  - يقدر ينشئ مشاريع
  - يقدر يضيف مستخدمين
  - يقدر يعين مشاريع للمستخدمين

- **User** (`role: 'user'`)
  - يرى المشاريع المخصصة له فقط
  - لا يقدر ينشئ مشاريع
  - يقدر يعمل في المشاريع المعينة له

### 3. تعيين المشاريع للمستخدمين
- كل مستخدم له `projectIds` - مصفوفة من IDs المشاريع
- Admin يقدر يعين أي مشروع لأي مستخدم
- المستخدم يشوف المشاريع المعينة له فقط

---

## 🚀 كيفية الاستخدام

### الخطوة 1: إنشاء شركة جديدة

**1. افتح لوحة التحكم:**
```
http://localhost:4000/admin-dashboard.html
```

**2. أضف شركة جديدة:**
- اذهب لقسم "إدارة الشركات"
- اضغط "➕ إضافة شركة جديدة"
- املأ البيانات:
  ```
  اسم الشركة: شركة الاختبار
  البريد: test@company.com
  الاشتراك: احترافي
  ```

**3. ستحصل على:**
```json
{
  "success": true,
  "companyId": "67250...",
  "subdomain": "shrk-alkotbar",
  "fullUrl": "http://shrk-alkotbar.taskon.local:4000",
  "adminUser": {
    "username": "admin_shrk-alkotbar",
    "password": "123456",
    "email": "test@company.com"
  }
}
```

**مهم:** احفظ بيانات Admin!

---

### الخطوة 2: تسجيل الدخول كـ Admin

**1. افتح صفحة تسجيل الدخول:**
```
http://shrk-alkotbar.taskon.local:4000/login.html
```

**2. سجل دخول بـ:**
```
البريد: test@company.com
كلمة المرور: 123456
```

**3. بعد الدخول:**
- ستدخل كـ Admin للشركة
- يتم حفظ بياناتك في localStorage:
  ```javascript
  {
    role: "admin",
    companyId: "67250...",
    userId: "67251..."
  }
  ```

---

### الخطوة 3: إنشاء مشاريع

**كـ Admin:**

**1. افتح صفحة المشاريع:**
```
http://shrk-alkotbar.taskon.local:4000/projects.html
```

**2. أنشئ مشروع جديد:**
```
اسم المشروع: مشروع البناء - المرحلة الأولى
الموقع: القاهرة
```

**3. أنشئ مشروع آخر:**
```
اسم المشروع: مشروع الطرق - المرحلة الثانية
الموقع: الإسكندرية
```

الآن لديك مشروعين:
- Project 1: `project_id_1`
- Project 2: `project_id_2`

---

### الخطوة 4: إضافة مستخدمين

**استخدم API مباشرة (أو أنشئ واجهة):**

#### إضافة مستخدم للمشروع الأول:

**POST** `http://localhost:4000/users`

```json
{
  "username": "ahmed_engineer",
  "email": "ahmed@company.com",
  "password": "123456",
  "companyId": "67250...",
  "role": "user",
  "projectIds": ["project_id_1"]
}
```

**النتيجة:**
- ✅ مستخدم جديد: ahmed_engineer
- ✅ يشوف المشروع الأول فقط
- ✅ لا يشوف المشروع الثاني

#### إضافة مستخدم للمشروع الثاني:

```json
{
  "username": "mohamed_supervisor",
  "email": "mohamed@company.com",
  "password": "123456",
  "companyId": "67250...",
  "role": "user",
  "projectIds": ["project_id_2"]
}
```

**النتيجة:**
- ✅ مستخدم جديد: mohamed_supervisor
- ✅ يشوف المشروع الثاني فقط
- ✅ لا يشوف المشروع الأول

#### إضافة مستخدم لمشروعين:

```json
{
  "username": "sara_manager",
  "email": "sara@company.com",
  "password": "123456",
  "companyId": "67250...",
  "role": "user",
  "projectIds": ["project_id_1", "project_id_2"]
}
```

**النتيجة:**
- ✅ مستخدم جديد: sara_manager
- ✅ يشوف المشروعين

---

### الخطوة 5: تعيين/تعديل مشاريع لمستخدم موجود

**PUT** `http://localhost:4000/users/{userId}/assign-projects`

```json
{
  "projectIds": ["project_id_1", "project_id_2"]
}
```

**مثال باستخدام JavaScript:**

```javascript
async function assignProjects(userId, projectIds) {
  const response = await fetch(`http://localhost:4000/users/${userId}/assign-projects`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectIds })
  });
  
  const result = await response.json();
  console.log(result);
}

// تعيين مشروعين لمستخدم
assignProjects('user_id_123', ['project_id_1', 'project_id_2']);
```

---

### الخطوة 6: تسجيل الدخول كمستخدم عادي

**1. افتح صفحة Login:**
```
http://shrk-alkotbar.taskon.local:4000/login.html
```

**2. سجل دخول كـ ahmed_engineer:**
```
البريد: ahmed@company.com
كلمة المرور: 123456
```

**3. افتح صفحة المشاريع:**
```
http://shrk-alkotbar.taskon.local:4000/projects.html
```

**النتيجة:**
- ✅ يشوف المشروع الأول فقط
- ❌ لا يشوف المشروع الثاني

---

## 🔧 API Endpoints الجديدة

### 1. POST /users (محدّث)
**إنشاء مستخدم مع تعيين مشاريع:**

```javascript
POST /users
{
  "username": "user_name",
  "email": "user@email.com",
  "password": "123456",
  "companyId": "company_id",
  "role": "user",  // أو "admin"
  "projectIds": ["project_id_1", "project_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "userId": "67251...",
  "companyId": "67250...",
  "role": "user"
}
```

---

### 2. PUT /users/:id/assign-projects (جديد)
**تعيين مشاريع لمستخدم موجود:**

```javascript
PUT /users/{userId}/assign-projects
{
  "projectIds": ["project_id_1", "project_id_2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تعيين المشاريع للمستخدم بنجاح"
}
```

---

### 3. GET /projects (محدّث)
**جلب المشاريع حسب role المستخدم:**

**للـ Admin (يرى كل المشاريع):**
```javascript
GET /projects?companyId=67250...&userRole=admin
```

**للـ User (يرى المشاريع المخصصة له فقط):**
```javascript
GET /projects?companyId=67250...&userId=67251...&userRole=user
```

**Response:**
```json
[
  {
    "_id": "project_id_1",
    "projectName": "مشروع البناء",
    "companyId": "67250..."
  }
]
```

---

### 4. POST /companies (محدّث)
**إنشاء شركة + Admin تلقائياً:**

```javascript
POST /companies
{
  "companyName": "شركة جديدة",
  "email": "company@email.com",
  "subscription": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "companyId": "67250...",
  "subdomain": "shrk-jdyd",
  "fullUrl": "http://shrk-jdyd.taskon.local:4000",
  "adminUser": {
    "username": "admin_shrk-jdyd",
    "password": "123456",
    "email": "company@email.com"
  }
}
```

---

## 💻 كود JavaScript للاستخدام في Frontend

### تسجيل الدخول وحفظ بيانات المستخدم:

```javascript
async function login(email, password) {
  const response = await fetch('http://localhost:4000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const result = await response.json();
  
  if (result.success) {
    const user = result.user;
    
    // حفظ بيانات المستخدم
    localStorage.setItem('user', JSON.stringify({
      userId: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      projectIds: user.projectIds || []
    }));
    
    // Redirect حسب الدور
    if (user.role === 'admin') {
      window.location.href = 'projects.html'; // Admin يرى كل المشاريع
    } else {
      window.location.href = 'projects.html'; // User يرى مشاريعه فقط
    }
  }
}
```

---

### جلب المشاريع حسب دور المستخدم:

```javascript
async function loadProjects() {
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!user) {
    window.location.href = 'login.html';
    return;
  }
  
  let url = `http://localhost:4000/projects?companyId=${user.companyId}`;
  
  // إضافة userId و userRole للفلترة
  if (user.role !== 'admin') {
    url += `&userId=${user.userId}&userRole=${user.role}`;
  } else {
    url += `&userRole=admin`;
  }
  
  const response = await fetch(url);
  const projects = await response.json();
  
  console.log(`Projects for ${user.username}:`, projects);
  
  // عرض المشاريع في الصفحة
  displayProjects(projects);
}
```

---

### إنشاء مستخدم مع تعيين مشاريع:

```javascript
async function createUser(userData, selectedProjectIds) {
  const user = JSON.parse(localStorage.getItem('user'));
  
  // التحقق من أن المستخدم الحالي admin
  if (user.role !== 'admin') {
    alert('فقط المدير يقدر يضيف مستخدمين!');
    return;
  }
  
  const newUser = {
    username: userData.username,
    email: userData.email,
    password: userData.password,
    companyId: user.companyId,
    role: 'user', // المستخدمين الجدد يكونوا user
    projectIds: selectedProjectIds
  };
  
  const response = await fetch('http://localhost:4000/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert(`تم إضافة المستخدم بنجاح!\nUsername: ${newUser.username}\nPassword: ${newUser.password}`);
  }
}
```

---

## 📊 مثال عملي كامل

### السيناريو:
شركة "BAHGAT" لها 3 مشاريع:
1. مشروع الأبراج
2. مشروع الطرق
3. مشروع المدارس

والمستخدمين:
1. **Admin** (المدير) - يرى الـ 3 مشاريع
2. **أحمد** (مهندس) - يشتغل في مشروع الأبراج فقط
3. **محمد** (مهندس) - يشتغل في مشروع الطرق فقط
4. **سارة** (مديرة مشاريع) - تشرف على الأبراج والطرق

### تنفيذ:

**1. إنشاء الشركة:**
```javascript
// تم تلقائياً: admin_bahgat
```

**2. Admin ينشئ المشاريع:**
```javascript
// Project 1: ID = "proj_001"
// Project 2: ID = "proj_002"  
// Project 3: ID = "proj_003"
```

**3. Admin يضيف المستخدمين:**
```javascript
// أحمد - مشروع الأبراج فقط
createUser({
  username: 'ahmed',
  email: 'ahmed@bahgat.com',
  password: '123456'
}, ['proj_001']);

// محمد - مشروع الطرق فقط
createUser({
  username: 'mohamed',
  email: 'mohamed@bahgat.com',
  password: '123456'
}, ['proj_002']);

// سارة - الأبراج والطرق
createUser({
  username: 'sara',
  email: 'sara@bahgat.com',
  password: '123456'
}, ['proj_001', 'proj_002']);
```

**4. النتائج:**

| المستخدم | يرى المشاريع |
|---------|--------------|
| admin_bahgat | الأبراج، الطرق، المدارس (الكل) |
| ahmed | الأبراج فقط |
| mohamed | الطرق فقط |
| sara | الأبراج، الطرق |

---

## 🎯 الخطوات القادمة (للتطوير)

### 1. واجهة إدارة المستخدمين
- صفحة لعرض جميع المستخدمين
- تعديل/حذف مستخدمين
- تعيين/إزالة مشاريع

### 2. واجهة تعيين المشاريع
- Checkbox list للمشاريع
- تعيين مشاريع متعددة للمستخدم
- عرض المشاريع المخصصة لكل مستخدم

### 3. تحسين الأمان
- تشفير كلمات المرور (bcrypt)
- JWT Tokens بدلاً من localStorage
- Session management

---

## ✅ الملخص

تم تنفيذ:
- ✅ إنشاء Admin تلقائياً مع كل شركة
- ✅ نظام الأدوار (Admin/User)
- ✅ تعيين مشاريع للمستخدمين
- ✅ فلترة المشاريع حسب دور المستخدم
- ✅ API كامل للإدارة

**النظام جاهز للاستخدام! 🚀**

---

**Happy Coding! 🎉**
