# 🔍 خطوات Debug المشكلة

## الخطوة 1️⃣: تحقق من بيانات المستخدم

افتح Developer Console (اضغط F12) وشغل:

```javascript
console.log('Current User:', JSON.parse(localStorage.getItem('user')));
console.log('CompanyId:', JSON.parse(localStorage.getItem('user'))?.companyId);
```

## الخطوة 2️⃣: تحقق من الـ URL

شوف الـ URL في شريط العنوان - لازم يكون:
```
http://mosbah.taskon.local:4000/projects.html
```

**وليس:**
- ❌ localhost:4000
- ❌ 127.0.0.1:4000

## الخطوة 3️⃣: امسح localStorage وسجل دخول من جديد

في Console:
```javascript
localStorage.clear();
location.reload();
```

ثم سجل دخول بـ:
- Username: `admin_mosbah`
- Password: `123456`

## الخطوة 4️⃣: بعد تسجيل الدخول، تحقق من CompanyId

```javascript
const user = JSON.parse(localStorage.getItem('user'));
console.log('User CompanyId:', user.companyId);
console.log('Expected CompanyId:', '68f7ac16e4ef2392514027ac');
```

لو الـ CompanyId مختلف، معناها في مشكلة في تسجيل الدخول.

## الخطوة 5️⃣: انسخ logs السيرفر

بعد ما تضيف مشروع، انسخ الـ logs اللي في terminal السيرفر خصوصاً:
- 📋 GET /projects called...
- 🌐 Subdomain detected...
- ✅ Company found...
- ✅ تم إضافة مشروع جديد...

---

## الحل السريع 🚀

إذا كل ده مش نافع:

1. **أغلق المتصفح بالكامل**
2. **افتح terminal جديد كمسؤول**
3. **شغل:**
   ```powershell
   cd C:\Users\acer\Desktop\taskon\dosc
   npm start
   ```
4. **افتح المتصفح**
5. **اذهب لـ:**
   ```
   http://mosbah.taskon.local:4000/login.html
   ```
6. **سجل دخول بـ:** `admin_mosbah` / `123456`
7. **أضف مشروع**

---

أخبرني بالنتيجة! 💪
