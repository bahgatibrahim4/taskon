# 🐛 إصلاح مشكلة 404 - URL Parameters

## ❌ المشكلة:
```
GET http://bahgat.taskon.local:4000/contractors&workItem=xxx?projectId=yyy
[HTTP/1.1 404 Not Found]
```

### 🔍 السبب:
الـ URL parameters مش مرتبة صح. المفروض يكون:
```
✅ /contractors?projectId=xxx&workItem=yyy
❌ /contractors&workItem=xxx?projectId=yyy
```

**الترتيب الصحيح:**
1. أول parameter يبدأ بـ `?`
2. باقي parameters تبدأ بـ `&`

---

## 🔧 الحل المُطبق:

### الملف: `add-extract.html`

#### ✅ التعديل 1 - دالة loadContractors:
```javascript
// قبل ❌
async function loadContractors(workItem = null) {
  let url = '/contractors';
  if (workItem) {
    url += '&workItem=' + encodeURIComponent(workItem);
  }
  const contractors = await projectUtils.getWithProject(url);
}

// بعد ✅
async function loadContractors(workItem = null) {
  let url = '/contractors';
  if (workItem) {
    url += '?workItem=' + encodeURIComponent(workItem);
  }
  const contractors = await projectUtils.getWithProject(url);
}
```

**النتيجة:**
- `projectUtils.getWithProject('/contractors?workItem=xxx')`
- يصبح: `/contractors?workItem=xxx&projectId=yyy` ✅

---

#### ✅ التعديل 2 - جلب extracts للمقاول:
```javascript
// قبل ❌
const extracts = await projectUtils.getWithProject(`/extracts&contractor=${contractorId}`);

// بعد ✅
const extracts = await projectUtils.getWithProject(`/extracts?contractor=${contractorId}`);
```

---

#### ✅ التعديل 3 - جلب extracts في lump sum:
```javascript
// قبل ❌
projectUtils.getWithProject(`/extracts&contractor=${contractorId}`)

// بعد ✅
projectUtils.getWithProject(`/extracts?contractor=${contractorId}`)
```

---

## 📊 ملخص التعديلات:

| الموقع | قبل | بعد | الحالة |
|--------|-----|-----|--------|
| loadContractors() | `&workItem=` | `?workItem=` | ✅ |
| جلب extracts (سطر 1556) | `&contractor=` | `?contractor=` | ✅ |
| جلب extracts (سطر 2351) | `&contractor=` | `?contractor=` | ✅ |

---

## 🧪 الاختبار:

### 1. افتح add-extract.html
### 2. اختر بند الأعمال من القائمة
### 3. شوف Console (F12):

**قبل (❌):**
```
GET /contractors&workItem=xxx?projectId=yyy
404 Not Found
```

**بعد (✅):**
```
GET /contractors?workItem=xxx&projectId=yyy
200 OK
```

---

## 💡 الدرس المستفاد:

عند استخدام `projectUtils.getWithProject(url)`:
- ✅ **صح:** `getWithProject('/api?param1=value1')`
  - النتيجة: `/api?param1=value1&projectId=xxx`
  
- ❌ **غلط:** `getWithProject('/api&param1=value1')`
  - النتيجة: `/api&param1=value1?projectId=xxx` (404)

---

## ✅ تم الإصلاح!

**جرب الآن:**
1. افتح: `http://bahgat.taskon.local:4000/add-extract.html`
2. اختر بند الأعمال
3. لازم تحمل قائمة المقاولين بنجاح ✅

---

**التاريخ:** 2025-10-20  
**الحالة:** ✅ تم الحل
