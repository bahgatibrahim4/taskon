# 🌐 دليل إعداد نظام النطاقات الفرعية (Subdomains)

## نظرة عامة

تم إضافة نظام النطاقات الفرعية لمنصة TASKON لتمكين كل شركة من الحصول على رابط خاص بها:
- **قبل**: `taskon.local:4000?companyId=123`
- **بعد**: `company1.taskon.local:4000`

---

## ✅ ما تم تنفيذه

### 1. Backend (server.js)
- ✅ إضافة حقل `subdomain` في مجموعة الشركات (companies collection)
- ✅ توليد تلقائي للنطاق الفرعي من اسم الشركة
- ✅ دعم الأحرف العربية (تحويل تلقائي إلى أحرف لاتينية)
- ✅ منع التكرار (إضافة أرقام عشوائية عند التكرار)
- ✅ Middleware للكشف عن النطاق الفرعي من الـ hostname

**مثال على التوليد التلقائي:**
```
"شركة المقاولات" → "shrk-almqawlat"
"ACME Construction" → "acme-construction"
"Test Company" → "test-company"
إذا كان مكرر → "test-company-742"
```

### 2. Admin Dashboard (admin-dashboard.html)
- ✅ عمود النطاق الفرعي في جدول الشركات
- ✅ حقل النطاق الفرعي في نموذج إضافة الشركة (اختياري)
- ✅ زر نسخ الرابط الكامل (📋)
- ✅ رسالة نجاح تحتوي على الرابط الكامل بعد إنشاء الشركة

---

## 🔧 كيفية الاختبار المحلي (Local Testing)

### الخطوة 1: تشغيل السيرفر
```bash
cd c:\Users\acer\Desktop\taskon\docs
node server.js
```

السيرفر سيعمل على: `http://localhost:4000`

### الخطوة 2: إضافة شركة جديدة

1. افتح لوحة التحكم: http://localhost:4000/admin-dashboard.html
2. انتقل إلى قسم "إدارة الشركات"
3. اضغط على "➕ إضافة شركة جديدة"
4. املأ البيانات:
   - **اسم الشركة**: شركة الاختبار
   - **النطاق الفرعي**: اتركه فارغاً للتوليد التلقائي (أو أدخل subdomain مخصص)
   - **البريد الإلكتروني**: test@example.com
   - **نوع الاشتراك**: مجاني/احترافي/مؤسسات
5. اضغط "حفظ"

ستظهر رسالة نجاح تحتوي على:
```
✅ تم إضافة الشركة بنجاح!

النطاق الفرعي: shrk-alakhtbar
الرابط الكامل: http://shrk-alakhtbar.taskon.local:4000

يمكنك الآن الوصول للشركة من خلال هذا الرابط
```

### الخطوة 3: تعديل ملف hosts (Windows)

لاختبار النطاقات الفرعية محلياً، يجب إضافة السجلات في ملف hosts:

**موقع الملف:**
```
C:\Windows\System32\drivers\etc\hosts
```

**خطوات التعديل:**

1. افتح PowerShell أو CMD **كمسؤول** (Run as Administrator)

2. افتح الملف باستخدام Notepad:
```powershell
notepad C:\Windows\System32\drivers\etc\hosts
```

3. أضف الأسطر التالية في نهاية الملف:
```
127.0.0.1 taskon.local
127.0.0.1 shrk-alakhtbar.taskon.local
127.0.0.1 company1.taskon.local
127.0.0.1 acme.taskon.local
```

4. احفظ الملف (Ctrl+S) وأغلقه

**ملاحظة:** يجب إضافة سطر جديد لكل subdomain تريد اختباره.

### الخطوة 4: اختبار النطاقات الفرعية

1. افتح المتصفح
2. اذهب إلى أحد الروابط:
   - http://shrk-alakhtbar.taskon.local:4000
   - http://company1.taskon.local:4000
   - http://acme.taskon.local:4000

3. افتح Console في Developer Tools (F12)
4. ستجد رسالة:
```
🌐 Subdomain detected: shrk-alakhtbar
```

---

## 📊 كيفية التحقق من عمل Middleware

### في server.js:
عند دخول أي صفحة، سيطبع الـ Middleware في Console:
```javascript
🌐 Subdomain detected: company1
```

### في المتصفح:
افتح Developer Tools (F12) → Network → Headers → Request Headers
ستجد:
```
Host: company1.taskon.local:4000
```

---

## 🎯 استخدام النظام في الإنتاج (Production)

### للنشر على سيرفر حقيقي:

1. **DNS Configuration:**
   - أضف سجل A يشير إلى IP السيرفر:
     ```
     A taskon.com → 123.45.67.89
     ```
   - أضف سجل Wildcard للنطاقات الفرعية:
     ```
     A *.taskon.com → 123.45.67.89
     ```

2. **SSL Certificate (HTTPS):**
   - استخدم Wildcard SSL Certificate:
     ```
     *.taskon.com
     ```
   - يمكن الحصول عليه من Let's Encrypt مجاناً

