# 🎯 دليل لوحة التحكم الإدارية - Platform Management

## 📋 نظرة عامة

تم تطوير نظام إدارة شامل على 3 مستويات:
1. **Platform Level** - لوحة التحكم الإدارية الرئيسية
2. **Company Level** - إدارة الشركات والمشاريع
3. **Project Level** - إدارة بيانات كل مشروع

---

## 🗄️ هيكل قواعد البيانات

### 1. Platform Database (`platform_db`)
```
platform_db/
├── admins          → مستخدمي لوحة التحكم الإدارية
└── companies       → الشركات المسجلة في المنصة
```

### 2. Company Database (`company_<subdomain>`)
```
company_balbuied/
├── projects        → مشاريع الشركة
└── users          → مستخدمي الشركة (اختياري)
```

### 3. Project Database (`project_<projectId>`)
```
project_68f8531840f380e6f4a5b561/
├── users
├── contractors
├── extracts
├── workers
├── store
├── supplies
├── suppliers
├── purchases
├── equipment
├── receipts
├── drawings
├── monthlyPays
├── externalServices
└── ... (المزيد)
```

---

## 🚀 البدء السريع

### 1. إنشاء أول Admin
```bash
node create-first-admin.js
```

**بيانات الدخول الافتراضية:**
- Username: `admin`
- Password: `admin123`

⚠️ **مهم:** يرجى تغيير كلمة المرور بعد أول تسجيل دخول!

### 2. الوصول للوحة التحكم
افتح المتصفح على:
```
http://localhost:4000/admin-panel.html
```

---

## 🎨 ميزات لوحة التحكم الإدارية

### ✅ إدارة الشركات
- ✨ عرض جميع الشركات المسجلة
- ➕ إضافة شركة جديدة مع التحقق من النطاق الفرعي
- 📊 إحصائيات فورية (نشط، معطل، منتهي)
- 🔄 تغيير حالة الشركة (Active/Suspended)
- 📅 إدارة الاشتراكات وتواريخ الانتهاء
- 🗑️ حذف الشركات

### 🔐 التحكم في الوصول
النظام يتحقق تلقائياً من:
- ✅ حالة الشركة (`status`)
- ✅ تاريخ انتهاء الاشتراك (`subscriptionEnd`)
- ❌ منع الوصول إذا كانت الحالة `suspended` أو `expired`

---

## 📡 Admin Panel APIs

### 🔑 تسجيل الدخول
```http
POST /admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "admin_token_here",
  "admin": {
    "username": "admin",
    "email": "admin@platform.com",
    "role": "superadmin"
  }
}
```

---

### 📋 عرض جميع الشركات
```http
GET /admin/companies
Authorization: Bearer admin_token_here
```

**Response:**
```json
{
  "success": true,
  "companies": [
    {
      "_id": "68f855320638a9d58f7c8f79",
      "companyName": "شركة بالبيد للمقاولات",
      "subdomain": "balbuied",
      "email": "info@balbuied.com",
      "phone": "+966501234567",
      "status": "active",
      "subscriptionPlan": "professional",
      "subscriptionEnd": "2025-12-31T00:00:00.000Z",
      "createdAt": "2025-01-20T10:30:00.000Z"
    }
  ]
}
```

---

### ➕ إضافة شركة جديدة
```http
POST /admin/companies
Authorization: Bearer admin_token_here
Content-Type: application/json

{
  "companyName": "شركة الإنشاءات الحديثة",
  "subdomain": "modern",
  "email": "info@modern.com",
  "phone": "+966509876543",
  "address": "الرياض، المملكة العربية السعودية",
  "subscriptionPlan": "professional",
  "subscriptionEnd": "2025-12-31"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إنشاء الشركة بنجاح",
  "companyId": "new_company_id_here",
  "subdomain": "modern"
}
```

---

### 🔄 تغيير حالة الشركة
```http
PUT /admin/companies/:companyId/status
Authorization: Bearer admin_token_here
Content-Type: application/json

{
  "status": "suspended"
}
```

**القيم المسموحة:** `active` | `suspended` | `expired`

---

### 📅 تحديث الاشتراك
```http
PUT /admin/companies/:companyId/subscription
Authorization: Bearer admin_token_here
Content-Type: application/json

{
  "subscriptionPlan": "enterprise",
  "subscriptionEnd": "2026-12-31"
}
```

---

### 🗑️ حذف شركة
```http
DELETE /admin/companies/:companyId
Authorization: Bearer admin_token_here
```

⚠️ **تحذير:** سيتم حذف جميع البيانات المرتبطة بالشركة!

---

## 🏢 Company-Level APIs

### 📂 عرض مشاريع الشركة
```http
GET /companies/:companyId/projects
```

### ➕ إضافة مشروع جديد
```http
POST /companies/:companyId/projects
Content-Type: application/json

{
  "projectName": "مشروع عين مكة",
  "location": "مكة المكرمة",
  "startDate": "2025-01-01",
  "budget": 5000000
}
```

