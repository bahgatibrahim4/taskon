# 📊 بنية قاعدة البيانات الجديدة

## نظرة عامة

تم تطوير نظام **Multi-Tenant Database Architecture** حيث كل شركة لها collections منفصلة، وكل مشروع داخل الشركة له collections خاصة به.

## 🏗️ الهيكل الهرمي

```
MongoDB Database: company_db
│
├── companies (collection مشترك - عام)
│   └── {_id, companyName, subdomain, contactInfo, createdAt}
│
├── platform_admins (collection مشترك - عام)
│   └── {_id, email, password, name, role}
│
├── {companyName}_projects (collection لكل شركة)
│   └── {_id, projectName, projectCode, companyId, startDate, endDate, status}
│
└── {companyName}_project_{projectId}_{collectionName}
    ├── {companyName}_project_{projectId}_contractors
    ├── {companyName}_project_{projectId}_extracts
    ├── {companyName}_project_{projectId}_suppliers
    ├── {companyName}_project_{projectId}_purchases
    ├── {companyName}_project_{projectId}_store
    ├── {companyName}_project_{projectId}_workers
    ├── {companyName}_project_{projectId}_equipment
    ├── {companyName}_project_{projectId}_users
    └── ... (جميع الـ collections الأخرى)
```

## 📝 أمثلة على أسماء Collections

### شركة "الإنشاءات الحديثة"
```
الإنشاءات_الحديثة_projects
الإنشاءات_الحديثة_project_12345_contractors
الإنشاءات_الحديثة_project_12345_extracts
الإنشاءات_الحديثة_project_12345_suppliers
الإنشاءات_الحديثة_project_67890_contractors
الإنشاءات_الحديثة_project_67890_extracts
```

### شركة "التعمير الذكي"
```
التعمير_الذكي_projects
التعمير_الذكي_project_11111_contractors
التعمير_الذكي_project_11111_extracts
```

## 🔧 الدوال المساعدة

### 1. `sanitizeCompanyName(companyName)`
تنظيف اسم الشركة لاستخدامه في اسم Collection:
- استبدال المسافات بـ `_`
- حذف الرموز الخاصة
- الحد من الطول إلى 50 حرف

```javascript
sanitizeCompanyName("شركة الإنشاءات الحديثة") 
// => "شركة_الإنشاءات_الحديثة"
```

### 2. `getCompanyProjectsCollection(companyName)`
الحصول على collection المشاريع الخاص بشركة معينة:

```javascript
const projectsCol = getCompanyProjectsCollection("شركة الإنشاءات");
// => db.collection("شركة_الإنشاءات_projects")
```

### 3. `getProjectCollections(companyName, projectId)`
الحصول على جميع collections خاصة بمشروع معين:

```javascript
const collections = getProjectCollections("شركة الإنشاءات", "12345");
// => {
//   contractorsCollection: db.collection("شركة_الإنشاءات_project_12345_contractors"),
//   extractsCollection: db.collection("شركة_الإنشاءات_project_12345_extracts"),
//   ...
// }
```

## 🔄 Middleware

### Company Context Middleware
```javascript
// يستخرج معلومات الشركة من subdomain
req.companyId = "..."
req.company = { ... }
req.companyName = "شركة الإنشاءات"
req.companyProjectsCollection = db.collection("شركة_الإنشاءات_projects")
```

### Project Context Middleware
```javascript
// يستخرج projectId من query/body ويرفق collections المشروع
req.projectId = "12345"
req.projectCollections = {
  contractorsCollection: ...,
  extractsCollection: ...,
  // ... جميع الـ collections
}
```

## 🎯 استخدام Endpoints

### إضافة مقاول جديد
```javascript
POST /contractors?projectId=12345

// الـ middleware سيرفق:
// req.projectCollections.contractorsCollection
// => "شركة_الإنشاءات_project_12345_contractors"
```

### جلب مقاولين
```javascript
GET /contractors?projectId=12345

// سيستخدم:
// req.projectCollections.contractorsCollection
```

### إضافة مشروع جديد
```javascript
POST /projects

// سيستخدم:
// req.companyProjectsCollection
// => "شركة_الإنشاءات_projects"
```

