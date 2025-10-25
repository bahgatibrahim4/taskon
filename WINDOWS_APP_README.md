# 🖥️ TASKON - تطبيق Windows Desktop

## 📦 تثبيت المكتبات المطلوبة

```powershell
npm install
```

هذا سيثبت:
- `electron` - لإنشاء تطبيق Windows
- `electron-builder` - لبناء ملف التثبيت

## 🚀 تشغيل التطبيق في وضع التطوير

```powershell
npm run electron
```

أو مع DevTools:
```powershell
npm run electron-dev
```

## 📦 بناء ملف التثبيت لـ Windows

### بناء نسخة 64-bit فقط:
```powershell
npm run build-win
```

### بناء نسخة 32-bit فقط:
```powershell
npm run build-win32
```

### بناء كلا النسختين (64-bit و 32-bit):
```powershell
npm run build-all
```

## 📁 ملفات التثبيت

بعد البناء، ستجد الملفات في مجلد `dist/`:

- **TASKON-Setup-1.0.0.exe** - ملف التثبيت الكامل
- **TASKON-1.0.0.exe** - نسخة محمولة (Portable) - تعمل بدون تثبيت

## ⚙️ المميزات

✅ يعمل بدون اتصال بالإنترنت (بعد الاتصال الأولي بقاعدة البيانات)
✅ واجهة Windows أصلية
✅ يعمل في الخلفية (Background)
✅ سهل التوزيع والتثبيت
✅ لا يحتاج متصفح

## 📝 ملاحظات مهمة

1. **قاعدة البيانات**: يجب أن يكون لديك اتصال بالإنترنت للاتصال بـ MongoDB Atlas
2. **الأيقونة**: يمكنك استبدال `favicon.ico` بأيقونة مخصصة
3. **الحجم**: الملف النهائي سيكون حوالي 150-200 MB

## 🔧 التخصيص

### تغيير الأيقونة:
استبدل ملف `favicon.ico` بأيقونة بحجم 256x256 بكسل

### تغيير اسم البرنامج:
عدل في `package.json`:
```json
"productName": "الاسم الجديد"
```

### تغيير رقم الإصدار:
عدل في `package.json`:
```json
"version": "1.0.0"
```

## 🐛 حل المشاكل

### المشكلة: "Cannot find module 'electron'"
الحل:
```powershell
npm install electron --save-dev
```

### المشكلة: السيرفر لا يعمل
الحل: تأكد من أن MongoDB URI صحيح في `server.js`

### المشكلة: النافذة فارغة
الحل: انتظر 2-3 ثواني لبدء السيرفر، أو زد الوقت في `electron-main.js`

## 📞 الدعم

للمشاكل والاستفسارات، تواصل مع المطور.
