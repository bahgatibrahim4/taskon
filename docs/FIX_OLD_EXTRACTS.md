# سكريبت لتحديث المستخلصات القديمة بإضافة projectId

## المشكلة:
المستخلصات القديمة اللي اتحفظت قبل تحديث النظام مش فيها `projectId`، وبالتالي مش بتظهر في قائمة المستخلصات.

## الحل السريع:

### 1. افتح MongoDB Compass أو mongosh

### 2. شغّل الـ Query ده:

```javascript
// في database: company_db
// في collection: extracts

// عرض المستخلصات اللي مفيش فيها projectId
db.extracts.find({ projectId: { $exists: false } })

// تحديث المستخلصات بإضافة projectId
// استبدل PROJECT_ID_HERE بـ ID المشروع الصحيح
db.extracts.updateMany(
  { projectId: { $exists: false } },
  { $set: { projectId: "68f61453f42072d2b0aa3742" } }
)
```

### 3. أو استخدم الـ API endpoint:

```javascript
// أضف endpoint في server.js للتحديث التلقائي
app.post('/admin/fix-extracts-projectid', async (req, res) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    const result = await extractsCollection.updateMany(
      { projectId: { $exists: false } },
      { $set: { projectId: projectId } }
    );
    
    res.json({ 
      message: 'تم تحديث المستخلصات',
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

---

## الحل الدائم (تم تطبيقه):

✅ كل المستخلصات الجديدة بيتم إضافة projectId لها تلقائياً عن طريق `projectUtils.postWithProject()`

---

## التحقق:

بعد التحديث، جرّب:
1. افتح list-extracts.html
2. لازم تشوف كل المستخلصات للمشروع الحالي ✅

---

**ملاحظة:** إذا في مستخلصات قديمة لمشاريع مختلفة، لازم تحدثها يدوياً بـ projectId الصحيح لكل مشروع.