## 🗑️ الحذف

### حذف شركة
```javascript
DELETE /companies/:id

// سيحذف:
// 1. جميع collections التي تبدأ بـ "شركة_الإنشاءات_"
// 2. سجل الشركة من collection companies
```

مثال:
```
✅ حذف: شركة_الإنشاءات_projects
✅ حذف: شركة_الإنشاءات_project_12345_contractors
✅ حذف: شركة_الإنشاءات_project_12345_extracts
✅ حذف: شركة_الإنشاءات_project_67890_contractors
... الخ
```

### حذف مشروع
```javascript
DELETE /projects/:id?projectId=12345

// سيحذف:
// 1. جميع collections التي تبدأ بـ "شركة_الإنشاءات_project_12345_"
// 2. سجل المشروع من collection المشاريع
```

مثال:
```
✅ حذف: شركة_الإنشاءات_project_12345_contractors
✅ حذف: شركة_الإنشاءات_project_12345_extracts
✅ حذف: شركة_الإنشاءات_project_12345_suppliers
... الخ
```

## 🔒 عزل البيانات (Data Isolation)

### المستوى 1: عزل على مستوى الشركة
- كل شركة لها collection مشاريع منفصل
- لا يمكن لشركة رؤية مشاريع شركة أخرى

### المستوى 2: عزل على مستوى المشروع
- كل مشروع له collections منفصلة تماماً
- لا يمكن لمشروع رؤية بيانات مشروع آخر (حتى في نفس الشركة)

### المستوى 3: عزل على مستوى المستخدم
- يتم تطبيقه عبر الـ permissions داخل كل مشروع
- المستخدمون يرون فقط ما لديهم صلاحيات له

## ✅ المميزات

1. **عزل كامل**: كل شركة ومشروع معزول تماماً
2. **حذف آمن**: حذف شركة/مشروع يحذف جميع بياناته تلقائياً
3. **أداء محسّن**: فصل البيانات يحسن الأداء
4. **سهولة الصيانة**: بنية واضحة ومنطقية
5. **Scalability**: سهولة التوسع مع نمو النظام

## ⚠️ ملاحظات مهمة

1. **اسم الشركة يجب أن يكون ثابت**: تغيير اسم الشركة سيتطلب إعادة تسمية collections
2. **projectId يجب أن يكون فريد**: لا تستخدم نفس projectId لمشاريع مختلفة
3. **Collections القديمة**: موجودة للتوافق مع البيانات القديمة (سيتم إزالتها تدريجياً)

## 🔄 Migration من البنية القديمة

البنية القديمة كانت:
```
- contractors (مشترك لجميع الشركات)
- extracts (مشترك لجميع الشركات)
```

البنية الجديدة:
```
- شركة_الإنشاءات_project_12345_contractors
- شركة_الإنشاءات_project_12345_extracts
```

**Note**: الـ endpoints تدعم الاثنين حالياً للتوافق التام.

## 📚 Collections المتاحة لكل مشروع

كل مشروع يحصل على 23 collection:

1. `contractors` - المقاولين
2. `extracts` - المستخلصات
3. `users` - المستخدمين
4. `supplies` - التوريدات
5. `suppliers` - الموردين
6. `purchases` - المشتريات
7. `store` - المخازن
8. `workers` - العمال
9. `monthlyPays` - المدفوعات الشهرية
10. `pays` - القبوضات
11. `chats` - المحادثات
12. `notifications` - الإشعارات
13. `equipment` - المعدات
14. `contractor_issues` - مشاكل المقاولين
15. `purchase_returns` - مرتجعات المشتريات
16. `external_services` - الخدمات الخارجية
17. `receipts` - سندات الاستلام
18. `drawings` - الرسومات
19. `project_data` - بيانات المشروع
20. `contract_addons` - إضافات العقود
21. `supply_addons` - إضافات التوريدات
22. `letters` - الخطابات
23. `estimates` - التقديرات

---

**تاريخ التحديث**: أكتوبر 2025  
**الإصدار**: 2.0 - Multi-Tenant Project-Level Architecture
