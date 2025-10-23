# 🚀 دليل البدء السريع لنظام النطاقات الفرعية

## ✅ ما تم إنجازه الآن

تم تنفيذ نظام النطاقات الفرعية (Subdomains) بالكامل! الآن كل شركة لها رابط خاص:

```
✅ قبل: http://localhost:4000/projects.html?companyId=123
✅ بعد: http://company1.taskon.local:4000/projects.html
```

---

## 🎯 الميزات المنفذة

### 1. Backend (server.js) ✅
- ✅ Subdomain Detection Middleware
- ✅ Company Context Middleware (يبحث عن الشركة تلقائياً)
- ✅ Auto-generation للنطاق من اسم الشركة
- ✅ دعم الأحرف العربية
- ✅ منع التكرار

### 2. Auto-Context Switching ✅
تم تحديث هذه الـ API endpoints لاستخدام `req.companyId` تلقائياً:
- ✅ `GET /projects` - جلب المشاريع للشركة من الـ subdomain
- ✅ `GET /users` - جلب المستخدمين للشركة من الـ subdomain
- ✅ `GET /extracts` - جلب المستخلصات للشركة من الـ subdomain

### 3. Admin Dashboard ✅
- ✅ عمود النطاق الفرعي في جدول الشركات
- ✅ حقل النطاق الفرعي في نموذج الإضافة
- ✅ زر نسخ الرابط (📋)
- ✅ رسالة نجاح مع الرابط الكامل

### 4. Test Page ✅
- ✅ صفحة `test-subdomain.html` لاختبار النظام

---

## 🧪 كيفية الاختبار (خطوات سريعة)

### الخطوة 1: تأكد من تشغيل السيرفر ✅
السيرفر يعمل الآن على: `http://localhost:4000`

### الخطوة 2: إنشاء شركة جديدة

1. افتح لوحة التحكم:
   ```
   http://localhost:4000/admin-dashboard.html
   ```

2. انتقل لقسم "إدارة الشركات"

3. اضغط "➕ إضافة شركة جديدة"

4. املأ البيانات:
   - **اسم الشركة**: شركة الاختبار الأولى
   - **النطاق الفرعي**: اتركه فارغاً (سيتم توليده تلقائياً)
   - **البريد**: test@example.com
   - **الاشتراك**: احترافي

5. اضغط "حفظ"

6. ستظهر رسالة تحتوي على:
   ```
   ✅ تم إضافة الشركة بنجاح!
   
   النطاق الفرعي: shrk-alakhtbar-alawl
   الرابط الكامل: http://shrk-alakhtbar-alawl.taskon.local:4000
   ```

### الخطوة 3: تعديل ملف hosts

**⚠️ مهم جداً:** يجب تشغيل PowerShell أو CMD **كمسؤول**

1. افتح PowerShell كمسؤول (Run as Administrator)

2. اكتب:
   ```powershell
   notepad C:\Windows\System32\drivers\etc\hosts
   ```

3. أضف في نهاية الملف:
   ```
   127.0.0.1 taskon.local
   127.0.0.1 shrk-alakhtbar-alawl.taskon.local
   127.0.0.1 company1.taskon.local
   127.0.0.1 company2.taskon.local
   ```

4. احفظ الملف (Ctrl+S) وأغلقه

5. امسح DNS cache:
   ```powershell
   ipconfig /flushdns
   ```

### الخطوة 4: اختبر النطاق الفرعي

1. افتح المتصفح

2. اذهب إلى صفحة الاختبار:
   ```
   http://shrk-alakhtbar-alawl.taskon.local:4000/test-subdomain.html
   ```

3. ستظهر لك:
   - ✅ معلومات النطاق الفرعي
   - ✅ معلومات الشركة
   - ✅ المشاريع المرتبطة بالشركة

### الخطوة 5: اختبر المشاريع

1. اذهب إلى:
   ```
   http://shrk-alakhtbar-alawl.taskon.local:4000/projects.html
   ```

2. ستجد أن النظام يعرض مشاريع هذه الشركة فقط تلقائياً!

---

## 🎨 كيف يعمل النظام

### 1. عند دخول رابط مثل: `http://company1.taskon.local:4000`

**الـ Middleware يقوم بـ:**
```javascript
1. اكتشاف الـ subdomain من الـ hostname → "company1"
2. البحث في قاعدة البيانات عن شركة بـ subdomain = "company1"
3. إذا وجدها، يضيف req.companyId و req.company
4. طباعة في Console: "✅ Company found: اسم الشركة (ID: xxx)"
```