---

## 🎯 Project-Level APIs

جميع APIs الخاصة بالمشاريع تتبع النمط:
```
/projects/:projectId/{entity}
```

**الكيانات المتاحة:**
- ✅ `users` - المستخدمين
- ✅ `contractors` - المقاولين
- ✅ `extracts` - المستخلصات
- ✅ `workers` - العمال
- ✅ `store` - المخزن
- ✅ `supplies` - التوريدات
- ✅ `suppliers` - الموردين
- ✅ `purchases` - المشتريات
- ✅ `equipment` - المعدات
- ✅ `receipts` - السندات
- ✅ `drawings` - الرسومات
- ✅ `monthlyPays` - الدفعات الشهرية
- ✅ `externalServices` - الخدمات الخارجية

**مثال:**
```http
GET /projects/68f8531840f380e6f4a5b561/contractors
POST /projects/68f8531840f380e6f4a5b561/contractors
PUT /projects/68f8531840f380e6f4a5b561/contractors/:id
DELETE /projects/68f8531840f380e6f4a5b561/contractors/:id
```

---

## 🔒 نظام الحماية

### Middleware الأمني
1. **Subdomain Detection** - كشف النطاق الفرعي تلقائياً
2. **Company Validation** - التحقق من وجود الشركة
3. **Status Check** - فحص حالة الشركة
4. **Subscription Check** - التحقق من انتهاء الاشتراك
5. **Access Control** - منع الوصول للشركات المعطلة

### رسالة الحظر
إذا كانت الشركة معطلة أو منتهية، ستحصل على:
```json
{
  "success": false,
  "message": "انتهى اشتراك شركتك. يرجى تجديد الاشتراك للمتابعة.",
  "status": "expired",
  "contactSupport": true
}
```

---

## 🎨 حالات الشركة (Company Status)

| الحالة | الوصف | اللون | الإجراء |
|--------|-------|-------|---------|
| `active` | نشط وجاهز للاستخدام | 🟢 أخضر | السماح بالوصول الكامل |
| `suspended` | معطل مؤقتاً | 🟡 أصفر | منع الوصول - اتصل بالإدارة |
| `expired` | انتهى الاشتراك | 🔴 أحمر | منع الوصول - تجديد الاشتراك |

---

## 📊 خطط الاشتراك

| الخطة | المدة | الميزات |
|-------|------|---------|
| `basic` | أساسية | للشركات الصغيرة |
| `professional` | احترافية | للشركات المتوسطة |
| `enterprise` | مؤسسية | للمؤسسات الكبيرة |

---

## 🔧 أدوات مساعدة (Utility Scripts)

### إنشاء Admin
```bash
node create-first-admin.js
```

### إنشاء شركة اختبارية
```bash
node create-company.js
```

### عرض مشاريع شركة
```bash
node list-projects.js
```

---

## ⚠️ تحديثات مطلوبة

### ملفات HTML تحتاج تحديث:
- [ ] `contractors.html` → استخدام `/projects/:projectId/contractors`
- [ ] `extracts.html` → استخدام `/projects/:projectId/extracts`
- [ ] `users.html` → استخدام `/projects/:projectId/users`
- [ ] `workers.html`
- [ ] `store.html`
- [ ] `supplies.html`
- [ ] `suppliers.html`
- [ ] `purchases.html`
- [ ] `equipment.html`
- [ ] `receipts.html`
- [ ] `drawings.html`

### مطلوب إضافة:
- [ ] مكون اختيار المشروع (Project Selector)
- [ ] مؤشر حالة الاشتراك في واجهة المستخدم
- [ ] نظام إشعارات لانتهاء الاشتراك
- [ ] Cron Job لفحص الاشتراكات تلقائياً

---

## 🎉 ملخص التطويرات

### ✅ تم الإنجاز:
1. ✅ إنشاء قاعدة بيانات منصة (`platform_db`)
2. ✅ إنشاء 6 APIs لإدارة الشركات
3. ✅ إنشاء 4 APIs على مستوى الشركة
4. ✅ إنشاء 150+ APIs على مستوى المشاريع
5. ✅ Middleware للتحقق من حالة الشركة
6. ✅ لوحة تحكم إدارية كاملة (HTML)
7. ✅ تعطيل جميع Collections القديمة
8. ✅ نظام اشتراكات مع تحقق تلقائي

### ⏳ قيد التنفيذ:
- تحديث واجهات HTML
- إضافة مكون اختيار المشروع
- نظام الإشعارات

---

## 📞 الدعم الفني

للمشاكل أو الاستفسارات:
1. تأكد من حالة الشركة في لوحة التحكم
2. تحقق من تاريخ انتهاء الاشتراك
3. راجع سجلات السيرفر (Server Logs)

---

**آخر تحديث:** يناير 2025  
**الإصدار:** 2.0.0 - Platform Management Edition