3. **Update API URLs:**
   - في `admin-dashboard.html` و `projects.html` وغيرها:
   ```javascript
   const API_URL = window.location.origin; // بدلاً من http://localhost:4000
   ```

---

## 🧪 سيناريوهات الاختبار

### 1. إنشاء شركة باسم عربي
```
اسم الشركة: "شركة المقاولات الكبرى"
النطاق المتوقع: "shrk-almqawlat-alkbr"
الرابط: http://shrk-almqawlat-alkbr.taskon.local:4000
```

### 2. إنشاء شركة باسم إنجليزي
```
اسم الشركة: "ACME Construction Ltd"
النطاق المتوقع: "acme-construction-ltd"
الرابط: http://acme-construction-ltd.taskon.local:4000
```

### 3. إنشاء شركة بـ subdomain مخصص
```
اسم الشركة: "شركة الاختبار"
النطاق الفرعي المدخل يدوياً: "test-company"
الرابط: http://test-company.taskon.local:4000
```

### 4. إنشاء شركة بنطاق مكرر
```
الشركة الأولى: "Test Company" → test-company
الشركة الثانية: "Test Company" → test-company-437
```

---

## 🔄 الخطوات القادمة (Pending Tasks)

### ⏳ Auto-Context Switching
حالياً يتم اكتشاف الـ subdomain في الـ Middleware، لكن لم يتم ربطه بالـ API routes.

**المطلوب:**
```javascript
// في server.js - بعد اكتشاف subdomain
app.use(async (req, res, next) => {
  if (req.subdomain) {
    // البحث عن الشركة من قاعدة البيانات
    const company = await companiesCollection.findOne({ subdomain: req.subdomain });
    if (company) {
      req.companyId = company._id.toString();
      req.company = company;
    }
  }
  next();
});

// في API routes مثل GET /projects
app.get('/projects', async (req, res) => {
  const companyId = req.companyId || req.query.companyId; // أولوية للـ subdomain
  const projects = await projectsCollection.find({ companyId }).toArray();
  res.json(projects);
});
```

### ⏳ Auto-Login Based on Subdomain
عند فتح `company1.taskon.local:4000/login.html`:
- اكتشاف تلقائي للشركة من الـ subdomain
- عرض المستخدمين المرتبطين بهذه الشركة فقط
- تسجيل الدخول بشكل آلي للشركة الصحيحة

---

## 📝 ملاحظات مهمة

1. **Development vs Production:**
   - في التطوير: استخدم `.local` (مثل `taskon.local`)
   - في الإنتاج: استخدم النطاق الحقيقي (مثل `taskon.com`)

2. **Port في Production:**
   - احذف رقم البورت (`:4000`) في الإنتاج
   - استخدم Port 80 (HTTP) أو 443 (HTTPS)

3. **Cache Issues:**
   - إذا لم تعمل التغييرات، امسح DNS cache:
     ```powershell
     ipconfig /flushdns
     ```

4. **Browser Cache:**
   - استخدم Ctrl+Shift+R لتحديث الصفحة بدون cache

---

## ✨ الميزات الإضافية المنفذة

### 1. Copy URL Button (📋)
في جدول الشركات، يوجد زر لنسخ الرابط الكامل مباشرة إلى الـ Clipboard

### 2. Success Message with URL
بعد إنشاء الشركة، تظهر رسالة تحتوي على:
- النطاق الفرعي المولد
- الرابط الكامل القابل للنسخ

### 3. Auto-Generation Preview
في نموذج الإضافة، يوجد نص توضيحي:
```
سيتم توليد النطاق تلقائياً من اسم الشركة إذا تركته فارغاً
```

---

## 🆘 استكشاف الأخطاء

### المشكلة: لا يعمل الـ subdomain
**الحل:**
1. تأكد من تشغيل السيرفر على Port 4000
2. تأكد من إضافة السجل في ملف hosts
3. امسح DNS cache: `ipconfig /flushdns`
4. أعد تشغيل المتصفح

### المشكلة: الـ Middleware لا يطبع في Console
**الحل:**
1. تأكد من استخدام الـ hostname الكامل (مثل `company1.taskon.local:4000`)
2. لا تستخدم `localhost:4000` فقط

### المشكلة: الشركة موجودة لكن لا يوجد subdomain
**الحل:**
الشركات القديمة قبل التحديث لا تحتوي على subdomain. الحلول:
1. أعد إنشاء الشركة من لوحة التحكم
2. أو أضف subdomain يدوياً في MongoDB:
   ```javascript
   db.companies.updateOne(
     { _id: ObjectId("...") },
     { $set: { subdomain: "company-name" } }
   )
   ```

---

## 📞 للدعم

إذا واجهت أي مشاكل:
1. افتح Developer Console (F12) وتحقق من الأخطاء
2. تحقق من Server logs في Terminal
3. تأكد من إعدادات ملف hosts

**Happy Coding! 🚀**