### 2. عند طلب `/projects`:

**الـ API يقوم بـ:**
```javascript
1. يأخذ companyId من req.companyId (من الـ middleware)
2. إذا لم يكن موجود، يأخذه من req.query.companyId
3. يجلب المشاريع المرتبطة بهذه الشركة فقط
4. يرسل النتيجة
```

### 3. في Console ستجد:

```
🌐 Subdomain detected: company1
✅ Company found: شركة الاختبار (ID: 67250abc123def456789)
📋 GET /projects called with query: {}
✅ Found 5 projects for companyId: 67250abc123def456789 (from subdomain)
```

---

## 📊 أمثلة على التوليد التلقائي

| اسم الشركة | النطاق المولد |
|------------|---------------|
| شركة المقاولات الكبرى | `shrk-almqawlat-alkbr` |
| ACME Construction | `acme-construction` |
| شركة النصر للتعمير | `shrk-alnsr-lltamir` |
| Test Company 123 | `test-company-123` |

**إذا كان مكرر:**
```
company1 → company1-437
company1 → company1-892
```

---

## 🔍 استكشاف الأخطاء

### المشكلة: لا يظهر النطاق الفرعي

**الحل:**
1. تأكد من إضافة السجل في ملف hosts
2. امسح DNS cache: `ipconfig /flushdns`
3. أعد تشغيل المتصفح
4. استخدم Ctrl+Shift+R لتحديث الصفحة

### المشكلة: "No company found for subdomain"

**الحل:**
1. تأكد من أن الشركة موجودة في قاعدة البيانات
2. تحقق من أن subdomain في الشركة يطابق الرابط
3. افتح MongoDB Compass وتحقق من collection "companies"

### المشكلة: الـ Middleware لا يطبع في Console

**الحل:**
1. تأكد من استخدام hostname كامل (مثل `company1.taskon.local:4000`)
2. لا تستخدم `localhost:4000` مباشرة
3. تحقق من أن السيرفر يعمل بدون أخطاء

---

## 🎯 API Endpoints المحدثة

### 1. GET /projects
```javascript
// قبل: يجب تمرير companyId في query
GET /projects?companyId=123

// بعد: يأخذه تلقائياً من subdomain
GET /projects
// من http://company1.taskon.local:4000
```

### 2. GET /users
```javascript
// قبل
GET /users?companyId=123

// بعد
GET /users
// من http://company1.taskon.local:4000
```

### 3. GET /extracts
```javascript
// قبل
GET /extracts?projectId=abc&companyId=123

// بعد
GET /extracts?projectId=abc
// companyId يأتي من subdomain تلقائياً
```

---

## 📝 ملاحظات مهمة

### 1. Backward Compatibility ✅
النظام يدعم الطريقة القديمة:
```javascript
// هذه ما زالت تعمل
GET /projects?companyId=123

// الجديدة (أفضل)
http://company1.taskon.local:4000/projects
```

### 2. Localhost vs Production
```javascript
// Development (Local)
http://company1.taskon.local:4000

// Production (بعد النشر)
http://company1.taskon.com
```

### 3. Console Logs
راقب الـ Terminal Console لرؤية:
- 🌐 Subdomain detected
- ✅ Company found
- 📋 API calls
- ✅ Results with (from subdomain) tag

---

## 🌟 الخطوات القادمة (اختياري)

### 1. Auto-Login بناءً على Subdomain
عند فتح `company1.taskon.local:4000/login.html`:
- عرض المستخدمين لهذه الشركة فقط
- تسجيل دخول تلقائي للشركة

### 2. Redirect بعد Login
بعد تسجيل الدخول، redirect للنطاق الفرعي:
```javascript
window.location.href = `http://${companySubdomain}.taskon.local:4000/projects.html`;
```

### 3. تحديث باقي الـ Endpoints
تطبيق نفس المنطق على:
- `/contractors`
- `/suppliers`
- `/equipment`
- وغيرها...

---

## 🎊 تهانينا!

أصبح لديك الآن نظام SaaS متعدد الشركات مع نطاقات فرعية احترافية! 🚀

**روابط مفيدة:**
- 📖 الدليل الشامل: `SUBDOMAIN_SETUP_GUIDE.md`
- 🧪 صفحة الاختبار: `test-subdomain.html`
- ⚙️ لوحة التحكم: `admin-dashboard.html`

---

**Happy Coding! 🎉**
