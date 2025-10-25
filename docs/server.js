const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (JS/CSS/assets). Important for permissions.js, favicon, etc.
app.use(express.static(path.join(__dirname)));

// Subdomain Detection Middleware
app.use((req, res, next) => {
  const host = req.get('host'); // مثال: company1.taskon.local:4000
  const hostname = host.split(':')[0]; // إزالة رقم البورت
  const parts = hostname.split('.');
  
  // إذا كان هناك subdomain (أكثر من جزء واحد)
  if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'localhost') {
    req.subdomain = parts[0]; // مثال: company1
    console.log(`🌐 Subdomain detected: ${req.subdomain}`);
  } else {
    req.subdomain = null; // لا يوجد subdomain
  }
  
  next();
});

// Company Context Middleware - يبحث عن الشركة من قاعدة البيانات
app.use(async (req, res, next) => {
  try {
    // إذا كان هناك subdomain وتم الاتصال بقاعدة البيانات
    if (req.subdomain) {
      // انتظار حتى يصبح companiesCollection جاهزاً
      let attempts = 0;
      while (!companiesCollection && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      
      if (companiesCollection) {
        const company = await companiesCollection.findOne({ subdomain: req.subdomain });
        if (company) {
          req.companyId = company._id.toString();
          req.company = company;
          req.companyName = company.companyName;
          
          // إرفاق collection المشاريع الخاص بهذه الشركة
          try {
            req.companyProjectsCollection = getCompanyProjectsCollection(company.companyName);
          } catch (err) {
            console.error('❌ Error creating company projects collection:', err);
            req.companyProjectsCollection = projectsCollection; // fallback
          }
          
          console.log(`✅ Company found: ${company.companyName} (ID: ${req.companyId})`);
        } else {
          console.log(`⚠️ No company found for subdomain: ${req.subdomain}`);
        }
      }
    }
  } catch (err) {
    console.error('❌ Error in company context middleware:', err);
  }
  next();
});

// Project Context Middleware - يستخرج projectId ويرفق collections المشروع
app.use(async (req, res, next) => {
  try {
    // محاولة استخراج projectId من query params أو body
    const projectId = req.query.projectId || req.body?.projectId;
    
    if (projectId && req.companyName) {
      req.projectId = projectId;
      
      // إرفاق collections الخاصة بهذا المشروع
      try {
        req.projectCollections = getProjectCollections(req.companyName, projectId);
        if (req.projectCollections) {
          console.log(`📁 Project collections attached for project: ${projectId}`);
        }
      } catch (err) {
        console.error('❌ Error creating project collections:', err);
        // لا نضع fallback هنا، سنتركه للـ endpoint نفسه
      }
    }
  } catch (err) {
    console.error('❌ Error in project context middleware:', err);
  }
  next();
});

// ملاحظة: تقديم الملفات الثابتة سيكون في النهاية بعد كل الـ API routes
// app.use(express.static(__dirname)); // تم تعطيله مؤقتاً

const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let extractsCollection, contractorsCollection, usersCollection, suppliesCollection, suppliersCollection, purchasesCollection, storeCollection, workersCollection, monthlyPaysCollection, paysCollection, chatsCollection, notificationsCollection, equipmentCollection, contractorIssuesCollection, purchaseReturnsCollection, draftsCollection, externalServicesCollection, receiptsCollection, drawingsCollection, companiesCollection, projectsCollection, platformAdminsCollection;
// كولكشن بيانات المشروع
let projectDataCollection, contractAddonsCollection, supplyAddonsCollection, lettersCollection, estimatesCollection;

// Global database reference
let db;

// دالة للحصول على اسم الشركة المنظف (بدون مسافات أو رموز خاصة)
function sanitizeCompanyName(companyName) {
  if (!companyName) return 'unknown';
  return companyName
    .replace(/\s+/g, '_')  // استبدال المسافات بـ _
    .replace(/[^\w\u0600-\u06FF_]/g, '')  // حذف أي رموز غير حروف/أرقام/عربي
    .substring(0, 50);  // تحديد طول الاسم
}

// دالة للحصول على collection المشاريع الخاص بالشركة
function getCompanyProjectsCollection(companyName) {
  if (!db) {
    console.error('❌ Database not connected in getCompanyProjectsCollection');
    return null;
  }
  
  if (!companyName) {
    console.warn('⚠️ companyName is missing in getCompanyProjectsCollection');
    return null;
  }
  
  try {
    const sanitized = sanitizeCompanyName(companyName);
    return db.collection(`${sanitized}_projects`);
  } catch (err) {
    console.error('❌ Error in getCompanyProjectsCollection:', err);
    return null;
  }
}

// دالة للحصول على Collections خاصة بمشروع معين داخل شركة
function getProjectCollections(companyName, projectId) {
  if (!db) {
    console.error('❌ Database not connected in getProjectCollections');
    return null;
  }
  
  if (!companyName) {
    console.warn('⚠️ companyName is missing in getProjectCollections');
    return null;
  }
  
  if (!projectId) {
    console.warn('⚠️ projectId is missing in getProjectCollections');
    return null;
  }
  
  try {
    // إنشاء أسماء Collections مع prefix الشركة والمشروع
    const sanitized = sanitizeCompanyName(companyName);
    const prefix = `${sanitized}_project_${projectId}_`;
    
    return {
      extractsCollection: db.collection(`${prefix}extracts`),
      contractorsCollection: db.collection(`${prefix}contractors`),
      usersCollection: db.collection(`${prefix}users`),
      suppliesCollection: db.collection(`${prefix}supplies`),
      suppliersCollection: db.collection(`${prefix}suppliers`),
      purchasesCollection: db.collection(`${prefix}purchases`),
      storeCollection: db.collection(`${prefix}store`),
      workersCollection: db.collection(`${prefix}workers`),
      monthlyPaysCollection: db.collection(`${prefix}monthlyPays`),
      paysCollection: db.collection(`${prefix}pays`),
      chatsCollection: db.collection(`${prefix}chats`),
      notificationsCollection: db.collection(`${prefix}notifications`),
      equipmentCollection: db.collection(`${prefix}equipment`),
      contractorIssuesCollection: db.collection(`${prefix}contractor_issues`),
      purchaseReturnsCollection: db.collection(`${prefix}purchase_returns`),
      externalServicesCollection: db.collection(`${prefix}external_services`),
      receiptsCollection: db.collection(`${prefix}receipts`),
      drawingsCollection: db.collection(`${prefix}drawings`),
      projectDataCollection: db.collection(`${prefix}project_data`),
      contractAddonsCollection: db.collection(`${prefix}contract_addons`),
      supplyAddonsCollection: db.collection(`${prefix}supply_addons`),
      lettersCollection: db.collection(`${prefix}letters`),
      estimatesCollection: db.collection(`${prefix}estimates`)
    };
  } catch (err) {
    console.error('❌ Error in getProjectCollections:', err);
    return null;
  }
}

// الاتصال بقاعدة البيانات
async function connectDB() {
  try {
    await client.connect();
    db = client.db('company_db');
    
    // Collections مشتركة (للشركات والمسؤولين فقط)
    companiesCollection = db.collection('companies');
    platformAdminsCollection = db.collection('platform_admins');
    
    // Collections قديمة (للتوافق مع البيانات القديمة - سيتم إزالتها لاحقاً)
    extractsCollection = db.collection('extracts');
    contractorsCollection = db.collection('contractors');
    usersCollection = db.collection('users');
    suppliesCollection = db.collection('supplies');
    suppliersCollection = db.collection('suppliers');
    purchasesCollection = db.collection('purchases');
    storeCollection = db.collection('store');
    workersCollection = db.collection('workers');
    monthlyPaysCollection = db.collection('monthlyPays');
    paysCollection = db.collection('pays');
    chatsCollection = db.collection('chats');
    notificationsCollection = db.collection('notifications');
    equipmentCollection = db.collection('equipment');
    contractorIssuesCollection = db.collection('contractor_issues');
    purchaseReturnsCollection = db.collection('purchase_returns');
    externalServicesCollection = db.collection('external_services');
    receiptsCollection = db.collection('receipts');
    drawingsCollection = db.collection('drawings');
    projectsCollection = db.collection('projects');
    projectDataCollection = db.collection('project_data');
    contractAddonsCollection = db.collection('contract_addons');
    supplyAddonsCollection = db.collection('supply_addons');
    lettersCollection = db.collection('letters');
    estimatesCollection = db.collection('estimates');
    
    console.log("Connected to MongoDB!");
    
    // إنشاء admin أول إذا لم يكن موجود
    const adminCount = await platformAdminsCollection.countDocuments();
    if (adminCount === 0) {
      await platformAdminsCollection.insertOne({
        email: 'bahgatt55@outlook.com',
        password: '123456', // في الإنتاج يجب تشفيره!
        name: 'بهجت',
        role: 'superadmin',
        createdAt: new Date()
      });
      console.log('✅ تم إنشاء مسؤول المنصة الأول');
    }
    
    // تحقق من وجود المستخلصات
    const extractsCount = await extractsCollection.countDocuments();
    console.log(`📄 عدد المستخلصات في قاعدة البيانات: ${extractsCount}`);
    
    if (extractsCount === 0) {
      console.log("⚠️ تحذير: لا توجد مستخلصات في قاعدة البيانات");
    } else {
      // عرض عينة من المستخلصات
      const sampleExtracts = await extractsCollection.find({}).limit(3).toArray();
      console.log("📋 عينة من المستخلصات:");
      sampleExtracts.forEach(extract => {
        console.log(`   - رقم ${extract.number || 'غير محدد'}, تاريخ: ${extract.date || 'غير محدد'}, مقاول: ${extract.contractor || 'غير محدد'}`);
      });
    }
  } catch (error) {
    console.error("خطأ في الاتصال بقاعدة البيانات:", error);
  }
}

connectDB().catch(console.dir);



// إعداد بيانات Cloudinary
cloudinary.config({
  cloud_name: 'root',
  api_key: '994869753445758',
  api_secret: 'qfLSlBcydXqctxqWdr3qzvSkI8k'
});

// إعداد التخزين المحلي كـ fallback
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fs = require('fs');
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + file.originalname);
  }
});

// إعداد التخزين على Cloudinary
const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads', // اسم المجلد في Cloudinary
    allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'xlsx', 'xls', 'dwg', 'dxf'],
    resource_type: 'auto' // يسمح برفع أي نوع ملف
  }
});

// استخدام local storage مؤقتاً لحل مشكلة Cloudinary
const storage = localStorage;
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:', file.originalname, file.mimetype);
    // قبول جميع أنواع الملفات
    cb(null, true);
  }
});

// API المقاولين

// حذف مادة من المقاول حسب الفهرس
app.delete('/contractors/:id/materials/:materialIndex', async (req, res) => {
  try {
    const contractorId = req.params.id;
    const materialIndex = parseInt(req.params.materialIndex);
    if (isNaN(materialIndex) || materialIndex < 0) {
      return res.status(400).json({ error: 'يجب تحديد فهرس المادة بشكل صحيح.' });
    }
    
    // جلب المقاول أولاً للتحقق من وجود المادة
    let contractor;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      contractor = await contractorsCollection.findOne({ _id: new ObjectId(contractorId) });
    } else {
      contractor = await contractorsCollection.findOne({ _id: contractorId });
    }
    
    if (!contractor || !contractor.materials || materialIndex >= contractor.materials.length) {
      return res.status(404).json({ error: 'لم يتم العثور على المادة أو المقاول.' });
    }
    
    // احذف المادة من الفهرس المحدد
    contractor.materials.splice(materialIndex, 1);
    
    // تحديث المقاول في قاعدة البيانات
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      result = await contractorsCollection.updateOne(
        { _id: new ObjectId(contractorId) },
        { $set: { materials: contractor.materials } }
      );
    } else {
      result = await contractorsCollection.updateOne(
        { _id: contractorId },
        { $set: { materials: contractor.materials } }
      );
    }
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'فشل في تحديث بيانات المقاول.' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إعادة مادة للمخزن
app.post('/materials/restore/:materialId', async (req, res) => {
  try {
    const materialId = req.params.materialId;
    const materialData = req.body;
    
    if (!materialData || !materialData.name) {
      return res.status(400).json({ error: 'بيانات المادة مطلوبة لإعادتها للمخزن.' });
    }
    
    // إضافة المادة للمخزن كعملية إضافة جديدة
    const storeEntry = {
      operation: 'إضافة',
      date: new Date().toISOString().split('T')[0],
      item: materialData.name,
      quantity: materialData.quantity || 1,
      unitPrice: materialData.unitPrice || 0,
      totalValue: (materialData.quantity || 1) * (materialData.unitPrice || 0),
      userName: 'النظام - إعادة من مقاول',
      source: 'contractor_return',
      contractorId: materialData.contractorId || '',
      originalDate: materialData.date || ''
    };
    
    const result = await storeCollection.insertOne(storeEntry);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// إضافة مقاول جديد (يدعم maxTotalPercentPerItem ويدعم المواد)
app.post('/contractors', async (req, res) => {
  try {
    const contractor = req.body;
    // إذا لم يوجد maxTotalPercentPerItem اجعله كائن فارغ
    if (!contractor.maxTotalPercentPerItem) contractor.maxTotalPercentPerItem = {};
    // إذا لم يوجد materials اجعله مصفوفة فارغة
    if (!Array.isArray(contractor.materials)) contractor.materials = [];
    // إضافة projectId إذا لم يكن موجوداً
    if (!contractor.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    contractor.createdAt = new Date();
    
    // استخدام collections الخاصة بالمشروع
    // إذا لم يكن req.projectCollections موجود، حاول إنشائه من projectId و companyName
    let contractorsCol;
    
    if (req.projectCollections) {
      contractorsCol = req.projectCollections.contractorsCollection;
    } else if (contractor.projectId && req.companyName) {
      // إنشاء collections المشروع يدوياً
      const projectColls = getProjectCollections(req.companyName, contractor.projectId);
      contractorsCol = projectColls.contractorsCollection;
    } else {
      // fallback للـ collection القديم
      contractorsCol = contractorsCollection;
    }
    
    const result = await contractorsCol.insertOne(contractor);
    console.log(`✅ تم إضافة مقاول في: ${contractorsCol.collectionName}`);
    res.status(201).json(result);
  } catch (err) {
    console.error('خطأ أثناء إضافة المقاول:', err); // لوج
    res.status(500).json({ error: err.message });
  }
});

app.get('/contractors', async (req, res) => {
  try {
    const { workItem, projectId, companyId } = req.query;
    
    // الأولوية لـ companyId من query أو من middleware
    const finalCompanyId = companyId || req.companyId;
    
    console.log('📋 GET /contractors - Query params:', { workItem, projectId, companyId: finalCompanyId });
    console.log('📋 GET /contractors - req.companyName:', req.companyName);
    console.log('📋 GET /contractors - req.projectCollections:', req.projectCollections ? 'موجود' : 'غير موجود');
    
    // ⚠️ إلزامي: يجب وجود companyId أو projectId لمنع عرض مقاولين كل الشركات
    if (!finalCompanyId && !projectId) {
      console.error('❌ GET /contractors: companyId أو projectId مفقود!');
      return res.status(400).json({ error: 'companyId or projectId is required' });
    }
    
    let filter = {};
    
    // فلتر حسب المشروع
    if (projectId) {
      filter.projectId = projectId;
    }
    
    // فلتر حسب الشركة
    if (finalCompanyId) {
      filter.companyId = finalCompanyId;
    }
    
    if (workItem) {
      // دعم البحث في workItems (مصفوفة) أو workItem (نص)
      filter.$or = [
        { workItems: { $elemMatch: { $eq: workItem } } }, // إذا workItems مصفوفة
        { workItem: workItem } // إذا workItem نص
      ];
    }
    
    console.log('🔍 Filter used:', filter);
    
    // استخدام collections الخاصة بالمشروع
    // إذا لم يكن req.projectCollections موجود، حاول إنشائه من projectId و companyName
    let contractorsCol;
    
    if (req.projectCollections && req.projectCollections.contractorsCollection) {
      contractorsCol = req.projectCollections.contractorsCollection;
      console.log('✅ استخدام req.projectCollections');
    } else if (projectId && req.companyName) {
      // إنشاء collections المشروع يدوياً
      const projectColls = getProjectCollections(req.companyName, projectId);
      if (projectColls && projectColls.contractorsCollection) {
        contractorsCol = projectColls.contractorsCollection;
        console.log('✅ تم إنشاء project collections يدوياً');
      } else {
        contractorsCol = contractorsCollection;
        console.log('⚠️ فشل إنشاء project collections - استخدام collection القديم');
      }
    } else if (projectId && req.company?.companyName) {
      // محاولة أخيرة باستخدام req.company.companyName
      const projectColls = getProjectCollections(req.company.companyName, projectId);
      if (projectColls && projectColls.contractorsCollection) {
        contractorsCol = projectColls.contractorsCollection;
        console.log('✅ تم إنشاء project collections من req.company.companyName');
      } else {
        contractorsCol = contractorsCollection;
        console.log('⚠️ فشل إنشاء project collections - استخدام collection القديم');
      }
    } else {
      // fallback للـ collection القديم
      contractorsCol = contractorsCollection;
      console.log('⚠️ استخدام collection القديم (fallback) - لا يوجد companyName');
    }
    
    console.log(`🗃️ Collection name: ${contractorsCol.collectionName}`);
    
    const contractors = await contractorsCol.find(filter).toArray();
    console.log(`📊 Found ${contractors.length} contractors`);
    
    res.json(contractors);
  } catch (err) {
    console.error('❌ Error in GET /contractors:', err);
    res.status(500).json({ error: err.message });
  }
});

// جلب مقاول واحد (يدعم maxTotalPercent ويدعم المواد)
app.get('/contractors/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // استخدام collections الخاصة بالمشروع
    const contractorsCol = req.projectCollections ? req.projectCollections.contractorsCollection : contractorsCollection;
    
    let contractor;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      contractor = await contractorsCol.findOne({ _id: new ObjectId(id) });
    } else {
      contractor = await contractorsCol.findOne({ _id: id });
    }
    if (!contractor) return res.status(404).json({ error: 'Contractor not found' });
    if (!Array.isArray(contractor.materials)) contractor.materials = [];
    if (!Array.isArray(contractor.contractorDeductions)) contractor.contractorDeductions = [];
    // دعم فلترة المواد الغير مخصومة فقط إذا طلب العميل ذلك عبر كويري سترينج
    if (req.query.onlyUndeducted === '1' || req.query.onlyUndeducted === 'true') {
      contractor.materials = contractor.materials.filter(mat => !mat.deductedInExtractNumber);
    }
    res.json(contractor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف مقاول
app.delete('/contractors/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    // إذا كان id من نوع ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await contractorsCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await contractorsCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المقاول' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل بيانات مقاول (يدعم maxTotalPercent ويدعم المواد)
app.put('/contractors/:id', async (req, res) => {
  try {
    const id = req.params.id;
    if (req.body.maxTotalPercentPerItem === undefined) req.body.maxTotalPercentPerItem = {};
    if (req.body.maxTotalPercent !== undefined) {
      req.body.maxTotalPercent = parseFloat(req.body.maxTotalPercent) || 100;
    }
    // إذا لم يوجد materials أضفه كمصفوفة فارغة
    if (!Array.isArray(req.body.materials)) req.body.materials = [];
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await contractorsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
    } else {
      result = await contractorsCollection.updateOne(
        { _id: id },
        { $set: req.body }
      );
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المقاول' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث حالة خصم مادة معينة لمقاول (تعيين رقم المستخلص وتاريخ الخصم)
app.put('/contractors/:id/materials/deduct', async (req, res) => {
  try {
    const contractorId = req.params.id;
    const { name, deductedInExtractNumber, deductedDate } = req.body;
    if (!name || !deductedInExtractNumber) {
      return res.status(400).json({ error: 'name و deductedInExtractNumber مطلوبة' });
    }
    const filter = {
      _id: /^[0-9a-fA-F]{24}$/.test(contractorId) ? new ObjectId(contractorId) : contractorId,
      "materials.name": name
    };
    const update = {
      $set: {
        "materials.$.deductedInExtractNumber": deductedInExtractNumber,
        "materials.$.deductedDate": deductedDate || null
      }
    };
    const result = await contractorsCollection.updateOne(filter, update);
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المادة أو المقاول' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




// تعديل عمل واحد في المستخلص
app.put('/extracts/:id/work-items/:workIndex', async (req, res) => {
  try {
    const extractId = req.params.id;
    const workIndex = parseInt(req.params.workIndex);
    const updatedWorkItem = req.body;
    
    console.log('📝 تعديل عمل واحد - المستخلص:', extractId, 'الفهرس:', workIndex);
    console.log('📝 البيانات الجديدة:', updatedWorkItem);
    
    // التحقق من نوع المعرف
    let query;
    if (/^[0-9a-fA-F]{24}$/.test(extractId)) {
      query = { _id: new ObjectId(extractId) };
    } else {
      query = { _id: extractId };
    }
    
    // جلب المستخلص الحالي
    const extract = await extractsCollection.findOne(query);
    if (!extract) {
      return res.status(404).json({ error: 'المستخلص غير موجود' });
    }
    
    if (!Array.isArray(extract.workItems) || workIndex < 0 || workIndex >= extract.workItems.length) {
      return res.status(400).json({ error: 'فهرس العمل غير صحيح' });
    }
    
    // تحديث العمل المحدد
    const updatedWork = {
      ...extract.workItems[workIndex],
      ...updatedWorkItem,
      _id: extract.workItems[workIndex]._id || new ObjectId(),
      updatedAt: new Date()
    };
    
    // تحديث المصفوفة
    extract.workItems[workIndex] = updatedWork;
    
    // حفظ التحديث في قاعدة البيانات
    const result = await extractsCollection.updateOne(
      query,
      { 
        $set: { 
          workItems: extract.workItems,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ نتيجة التحديث:', result);
    
    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'فشل في تحديث العمل' });
    }
    
    res.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      updatedWork: updatedWork,
      message: 'تم تحديث العمل بنجاح في قاعدة البيانات'
    });
    
  } catch (err) {
    console.error('❌ خطأ في تعديل العمل:', err);
    res.status(500).json({ error: err.message });
  }
});

// حذف عمل واحد من المستخلص
app.delete('/extracts/:id/work-items/:workIndex', async (req, res) => {
  try {
    const extractId = req.params.id;
    const workIndex = parseInt(req.params.workIndex);
    
    console.log('🗑️ حذف عمل واحد - المستخلص:', extractId, 'الفهرس:', workIndex);
    
    // التحقق من نوع المعرف
    let query;
    if (/^[0-9a-fA-F]{24}$/.test(extractId)) {
      query = { _id: new ObjectId(extractId) };
    } else {
      query = { _id: extractId };
    }
    
    // جلب المستخلص الحالي
    const extract = await extractsCollection.findOne(query);
    if (!extract) {
      return res.status(404).json({ error: 'المستخلص غير موجود' });
    }
    
    if (!Array.isArray(extract.workItems) || workIndex < 0 || workIndex >= extract.workItems.length) {
      return res.status(400).json({ error: 'فهرس العمل غير صحيح' });
    }
    
    // التحقق من أن العمل ليس فاصل أو مقفول
    const workToDelete = extract.workItems[workIndex];
    if (workToDelete.isSeparator) {
      return res.status(400).json({ error: 'لا يمكن حذف الفواصل' });
    }
    
    if (workToDelete.locked) {
      return res.status(400).json({ error: 'لا يمكن حذف العمل المقفول' });
    }
    
    // حذف العمل من المصفوفة
    extract.workItems.splice(workIndex, 1);
    
    // حفظ التحديث في قاعدة البيانات
    const result = await extractsCollection.updateOne(
      query,
      { 
        $set: { 
          workItems: extract.workItems,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('✅ نتيجة الحذف:', result);
    
    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'فشل في حذف العمل' });
    }
    
    res.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      remainingWorkItems: extract.workItems.length,
      message: 'تم حذف العمل بنجاح من قاعدة البيانات'
    });
    
  } catch (err) {
    console.error('❌ خطأ في حذف العمل:', err);
    res.status(500).json({ error: err.message });
  }
});

// جلب البنود الفريدة من جميع المقاولين
app.get('/contractors/work-items/unique', async (req, res) => {
  try {
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    let filter = { projectId };
    
    // استخدام collections الخاصة بالمشروع
    let contractorsCol;
    
    if (req.projectCollections) {
      contractorsCol = req.projectCollections.contractorsCollection;
      console.log('✅ استخدام req.projectCollections لجلب البنود');
    } else if (projectId && req.companyName) {
      // إنشاء collections المشروع يدوياً
      const projectColls = getProjectCollections(req.companyName, projectId);
      contractorsCol = projectColls.contractorsCollection;
      console.log('✅ تم إنشاء project collections يدوياً لجلب البنود');
    } else {
      // fallback للـ collection القديم
      contractorsCol = contractorsCollection;
      console.log('⚠️ استخدام collection القديم لجلب البنود (fallback)');
    }
    
    const contractors = await contractorsCol.find(filter).toArray();
    const uniqueWorkItems = new Set();
    
    contractors.forEach(contractor => {
      if (contractor.workItem && contractor.workItem.trim()) {
        uniqueWorkItems.add(contractor.workItem.trim());
      }
    });
    
    const workItemsArray = Array.from(uniqueWorkItems).sort();
    console.log(`📋 تم العثور على ${workItemsArray.length} بنود فريدة`);
    res.json(workItemsArray);
  } catch (err) {
    console.error('خطأ في جلب البنود الفريدة:', err);
    res.status(500).json({ error: err.message });
  }
});







// API المستخلصات
app.post('/extracts', async (req, res) => {
  try {
    const extract = req.body;
    
    // استخدام companyId من middleware بدل اللي جاي من body
    if (req.companyId) {
      extract.companyId = req.companyId;
    }
    
    console.log('📝 حفظ مستخلص جديد:', {
      projectId: extract.projectId,
      companyId: extract.companyId,
      number: extract.number,
      contractor: extract.contractor
    });
    
    // التحقق من وجود projectId
    if (!extract.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    extract.createdAt = new Date();
    const result = await extractsCollection.insertOne(extract);
    
    console.log('✅ تم حفظ المستخلص بنجاح - ID:', result.insertedId);

    // تحديث نسب المقاول بناء على الأعمال في المستخلص
    if (extract.contractor && extract.workItems && Array.isArray(extract.workItems)) {
      const contractorId = extract.contractor;
      
      // حساب إجمالي النسب من المستخلص
      let totalPercentFromExtract = 0;
      extract.workItems.forEach(item => {
        if (!item.isSeparator && item.totalPercent && !isNaN(item.totalPercent)) {
          totalPercentFromExtract += parseFloat(item.totalPercent);
        }
      });

      // تحديث نسبة المقاول
      const contractorQuery = /^[0-9a-fA-F]{24}$/.test(contractorId) ? 
        { _id: new ObjectId(contractorId) } : 
        { _id: contractorId };

      // جلب بيانات المقاول الحالية
      const contractor = await contractorsCollection.findOne(contractorQuery);
      if (contractor) {
        const currentTotalPercent = contractor.totalPercent || 0;
        const newTotalPercent = currentTotalPercent + totalPercentFromExtract;

        // تحديث النسبة الإجمالية للمقاول
        await contractorsCollection.updateOne(
          contractorQuery,
          { 
            $set: { 
              totalPercent: newTotalPercent,
              lastExtractNumber: extract.number,
              lastExtractDate: extract.date
            }
          }
        );

        console.log(`✅ تم تحديث نسبة المقاول ${contractor.name} من ${currentTotalPercent}% إلى ${newTotalPercent}%`);
      }
    }

    // بعد حفظ المستخلص، إذا كان فيه خصومات تخص مواد المقاول، حدّث المواد وأضف إلى contractorDeductions
    if (extract.deductions && Array.isArray(extract.deductions) && extract.contractor && extract.number) {
      for (const ded of extract.deductions) {
        // ابحث عن المادة في materials للمقاول بنفس الاسم والتاريخ
        if (ded.statement && ded.date) {
          // تحديث المادة نفسها (تم الخصم في مستخلص)
          await contractorsCollection.updateOne(
            { _id: /^[0-9a-fA-F]{24}$/.test(extract.contractor) ? new ObjectId(extract.contractor) : extract.contractor,
              "materials.name": ded.statement,
              "materials.date": ded.date
            },
            {
              $set: {
                "materials.$.deductedInExtractNumber": extract.number,
                "materials.$.deductedInExtractId": result.insertedId
              }
            }
          );
          // أضف سجل جديد في contractorDeductions
          await contractorsCollection.updateOne(
            { _id: /^[0-9a-fA-F]{24}$/.test(extract.contractor) ? new ObjectId(extract.contractor) : extract.contractor },
            {
              $push: {
                contractorDeductions: {
                  name: ded.statement,
                  quantity: ded.quantity,
                  unitPrice: ded.category,
                  extractNumber: extract.number,
                  extractId: result.insertedId,
                  date: ded.date
                }
              }
            }
          );
        }
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/extracts', async (req, res) => {
  try {
    const { projectId } = req.query;
    const companyId = req.companyId || req.query.companyId;
    
    console.log('📋 طلب جلب مستخلصات - projectId:', projectId, 'companyId:', companyId);
    
    // ⚠️ إلزامي: يجب وجود companyId أو projectId لمنع عرض مستخلصات كل الشركات
    if (!companyId && !projectId) {
      console.error('❌ GET /extracts: companyId أو projectId مفقود!');
      return res.status(400).json({ error: 'companyId or projectId is required' });
    }
    
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    // إضافة فلتر الشركة إذا كان متوفراً
    if (companyId) {
      filter.companyId = companyId;
    }
    
    console.log('🔍 Filter المستخدم:', JSON.stringify(filter));
    
    const extracts = await extractsCollection.find(filter).toArray();
    console.log(`📊 تم جلب ${extracts.length} مستخلص`);
    
    if (extracts.length > 0) {
      console.log('📄 أول مستخلص:', {
        number: extracts[0].number,
        projectId: extracts[0].projectId,
        companyId: extracts[0].companyId
      });
    }
    
    // جلب المستخدمين للشركة المحددة فقط
    const usersFilter = companyId ? { companyId } : {};
    const users = await usersCollection.find(usersFilter).toArray();
    console.log(`تم جلب ${users.length} مستخدم`);

    const extractsWithUser = extracts.map(extract => {
      // محاولة البحث عن المستخدم بطرق متعددة
      let user = null;
      
      // البحث بـ userId أولاً
      if (extract.userId) {
        const extractUserId = extract.userId.toString();
        user = users.find(u => u._id && u._id.toString() === extractUserId);
      }
      
      // إذا لم نجد، ابحث بـ createdBy
      if (!user && extract.createdBy) {
        const extractCreatedBy = extract.createdBy.toString();
        user = users.find(u => u._id && u._id.toString() === extractCreatedBy);
      }
      
      // إذا لم نجد، ابحث بـ username مباشرة
      if (!user && extract.username) {
        user = users.find(u => u.username === extract.username);
      }

      const result = {
        ...extract,
        username: user ? user.username : (extract.username || 'غير محدد')
      };
      
      console.log(`مستخلص ${extract.number || extract._id}: المستخدم=${result.username}`);
      return result;
    });

    console.log(`إرسال ${extractsWithUser.length} مستخلص مع بيانات المستخدمين`);
    res.json(extractsWithUser);
  } catch (err) {
    console.error('خطأ في جلب المستخلصات:', err);
    res.status(500).json({ error: err.message });
  }
});

// جلب مستخلص واحد
app.get('/extracts/:id', async (req, res) => {
  try {
    const extractId = req.params.id;
    console.log('جلب مستخلص بـ ID:', extractId);
    
    let extract = null;
    
    // محاولة جلب المستخلص بـ ObjectId أولاً
    if (/^[0-9a-fA-F]{24}$/.test(extractId)) {
      extract = await extractsCollection.findOne({ _id: new ObjectId(extractId) });
      console.log('البحث بـ ObjectId:', extract ? 'تم العثور عليه' : 'لم يتم العثور عليه');
    }
    
    // إذا لم نجد، ابحث بـ ID كنص
    if (!extract) {
      extract = await extractsCollection.findOne({ _id: extractId });
      console.log('البحث بـ String ID:', extract ? 'تم العثور عليه' : 'لم يتم العثور عليه');
    }
    
    // إذا لم نجد، ابحث برقم المستخلص
    if (!extract) {
      extract = await extractsCollection.findOne({ number: extractId });
      console.log('البحث برقم المستخلص:', extract ? 'تم العثور عليه' : 'لم يتم العثور عليه');
    }
    
    if (!extract) {
      console.log('لم يتم العثور على المستخلص');
      return res.status(404).json({ error: 'Extract not found' });
    }

    // التأكد من وجود الحقول المطلوبة
    extract.otherWorks = extract.otherWorks || [];
    extract.otherWorksHeaders = extract.otherWorksHeaders || [];
    extract.workItems = extract.workItems || [];
    extract.deductions = extract.deductions || [];
    extract.lumpSumRows = extract.lumpSumRows || [];
    extract.dailyRows = extract.dailyRows || [];

    console.log(`تم جلب المستخلص بنجاح - رقم: ${extract.number}, بنود العمل: ${extract.workItems.length}`);
    res.json(extract);
  } catch (err) {
    console.error('خطأ في جلب المستخلص:', err);
    res.status(500).json({ error: err.message });
  }
});

// API محسن لتعديل المستخلص مع لوقينق مفصل
app.put('/extracts/:id', async (req, res) => {
  try {
    const extractId = req.params.id;
    console.log(`🔄 تحديث المستخلص: ${extractId}`);
    
    let filter;
    if (/^[0-9a-fA-F]{24}$/.test(extractId)) {
      filter = { _id: new ObjectId(extractId) };
    } else {
      filter = { _id: extractId };
    }
    
    const oldExtract = await extractsCollection.findOne(filter);
    if (!oldExtract) {
      console.log(`❌ لم يتم العثور على المستخلص: ${extractId}`);
      return res.status(404).json({ error: 'Extract not found' });
    }
    
    console.log(`✅ تم العثور على المستخلص: ${oldExtract.number || oldExtract._id}`);

    // أضف _id لأي بند جديد وحماية البنود المقفولة
    if (Array.isArray(req.body.workItems)) {
      console.log(`📋 معالجة ${req.body.workItems.length} بند عمل`);
      req.body.workItems = req.body.workItems.map((item, idx) => {
        const oldItem = oldExtract.workItems && oldExtract.workItems[idx];
        // إذا كان البند مقفول أعده كما هو
        if (oldItem && oldItem.locked) {
          console.log(`🔒 البند ${idx} مقفول - تم تجاهل التعديل`);
          return oldItem;
        }
        return {
          _id: item._id || new ObjectId(),
          ...item,
          updatedAt: new Date()
        };
      });
    }

    // إضافة تاريخ التحديث
    req.body.updatedAt = new Date();

    const result = await extractsCollection.updateOne(filter, { $set: req.body });
    
    if (result.modifiedCount === 0) {
      console.log(`⚠️ لم يتم تعديل أي شيء في المستخلص: ${extractId}`);
      return res.status(500).json({ error: 'فشل في تحديث المستخلص' });
    }
    
    console.log(`✅ تم تحديث المستخلص بنجاح: ${extractId}`);
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('❌ خطأ في تحديث المستخلص:', err);
    res.status(500).json({ error: err.message });
  }
});

// API جديد لتعديل عمل واحد فقط في المستخلص
app.put('/extracts/:id/work-items/:workIndex', async (req, res) => {
  try {
    const extractId = req.params.id;
    const workIndex = parseInt(req.params.workIndex);
    
    console.log(`🔄 تعديل العمل ${workIndex} في المستخلص ${extractId}`);
    
    if (isNaN(workIndex) || workIndex < 0) {
      return res.status(400).json({ error: 'فهرس العمل غير صحيح' });
    }

    let filter;
    if (/^[0-9a-fA-F]{24}$/.test(extractId)) {
      filter = { _id: new ObjectId(extractId) };
    } else {
      filter = { _id: extractId };
    }

    const extract = await extractsCollection.findOne(filter);
    if (!extract) {
      return res.status(404).json({ error: 'المستخلص غير موجود' });
    }

    if (!extract.workItems || workIndex >= extract.workItems.length) {
      return res.status(400).json({ error: 'فهرس العمل خارج النطاق' });
    }

    const workItem = extract.workItems[workIndex];
    if (workItem.isSeparator) {
      return res.status(400).json({ error: 'لا يمكن تعديل الفواصل' });
    }

    if (workItem.locked) {
      return res.status(400).json({ error: 'هذا العمل مقفول ولا يمكن تعديله' });
    }

    // تحديث العمل
    const updatedWork = {
      ...workItem,
      ...req.body,
      _id: workItem._id || new ObjectId(),
      updatedAt: new Date()
    };

    // تحديث العمل في المصفوفة
    extract.workItems[workIndex] = updatedWork;

    const result = await extractsCollection.updateOne(
      filter,
      { 
        $set: { 
          workItems: extract.workItems,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'فشل في تحديث العمل' });
    }

    console.log(`✅ تم تحديث العمل ${workIndex} بنجاح`);
    res.json({ success: true, updatedWork });
  } catch (err) {
    console.error('❌ خطأ في تعديل العمل:', err);
    res.status(500).json({ error: err.message });
  }
});

// API جديد لحذف عمل واحد من المستخلص
app.delete('/extracts/:id/work-items/:workIndex', async (req, res) => {
  try {
    const extractId = req.params.id;
    const workIndex = parseInt(req.params.workIndex);
    
    console.log(`🗑️ حذف العمل ${workIndex} من المستخلص ${extractId}`);
    
    if (isNaN(workIndex) || workIndex < 0) {
      return res.status(400).json({ error: 'فهرس العمل غير صحيح' });
    }

    let filter;
    if (/^[0-9a-fA-F]{24}$/.test(extractId)) {
      filter = { _id: new ObjectId(extractId) };
    } else {
      filter = { _id: extractId };
    }

    const extract = await extractsCollection.findOne(filter);
    if (!extract) {
      return res.status(404).json({ error: 'المستخلص غير موجود' });
    }

    if (!extract.workItems || workIndex >= extract.workItems.length) {
      return res.status(400).json({ error: 'فهرس العمل خارج النطاق' });
    }

    const workItem = extract.workItems[workIndex];
    if (workItem.isSeparator) {
      return res.status(400).json({ error: 'لا يمكن حذف الفواصل' });
    }

    if (workItem.locked) {
      return res.status(400).json({ error: 'هذا العمل مقفول ولا يمكن حذفه' });
    }

    // حذف العمل من المصفوفة
    extract.workItems.splice(workIndex, 1);

    const result = await extractsCollection.updateOne(
      filter,
      { 
        $set: { 
          workItems: extract.workItems,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(500).json({ error: 'فشل في حذف العمل' });
    }

    console.log(`✅ تم حذف العمل ${workIndex} بنجاح`);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ خطأ في حذف العمل:', err);
    res.status(500).json({ error: err.message });
  }
});

// حذف مستخلص كامل
app.delete('/extracts/:id', async (req, res) => {
  try {
    const extractId = req.params.id;
    console.log(`🗑️ حذف المستخلص: ${extractId}`);
    
    // التحقق من نوع المعرف
    let query;
    if (/^[0-9a-fA-F]{24}$/.test(extractId)) {
      query = { _id: new ObjectId(extractId) };
    } else {
      query = { _id: extractId };
    }
    
    // البحث عن المستخلص المراد حذفه
    const extractToDelete = await extractsCollection.findOne(query);
    if (!extractToDelete) {
      console.log(`❌ لم يتم العثور على المستخلص: ${extractId}`);
      return res.status(404).json({ error: 'المستخلص غير موجود' });
    }
    
    // البحث عن آخر مستخلص لنفس المقاول (أعلى رقم مستخلص)
    const lastExtractForContractor = await extractsCollection.findOne(
      { contractor: extractToDelete.contractor },
      { sort: { number: -1 } }
    );
    
    // التحقق من أن المستخلص المراد حذفه هو آخر مستخلص للمقاول
    if (!lastExtractForContractor || lastExtractForContractor._id.toString() !== extractToDelete._id.toString()) {
      console.log(`❌ لا يمكن حذف هذا المستخلص - ليس آخر مستخلص للمقاول`);
      return res.status(400).json({ 
        error: 'لا يمكن حذف هذا المستخلص. يمكن حذف آخر مستخلص فقط لكل مقاول.' 
      });
    }
    
    // محاولة الحذف
    const result = await extractsCollection.deleteOne(query);
    
    if (result.deletedCount === 0) {
      console.log(`❌ فشل حذف المستخلص: ${extractId}`);
      return res.status(500).json({ error: 'فشل في حذف المستخلص' });
    }
    
    console.log(`✅ تم حذف المستخلص بنجاح: ${extractId}`);
    res.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: 'تم حذف المستخلص بنجاح'
    });
    
  } catch (err) {
    console.error('❌ خطأ في حذف المستخلص:', err);
    res.status(500).json({ error: err.message });
  }
});

// API المستخدمين

// إضافة مستخدم جديد
app.post('/users', async (req, res) => {
  try {
    console.log('📥 طلب إضافة مستخدم جديد...');
    console.log('📋 البيانات المستلمة:', req.body);
    
    const user = req.body;
    
    // إضافة companyId إذا لم يكن موجود (للمستخدم الأول من الشركة)
    if (!user.companyId) {
      console.warn('⚠️ لا يوجد companyId، سيتم إنشاء شركة جديدة');
      // إنشاء شركة جديدة تلقائياً
      const newCompany = {
        companyName: user.companyName || 'شركة جديدة',
        email: user.email,
        subscription: 'active',
        createdAt: new Date()
      };
      const companyResult = await companiesCollection.insertOne(newCompany);
      user.companyId = companyResult.insertedId.toString();
      console.log('✅ تم إنشاء شركة جديدة:', user.companyId);
    } else {
      console.log('✅ CompanyId موجود:', user.companyId);
    }
    
    // إضافة الحقول الجديدة
    user.role = user.role || 'user'; // admin أو user
    user.projectIds = user.projectIds || []; // المشاريع المخصصة للمستخدم
    user.createdAt = new Date();
    
    console.log('💾 حفظ المستخدم في قاعدة البيانات...');
    const result = await usersCollection.insertOne(user);
    
    console.log(`✅ Created user: ${user.username} (role: ${user.role}) for company: ${user.companyId}`);
    
    res.status(201).json({ 
      success: true, 
      userId: result.insertedId, 
      companyId: user.companyId,
      role: user.role 
    });
  } catch (err) {
    console.error('❌ خطأ في إضافة المستخدم:', err);
    res.status(500).json({ error: err.message });
  }
});

// جلب جميع المستخدمين
app.get('/users', async (req, res) => {
  try {
    // إعطاء الأولوية لـ query parameter إذا كان موجود
    const companyId = req.query.companyId || req.companyId;
    
    // ⚠️ إلزامي: يجب وجود companyId لمنع عرض مستخدمين كل الشركات
    if (!companyId) {
      console.error('❌ GET /users: companyId مفقود!');
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    const filter = { companyId };
    
    console.log(`📋 جلب المستخدمين - CompanyId: ${companyId}`);
    const users = await usersCollection.find(filter).toArray();
    console.log(`✅ Found ${users.length} users for company: ${companyId}`);
    res.json(users);
  } catch (err) {
    console.error('❌ خطأ في جلب المستخدمين:', err);
    res.status(500).json({ error: err.message });
  }
});

// حذف مستخدم (اختياري)
app.delete('/users/:id', async (req, res) => {
  try {
    await usersCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعيين مشاريع لمستخدم (Assign Projects to User)
app.put('/users/:id/assign-projects', async (req, res) => {
  try {
    const userId = req.params.id;
    const { projectIds } = req.body; // مصفوفة من project IDs
    
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          projectIds: projectIds || [],
          updatedAt: new Date()
        } 
      }
    );
    
    if (result.modifiedCount > 0) {
      console.log(`✅ Assigned ${projectIds.length} projects to user: ${userId}`);
      res.json({ success: true, message: 'تم تعيين المشاريع للمستخدم بنجاح' });
    } else {
      res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }
  } catch (err) {
    console.error('Error assigning projects:', err);
    res.status(500).json({ error: err.message });
  }
});

// تسجيل الدخول
// ====================================
// Platform Admin Routes
// ====================================

// تسجيل دخول مسؤولي المنصة
app.post('/platform/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 محاولة تسجيل دخول المنصة:', email);
    
    const admin = await platformAdminsCollection.findOne({ email, password });
    
    if (admin) {
      console.log('✅ تم تسجيل الدخول بنجاح:', admin.name);
      res.json({ 
        success: true, 
        admin: { 
          ...admin, 
          _id: admin._id.toString() 
        } 
      });
    } else {
      console.log('❌ فشل تسجيل الدخول');
      res.json({ success: false, message: 'الإيميل أو كلمة المرور غير صحيحة' });
    }
  } catch (err) {
    console.error('خطأ في تسجيل دخول المنصة:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// جلب جميع مسؤولي المنصة
app.get('/platform/admins', async (req, res) => {
  try {
    const admins = await platformAdminsCollection.find({}).toArray();
    res.json(admins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة مسؤول جديد للمنصة
app.post('/platform/admins', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // التحقق من عدم وجود نفس الإيميل
    const existing = await platformAdminsCollection.findOne({ email });
    if (existing) {
      return res.json({ success: false, message: 'هذا الإيميل مسجل بالفعل' });
    }
    
    const newAdmin = {
      email,
      password, // في الإنتاج يجب تشفيره!
      name,
      role: role || 'admin',
      createdAt: new Date()
    };
    
    const result = await platformAdminsCollection.insertOne(newAdmin);
    
    res.json({ 
      success: true, 
      message: 'تم إضافة المسؤول بنجاح',
      adminId: result.insertedId 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// تعديل مسؤول المنصة
app.put('/platform/admins/:id', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    const updateData = { name, role };
    if (password) updateData.password = password;
    if (email) updateData.email = email;
    
    const result = await platformAdminsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    res.json({ 
      success: true, 
      message: 'تم تحديث البيانات بنجاح',
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// حذف مسؤول المنصة
app.delete('/platform/admins/:id', async (req, res) => {
  try {
    const result = await platformAdminsCollection.deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    res.json({ 
      success: true, 
      message: 'تم حذف المسؤول بنجاح',
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ====================================
// Company Users Routes
// ====================================

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log(`🔐 محاولة تسجيل دخول: ${email}`);
    
    const user = await usersCollection.findOne({ email, password });
    
    if (user) {
      console.log(`✅ تم العثور على المستخدم: ${user.username} (CompanyId: ${user.companyId})`);
      
      // جلب بيانات الشركة الخاصة بالمستخدم
      let company = null;
      let redirectUrl = null;
      
      if (user.companyId) {
        try {
          company = await companiesCollection.findOne({ 
            _id: new ObjectId(user.companyId) 
          });
          
          if (company) {
            console.log(`🏢 تم العثور على الشركة: ${company.companyName} (Subdomain: ${company.subdomain})`);
            
            // إنشاء رابط التوجيه الصحيح بناءً على subdomain الشركة
            const baseUrl = process.env.NODE_ENV === 'production' ? 
              'https://taskon-qzj8.onrender.com' : 
              'http://localhost:4000';
            
            // توجيه المستخدم لصفحة المشاريع مع subdomain الشركة
            redirectUrl = `${baseUrl}/projects.html?company=${company.subdomain}`;
            
            console.log(`🔗 رابط التوجيه: ${redirectUrl}`);
          } else {
            console.warn(`⚠️ لم يتم العثور على الشركة للمعرف: ${user.companyId}`);
          }
        } catch (err) {
          console.error('❌ خطأ في جلب بيانات الشركة:', err);
        }
      } else {
        console.warn(`⚠️ المستخدم ${user.username} لا يملك companyId!`);
      }
      
      // إرجاع بيانات المستخدم مع معلومات الشركة ورابط التوجيه
      res.json({ 
        success: true, 
        user: { ...user, _id: user._id.toString() },
        company: company ? {
          _id: company._id.toString(),
          companyName: company.companyName,
          subdomain: company.subdomain,
          email: company.email
        } : null,
        redirectUrl: redirectUrl
      });
    } else {
      console.log(`❌ فشل تسجيل الدخول: ${email}`);
      res.json({ success: false, message: 'الإيميل أو كلمة المرور غير صحيحة' });
    }
  } catch (err) {
    console.error('❌ خطأ في تسجيل الدخول:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// تحديث صلاحيات مستخدم
app.put('/users/:id/permissions', async (req, res) => {
  try {
    const id = req.params.id;
    let filter;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { _id: id };
    }
    const result = await usersCollection.updateOne(
      filter,
      { $set: { permissions: req.body.permissions || [] } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل بيانات مستخدم
app.put('/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
    } else {
      result = await usersCollection.updateOne(
        { _id: id },
        { $set: req.body }
      );
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المستخدم' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API الأعمال الإضافية

// إضافة عمل إضافي
// app.post('/extra-works', async (req, res) => { ... });
// جلب كل الأعمال الإضافية
// app.get('/extra-works', async (req, res) => { ... });
// جلب عمل إضافي واحد
// app.get('/extra-works/:id', async (req, res) => { ... });
// تعديل عمل إضافي
// app.put('/extra-works/:id', async (req, res) => { ... });
// حذف عمل إضافي
// app.delete('/extra-works/:id', async (req, res) => { ... });

// جلب جدول المقطوعيات لمستخلص معين
app.get('/extracts/:id/lump-sum', async (req, res) => {
  try {
    let extract = null;
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      extract = await extractsCollection.findOne({ _id: new ObjectId(req.params.id) });
    }
    if (!extract) {
      extract = await extractsCollection.findOne({ _id: req.params.id });
    }
    if (!extract) return res.status(404).json({ error: 'Extract not found' });
    res.json({ lumpSumRows: extract.lumpSumRows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب جدول اليوميات لمستخلص معين
app.get('/extracts/:id/daily', async (req, res) => {
  try {
    let extract = null;
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      extract = await extractsCollection.findOne({ _id: new ObjectId(req.params.id) });
    }
    if (!extract) {
      extract = await extractsCollection.findOne({ _id: req.params.id });
    }
    if (!extract) return res.status(404).json({ error: 'Extract not found' });
    res.json({ dailyRows: extract.dailyRows || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث جدول المقطوعيات لمستخلص معين
app.put('/extracts/:id/lump-sum', async (req, res) => {
  try {
    const lumpSumRows = req.body.lumpSumRows || [];
    let result = await extractsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { lumpSumRows } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث جدول اليوميات لمستخلص معين
app.put('/extracts/:id/daily', async (req, res) => {
  try {
    const dailyRows = req.body.dailyRows || [];
    let result = await extractsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { dailyRows } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة مستخلص باستخدام منطق مماثل للنموذج (workItems لا تلمسها!)
app.post('/extracts/model', async (req, res) => {
  try {
    // workItems قد تحتوي على فواصل
    const extract = {
      ...req.body,
      workItems: req.body.workItems // لا تلمسها!
    };
    await extractsCollection.insertOne(extract);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// نقل بنود من مقاول إلى آخر وتحديث حالة البنود عند المقاول القديم
app.post('/contractors/:fromId/transfer-items', async (req, res) => {
  try {
    const fromId = req.params.fromId;
    const { toId, itemIds } = req.body;
    if (!toId || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'toId و itemIds مطلوبة' });
    }

    // تحديث البنود في جميع المستخلصات التي تخص المقاول القديم
    // نفترض أن البنود موجودة في workItems داخل مستندات extracts
    // سنبحث عن جميع المستخلصات التي تخص المقاول القديم وتحتوي على البنود المطلوبة
    const fromContractorId = /^[0-9a-fA-F]{24}$/.test(fromId) ? new ObjectId(fromId) : fromId;
    const toContractorId = /^[0-9a-fA-F]{24}$/.test(toId) ? new ObjectId(toId) : toId;

    // تحديث البنود: نجعلها غير نشطة (isActive: false) أو نغير مالكها (contractor)
    // هنا سنجعلها غير نشطة فقط (يمكنك التعديل حسب الحاجة)
    const updateResult = await extractsCollection.updateMany(
      {
        contractor: fromContractorId,
        "workItems._id": { $in: itemIds.map(id => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id) }
      },
      {
        $set: { "workItems.$[elem].isActive": false }
      },
      {
        arrayFilters: [{ "elem._id": { $in: itemIds.map(id => /^[0-9a-fA-F]{24}$/.test(id) ? new ObjectId(id) : id) } }]
      }
    );

    // يمكنك أيضاً نقل البنود فعلياً إلى المقاول الجديد إذا كان ذلك مطلوباً (مثلاً: نسخها أو نقلها)
    // هنا نكتفي بتعطيلها عند المقاول القديم

    res.json({
      success: true,
      modifiedCount: updateResult.modifiedCount,
      message: `تم تحديث حالة ${updateResult.modifiedCount} بند عند المقاول القديم`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// API التوريدات
app.post('/supplies', async (req, res) => {
  try {
    const supply = req.body;
    
    // التحقق من وجود projectId
    if (!supply.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    // إضافة حقل issued للتوريدات (يبدأ بصفر)
    supply.issued = 0;
    supply.createdAt = new Date();
    const result = await suppliesCollection.insertOne(supply);

    // إضافة التوريد إلى كولكشن المخزن (تسجيل كامل)
    await storeCollection.insertOne({
      date: supply.date,
      supplier: supply.supplier,
      item: supply.item,
      quantity: Number(supply.quantity) || 0,
      unit: supply.unit,
      unitPrice: supply.unitPrice,
      total: (Number(supply.quantity) * Number(supply.unitPrice || 0)).toFixed(2),
      operationType: 'توريد',
      invoiceNo: supply.invoiceNo,
      notes: supply.notes || '',
      supplyId: result.insertedId, // ربط بالتوريد الأصلي
      projectId: supply.projectId // إضافة projectId للمخزن أيضاً
    });

    // إذا كان هناك اسم مورد، أضف التوريد نفسه إلى مصفوفة supplies في كولكشن المورد
    // مع تعيين unitPrice، ودون حذف التوريدات القديمة
    if (supply.supplier) {
      const supplierDoc = await suppliersCollection.findOne({ name: supply.supplier });
      if (supplierDoc && supplierDoc._id) {
        const supplyForSupplier = { ...supply, unitPrice: supply.unitPrice };
        await suppliersCollection.updateOne(
          { _id: supplierDoc._id },
          { $push: { supplies: supplyForSupplier } }
        );
      }
    }

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/supplies', async (req, res) => {
  try {
    const { projectId } = req.query;
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    const supplies = await suppliesCollection.find(filter).toArray();
    res.json(supplies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف توريد
app.delete('/supplies/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let supplyDoc;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      supplyDoc = await suppliesCollection.findOne({ _id: new ObjectId(id) });
    } else {
      supplyDoc = await suppliesCollection.findOne({ _id: id });
    }
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await suppliesCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await suppliesCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على التوريد' });
    }

    // حذف التوريد من مصفوفة supplies في جميع الموردين بناءً على invoiceNo/date/item
    if (supplyDoc) {
      await suppliersCollection.updateMany(
        {},
        {
          $pull: {
            supplies: {
              invoiceNo: supplyDoc.invoiceNo || '',
              date: supplyDoc.date || '',
              item: supplyDoc.item || ''
            }
          }
        }
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API أمر إرجاع التوريدات
app.post('/supplies/return', async (req, res) => {
  try {
    const { 
      originalSupplyId, 
      returnedQuantity, 
      returnReason, 
      returnNotes, 
      returnDate, 
      refundAmount 
    } = req.body;

    console.log('🔄 معالجة أمر إرجاع:', { originalSupplyId, returnedQuantity, returnReason });

    // البحث عن التوريد الأصلي
    const originalSupply = await suppliesCollection.findOne({
      _id: /^[0-9a-fA-F]{24}$/.test(originalSupplyId) ? new ObjectId(originalSupplyId) : originalSupplyId
    });

    if (!originalSupply) {
      return res.status(404).json({ error: 'التوريد الأصلي غير موجود' });
    }

    // التحقق من أن الكمية المرجعة لا تتجاوز المتاح
    const issuedQuantity = originalSupply.issued || 0;
    const availableForReturn = originalSupply.quantity - issuedQuantity;
    
    if (returnedQuantity > availableForReturn) {
      return res.status(400).json({ 
        error: `الكمية المرجعة (${returnedQuantity}) تتجاوز المتاح للإرجاع (${availableForReturn})` 
      });
    }

    // إنشاء سجل الإرجاع
    const returnRecord = {
      _id: new ObjectId(),
      type: 'return',
      originalSupplyId: originalSupply._id,
      supplier: originalSupply.supplier,
      item: originalSupply.item,
      unit: originalSupply.unit,
      unitPrice: originalSupply.unitPrice,
      quantity: -returnedQuantity, // كمية سالبة للإرجاع
      total: -refundAmount, // مبلغ سالب للاسترداد
      returnedQuantity: returnedQuantity,
      returnReason: returnReason,
      returnNotes: returnNotes,
      date: returnDate,
      createdAt: new Date(),
      originalSupplyDate: originalSupply.date,
      originalInvoiceNo: originalSupply.invoiceNo
    };

    // إضافة سجل الإرجاع لكولكشن التوريدات
    await suppliesCollection.insertOne(returnRecord);

    // تحديث كمية الصادر في التوريد الأصلي
    await suppliesCollection.updateOne(
      { _id: originalSupply._id },
      { 
        $inc: { issued: returnedQuantity },
        $set: { updatedAt: new Date() }
      }
    );

    // تحديث المخزن - خصم الكمية المرجعة
    await storeCollection.insertOne({
      _id: new ObjectId(),
      operation: 'return',
      item: originalSupply.item,
      quantity: -returnedQuantity, // كمية سالبة للخصم من المخزن
      unit: originalSupply.unit,
      unitPrice: originalSupply.unitPrice,
      total: -refundAmount,
      date: returnDate,
      referenceId: returnRecord._id,
      referenceType: 'supply_return',
      supplier: originalSupply.supplier,
      returnReason: returnReason,
      originalSupplyId: originalSupply._id,
      createdAt: new Date()
    });

    console.log('✅ تم تنفيذ أمر الإرجاع بنجاح');
    
    res.json({ 
      success: true, 
      returnId: returnRecord._id,
      message: 'تم تنفيذ أمر الإرجاع بنجاح',
      details: {
        returnedQuantity,
        refundAmount,
        remainingQuantity: originalSupply.quantity - (issuedQuantity + returnedQuantity)
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تنفيذ أمر الإرجاع:', err);
    res.status(500).json({ error: err.message });
  }
});

// حذف كولكشن التوريدات والحسابات المنفصلة لكل مورد
// فقط احفظ التوريدات والحسابات داخل كولكشن المورد نفسه

// إضافة توريد لمورد معين (يُحفظ فقط في suppliers) - استخدم نفس البيانات كما هي
app.post('/suppliers/:supplierId/supplies', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const data = req.body;

    // جلب بيانات المورد
    const supplier = await suppliersCollection.findOne(
      { _id: /^[0-9a-fA-F]{24}$/.test(supplierId) ? new ObjectId(supplierId) : supplierId }
    );
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });

    // التحقق من التكرار بناءً على date + invoiceNo + (desc أو item)
    function normalize(val) {
      return (val || '').toString().trim();
    }
    const dataKey = normalize(data.date) + '|' + normalize(data.invoiceNo) + '|' + (normalize(data.desc) || normalize(data.item));
    const isDuplicate = (row) => {
      const rowKey = normalize(row.date) + '|' + normalize(row.invoiceNo) + '|' + (normalize(row.desc) || normalize(row.item));
      return rowKey === dataKey;
    };

    if (Array.isArray(supplier.supplies) && supplier.supplies.some(isDuplicate)) {
      return res.status(200).json({ success: false, message: 'Supply already exists' });
    }

    // أضف التوريد إذا لم يكن مكرر
    const updateResult = await suppliersCollection.updateOne(
      { _id: /^[0-9a-fA-F]{24}$/.test(supplierId) ? new ObjectId(supplierId) : supplierId },
      { $push: { supplies: data } }
    );
    res.status(201).json({ success: true, modifiedCount: updateResult.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل توريدات مورد معين من كولكشن المورد فقط
app.get('/suppliers/:supplierId/supplies', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await suppliersCollection.findOne(
      { _id: /^[0-9a-fA-F]{24}$/.test(supplierId) ? new ObjectId(supplierId) : supplierId }
    );
    res.json(supplier && Array.isArray(supplier.supplies) ? supplier.supplies : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة حساب لمورد معين (يُحفظ فقط في suppliers)
app.post('/suppliers/:supplierId/accounts', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const data = req.body;
    // أضف الحساب إلى مصفوفة accounts في كولكشن المورد فقط
    const updateResult = await suppliersCollection.updateOne(
      { _id: /^[0-9a-fA-F]{24}$/.test(supplierId) ? new ObjectId(supplierId) : supplierId },
      { $push: { accounts: data } }
    );
    res.status(201).json({ success: true, modifiedCount: updateResult.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل حسابات مورد معين من كولكشن المورد فقط
app.get('/suppliers/:supplierId/accounts', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const supplier = await suppliersCollection.findOne(
      { _id: /^[0-9a-fA-F]{24}$/.test(supplierId) ? new ObjectId(supplierId) : supplierId }
    );
    res.json(supplier && Array.isArray(supplier.accounts) ? supplier.accounts : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API الموردين

// إضافة مورد جديد
app.post('/suppliers', async (req, res) => {
  try {
    const supplier = req.body;
    
    // التحقق من وجود projectId
    if (!supplier.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    supplier.createdAt = new Date();
    const result = await suppliersCollection.insertOne(supplier);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب جميع الموردين
app.get('/suppliers', async (req, res) => {
  try {
    const { projectId } = req.query;
    const companyId = req.companyId || req.query.companyId;
    
    // ⚠️ إلزامي: يجب وجود companyId أو projectId
    if (!companyId && !projectId) {
      console.error('❌ GET /suppliers: companyId أو projectId مفقود!');
      return res.status(400).json({ error: 'companyId or projectId is required' });
    }
    
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    if (companyId) {
      filter.companyId = companyId;
    }
    const suppliers = await suppliersCollection.find(filter).toArray();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب مورد واحد بالتفاصيل
app.get('/suppliers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let supplier;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      supplier = await suppliersCollection.findOne({ _id: new ObjectId(id) });
    } else {
      supplier = await suppliersCollection.findOne({ _id: id });
    }
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل بيانات مورد
app.put('/suppliers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await suppliersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
    } else {
      result = await suppliersCollection.updateOne(
        { _id: id },
        { $set: req.body }
      );
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المورد' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف مورد
app.delete('/suppliers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await suppliersCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await suppliersCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المورد' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API للحسابات المحاسبية للمورد
app.get('/suppliers/:id/accounting', async (req, res) => {
  try {
    const supplierId = req.params.id;
    
    // جلب بيانات المورد
    const supplier = await suppliersCollection.findOne({
      _id: /^[0-9a-fA-F]{24}$/.test(supplierId) ? new ObjectId(supplierId) : supplierId
    });
    
    if (!supplier) {
      return res.status(404).json({ error: 'المورد غير موجود' });
    }
    
    // جلب جميع التوريدات والمرتجعات للمورد
    const supplies = await suppliesCollection.find({ supplier: supplier.name }).toArray();
    
    // فصل التوريدات عن المرتجعات
    const regularSupplies = supplies.filter(s => s.type !== 'return');
    const returns = supplies.filter(s => s.type === 'return');
    
    // حساب الإجماليات
    const totalSuppliesValue = regularSupplies.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalReturnsValue = returns.reduce((sum, r) => sum + Math.abs(r.total || 0), 0);
    const totalPaymentsValue = (supplier.accounts || []).reduce((sum, p) => sum + (p.value || 0), 0);
    
    // حساب الرصيد الحالي
    const currentBalance = totalSuppliesValue - totalReturnsValue - totalPaymentsValue;
    
    res.json({
      supplier: supplier.name,
      summary: {
        totalSupplies: totalSuppliesValue,
        totalReturns: totalReturnsValue,
        totalPayments: totalPaymentsValue,
        currentBalance: currentBalance,
        suppliesCount: regularSupplies.length,
        returnsCount: returns.length,
        paymentsCount: (supplier.accounts || []).length
      },
      supplies: regularSupplies,
      returns: returns,
      payments: supplier.accounts || []
    });
    
  } catch (err) {
    console.error('خطأ في جلب البيانات المحاسبية:', err);
    res.status(500).json({ error: err.message });
  }
});

// API إنشاء تقرير محاسبي للمورد
app.get('/suppliers/:id/financial-report', async (req, res) => {
  try {
    const supplierId = req.params.id;
    const { from, to } = req.query; // فترة التقرير
    
    const supplier = await suppliersCollection.findOne({
      _id: /^[0-9a-fA-F]{24}$/.test(supplierId) ? new ObjectId(supplierId) : supplierId
    });
    
    if (!supplier) {
      return res.status(404).json({ error: 'المورد غير موجود' });
    }
    
    // فلترة البيانات حسب الفترة المحددة
    let filter = { supplier: supplier.name };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    
    const supplies = await suppliesCollection.find(filter).toArray();
    
    // إنشاء القيود المحاسبية مرتبة حسب التاريخ
    const entries = [];
    let runningBalance = 0;
    
    // ترتيب جميع العمليات حسب التاريخ
    const allOperations = [
      ...supplies.filter(s => s.type !== 'return').map(s => ({...s, operationType: 'supply'})),
      ...supplies.filter(s => s.type === 'return').map(s => ({...s, operationType: 'return'})),
      ...(supplier.accounts || []).map(p => ({...p, operationType: 'payment'}))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    allOperations.forEach((op, index) => {
      let credit = 0, debit = 0, description = '';
      
      if (op.operationType === 'supply') {
        credit = op.total || 0;
        description = `توريد ${op.item} - فاتورة ${op.invoiceNo || 'غير محدد'}`;
      } else if (op.operationType === 'return') {
        debit = Math.abs(op.total || 0);
        description = `إرجاع ${op.item} - ${op.returnReason}`;
      } else if (op.operationType === 'payment') {
        debit = op.value || 0;
        description = op.desc || 'دفعة';
      }
      
      runningBalance += (credit - debit);
      
      entries.push({
        entryNumber: index + 1,
        date: op.date,
        type: op.operationType,
        description,
        credit,
        debit,
        runningBalance,
        reference: `${op.operationType}-${op._id}`
      });
    });
    
    res.json({
      supplier: supplier.name,
      reportPeriod: { from: from || 'البداية', to: to || 'النهاية' },
      entries,
      summary: {
        totalEntries: entries.length,
        totalCredit: entries.reduce((sum, e) => sum + e.credit, 0),
        totalDebit: entries.reduce((sum, e) => sum + e.debit, 0),
        finalBalance: runningBalance
      },
      generatedAt: new Date().toISOString()
    });
    
  } catch (err) {
    console.error('خطأ في إنشاء التقرير المحاسبي:', err);
    res.status(500).json({ error: err.message });
  }
});

// تحديث المشتريات الموجودة لإضافة حقل issued
app.post('/update-existing-purchases', async (req, res) => {
  try {
    // تحديث جميع المشتريات التي لا تحتوي على حقل issued
    const result = await purchasesCollection.updateMany(
      { issued: { $exists: false } },
      { $set: { issued: 0 } }
    );
    
    console.log(`تم تحديث ${result.modifiedCount} مشتريات`);
    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث التوريدات الموجودة لإضافة حقل issued
app.post('/update-existing-supplies', async (req, res) => {
  try {
    // تحديث جميع التوريدات التي لا تحتوي على حقل issued
    const result = await suppliesCollection.updateMany(
      { issued: { $exists: false } },
      { $set: { issued: 0 } }
    );
    
    console.log(`تم تحديث ${result.modifiedCount} توريدات`);
    res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API المشتريات
app.post('/purchases', async (req, res) => {
  try {
    const purchase = req.body;
    
    // التحقق من وجود projectId
    if (!purchase.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    // إضافة حقل issued للمشتريات (يبدأ بصفر)
    purchase.issued = 0;
    purchase.createdAt = new Date();
    const result = await purchasesCollection.insertOne(purchase);

    // إضافة الشراء إلى كولكشن المخزن (تسجيل كامل)
    await storeCollection.insertOne({
      date: purchase.date,
      supplier: purchase.store, // اسم المحل في عمود اسم المورد
      item: purchase.item,
      quantity: Number(purchase.quantity) || 0,
      unit: purchase.unit,
      unitPrice: purchase.category, // الفئة في عمود سعر الوحدة
      total: (Number(purchase.quantity) * Number(purchase.category || 0)).toFixed(2),
      operationType: 'شراء',
      invoice: purchase.invoice,
      notes: purchase.notes || '',
      purchaseId: result.insertedId, // ربط بالشراء الأصلي
      projectId: purchase.projectId // إضافة projectId للمخزن أيضاً
    });

    res.status(201).json({ ...result, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/purchases', async (req, res) => {
  try {
    const { projectId } = req.query;
    const companyId = req.companyId || req.query.companyId;
    
    // ⚠️ إلزامي: يجب وجود companyId أو projectId
    if (!companyId && !projectId) {
      console.error('❌ GET /purchases: companyId أو projectId مفقود!');
      return res.status(400).json({ error: 'companyId or projectId is required' });
    }
    
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    if (companyId) {
      filter.companyId = companyId;
    }
    const purchases = await purchasesCollection.find(filter).toArray();
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/purchases/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await purchasesCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await purchasesCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على الشراء' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// === API مرتجعات المشتريات ===

// جلب جميع المرتجعات
app.get('/returns', async (req, res) => {
  try {
    const returns = await purchaseReturnsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(returns);
  } catch (err) {
    console.error('خطأ في جلب المرتجعات:', err);
    res.status(500).json({ error: err.message });
  }
});

// إضافة مرتجع جديد
app.post('/returns', async (req, res) => {
  try {
    const returnData = {
      ...req.body,
      createdAt: new Date(),
      type: 'return'
    };
    
    console.log('إضافة مرتجع جديد:', returnData);
    
    // إضافة المرتجع لقاعدة البيانات
    const result = await purchaseReturnsCollection.insertOne(returnData);
    
    // إعادة المادة للمخزن (إضافة كمية)
    const storeEntry = {
      type: 'return_purchase', // نوع العملية
      date: returnData.returnDate,
      item: returnData.item,
      quantity: Number(returnData.returnQuantity),
      unitPrice: Number(returnData.unitPrice),
      totalValue: Number(returnData.returnQuantity) * Number(returnData.unitPrice),
      category: returnData.category || '',
      supplier: returnData.supplier || '',
      notes: `مرتجع من المشتريات - ${returnData.returnReason}`,
      purchaseId: returnData.purchaseId,
      returnId: result.insertedId.toString(),
      operationType: 'مرتجع',
      total: (Number(returnData.returnQuantity) * Number(returnData.unitPrice)).toFixed(2),
      userName: returnData.userName || 'غير محدد'
    };
    
    await storeCollection.insertOne(storeEntry);
    
    console.log('تم إضافة المرتجع بنجاح');
    res.json({ 
      message: 'تم إضافة المرتجع بنجاح وإعادة المادة للمخزن', 
      returnId: result.insertedId,
      storeUpdated: true 
    });
  } catch (err) {
    console.error('خطأ في إضافة المرتجع:', err);
    res.status(500).json({ error: err.message });
  }
});

// حذف مرتجع
app.delete('/returns/:id', async (req, res) => {
  try {
    const returnId = req.params.id;
    
    console.log('حذف مرتجع:', returnId);
    
    // جلب بيانات المرتجع أولاً
    const returnDoc = await purchaseReturnsCollection.findOne({ 
      _id: /^[0-9a-fA-F]{24}$/.test(returnId) ? new ObjectId(returnId) : returnId 
    });
    
    if (!returnDoc) {
      return res.status(404).json({ error: 'المرتجع غير موجود' });
    }
    
    // حذف المرتجع
    await purchaseReturnsCollection.deleteOne({ 
      _id: /^[0-9a-fA-F]{24}$/.test(returnId) ? new ObjectId(returnId) : returnId 
    });
    
    // إضافة عملية طرح من المخزن (لإلغاء تأثير المرتجع)
    const storeEntry = {
      type: 'cancel_return_purchase',
      date: new Date().toISOString().split('T')[0],
      item: returnDoc.item,
      quantity: -Number(returnDoc.returnQuantity), // كمية سالبة لإلغاء المرتجع
      unitPrice: Number(returnDoc.unitPrice),
      totalValue: -Number(returnDoc.returnQuantity) * Number(returnDoc.unitPrice),
      category: returnDoc.category || '',
      supplier: returnDoc.supplier || '',
      notes: `إلغاء مرتجع المشتريات - ${returnDoc.returnReason}`,
      purchaseId: returnDoc.purchaseId,
      cancelledReturnId: returnId,
      operationType: 'إلغاء مرتجع',
      total: (-Number(returnDoc.returnQuantity) * Number(returnDoc.unitPrice)).toFixed(2),
      userName: 'نظام'
    };
    
    await storeCollection.insertOne(storeEntry);
    
    console.log('تم حذف المرتجع بنجاح');
    res.json({ 
      message: 'تم حذف المرتجع وتعديل المخزن', 
      storeUpdated: true 
    });
  } catch (err) {
    console.error('خطأ في حذف المرتجع:', err);
    res.status(500).json({ error: err.message });
  }
});

// إضافة مرتجع جديد
app.post('/purchase-returns', async (req, res) => {
  try {
    const returnData = {
      ...req.body,
      createdAt: new Date(),
      type: 'return'
    };
    
    // إضافة المرتجع لقاعدة البيانات
    const result = await purchaseReturnsCollection.insertOne(returnData);
    
    // إعادة المادة للمخزن (إضافة كمية)
    const storeEntry = {
      type: 'return_purchase', // نوع العملية
      date: returnData.returnDate,
      item: returnData.item,
      quantity: Number(returnData.returnQuantity),
      unitPrice: Number(returnData.unitPrice),
      totalValue: Number(returnData.returnQuantity) * Number(returnData.unitPrice),
      category: returnData.category || '',
      supplier: returnData.supplier || '',
      notes: `مرتجع من المشتريات - ${returnData.returnReason}`,
      purchaseId: returnData.purchaseId,
      returnId: result.insertedId.toString(),
      userName: returnData.userName || 'غير محدد'
    };
    
    await storeCollection.insertOne(storeEntry);
    
    res.json({ 
      message: 'تم إضافة المرتجع بنجاح وإعادة المادة للمخزن', 
      returnId: result.insertedId,
      storeUpdated: true 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب جميع المرتجعات
app.get('/purchase-returns', async (req, res) => {
  try {
    const returns = await purchaseReturnsCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب مرتجعات مشترى معين
app.get('/purchase-returns/purchase/:purchaseId', async (req, res) => {
  try {
    const returns = await purchaseReturnsCollection.find({ 
      purchaseId: req.params.purchaseId 
    }).sort({ createdAt: -1 }).toArray();
    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف مرتجع (وطرح الكمية من المخزن)
app.delete('/purchase-returns/:id', async (req, res) => {
  try {
    const returnId = req.params.id;
    
    // جلب بيانات المرتجع أولاً
    const returnDoc = await purchaseReturnsCollection.findOne({ _id: new ObjectId(returnId) });
    if (!returnDoc) {
      return res.status(404).json({ error: 'المرتجع غير موجود' });
    }
    
    // حذف المرتجع
    await purchaseReturnsCollection.deleteOne({ _id: new ObjectId(returnId) });
    
    // إضافة عملية طرح من المخزن (لإلغاء تأثير المرتجع)
    const storeEntry = {
      type: 'cancel_return_purchase',
      date: new Date().toISOString().split('T')[0],
      item: returnDoc.item,
      quantity: -Number(returnDoc.returnQuantity), // كمية سالبة لإلغاء المرتجع
      unitPrice: Number(returnDoc.unitPrice),
      totalValue: -Number(returnDoc.returnQuantity) * Number(returnDoc.unitPrice),
      category: returnDoc.category || '',
      supplier: returnDoc.supplier || '',
      notes: `إلغاء مرتجع المشتريات - ${returnDoc.returnReason}`,
      purchaseId: returnDoc.purchaseId,
      cancelledReturnId: returnId,
      userName: 'نظام'
    };
    
    await storeCollection.insertOne(storeEntry);
    
    res.json({ 
      message: 'تم حذف المرتجع وتعديل المخزن', 
      storeUpdated: true 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تقرير مرتجعات المشتريات
app.get('/purchase-returns/report', async (req, res) => {
  try {
    const { startDate, endDate, supplier, item } = req.query;
    
    let filter = {};
    if (startDate && endDate) {
      filter.returnDate = { 
        $gte: startDate, 
        $lte: endDate 
      };
    }
    if (supplier) filter.supplier = new RegExp(supplier, 'i');
    if (item) filter.item = new RegExp(item, 'i');
    
    const returns = await purchaseReturnsCollection.find(filter).sort({ returnDate: -1 }).toArray();
    
    // حساب الإحصائيات
    const totalReturns = returns.length;
    const totalValue = returns.reduce((sum, r) => sum + (Number(r.returnQuantity) * Number(r.unitPrice)), 0);
    const totalQuantity = returns.reduce((sum, r) => sum + Number(r.returnQuantity), 0);
    
    // تجميع حسب السبب
    const reasonStats = {};
    returns.forEach(r => {
      const reason = r.returnReason || 'غير محدد';
      if (!reasonStats[reason]) {
        reasonStats[reason] = { count: 0, value: 0 };
      }
      reasonStats[reason].count++;
      reasonStats[reason].value += Number(r.returnQuantity) * Number(r.unitPrice);
    });
    
    // تجميع حسب المورد
    const supplierStats = {};
    returns.forEach(r => {
      const supplier = r.supplier || 'غير محدد';
      if (!supplierStats[supplier]) {
        supplierStats[supplier] = { count: 0, value: 0 };
      }
      supplierStats[supplier].count++;
      supplierStats[supplier].value += Number(r.returnQuantity) * Number(r.unitPrice);
    });
    
    res.json({
      returns,
      statistics: {
        totalReturns,
        totalValue,
        totalQuantity,
        reasonStats,
        supplierStats
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API المخزن: جلب جميع العمليات من كولكشن المخزن مباشرة
app.get('/store', async (req, res) => {
  try {
    // جلب projectId من query parameters
    const { projectId } = req.query;
    const companyId = req.companyId || req.query.companyId;
    
    // ⚠️ إلزامي: يجب وجود companyId أو projectId
    if (!companyId && !projectId) {
      console.error('❌ GET /store: companyId أو projectId مفقود!');
      return res.status(400).json({ error: 'companyId or projectId is required' });
    }
    
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
      console.log('📋 جلب سجلات المخزن لمشروع:', projectId);
    }
    if (companyId) {
      filter.companyId = companyId;
    }
    
    // جلب جميع العمليات من كولكشن المخزن مع فلترة حسب المشروع
    const storeRecords = await storeCollection.find(filter).sort({ date: -1 }).toArray();
    
    // تنسيق البيانات للعرض
    const formattedRecords = storeRecords.map((record, index) => ({
      _id: record._id,
      idx: index + 1,
      date: record.date,
      supplier: record.supplier || '',
      item: record.item || '',
      quantity: record.quantity || 0,
      unit: record.unit || '',
      unitPrice: record.unitPrice || '',
      total: record.total || (Number(record.quantity || 0) * Number(record.unitPrice || 0)).toFixed(2),
      operationType: record.operationType || '',
      notes: record.notes || '',
      contractor: record.contractor || '',
      userName: record.userName || '',
      invoiceNo: record.invoiceNo || '',
      invoice: record.invoice || ''
    }));

    res.json(formattedRecords);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API المخزن: جلب ملخص المخزون (مادة/كمية متوفرة/وحدة/سعر/إجمالي)
app.get('/store/summary', async (req, res) => {
  try {
    // جلب projectId من query parameters
    const { projectId } = req.query;
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
      console.log('📊 جلب ملخص المخزن لمشروع:', projectId);
    }
    
    // جلب كل التوريدات للمشروع المحدد
    const supplies = await suppliesCollection.find(filter).toArray();
    // جلب كل المشتريات للمشروع المحدد
    const purchases = await purchasesCollection.find(filter).toArray();
    // جلب عمليات الصرف للمشروع المحدد
    const storeOperations = await storeCollection.find(filter).toArray();

    console.log('إجمالي التوريدات:', supplies.length);
    console.log('إجمالي المشتريات:', purchases.length);
    console.log('إجمالي عمليات الصرف:', storeOperations.length);

    // بناء جدول المخزون: لكل مادة + سعر
    const items = {};
    supplies.forEach(s => {
      if (!s.item) return;
      // مفتاح فريد = اسم المادة + السعر
      const unitPrice = s.unitPrice || '0';
      const uniqueKey = `${s.item}_${unitPrice}`;
      
      if (!items[uniqueKey]) {
        items[uniqueKey] = {
          item: s.item,
          unit: s.unit || '',
          unitPrice: unitPrice,
          totalSupplied: 0,
          totalPurchased: 0,
          supplier: s.supplier || '',
          lastSupplyDate: s.date || '',
          lastOperationDate: s.date || '', // تاريخ آخر عملية
          operationType: 'توريد'
        };
      }
      // استخدم الكمية الفعلية المتوفرة (بعد خصم المصروف)
      const suppliedQty = Number(s.quantity) || 0;
      const issuedFromSupply = Number(s.issued) || 0;
      const availableFromSupply = suppliedQty - issuedFromSupply;
      
      console.log(`توريد ${s.item} (${unitPrice}): كمية أصلية=${suppliedQty}, مصروف=${issuedFromSupply}, متاح=${availableFromSupply}`);
      
      items[uniqueKey].totalSupplied += Math.max(0, availableFromSupply);
      items[uniqueKey].supplier = s.supplier || items[uniqueKey].supplier;
      items[uniqueKey].lastSupplyDate = s.date || items[uniqueKey].lastSupplyDate;
      items[uniqueKey].unit = s.unit || items[uniqueKey].unit;
      items[uniqueKey].operationType = 'توريد';
      // تحديث تاريخ آخر عملية إذا كان هذا التوريد أحدث
      if (s.date && (!items[uniqueKey].lastOperationDate || s.date > items[uniqueKey].lastOperationDate)) {
        items[uniqueKey].lastOperationDate = s.date;
      }
    });
    
    purchases.forEach(p => {
      if (!p.item) return;
      // مفتاح فريد = اسم المادة + السعر
      const unitPrice = p.unitPrice || p.category || '0';
      const uniqueKey = `${p.item}_${unitPrice}`;
      
      if (!items[uniqueKey]) {
        items[uniqueKey] = {
          item: p.item,
          unit: p.unit || '',
          unitPrice: unitPrice,
          totalSupplied: 0,
          totalPurchased: 0,
          supplier: p.supplier || p.store || '',
          lastSupplyDate: p.date || '',
          lastOperationDate: p.date || '', // تاريخ آخر عملية
          operationType: 'شراء'
        };
      }
      // استخدم الكمية الفعلية المتوفرة (بعد خصم المصروف)
      const purchasedQty = Number(p.quantity) || 0;
      const issuedFromPurchase = Number(p.issued) || 0;
      const availableFromPurchase = purchasedQty - issuedFromPurchase;
      
      console.log(`شراء ${p.item} (${unitPrice}): كمية أصلية=${purchasedQty}, مصروف=${issuedFromPurchase}, متاح=${availableFromPurchase}`);
      
      items[uniqueKey].totalPurchased += Math.max(0, availableFromPurchase);
      items[uniqueKey].supplier = p.supplier || p.store || items[uniqueKey].supplier;
      items[uniqueKey].lastSupplyDate = p.date || items[uniqueKey].lastSupplyDate;
      items[uniqueKey].unit = p.unit || items[uniqueKey].unit;
      items[uniqueKey].operationType = 'شراء';
      // تحديث تاريخ آخر عملية إذا كان هذا الشراء أحدث
      if (p.date && (!items[uniqueKey].lastOperationDate || p.date > items[uniqueKey].lastOperationDate)) {
        items[uniqueKey].lastOperationDate = p.date;
      }
    });

    // تحديث تاريخ آخر عملية بناءً على عمليات الصرف
    storeOperations.forEach(op => {
      if (!op.item || op.type !== 'out') return; // فقط عمليات الصرف
      
      const unitPrice = op.unitPrice || '0';
      const uniqueKey = `${op.item}_${unitPrice}`;
      
      if (items[uniqueKey] && op.date) {
        // تحديث تاريخ آخر عملية إذا كان هذا الصرف أحدث
        if (!items[uniqueKey].lastOperationDate || op.date > items[uniqueKey].lastOperationDate) {
          items[uniqueKey].lastOperationDate = op.date;
        }
      }
    });

    // بناء صفوف الجدول
    const rows = Object.values(items).map((it, idx) => {
      const totalAvailable = it.totalSupplied + it.totalPurchased;
      console.log(`ملخص ${it.item}: توريد=${it.totalSupplied}, شراء=${it.totalPurchased}, إجمالي=${totalAvailable}`);
      
      return {
        idx: idx + 1,
        date: it.lastSupplyDate,
        supplier: it.supplier,
        item: it.item,
        quantity: totalAvailable, // الكمية المتاحة الفعلية
        unit: it.unit,
        unitPrice: it.unitPrice,
        total: (totalAvailable * (Number(it.unitPrice) || 0)).toFixed(2),
        operationType: it.operationType || '',
        lastOperationDate: it.lastOperationDate || it.lastSupplyDate || '' // تاريخ آخر عملية
      };
    });

    console.log('عدد المواد في الملخص:', rows.length);
    res.json(rows);
  } catch (err) {
    console.error('خطأ في ملخص المخزن:', err);
    res.status(500).json({ error: err.message });
  }
});

// إضافة سجل مباشر لكولكشن المخزن (للحالات الخاصة)
app.post('/store/direct', async (req, res) => {
  try {
    const row = req.body;
    const result = await storeCollection.insertOne(row);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف سجل من كولكشن المخزن
app.delete('/store/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await storeCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await storeCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على السجل' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API العمال

// إضافة عامل جديد
app.post('/workers', async (req, res) => {
  try {
    const worker = req.body;
    
    // التحقق من وجود projectId
    if (!worker.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    worker.createdAt = new Date();
    const result = await workersCollection.insertOne(worker);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/workers', async (req, res) => {
  try {
    const { projectId } = req.query;
    const companyId = req.companyId || req.query.companyId;
    
    // ⚠️ إلزامي: يجب وجود companyId أو projectId
    if (!companyId && !projectId) {
      console.error('❌ GET /workers: companyId أو projectId مفقود!');
      return res.status(400).json({ error: 'companyId or projectId is required' });
    }
    
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    if (companyId) {
      filter.companyId = companyId;
    }
    const workers = await workersCollection.find(filter).toArray();
    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف عامل
app.delete('/workers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await workersCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await workersCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على العامل' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل بيانات عامل
app.put('/workers/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await workersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
    } else {
      result = await workersCollection.updateOne(
        { _id: id },
        { $set: req.body }
      );
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على العامل' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// دعم الرجوع للصفحة الرئيسية من المسار /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// معالج favicon لتجنب رسائل 404
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// API سجل عمليات المستخلصات (نقل من نهاية الملف)
// حفظ عملية في سجل العمليات
app.post('/extract-operations', async (req, res) => {
  try {
    const { extractId, contractorId, action, details, user, timestamp } = req.body;
    
    const operation = {
      extractId,
      contractorId,
      action,
      details,
      user,
      timestamp: new Date(timestamp || Date.now()),
      createdAt: new Date()
    };
    
    console.log(`📝 حفظ عملية: ${action} - ${details}`);
    
    // إما إضافة للمستخلص الموجود أو حفظ مؤقت في كولكشن منفصل
    if (extractId && extractId !== 'temp') {
      await extractsCollection.updateOne(
        { _id: new ObjectId(extractId) },
        { $push: { operations: operation } }
      );
      console.log(`✅ تم حفظ العملية في المستخلص ${extractId}`);
    } else {
      // حفظ مؤقت في localStorage أو كولكشن مؤقت
      operation.tempId = `temp_${Date.now()}`;
      console.log(`⏳ عملية مؤقتة: ${operation.tempId}`);
    }
    
    res.json({ success: true, operation });
  } catch (err) {
    console.error('❌ خطأ في حفظ العملية:', err);
    res.status(500).json({ error: 'خطأ في حفظ العملية' });
  }
});

// جلب سجل العمليات لمستخلص محدد
app.get('/extract-operations/:extractId', async (req, res) => {
  try {
    const extractId = req.params.extractId;
    const extract = await extractsCollection.findOne({ _id: new ObjectId(extractId) });
    
    if (!extract) {
      return res.status(404).json({ error: 'المستخلص غير موجود' });
    }
    
    res.json({ operations: extract.operations || [] });
  } catch (err) {
    console.error('خطأ في جلب سجل العمليات:', err);
    res.status(500).json({ error: 'خطأ في جلب سجل العمليات' });
  }
});

// ========== API المعدات ==========

// جلب جميع المعدات
app.get('/equipments', async (req, res) => {
  try {
    const { projectId } = req.query;
    const companyId = req.companyId || req.query.companyId;
    
    console.log('📦 جلب المعدات - projectId:', projectId, 'companyId:', companyId);
    
    // ⚠️ إلزامي: يجب وجود companyId أو projectId
    if (!companyId && !projectId) {
      console.error('❌ GET /equipments: companyId أو projectId مفقود!');
      return res.status(400).json({ error: 'companyId or projectId is required' });
    }
    
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    if (companyId) {
      filter.companyId = companyId;
    }
    
    const equipments = await equipmentCollection.find(filter).sort({ rentDate: -1 }).toArray();
    console.log(`✅ تم جلب ${equipments.length} معدة`);
    
    // 🔍 Debug: طباعة أول 3 معدات للتأكد
    if (equipments.length > 0) {
      console.log('📋 عينة من المعدات:', equipments.slice(0, 3).map(e => ({
        name: e.name,
        projectId: e.projectId,
        hasProjectId: !!e.projectId
      })));
    }
    
    res.json(equipments);
  } catch (err) {
    console.error('❌ خطأ في جلب المعدات:', err);
    res.status(500).json({ error: err.message });
  }
});

// جلب معدة واحدة
app.get('/equipments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('📦 جلب معدة بـ ID:', id);
    
    let equipment;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      equipment = await equipmentCollection.findOne({ _id: new ObjectId(id) });
    } else {
      equipment = await equipmentCollection.findOne({ _id: id });
    }
    
    if (!equipment) {
      return res.status(404).json({ error: 'المعدة غير موجودة' });
    }
    
    console.log('✅ تم جلب المعدة بنجاح');
    res.json(equipment);
  } catch (err) {
    console.error('❌ خطأ في جلب المعدة:', err);
    res.status(500).json({ error: err.message });
  }
});

// إضافة معدة جديدة
app.post('/equipments', upload.single('invoice'), async (req, res) => {
  try {
    console.log('➕ إضافة معدة جديدة...');
    console.log('البيانات المستلمة:', req.body);
    
    const equipmentData = {
      name: req.body.name,
      owner: req.body.owner,
      rentDate: req.body.rentDate,
      days: parseInt(req.body.days) || 0,
      dayValue: parseFloat(req.body.dayValue) || 0,
      total: parseFloat(req.body.total) || 0,
      notes: req.body.notes || '',
      invoicePath: req.file ? req.file.filename : '',
      projectId: req.body.projectId, // ✅ إضافة projectId
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📦 المعدة النهائية مع projectId:', equipmentData.projectId);
    
    const result = await equipmentCollection.insertOne(equipmentData);
    console.log('✅ تمت إضافة المعدة بنجاح - ID:', result.insertedId);
    
    res.status(201).json({ 
      success: true, 
      insertedId: result.insertedId,
      message: 'تمت إضافة المعدة بنجاح'
    });
  } catch (err) {
    console.error('❌ خطأ في إضافة المعدة:', err);
    res.status(500).json({ error: err.message });
  }
});

// تعديل معدة
app.put('/equipments/:id', upload.single('invoice'), async (req, res) => {
  try {
    const id = req.params.id;
    console.log('🔄 تعديل معدة - ID:', id);
    console.log('البيانات المستلمة:', req.body);
    
    let filter;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { _id: id };
    }
    
    // جلب المعدة القديمة للحفاظ على الفاتورة إذا لم يتم رفع واحدة جديدة
    const oldEquipment = await equipmentCollection.findOne(filter);
    if (!oldEquipment) {
      return res.status(404).json({ error: 'المعدة غير موجودة' });
    }
    
    const updateData = {
      name: req.body.name,
      owner: req.body.owner,
      rentDate: req.body.rentDate,
      days: parseInt(req.body.days) || 0,
      dayValue: parseFloat(req.body.dayValue) || 0,
      total: parseFloat(req.body.total) || 0,
      notes: req.body.notes || '',
      invoicePath: req.file ? req.file.filename : (oldEquipment.invoicePath || ''),
      projectId: req.body.projectId || oldEquipment.projectId, // ✅ الحفاظ على projectId
      updatedAt: new Date()
    };
    
    const result = await equipmentCollection.updateOne(filter, { $set: updateData });
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'المعدة غير موجودة' });
    }
    
    console.log('✅ تم تحديث المعدة بنجاح');
    res.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      message: 'تم تحديث المعدة بنجاح'
    });
  } catch (err) {
    console.error('❌ خطأ في تعديل المعدة:', err);
    res.status(500).json({ error: err.message });
  }
});

// حذف معدة
app.delete('/equipments/:id', async (req, res) => {
  try {
    const id = req.params.id;
    console.log('🗑️ حذف معدة - ID:', id);
    
    let filter;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      filter = { _id: new ObjectId(id) };
    } else {
      filter = { _id: id };
    }
    
    const result = await equipmentCollection.deleteOne(filter);
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'المعدة غير موجودة' });
    }
    
    console.log('✅ تم حذف المعدة بنجاح');
    res.json({ 
      success: true,
      deletedCount: result.deletedCount,
      message: 'تم حذف المعدة بنجاح'
    });
  } catch (err) {
    console.error('❌ خطأ في حذف المعدة:', err);
    res.status(500).json({ error: err.message });
  }
});

// ========== نهاية API المعدات ==========

// API جديد لحفظ المسودات في السيرفر (حماية إضافية)
app.post('/drafts', async (req, res) => {
  try {
    const draftData = req.body;
    const contractorId = draftData.contractorId;
    
    console.log(`💾 حفظ مسودة في السيرفر للمقاول: ${contractorId}`);
    
    // إنشاء كولكشن للمسودات إذا لم يوجد
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('drafts');
    }
    
    // حفظ أو تحديث المسودة
    const result = await draftsCollection.replaceOne(
      { contractorId: contractorId },
      {
        contractorId: contractorId,
        draftData: draftData,
        timestamp: new Date(),
        lastModified: new Date()
      },
      { upsert: true }
    );
    
    console.log(`✅ تم حفظ المسودة في السيرفر للمقاول ${contractorId}`);
    res.json({ success: true, message: 'تم حفظ المسودة في السيرفر بنجاح' });
  } catch (err) {
    console.error('❌ خطأ في حفظ المسودة في السيرفر:', err);
    res.status(500).json({ error: 'خطأ في حفظ المسودة' });
  }
});

// API لجلب المسودة من السيرفر
app.get('/drafts/:contractorId', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    console.log(`📖 جلب مسودة من السيرفر للمقاول: ${contractorId}`);
    
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('drafts');
    }
    
    const draft = await draftsCollection.findOne({ contractorId: contractorId });
    
    if (draft) {
      console.log(`✅ تم العثور على مسودة للمقاول ${contractorId}`);
      res.json({ success: true, draft: draft.draftData });
    } else {
      console.log(`❌ لم يتم العثور على مسودة للمقاول ${contractorId}`);
      res.json({ success: false, message: 'لا توجد مسودة محفوظة' });
    }
  } catch (err) {
    console.error('❌ خطأ في جلب المسودة من السيرفر:', err);
    res.status(500).json({ error: 'خطأ في جلب المسودة' });
  }
});

// API جديد لمسح المسودة
app.delete('/draft/:contractorId', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    console.log(`🗑️ طلب مسح مسودة للمقاول: ${contractorId}`);
    
    // مسح المسودة من قاعدة البيانات
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('drafts');
    }
    
    await draftsCollection.deleteOne({ contractorId: contractorId });
    
    res.json({ success: true, message: 'تم مسح المسودة بنجاح' });
  } catch (err) {
    console.error('❌ خطأ في مسح المسودة:', err);
    res.status(500).json({ error: 'خطأ في مسح المسودة' });
  }
});

// 🗑️ مسح جميع بيانات الشركات والمشاريع (خطير!)
app.delete('/api/reset-all-data', async (req, res) => {
  try {
    const { confirmPassword } = req.body;
    
    // تأكيد بكلمة مرور خاصة للحماية
    if (confirmPassword !== 'DELETE_ALL_DATA_123') {
      return res.status(403).json({ 
        error: 'كلمة المرور غير صحيحة. هذه العملية خطيرة جداً!' 
      });
    }

    console.log('⚠️ بدء عملية مسح جميع البيانات...');
    
    // 1. الحصول على قائمة جميع الشركات
    const companies = await companiesCollection.find({}).toArray();
    console.log(`📊 عدد الشركات المكتشفة: ${companies.length}`);
    
    // 2. مسح collections الخاصة بكل شركة
    let totalCollectionsDeleted = 0;
    for (const company of companies) {
      const sanitized = sanitizeCompanyName(company.companyName);
      const prefix = `${sanitized}_`;
      
      console.log(`🗑️ مسح بيانات الشركة: ${company.companyName}`);
      
      // الحصول على قائمة جميع collections
      const collections = await db.listCollections().toArray();
      
      // مسح كل collection خاص بالشركة
      for (const coll of collections) {
        if (coll.name.startsWith(prefix)) {
          try {
            await db.collection(coll.name).drop();
            console.log(`  ✅ تم مسح: ${coll.name}`);
            totalCollectionsDeleted++;
          } catch (err) {
            if (err.code !== 26) { // 26 = NamespaceNotFound
              console.error(`  ❌ خطأ في مسح ${coll.name}:`, err.message);
            }
          }
        }
      }
    }
    
    // 3. مسح Collections القديمة المشتركة
    const oldCollections = [
      'extracts', 'contractors', 'users', 'supplies', 'suppliers',
      'purchases', 'store', 'workers', 'monthlyPays', 'pays',
      'chats', 'notifications', 'equipment', 'contractor_issues',
      'purchase_returns', 'external_services', 'receipts', 'drawings',
      'projects', 'project_data', 'contract_addons', 'supply_addons',
      'letters', 'estimates'
    ];
    
    console.log('🗑️ مسح Collections القديمة...');
    for (const collName of oldCollections) {
      try {
        await db.collection(collName).drop();
        console.log(`  ✅ تم مسح: ${collName}`);
      } catch (err) {
        if (err.code !== 26) {
          console.error(`  ❌ خطأ في مسح ${collName}:`, err.message);
        }
      }
    }
    
    // 4. مسح جميع الشركات
    const deletedCompanies = await companiesCollection.deleteMany({});
    console.log(`✅ تم مسح ${deletedCompanies.deletedCount} شركة`);
    
    // 5. إعادة إنشاء Collections القديمة الفارغة للتوافق
    extractsCollection = db.collection('extracts');
    contractorsCollection = db.collection('contractors');
    usersCollection = db.collection('users');
    suppliesCollection = db.collection('supplies');
    suppliersCollection = db.collection('suppliers');
    purchasesCollection = db.collection('purchases');
    storeCollection = db.collection('store');
    workersCollection = db.collection('workers');
    monthlyPaysCollection = db.collection('monthlyPays');
    paysCollection = db.collection('pays');
    chatsCollection = db.collection('chats');
    notificationsCollection = db.collection('notifications');
    equipmentCollection = db.collection('equipment');
    contractorIssuesCollection = db.collection('contractor_issues');
    purchaseReturnsCollection = db.collection('purchase_returns');
    externalServicesCollection = db.collection('external_services');
    receiptsCollection = db.collection('receipts');
    drawingsCollection = db.collection('drawings');
    projectsCollection = db.collection('projects');
    projectDataCollection = db.collection('project_data');
    contractAddonsCollection = db.collection('contract_addons');
    supplyAddonsCollection = db.collection('supply_addons');
    lettersCollection = db.collection('letters');
    estimatesCollection = db.collection('estimates');
    
    console.log('🎉 تم مسح جميع البيانات بنجاح!');
    
    res.json({ 
      success: true, 
      message: 'تم مسح جميع بيانات الشركات والمشاريع بنجاح',
      deletedCompanies: deletedCompanies.deletedCount,
      collectionsDeleted: totalCollectionsDeleted,
      note: 'مسؤولي المنصة (platform_admins) لم يتم مسحهم'
    });
  } catch (err) {
    console.error('❌ خطأ في مسح البيانات:', err);
    res.status(500).json({ error: err.message });
  }
});

// Global Error Handler - يجب أن يكون قبل app.listen
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).json({ 
    error: 'حدث خطأ في السيرفر',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`🔗 APIs متاحة:`);
  console.log(`   GET  /pays - جلب القبض`);
  console.log(`   POST /pays - إضافة قبض`);
  console.log(`   PUT  /pays/reorder - تحديث ترتيب الصفوف`);
  console.log(`   PUT  /pays/:id - تحديث قبض`);
  console.log(`   DELETE /pays/:id - حذف قبض`);

});

// لا يوجد أي تعديل مطلوب هنا بخصوص منطق إخفاء الجداول عند حذف آخر صف

// API القبض الشهري

// إضافة شهر جديد
app.post('/monthly-pays', async (req, res) => {
  try {
    const { name, date } = req.body;
    if (!name || !date) return res.status(400).json({ error: 'name and date required' });
    const result = await monthlyPaysCollection.insertOne({ name, date });
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل الشهور
app.get('/monthly-pays', async (req, res) => {
  try {
    const months = await monthlyPaysCollection.find({}).sort({ date: -1 }).toArray();
    res.json(months);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف شهر
app.delete('/monthly-pays/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await monthlyPaysCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await monthlyPaysCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على الشهر' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API القبض الشهرى (pays) ---
// جلب كل القبض لشهر معين
app.get('/pays', async (req, res) => {
  try {
    const { month, projectId } = req.query;
    let filter = {};
    if (month) filter.month = month;
    if (projectId) filter.projectId = projectId;
    
    console.log('جلب البيانات للشهر:', month, 'المشروع:', projectId);
    
    // ترتيب حسب order أولاً ثم _id
    const pays = await paysCollection.find(filter).sort({ order: 1, _id: 1 }).toArray();
    
    console.log(`تم جلب ${pays.length} صف للشهر ${month}`);
    console.log('IDs الموجودة:', pays.map(p => ({ id: p._id.toString(), name: p.name || p.separatorName })));
    
    res.json(pays);
  } catch (err) {
    console.error('خطأ في جلب البيانات:', err);
    res.status(500).json({ error: err.message });
  }
});

// API جديد لتحديث ترتيب الصفوف بالجملة - يجب أن يأتي قبل /pays/:id
app.put('/pays/reorder', async (req, res) => {
  try {
    const { month, newOrder } = req.body;
    
    console.log('🔄 API /pays/reorder تم استدعاؤه');
    console.log('تحديث الترتيب - البيانات المستلمة:', { month, newOrderLength: newOrder?.length, newOrder });
    
    if (!month || !Array.isArray(newOrder)) {
      console.error('بيانات غير صحيحة:', { month, newOrder });
      return res.status(400).json({ 
        success: false,
        error: 'month و newOrder مطلوبان' 
      });
    }

    console.log(`تحديث ترتيب ${newOrder.length} صف للشهر ${month}`);

    // تحديث ترتيب كل صف حسب موقعه الجديد في المصفوفة
    const bulkOps = [];
    
    for (let index = 0; index < newOrder.length; index++) {
      const payId = newOrder[index];
      console.log(`معالجة ID: ${payId} في الموضع ${index}`);
      
      // تحقق من نوع الـ ID وتحويله إذا لزم الأمر
      let objectId;
      try {
        if (typeof payId === 'string' && payId.length === 24 && /^[0-9a-fA-F]{24}$/.test(payId)) {
          objectId = new ObjectId(payId);
        } else {
          objectId = payId;
        }
      } catch (err) {
        console.error(`خطأ في تحويل ID ${payId}:`, err);
        continue;
      }
      
      bulkOps.push({
        updateOne: {
          filter: { 
            _id: objectId,
            month: month
          },
          update: { $set: { order: index } }
        }
      });
    }

    console.log(`إجراء ${bulkOps.length} عملية تحديث...`);

    if (bulkOps.length > 0) {
      const result = await paysCollection.bulkWrite(bulkOps, { ordered: false });
      console.log(`نتيجة bulkWrite:`, result);
      console.log(`تم تحديث ترتيب ${result.modifiedCount} صف من أصل ${newOrder.length}`);
      
      // تحقق من النتائج
      if (result.modifiedCount === 0) {
        console.warn('لم يتم تحديث أي صف - قد تكون الـ IDs غير صحيحة');
        
        // جلب كل الصفوف لهذا الشهر للتحقق
        const existingPays = await paysCollection.find({ month }).toArray();
        console.log('الصفوف الموجودة:', existingPays.map(p => ({ id: p._id.toString(), name: p.name || p.separatorName })));
        console.log('الـ IDs المطلوب تحديثها:', newOrder);
        
        // تحقق من وجود كل ID
        for (const id of newOrder) {
          const exists = existingPays.find(p => p._id.toString() === id);
          console.log(`ID ${id} موجود:`, !!exists);
        }
      }
      
      res.json({ 
        success: true, 
        modifiedCount: result.modifiedCount,
        totalRows: newOrder.length
      });
    } else {
      res.json({ 
        success: true, 
        modifiedCount: 0, 
        totalRows: 0 
      });
    }
  } catch (err) {
    console.error('خطأ في تحديث ترتيب الصفوف:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// إضافة قبض جديد
app.post('/pays', async (req, res) => {
  try {
    const pay = req.body;
    
    // التحقق من وجود projectId
    if (!pay.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    // إذا كان فاصل، تحقق من وجود separatorName فقط
    if (pay.isSeparator) {
      if (!pay.separatorName || !pay.month) {
        return res.status(400).json({ error: 'separatorName و month مطلوبة للفاصل' });
      }
    } else {
      // للقبض العادي، تحقق من البيانات المطلوبة
      if (!pay.name || !pay.date || pay.value === undefined || !pay.month) {
        return res.status(400).json({ error: 'name, date, value, month مطلوبة' });
      }
    }
    
    // إذا لم يتم تحديد ترتيب، اجعله في النهاية
    if (pay.order === undefined) {
      // احصل على أعلى رقم ترتيب موجود لهذا الشهر
      const lastPay = await paysCollection.findOne(
        { month: pay.month, projectId: pay.projectId },
        { sort: { order: -1 } }
      );
      pay.order = lastPay && lastPay.order !== undefined ? lastPay.order + 1 : 0;
    }
    
    pay.createdAt = new Date();
    const result = await paysCollection.insertOne(pay);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف صف قبض
app.delete('/pays/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await paysCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await paysCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على القبض' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تحديث بيانات قبض (لدعم إعادة الترتيب)
app.put('/pays/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await paysCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
    } else {
      result = await paysCollection.updateOne(
        { _id: id },
        { $set: req.body }
      );
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على القبض' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API المخزن (كولكشن منفصل)
app.post('/store', async (req, res) => {
  try {
    const row = req.body;
    const result = await storeCollection.insertOne(row);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/store', async (req, res) => {
  try {
    const { projectId } = req.query;
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    const rows = await storeCollection.find(filter).toArray();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/store/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await storeCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await storeCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على الصف' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// صرف مواد من المخزن مباشرة (أو لمقاول إذا تم اختيار مقاول)
app.post('/store/issue', async (req, res) => {
  try {
    const { item, quantity, date, notes, contractor, unitPrice, userName } = req.body;

    console.log('صرف مواد - البيانات المستلمة:', { item, quantity, date, contractor, unitPrice, userName });

    // تحقق من صحة البيانات المطلوبة
    if (!item || quantity === undefined || quantity === null || quantity === '' || !date) {
      return res.status(400).json({ error: 'item, quantity, and date required' });
    }

    let qtyToIssue = Number(quantity);
    if (isNaN(qtyToIssue) || qtyToIssue <= 0) {
      return res.status(400).json({ error: 'كمية غير صحيحة' });
    }

    // حساب إجمالي الكمية المتاحة للمادة من جميع المصادر
    let totalAvailable = 0;
    let avgUnitPrice = 0;
    let priceCount = 0;

    // جلب التوريدات
    const supplies = await suppliesCollection.find({ item }).toArray();
    console.log(`التوريدات للمادة ${item}:`, supplies.length);
    
    supplies.forEach(supply => {
      const suppliedQty = Number(supply.quantity) || 0;
      const issuedFromSupply = Number(supply.issued) || 0;
      const availableFromSupply = suppliedQty - issuedFromSupply;
      console.log(`توريد: كمية=${suppliedQty}, مصروف=${issuedFromSupply}, متاح=${availableFromSupply}`);
      
      if (availableFromSupply > 0) {
        totalAvailable += availableFromSupply;
        if (supply.unitPrice && Number(supply.unitPrice) > 0) {
          avgUnitPrice += Number(supply.unitPrice);
          priceCount++;
        }
      }
    });

    // جلب المشتريات
    const purchases = await purchasesCollection.find({ item }).toArray();
    console.log(`المشتريات للمادة ${item}:`, purchases.length);
    
    purchases.forEach(purchase => {
      const purchasedQty = Number(purchase.quantity) || 0;
      const issuedFromPurchase = Number(purchase.issued) || 0;
      const availableFromPurchase = purchasedQty - issuedFromPurchase;
      console.log(`شراء: كمية=${purchasedQty}, مصروف=${issuedFromPurchase}, متاح=${availableFromPurchase}`);
      
      if (availableFromPurchase > 0) {
        totalAvailable += availableFromPurchase;
        const price = purchase.category || purchase.unitPrice;
        if (price && Number(price) > 0) {
          avgUnitPrice += Number(price);
          priceCount++;
        }
      }
    });

    console.log(`إجمالي المتاح: ${totalAvailable}, الكمية المطلوبة: ${qtyToIssue}`);

    // حساب متوسط السعر
    if (priceCount > 0) {
      avgUnitPrice = (avgUnitPrice / priceCount).toFixed(2);
    }

    // تحقق من توفر الكمية
    if (totalAvailable <= 0) {
      return res.status(400).json({ error: 'لا توجد كمية متاحة لهذه المادة في المخزن' });
    }

    if (qtyToIssue > totalAvailable) {
      return res.status(400).json({ error: `الكمية غير متوفرة في المخزن (المتاح: ${totalAvailable})` });
    }

    // تنفيذ الخصم من التوريدات أولاً (FIFO)
    let qtyLeft = qtyToIssue;
    const suppliesUpdates = [];
    
    for (const supply of supplies.sort((a, b) => new Date(a.date) - new Date(b.date))) {
      if (qtyLeft <= 0) break;
      const suppliedQty = Number(supply.quantity) || 0;
      const issuedFromSupply = Number(supply.issued) || 0;
      const availableFromSupply = suppliedQty - issuedFromSupply;
      
      if (availableFromSupply > 0) {
        const deduct = Math.min(availableFromSupply, qtyLeft);
        suppliesUpdates.push({
          id: supply._id,
          issued: issuedFromSupply + deduct
        });
        qtyLeft -= deduct;
      }
    }

    // إذا لم تكفي التوريدات، اخصم من المشتريات
    const purchasesUpdates = [];
    if (qtyLeft > 0) {
      for (const purchase of purchases.sort((a, b) => new Date(a.date) - new Date(b.date))) {
        if (qtyLeft <= 0) break;
        const purchasedQty = Number(purchase.quantity) || 0;
        const issuedFromPurchase = Number(purchase.issued) || 0;
        const availableFromPurchase = purchasedQty - issuedFromPurchase;
        
        if (availableFromPurchase > 0) {
          const deduct = Math.min(availableFromPurchase, qtyLeft);
          purchasesUpdates.push({
            id: purchase._id,
            issued: issuedFromPurchase + deduct
          });
          qtyLeft -= deduct;
        }
      }
    }

    // تطبيق التحديثات
    for (const update of suppliesUpdates) {
      await suppliesCollection.updateOne(
        { _id: update.id },
        { $set: { issued: update.issued } }
      );
    }

    for (const update of purchasesUpdates) {
      await purchasesCollection.updateOne(
        { _id: update.id },
        { $set: { issued: update.issued } }
      );
    }

    // استخدام السعر المرسل من الواجهة أو المتوسط المحسوب
    const finalUnitPrice = unitPrice || avgUnitPrice || '';

    // إذا تم اختيار مقاول، سجل كصرف للمقاول
    if (contractor) {
      // سجل عملية الصرف في كولكشن المخزن
      const storeResult = await storeCollection.insertOne({
        date: new Date(date),
        item,
        quantity: -qtyToIssue, // كمية سالبة للإشارة إلى الصرف
        notes: notes || '',
        operationType: 'صرف للمقاول',
        contractor: contractor || '',
        unitPrice: finalUnitPrice,
        userName: userName || '',
        supplier: 'صرف للمقاول', // تمييز عمليات الصرف
        total: (qtyToIssue * Number(finalUnitPrice || 0)).toFixed(2)
      });

      // سجل عملية الصرف في كولكشن صرف المقاولين
      const contractorIssueResult = await contractorIssuesCollection.insertOne({
        date: new Date(date),
        contractorId: contractor,
        item,
        quantity: qtyToIssue,
        unitPrice: finalUnitPrice,
        total: (qtyToIssue * Number(finalUnitPrice || 0)).toFixed(2),
        notes: notes || '',
        userName: userName || '',
        storeRecordId: storeResult.insertedId // ربط بسجل المخزن
      });

      // أضف المادة في خانة المواد عند المقاول
      let contractorId = contractor;
      if (/^[0-9a-fA-F]{24}$/.test(contractorId)) contractorId = new ObjectId(contractorId);
      const contractorDoc = await contractorsCollection.findOne({ _id: contractorId });
      if (contractorDoc) {
        if (!Array.isArray(contractorDoc.materials)) {
          await contractorsCollection.updateOne(
            { _id: contractorId },
            { $set: { materials: [] } }
          );
        }
        const matObj = {
          name: item,
          quantity: qtyToIssue,
          date: new Date(date),
          unitPrice: finalUnitPrice,
          userName: userName || '',
          notes: notes || '',
          issueRecordId: contractorIssueResult.insertedId // ربط بسجل الصرف
        };
        await contractorsCollection.updateOne(
          { _id: contractorId },
          { $push: { materials: matObj } }
        );
        
        console.log('تم صرف المواد للمقاول بنجاح');
        return res.json({ success: true });
      } else {
        return res.status(404).json({ error: 'Contractor not found' });
      }
    }

    // إذا لم يتم اختيار مقاول، نفذ الصرف العام
    await storeCollection.insertOne({
      date: new Date(date),
      item,
      quantity: -qtyToIssue, // كمية سالبة للإشارة إلى الصرف
      notes: notes || '',
      operationType: 'صرف عام',
      supplier: 'صرف عام',
      unitPrice: finalUnitPrice,
      userName: userName || '',
      total: (qtyToIssue * Number(finalUnitPrice || 0)).toFixed(2)
    });

    console.log('تم الصرف العام بنجاح');
    res.json({ success: true });
  } catch (err) {
    console.error('خطأ في صرف المواد:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- API صرف المقاولين ---

// جلب كل عمليات صرف المقاولين
app.get('/contractor-issues', async (req, res) => {
  try {
    const { contractorId, item, fromDate, toDate } = req.query;
    let filter = {};
    
    if (contractorId) filter.contractorId = contractorId;
    if (item) filter.item = item;
    if (fromDate) filter.date = { $gte: new Date(fromDate) };
    if (toDate) {
      if (filter.date) {
        filter.date.$lte = new Date(toDate);
      } else {
        filter.date = { $lte: new Date(toDate) };
      }
    }

    const issues = await contractorIssuesCollection.find(filter).sort({ date: -1 }).toArray();
    
    // جلب أسماء المقاولين
    const contractors = await contractorsCollection.find({}).toArray();
    const issuesWithNames = issues.map(issue => {
      const contractor = contractors.find(c => c._id.toString() === issue.contractorId);
      return {
        ...issue,
        contractorName: contractor ? (contractor.name || contractor.contractorName) : 'غير محدد'
      };
    });

    res.json(issuesWithNames);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب عمليات صرف مقاول معين
app.get('/contractor-issues/:contractorId', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    const issues = await contractorIssuesCollection.find({ contractorId }).sort({ date: -1 }).toArray();
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف سجل صرف (إذا لزم الأمر)
app.delete('/contractor-issues/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await contractorIssuesCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await contractorIssuesCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على سجل الصرف' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API الشات ---

// جلب كل الشاتات لمستخدم معين
app.get('/chats/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const chatDoc = await chatsCollection.findOne({ userId });
    res.json(chatDoc ? chatDoc.conversations || [] : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب شات بين مستخدمين (userId و otherUserId)
app.get('/chats/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    const chatDoc = await chatsCollection.findOne({ userId });
    if (!chatDoc || !Array.isArray(chatDoc.conversations)) return res.json([]);
    const conv = chatDoc.conversations.find(c => c.otherUserId === otherUserId);
    res.json(conv ? conv.messages : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب آخر رسالة بين مستخدمين (userId و otherUserId)
app.get('/chats/last/:userId/:otherUserId', async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    // ابحث في شات userId
    let chatDoc = await chatsCollection.findOne({ userId });
    let messages = [];
    if (chatDoc && Array.isArray(chatDoc.conversations)) {
      const conv = chatDoc.conversations.find(c => c.otherUserId === otherUserId);
      if (conv && Array.isArray(conv.messages)) {
        messages = conv.messages;
      }
    }
    // إذا لم نجد، ابحث في شات otherUserId (قد يكون اتجاه الرسائل معكوس)
    if (messages.length === 0) {
      let chatDoc2 = await chatsCollection.findOne({ userId: otherUserId });
      if (chatDoc2 && Array.isArray(chatDoc2.conversations)) {
        const conv2 = chatDoc2.conversations.find(c => c.otherUserId === userId);
        if (conv2 && Array.isArray(conv2.messages)) {
          messages = conv2.messages;
        }
      }
    }
    // أعد آخر رسالة فقط (أو null إذا لا يوجد)
    const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
    res.json(lastMsg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إرسال رسالة بين مستخدمين
app.post('/chats/send', async (req, res) => {
  try {
    const { fromUserId, toUserId, message } = req.body;
    if (!fromUserId || !toUserId || !message) return res.status(400).json({ error: 'fromUserId, toUserId, message مطلوبة' });

    const msgObj = {
      from: fromUserId,
      to: toUserId,
      text: message,
      date: new Date()
    };

    // أضف الرسالة في شات المستخدم الأول
    let chatDoc = await chatsCollection.findOne({ userId: fromUserId });
    if (!chatDoc) {
      // أنشئ مستند جديد
      await chatsCollection.insertOne({
        userId: fromUserId,
        conversations: [{
          otherUserId: toUserId,
          messages: [msgObj]
        }]
      });
    } else {
      // ابحث عن المحادثة مع المستخدم الآخر
      const idx = (chatDoc.conversations || []).findIndex(c => c.otherUserId === toUserId);
      if (idx === -1) {
        // أضف محادثة جديدة
        await chatsCollection.updateOne(
          { userId: fromUserId },
          { $push: { conversations: { otherUserId: toUserId, messages: [msgObj] } } }
        );
      } else {
        // أضف الرسالة للمحادثة الموجودة
        await chatsCollection.updateOne(
          { userId: fromUserId, "conversations.otherUserId": toUserId },
          { $push: { "conversations.$.messages": msgObj } }
        );
      }
    }

    // أضف الرسالة في شات المستخدم الثاني (معكوسة)
    let chatDoc2 = await chatsCollection.findOne({ userId: toUserId });
    if (!chatDoc2) {
      await chatsCollection.insertOne({
        userId: toUserId,
        conversations: [{
          otherUserId: fromUserId,
          messages: [msgObj]
        }]
      });
    } else {
      const idx2 = (chatDoc2.conversations || []).findIndex(c => c.otherUserId === fromUserId);
      if (idx2 === -1) {
        await chatsCollection.updateOne(
          { userId: toUserId },
          { $push: { conversations: { otherUserId: fromUserId, messages: [msgObj] } } }
        );
      } else {
        await chatsCollection.updateOne(
          { userId: toUserId, "conversations.otherUserId": fromUserId },
          { $push: { "conversations.$.messages": msgObj } }
        );
      }
    }

    // إضافة إشعار للمستلم (تأكد أن الحقل اسمه from وليس fromUserId)
    await notificationsCollection.insertOne({
      userId: toUserId,
      fromUserId: fromUserId, // <-- هنا التغيير
      message,
      date: new Date(),
      read: false,
      type: 'chat'
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- API الإشعارات ---

// جلب كل إشعارات مستخدم
app.get('/notifications/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const notifications = await notificationsCollection.find({ userId }).sort({ date: -1 }).toArray();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعيين إشعار كمقروء
app.put('/notifications/:id/read', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await notificationsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { read: true } }
      );
    } else {
      result = await notificationsCollection.updateOne(
        { _id: id },
        { $set: { read: true } }
      );
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إرسال إشعار لأي مستخدم
app.post('/notifications/send', async (req, res) => {
  try {
    const { userId, message, type = 'custom', fromUserId = null, data = {} } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ error: 'userId و message مطلوبة' });
    }
    const notification = {
      userId,
      fromUserId,
      message,
      type,
      data,
      date: new Date(),
      read: false
    };
    const result = await notificationsCollection.insertOne(notification);
    res.status(201).json({ success: true, notificationId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API بيانات المشروع
app.post('/project-data', async (req, res) => {
  try {
    const data = req.body;
    await projectDataCollection.insertOne(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب بيانات المشروع (واحدة فقط)
app.get('/project-data', async (req, res) => {
  try {
    const arr = await projectDataCollection.find({}).limit(1).toArray();
    res.json(arr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل بيانات المشروع (حسب _id)
app.put('/project-data/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const data = req.body;
    
    // حذف _id من البيانات المرسلة لتجنب تضارب MongoDB
    delete data._id;
    
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await projectDataCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: data }
      );
    } else {
      result = await projectDataCollection.updateOne(
        { _id: id },
        { $set: data }
      );
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على بيانات المشروع' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('خطأ في تعديل بيانات المشروع:', err);
    res.status(500).json({ error: err.message });
  }
});

// API ملحقات العقود
app.post('/contract-addons', async (req, res) => {
  try {
    const addon = req.body;
    await contractAddonsCollection.insertOne(addon);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل ملاحق العقود
app.get('/contract-addons', async (req, res) => {
  try {
    const arr = await contractAddonsCollection.find({}).toArray();
    res.json(arr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف ملحق عقد
app.delete('/contract-addons/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await contractAddonsCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await contractAddonsCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على ملحق العقد' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API ملحقات التوريدات
app.post('/supply-addons', async (req, res) => {
  try {
    const addon = req.body;
    await supplyAddonsCollection.insertOne(addon);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل ملاحق التوريدات
app.get('/supply-addons', async (req, res) => {
  try {
    const arr = await supplyAddonsCollection.find({}).toArray();
    res.json(arr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف ملحق توريد
app.delete('/supply-addons/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await supplyAddonsCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await supplyAddonsCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على ملحق التوريد' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API الخطابات
app.post('/letters', async (req, res) => {
  try {
    const letter = req.body;
    await lettersCollection.insertOne(letter);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل الخطابات
app.get('/letters', async (req, res) => {
  try {
    const arr = await lettersCollection.find({}).toArray();
    res.json(arr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف خطاب
app.delete('/letters/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await lettersCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await lettersCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على الخطاب' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API المقايسات
app.post('/estimates', async (req, res) => {
  try {
    const estimate = req.body;
    await estimatesCollection.insertOne(estimate);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل المقايسات
app.get('/estimates', async (req, res) => {
  try {
    const arr = await estimatesCollection.find({}).toArray();
    res.json(arr);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف مقايسة
app.delete('/estimates/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await estimatesCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await estimatesCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المقايسة' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف مستخلص من المشروع
app.delete('/project-extracts/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    // إذا كان id من نوع ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await extractsCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await extractsCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المستخلص' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API لرفع الملفات
app.post('/upload', (req, res) => {
  const uploadSingle = upload.single('file');
  
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('❌ Multer error:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'حجم الملف كبير جداً. الحد الأقصى 50MB' });
      }
      return res.status(400).json({ error: `خطأ في رفع الملف: ${err.message}` });
    } else if (err) {
      console.error('❌ Other upload error:', err);
      return res.status(500).json({ error: `خطأ في رفع الملف: ${err.message}` });
    }
    
    try {
      console.log('📤 Upload request received');
      console.log('📋 File info:', req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file');
      
      if (!req.file) {
        console.log('❌ No file uploaded');
        return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
      }
      
      console.log('✅ File uploaded successfully:', req.file.path);
      res.json({ 
        success: true,
        url: req.file.path, 
        filename: req.file.filename,
        name: req.file.originalname 
      });
    } catch (error) {
      console.error('❌ خطأ في رفع الملف:', error);
      console.error('Error details:', error.stack);
      res.status(500).json({ error: error.message });
    }
  });
});

// API المعدات
app.post('/equipment', async (req, res) => {
  try {
    const equipment = req.body;
    
    // التحقق من وجود projectId
    if (!equipment.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    equipment.createdAt = new Date();
    const result = await equipmentCollection.insertOne(equipment);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Old endpoint removed - use /equipments instead

// إعداد multer لرفع الملفات
const contractStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const contractsDir = path.join(__dirname, 'contracts');
    // إنشاء مجلد contracts إذا لم يكن موجوداً
    if (!fs.existsSync(contractsDir)) {
      fs.mkdirSync(contractsDir, { recursive: true });
    }
    cb(null, contractsDir);
  },
  filename: function (req, file, cb) {
    // تسمية الملف: contractorId_contractNumber_timestamp.pdf
    const contractorId = req.body.contractorId;
    const contractNumber = req.body.contractNumber;
    const timestamp = Date.now();
    const fileName = `${contractorId}_${contractNumber}_${timestamp}.pdf`;
    cb(null, fileName);
  }
});

const uploadContract = multer({ 
  storage: contractStorage,
  fileFilter: function (req, file, cb) {
    // قبول ملفات PDF فقط
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('يُسمح بملفات PDF فقط'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // حد أقصى 10MB
  }
});

// endpoint لرفع ملف العقد
app.post('/upload-contract', uploadContract.single('contractFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
    }

    console.log('✅ تم رفع ملف العقد:', req.file.filename);
    
    res.json({
      success: true,
      fileName: req.file.filename,
      filePath: req.file.path,
      originalName: req.file.originalname,
      size: req.file.size,
      message: 'تم رفع ملف العقد بنجاح'
    });
  } catch (error) {
    console.error('❌ خطأ في رفع ملف العقد:', error);
    res.status(500).json({ error: error.message });
  }
});

// endpoint لعرض ملفات العقود
app.get('/contracts/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'contracts', filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'ملف العقد غير موجود' });
  }
});

// endpoint لتمييز عمل من المستخلص كمسحوب
app.put('/extracts/mark-work-pulled/:contractorId/:workIndex', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    const workIndex = parseInt(req.params.workIndex);
    const { isPulled, pulledTo, pulledToContractorName, pulledAt } = req.body;
    
    console.log('🔄 تمييز عمل من المستخلص كمسحوب - المقاول:', contractorId, 'الفهرس:', workIndex);
    console.log('📦 البيانات المرسلة:', { isPulled, pulledTo, pulledToContractorName, pulledAt });
    
    // البحث عن المستخلصات الخاصة بالمقاول
    const extracts = await extractsCollection.find({ contractor: contractorId }).toArray();
    console.log('📄 عدد المستخلصات الموجودة:', extracts.length);
    
    if (!extracts || extracts.length === 0) {
      return res.status(404).json({ error: 'لا توجد مستخلصات لهذا المقاول' });
    }
    
    // أخذ آخر مستخلص
    const lastExtract = extracts[extracts.length - 1];
    console.log('📋 آخر مستخلص - رقم:', lastExtract.number, 'تاريخ:', lastExtract.date);
    
    if (!lastExtract.workItems || !Array.isArray(lastExtract.workItems)) {
      console.log('❌ لا توجد workItems في المستخلص');
      return res.status(404).json({ error: 'لا توجد بنود أعمال في المستخلص' });
    }
    
    console.log('📝 عدد بنود الأعمال في المستخلص:', lastExtract.workItems.length);
    console.log('🎯 الفهرس المطلوب:', workIndex, 'صالح؟', (workIndex >= 0 && workIndex < lastExtract.workItems.length));
    
    if (workIndex < 0 || workIndex >= lastExtract.workItems.length) {
      console.log('❌ فهرس العمل غير صحيح - الفهرس:', workIndex, 'العدد الكلي:', lastExtract.workItems.length);
      return res.status(400).json({ 
        error: 'فهرس العمل غير صحيح',
        requestedIndex: workIndex,
        totalItems: lastExtract.workItems.length,
        availableRange: `0-${lastExtract.workItems.length - 1}`
      });
    }
    
    // تحديث العمل المحدد
    lastExtract.workItems[workIndex] = {
      ...lastExtract.workItems[workIndex],
      isPulled: isPulled,
      pulledTo: pulledTo,
      pulledToContractorName: pulledToContractorName,
      pulledAt: new Date(pulledAt)
    };
    
    // حفظ التغييرات في قاعدة البيانات
    const result = await extractsCollection.updateOne(
      { _id: lastExtract._id },
      { 
        $set: { 
          workItems: lastExtract.workItems,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(400).json({ error: 'فشل في تحديث العمل' });
    }
    
    console.log('✅ تم تمييز العمل كمسحوب بنجاح');
    res.json({ 
      success: true, 
      message: 'تم تمييز العمل كمسحوب بنجاح',
      workIndex: workIndex
    });
    
  } catch (error) {
    console.error('❌ خطأ في تمييز العمل كمسحوب:', error);
    res.status(500).json({ error: error.message });
  }
});

// API جديد لإضافة أعمال مسحوبة للمقاول الجديد
// GET أعمال مسحوبة لمقاول محدد
app.get('/contractors/:contractorId/pulled-works', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    const projectId = req.query.projectId;
    
    console.log('🔍 جلب الأعمال المسحوبة:', { contractorId, projectId });
    
    // تحويل معرف المقاول
    let contractorObjectId;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      contractorObjectId = new ObjectId(contractorId);
    } else {
      contractorObjectId = contractorId;
    }
    
    // العثور على المقاول
    const contractor = await contractorsCollection.findOne({ _id: contractorObjectId });
    if (!contractor) {
      return res.status(404).json({ error: 'المقاول غير موجود' });
    }
    
    // إرجاع الأعمال المسحوبة
    const pulledWorks = contractor.pulledWorks || [];
    console.log(`✅ تم العثور على ${pulledWorks.length} عمل مسحوب`);
    
    res.json(pulledWorks);
  } catch (err) {
    console.error('❌ خطأ في جلب الأعمال المسحوبة:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/contractors/:contractorId/add-pulled-works', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    const { pulledWorks } = req.body;
    
    console.log('🔄 إضافة أعمال مسحوبة للمقاول الجديد:', { 
      contractorId, 
      worksCount: pulledWorks ? pulledWorks.length : 0,
      requestBody: req.body 
    });
    
    if (!Array.isArray(pulledWorks) || pulledWorks.length === 0) {
      console.log('❌ لا توجد أعمال للإضافة');
      return res.status(400).json({ error: 'لا توجد أعمال للإضافة' });
    }
    
    // تحويل معرف المقاول
    let contractorObjectId;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      contractorObjectId = new ObjectId(contractorId);
    } else {
      // إذا لم يكن ObjectId صحيح، جرب البحث بالاسم أو المعرف النصي
      const contractor = await contractorsCollection.findOne({ 
        $or: [
          { name: contractorId },
          { _id: contractorId }
        ]
      });
      if (!contractor) {
        return res.status(404).json({ error: 'المقاول غير موجود' });
      }
      contractorObjectId = contractor._id;
    }
    
    const contractorFilter = { contractor: contractorObjectId };
    
    // العثور على المستخلص الأخير للمقاول الجديد
    const extracts = await extractsCollection.find(contractorFilter).sort({ date: -1 }).toArray();
    
    if (extracts.length === 0) {
      // إنشاء مستخلص جديد إذا لم يوجد
      const newExtract = {
        number: 1,
        date: new Date(),
        contractor: contractorObjectId,
        workItems: pulledWorks.map(work => ({
          ...work,
          pulledFromContractorId: work.pulledFromContractorId,
          pulledFromContractorName: work.pulledFromContractorName,
          isPulledWork: true, // تمييز كعمل مسحوب
          addedAt: new Date()
        })),
        lumpSumRows: [],
        dailyRows: [],
        deductionRows: []
      };
      
      const result = await extractsCollection.insertOne(newExtract);
      console.log('✅ تم إنشاء مستخلص جديد مع الأعمال المسحوبة');
      return res.json({ success: true, message: 'تم إنشاء مستخلص جديد مع الأعمال المسحوبة', extractId: result.insertedId });
    }
    
    // إضافة الأعمال للمستخلص الموجود
    const lastExtract = extracts[0];
    const newWorkItems = pulledWorks.map(work => ({
      ...work,
      pulledFromContractorId: work.pulledFromContractorId,
      pulledFromContractorName: work.pulledFromContractorName,
      isPulledWork: true, // تمييز كعمل مسحوب
      addedAt: new Date()
    }));
    
    lastExtract.workItems = [...(lastExtract.workItems || []), ...newWorkItems];
    
    // تحديث المستخلص
    const result = await extractsCollection.updateOne(
      { _id: lastExtract._id },
      { $set: { workItems: lastExtract.workItems } }
    );
    
    console.log('✅ تم إضافة الأعمال المسحوبة للمستخلص الموجود');
    res.json({ success: true, message: 'تم إضافة الأعمال المسحوبة بنجاح', extractId: lastExtract._id });
    
  } catch (error) {
    console.error('❌ خطأ في إضافة الأعمال المسحوبة:', error);
    res.status(500).json({ error: error.message });
  }
});

// API للحصول على مستخلصات مقاول محدد
app.get('/contractors/:contractorId/extracts', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    console.log('🔄 جلب مستخلصات المقاول:', contractorId);
    
    // تحويل معرف المقاول
    let contractorObjectId;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      contractorObjectId = new ObjectId(contractorId);
    } else {
      // البحث بالاسم أو المعرف النصي
      const contractor = await contractorsCollection.findOne({ 
        $or: [
          { name: contractorId },
          { _id: contractorId }
        ]
      });
      if (!contractor) {
        return res.status(404).json({ error: 'المقاول غير موجود' });
      }
      contractorObjectId = contractor._id;
    }
    
    // جلب المستخلصات للمقاول
    const extracts = await extractsCollection.find({ 
      contractor: contractorObjectId 
    }).toArray();
    
    console.log(`✅ تم جلب ${extracts.length} مستخلص للمقاول`);
    res.json(extracts);
    
  } catch (error) {
    console.error('❌ خطأ في جلب مستخلصات المقاول:', error);
    res.status(500).json({ error: error.message });
  }
});

// API للحصول على خصومات مقاول محدد
app.get('/contractors/:contractorId/deductions', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    console.log('🔄 جلب خصومات المقاول:', contractorId);
    
    // تحويل معرف المقاول
    let contractorObjectId;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      contractorObjectId = new ObjectId(contractorId);
    } else {
      const contractor = await contractorsCollection.findOne({ 
        $or: [
          { name: contractorId },
          { _id: contractorId }
        ]
      });
      if (!contractor) {
        return res.status(404).json({ error: 'المقاول غير موجود' });
      }
      contractorObjectId = contractor._id;
    }
    
    // جلب المستخلصات للمقاول وجمع الخصومات
    const extracts = await extractsCollection.find({ 
      contractor: contractorObjectId 
    }).toArray();
    
    let allDeductions = [];
    extracts.forEach(extract => {
      if (extract.deductionRows && Array.isArray(extract.deductionRows)) {
        extract.deductionRows.forEach(deduction => {
          allDeductions.push({
            ...deduction,
            extractId: extract._id,
            extractNumber: extract.number
          });
        });
      }
    });
    
    console.log(`✅ تم جلب ${allDeductions.length} خصم للمقاول`);
    res.json(allDeductions);
    
  } catch (error) {
    console.error('❌ خطأ في جلب خصومات المقاول:', error);
    res.status(500).json({ error: error.message });
  }
});

// API للحصول على مواد مقاول محدد
app.get('/contractors/:contractorId/materials', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    console.log('🔄 جلب مواد المقاول:', contractorId);
    
    // تحويل معرف المقاول
    let contractorObjectId;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      contractorObjectId = new ObjectId(contractorId);
    } else {
      const contractor = await contractorsCollection.findOne({ 
        $or: [
          { name: contractorId },
          { _id: contractorId }
        ]
      });
      if (!contractor) {
        return res.status(404).json({ error: 'المقاول غير موجود' });
      }
      contractorObjectId = contractor._id;
    }
    
    // جلب بيانات المقاول مع المواد
    const contractor = await contractorsCollection.findOne({ _id: contractorObjectId });
    const materials = contractor && contractor.materials ? contractor.materials : [];
    
    console.log(`✅ تم جلب ${materials.length} مادة للمقاول`);
    res.json(materials);
    
  } catch (error) {
    console.error('❌ خطأ في جلب مواد المقاول:', error);
    res.status(500).json({ error: error.message });
  }
});

// API جديد لحفظ المسودات في السيرفر (حماية إضافية)
app.post('/drafts', async (req, res) => {
  try {
    const draftData = req.body;
    const contractorId = draftData.contractorId;
    
    console.log(`💾 حفظ مسودة في السيرفر للمقاول: ${contractorId}`);
    
    // إنشاء كولكشن للمسودات إذا لم يوجد
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('drafts');
    }
    
    // حفظ أو تحديث المسودة
    const result = await draftsCollection.replaceOne(
      { contractorId: contractorId },
      {
        contractorId: contractorId,
        draftData: draftData,
        timestamp: new Date(),
        lastModified: new Date()
      },
      { upsert: true }
    );
    
    console.log(`✅ تم حفظ المسودة في السيرفر للمقاول ${contractorId}`);
    res.json({ success: true, message: 'تم حفظ المسودة في السيرفر بنجاح' });
  } catch (err) {
    console.error('❌ خطأ في حفظ المسودة في السيرفر:', err);
    res.status(500).json({ error: 'خطأ في حفظ المسودة' });
  }
});

// API لجلب المسودة من السيرفر
app.get('/drafts/:contractorId', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    console.log(`� جلب مسودة من السيرفر للمقاول: ${contractorId}`);
    
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('drafts');
    }
    
    const draft = await draftsCollection.findOne({ contractorId: contractorId });
    
    if (draft) {
      console.log(`✅ تم العثور على مسودة للمقاول ${contractorId}`);
      res.json({ success: true, draft: draft.draftData });
    } else {
      console.log(`❌ لم يتم العثور على مسودة للمقاول ${contractorId}`);
      res.json({ success: false, message: 'لا توجد مسودة محفوظة' });
    }
  } catch (err) {
    console.error('❌ خطأ في جلب المسودة من السيرفر:', err);
    res.status(500).json({ error: 'خطأ في جلب المسودة' });
  }
});

// API جديد لمسح المسودة
app.delete('/draft/:contractorId', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    console.log(`🗑️ طلب مسح مسودة للمقاول: ${contractorId}`);
    
    // مسح المسودة من قاعدة البيانات
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('drafts');
    }
    
    await draftsCollection.deleteOne({ contractorId: contractorId });
    
    res.json({ success: true, message: 'تم مسح المسودة بنجاح' });
  } catch (err) {
    console.error('❌ خطأ في مسح المسودة:', err);
    res.status(500).json({ error: 'خطأ في مسح المسودة' });
  }
});

// جلب سجل العمليات لمستخلص محدد
app.get('/extract-operations/:extractId', async (req, res) => {
  try {
    const extractId = req.params.extractId;
    const extract = await extractsCollection.findOne({ _id: new ObjectId(extractId) });
    
    if (!extract) {
      return res.status(404).json({ error: 'المستخلص غير موجود' });
    }
    
    res.json({ operations: extract.operations || [] });
  } catch (err) {
    console.error('خطأ في جلب سجل العمليات:', err);
    res.status(500).json({ error: 'خطأ في جلب سجل العمليات' });
  }
});

// ==================== External Services API ====================

// Get all external services
app.get('/external-services', async (req, res) => {
  try {
    if (!externalServicesCollection) {
      console.log('⚠️ External services collection not initialized, returning empty array');
      return res.json([]);
    }
    const { projectId } = req.query;
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    const services = await externalServicesCollection.find(filter).sort({ serviceDate: -1 }).toArray();
    console.log(`✅ Fetched ${services.length} external services for project:`, projectId);
    res.json(services);
  } catch (err) {
    console.error('Error fetching external services:', err);
    res.status(500).json({ error: 'خطأ في جلب البيانات' });
  }
});

// Get single external service
app.get('/external-services/:id', async (req, res) => {
  try {
    const service = await externalServicesCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!service) {
      return res.status(404).json({ error: 'التعامل غير موجود' });
    }
    res.json(service);
  } catch (err) {
    console.error('Error fetching service:', err);
    res.status(500).json({ error: 'خطأ في جلب البيانات' });
  }
});

// Create new external service
app.post('/external-services', upload.single('attachment'), async (req, res) => {
  try {
    if (!externalServicesCollection) {
      return res.status(500).json({ error: 'External services collection not initialized' });
    }
    
    // التحقق من وجود projectId
    if (!req.body.projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    const serviceData = {
      supplierName: req.body.supplierName,
      serviceType: req.body.serviceType,
      serviceDate: req.body.serviceDate,
      amount: parseFloat(req.body.amount),
      paymentMethod: req.body.paymentMethod,
      receiverName: req.body.receiverName || '',
      description: req.body.description,
      notes: req.body.notes || '',
      attachmentUrl: req.file ? req.file.path : '',
      attachmentFilename: req.file ? req.file.filename : '',
      projectId: req.body.projectId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await externalServicesCollection.insertOne(serviceData);
    console.log(`✅ Added new external service: ${serviceData.supplierName} for project:`, serviceData.projectId);
    res.status(201).json({ 
      success: true, 
      message: 'تم إضافة التعامل بنجاح',
      id: result.insertedId 
    });
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ error: 'خطأ في إضافة التعامل' });
  }
});

// Update external service
app.put('/external-services/:id', upload.single('attachment'), async (req, res) => {
  try {
    const updateData = {
      supplierName: req.body.supplierName,
      serviceType: req.body.serviceType,
      serviceDate: req.body.serviceDate,
      amount: parseFloat(req.body.amount),
      paymentMethod: req.body.paymentMethod,
      receiverName: req.body.receiverName || '',
      description: req.body.description,
      notes: req.body.notes || '',
      updatedAt: new Date()
    };

    // Update attachment if new file uploaded
    if (req.file) {
      updateData.attachmentUrl = req.file.path;
      updateData.attachmentFilename = req.file.filename;
    }

    const result = await externalServicesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'التعامل غير موجود' });
    }

    res.json({ success: true, message: 'تم تحديث التعامل بنجاح' });
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ error: 'خطأ في تحديث التعامل' });
  }
});

// Delete external service
app.delete('/external-services/:id', async (req, res) => {
  try {
    const result = await externalServicesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'التعامل غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف التعامل بنجاح' });
  } catch (err) {
    console.error('Error deleting service:', err);
    res.status(500).json({ error: 'خطأ في حذف التعامل' });
  }
});

// Export external services to Excel
app.get('/external-services/export', async (req, res) => {
  try {
    const services = await externalServicesCollection.find({}).sort({ serviceDate: -1 }).toArray();
    
    // Create simple CSV (you can use xlsx library for better Excel support)
    let csv = 'التاريخ,اسم الجهة,نوع الخدمة,وصف العملية,القيمة,طريقة الدفع,المستلم,ملاحظات\n';
    
    services.forEach(s => {
      const date = new Date(s.serviceDate).toLocaleDateString('ar-EG');
      csv += `"${date}","${s.supplierName}","${s.serviceType}","${s.description}","${s.amount}","${s.paymentMethod}","${s.receiverName || ''}","${s.notes || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=external-services.csv');
    res.send('\uFEFF' + csv); // UTF-8 BOM for Excel
  } catch (err) {
    console.error('Error exporting services:', err);
    res.status(500).json({ error: 'خطأ في التصدير' });
  }
});

// ==================== End External Services API ====================


// ==================== Receipts API ====================

// Get all receipts
app.get('/receipts', async (req, res) => {
  try {
    if (!receiptsCollection) {
      console.log('⚠️ Receipts collection not initialized, returning empty array');
      return res.json([]);
    }
    const { projectId } = req.query;
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    const receipts = await receiptsCollection.find(filter).sort({ receiptDate: -1 }).toArray();
    console.log(`✅ Fetched ${receipts.length} receipts for project:`, projectId);
    res.json(receipts);
  } catch (err) {
    console.error('Error fetching receipts:', err);
    res.status(500).json({ error: 'خطأ في جلب السندات' });
  }
});

// Get single receipt by ID
app.get('/receipts/:id', async (req, res) => {
  try {
    const receipt = await receiptsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!receipt) {
      return res.status(404).json({ error: 'السند غير موجود' });
    }
    res.json(receipt);
  } catch (err) {
    console.error('Error fetching receipt:', err);
    res.status(500).json({ error: 'خطأ في جلب السند' });
  }
});

// Create new receipt
app.post('/receipts', async (req, res) => {
  try {
    if (!receiptsCollection) {
      return res.status(500).json({ error: 'Collection not initialized' });
    }

    const {
      receiptNumber,
      receiptDate,
      receiverName,
      serviceDescription,
      amount,
      amountInWords,
      notes,
      projectId
    } = req.body;

    // التحقق من وجود projectId
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const receiptData = {
      receiptNumber,
      receiptDate,
      receiverName,
      serviceDescription,
      amount: parseFloat(amount) || 0,
      amountInWords: amountInWords || '',
      notes: notes || '',
      projectId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await receiptsCollection.insertOne(receiptData);
    console.log(`✅ Added new receipt: ${receiptData.receiptNumber} for project:`, projectId);
    res.status(201).json({ success: true, id: result.insertedId });
  } catch (err) {
    console.error('Error creating receipt:', err);
    res.status(500).json({ error: 'خطأ في إنشاء السند' });
  }
});

// Update receipt
app.put('/receipts/:id', async (req, res) => {
  try {
    const {
      receiptNumber,
      receiptDate,
      receiverName,
      serviceDescription,
      amount,
      amountInWords,
      notes
    } = req.body;

    const updateData = {
      receiptNumber,
      receiptDate,
      receiverName,
      serviceDescription,
      amount: parseFloat(amount) || 0,
      amountInWords: amountInWords || '',
      notes: notes || '',
      updatedAt: new Date()
    };

    const result = await receiptsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'السند غير موجود' });
    }

    res.json({ success: true, message: 'تم تحديث السند بنجاح' });
  } catch (err) {
    console.error('Error updating receipt:', err);
    res.status(500).json({ error: 'خطأ في تحديث السند' });
  }
});

// Delete receipt
app.delete('/receipts/:id', async (req, res) => {
  try {
    const result = await receiptsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'السند غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف السند بنجاح' });
  } catch (err) {
    console.error('Error deleting receipt:', err);
    res.status(500).json({ error: 'خطأ في حذف السند' });
  }
});

// Export receipts to CSV
app.get('/receipts/export', async (req, res) => {
  try {
    const receipts = await receiptsCollection.find({}).sort({ receiptDate: -1 }).toArray();
    
    let csv = 'رقم السند,التاريخ,المستلم,المورد,نوع الخدمة,المبلغ,المبلغ بالحروف,الحالة,ملاحظات\n';
    
    receipts.forEach(r => {
      const date = new Date(r.receiptDate).toLocaleDateString('ar-EG');
      csv += `"${r.receiptNumber}","${date}","${r.receiverName}","${r.supplierName}","${r.serviceType}","${r.amount}","${r.amountInWords || ''}","${r.status}","${r.notes || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=receipts.csv');
    res.send('\uFEFF' + csv); // UTF-8 BOM for Excel
  } catch (err) {
    console.error('Error exporting receipts:', err);
    res.status(500).json({ error: 'خطأ في التصدير' });
  }
});

// ==================== End Receipts API ====================


// ==================== Drawings API ====================

// Get all drawings
app.get('/drawings', async (req, res) => {
  try {
    const { projectId } = req.query;
    const companyId = req.companyId || req.query.companyId;
    
    console.log('📋 طلب جلب مخططات - projectId:', projectId, 'companyId:', companyId);
    
    let filter = {};
    if (projectId) {
      filter.projectId = projectId;
    }
    if (companyId) {
      filter.companyId = companyId;
    }
    
    console.log('🔍 Filter المستخدم:', JSON.stringify(filter));
    
    const drawings = await drawingsCollection.find(filter).sort({ drawingDate: -1 }).toArray();
    console.log(`📊 تم جلب ${drawings.length} مخطط`);
    
    res.json(drawings);
  } catch (err) {
    console.error('Error fetching drawings:', err);
    res.status(500).json({ error: 'خطأ في جلب الرسومات' });
  }
});

// Get single drawing by ID
app.get('/drawings/:id', async (req, res) => {
  try {
    const drawing = await drawingsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!drawing) return res.status(404).json({ error: 'الرسم غير موجود' });
    res.json(drawing);
  } catch (err) {
    console.error('Error fetching drawing:', err);
    res.status(500).json({ error: 'خطأ في جلب الرسم' });
  }
});

// Create new drawing
app.post('/drawings', upload.single('attachment'), async (req, res) => {
  try {
    console.log('📝 POST /drawings - طلب إضافة مخطط جديد');
    console.log('📋 Request body:', req.body);
    console.log('📁 Request file:', req.file ? req.file.originalname : 'No file');
    
    const {
      drawingNumber,
      name,
      drawingName,
      buildingModel,
      type,
      drawingType,
      itemName,
      statement,
      notes,
      projectId,
      companyId: bodyCompanyId,
      dwgFile,
      pdfFile
    } = req.body;
    
    // استخدام companyId من body أو middleware
    let companyId = bodyCompanyId || req.companyId || req.query.companyId;
    
    // إذا لم يكن موجود، حاول الحصول عليه من subdomain
    if (!companyId && req.subdomain && companiesCollection) {
      const company = await companiesCollection.findOne({ subdomain: req.subdomain });
      if (company) {
        companyId = company._id.toString();
      }
    }
    
    console.log('📝 حفظ مخطط جديد:', {
      projectId: projectId,
      companyId: companyId,
      drawingNumber: drawingNumber,
      name: name || drawingName,
      type: type || drawingType,
      subdomain: req.subdomain
    });

    const newDrawing = {
      drawingNumber,
      name: name || drawingName,
      drawingDate: new Date(),
      buildingModel,
      type: type || drawingType,
      itemName,
      statement: statement || notes || '',
      projectId: projectId,
      companyId: companyId,
      dwgFile: dwgFile || null,
      pdfFile: pdfFile || null,
      attachment: req.file ? req.file.path : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('💾 Drawing to save:', newDrawing);
    
    const result = await drawingsCollection.insertOne(newDrawing);
    console.log('✅ تم حفظ المخطط بنجاح - ID:', result.insertedId);
    
    res.json({ 
      success: true, 
      message: 'تم إضافة الرسم بنجاح',
      drawingId: result.insertedId 
    });
  } catch (err) {
    console.error('Error creating drawing:', err);
    res.status(500).json({ 
      error: 'خطأ في إضافة الرسم',
      details: err.message 
    });
  }
});

// Update drawing
app.put('/drawings/:id', upload.single('attachment'), async (req, res) => {
  try {
    console.log('📝 Update Drawing Request:');
    console.log('ID:', req.params.id);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    
    const {
      drawingNumber,
      drawingName,
      drawingDate,
      contractorName,
      drawingType,
      notes
    } = req.body;

    const updateData = {
      drawingNumber,
      drawingName,
      drawingDate: new Date(drawingDate),
      contractorName,
      drawingType,
      notes: notes || '',
      updatedAt: new Date()
    };

    // إذا تم رفع ملف جديد
    if (req.file) {
      updateData.attachment = req.file.path;
    }

    console.log('Update Data:', updateData);

    const result = await drawingsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    console.log('Update Result:', result);

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'الرسم غير موجود' });
    }

    res.json({ success: true, message: 'تم تحديث الرسم بنجاح' });
  } catch (err) {
    console.error('❌ Error updating drawing:', err);
    res.status(500).json({ 
      error: 'خطأ في تحديث الرسم',
      details: err.message 
    });
  }
});

// Delete drawing
app.delete('/drawings/:id', async (req, res) => {
  try {
    const result = await drawingsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'الرسم غير موجود' });
    }

    res.json({ success: true, message: 'تم حذف الرسم بنجاح' });
  } catch (err) {
    console.error('Error deleting drawing:', err);
    res.status(500).json({ 
      error: 'خطأ في حذف الرسم',
      details: err.message 
    });
  }
});

// Export drawings to Excel/CSV
app.get('/drawings/export', async (req, res) => {
  try {
    const drawings = await drawingsCollection.find({}).sort({ drawingDate: -1 }).toArray();
    
    let csv = 'رقم الرسم,اسم الرسم,التاريخ,المقاول,نوع الرسم,ملاحظات\n';
    
    drawings.forEach(d => {
      const date = new Date(d.drawingDate).toLocaleDateString('ar-EG');
      csv += `"${d.drawingNumber}","${d.drawingName}","${date}","${d.contractorName}","${d.drawingType}","${d.notes || ''}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=drawings.csv');
    res.send('\uFEFF' + csv); // UTF-8 BOM for Excel
  } catch (err) {
    console.error('Error exporting drawings:', err);
    res.status(500).json({ error: 'خطأ في التصدير' });
  }
});

// ==================== End Drawings API ====================


// ==================== Companies API ====================

// Get all companies
app.get('/companies', async (req, res) => {
  try {
    const companies = await companiesCollection.find({}).sort({ createdAt: -1 }).toArray();
    res.json(companies);
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ error: 'خطأ في جلب الشركات' });
  }
});

// Create new company
app.post('/companies', async (req, res) => {
  try {
    const { companyName, email, phone, address, subscription, subdomain } = req.body;
    
    // إنشاء subdomain تلقائياً من اسم الشركة إذا لم يتم إدخاله
    let companySubdomain = subdomain;
    if (!companySubdomain) {
      // تحويل اسم الشركة إلى subdomain (إزالة المسافات والأحرف الخاصة)
      companySubdomain = companyName
        .toLowerCase()
        .replace(/\s+/g, '-')           // استبدال المسافات بـ -
        .replace(/[أإآ]/g, 'a')         // استبدال الهمزات
        .replace(/[^\w\-]/g, '')        // إزالة الأحرف الخاصة
        .substring(0, 20);              // أقصى طول 20 حرف
    }
    
    // التحقق من عدم تكرار الـ subdomain
    const existingCompany = await companiesCollection.findOne({ subdomain: companySubdomain });
    if (existingCompany) {
      // إضافة رقم عشوائي إذا كان مكرر
      companySubdomain = `${companySubdomain}-${Math.floor(Math.random() * 1000)}`;
    }
    
    const newCompany = {
      companyName,
      subdomain: companySubdomain,
      email,
      phone: phone || '',
      address: address || '',
      subscription: subscription || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await companiesCollection.insertOne(newCompany);
    const companyId = result.insertedId.toString();
    
    // إنشاء مستخدم Admin تلقائياً للشركة
    const adminUser = {
      username: `admin_${companySubdomain}`,
      email: email, // نفس البريد الإلكتروني للشركة
      password: '123456', // كلمة مرور افتراضية (يجب تغييرها لاحقاً)
      companyId: companyId,
      role: 'admin', // مدير الشركة
      projectIds: [], // Admin يرى كل المشاريع
      createdAt: new Date()
    };
    
    const adminResult = await usersCollection.insertOne(adminUser);
    
    console.log(`✅ Created company: ${companyName} with admin user: ${adminUser.username}`);
    
    // محاولة إضافة النطاق الفرعي تلقائياً لملف hosts (Windows فقط)
    try {
      const { exec } = require('child_process');
      const scriptPath = path.join(__dirname, 'auto-add-subdomain.ps1');
      
      // تشغيل السكريبت بصلاحيات مرتفعة (يحتاج PowerShell كمسؤول)
      const psCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -Subdomain "${companySubdomain}"`;
      
      exec(psCommand, (error, stdout, stderr) => {
        if (error) {
          console.log(`⚠️  تنبيه: لم يتم إضافة النطاق لملف hosts تلقائياً (يحتاج صلاحيات Admin)`);
          console.log(`💡 يمكنك تشغيل هذا الأمر يدوياً في PowerShell كمسؤول:`);
          console.log(`   .\\auto-add-subdomain.ps1 -Subdomain "${companySubdomain}"`);
        } else {
          console.log(`🎉 تم إضافة النطاق لملف hosts تلقائياً: ${companySubdomain}.taskon.local`);
        }
      });
    } catch (err) {
      console.log(`⚠️  تنبيه: خطأ في إضافة النطاق تلقائياً: ${err.message}`);
    }
    
    // تحديد الرابط حسب البيئة
    const baseUrl = process.env.NODE_ENV === 'production' ? 
      (req.get('host').includes('render.com') ? `https://${req.get('host')}` : 'https://taskon-qzj8.onrender.com') :
      'http://localhost:4000';
    
    const fullUrl = `${baseUrl}/index.html?company=${companySubdomain}`;

    res.json({ 
      success: true, 
      message: 'تم إضافة الشركة بنجاح',
      companyId: companyId,
      subdomain: companySubdomain,
      fullUrl: fullUrl,
      adminUser: {
        username: adminUser.username,
        password: '123456',
        email: adminUser.email
      },
      instructions: process.env.NODE_ENV === 'production' ? 
        `يمكنك الوصول للشركة عبر: ${fullUrl}` :
        'إذا لم يعمل الرابط محلياً، قم بتشغيل PowerShell كمسؤول وأضف النطاق يدوياً'
    });
  } catch (err) {
    console.error('Error creating company:', err);
    res.status(500).json({ error: 'خطأ في إضافة الشركة' });
  }
});

// Delete company
app.delete('/companies/:id', async (req, res) => {
  try {
    // الحصول على بيانات الشركة قبل الحذف
    const company = await companiesCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!company) {
      return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });
    }
    
    console.log(`🗑️ بدء حذف الشركة: ${company.companyName}`);
    
    // الحصول على اسم الشركة المنظف
    const sanitized = sanitizeCompanyName(company.companyName);
    const prefix = `${sanitized}_`;
    
    // الحصول على قائمة جميع collections
    const collections = await db.listCollections().toArray();
    
    // حذف جميع collections التي تبدأ باسم الشركة
    let deletedCount = 0;
    for (const coll of collections) {
      if (coll.name.startsWith(prefix)) {
        try {
          await db.collection(coll.name).drop();
          console.log(`  ✅ تم حذف: ${coll.name}`);
          deletedCount++;
        } catch (err) {
          console.error(`  ❌ خطأ في حذف ${coll.name}:`, err.message);
        }
      }
    }
    
    // حذف سجل الشركة من collection الشركات
    const result = await companiesCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    console.log(`✅ تم حذف الشركة و ${deletedCount} collection(s)`);
    
    res.json({ 
      success: true, 
      message: `تم حذف الشركة و ${deletedCount} قاعدة بيانات بنجاح`,
      collectionsDeleted: deletedCount
    });
  } catch (err) {
    console.error('Error deleting company:', err);
    res.status(500).json({ success: false, error: 'خطأ في حذف الشركة' });
  }
});

// Update company
app.put('/companies/:id', async (req, res) => {
  try {
    const { companyName, contactInfo, subdomain } = req.body;
    
    // Check if subdomain already exists (excluding current company)
    const existingCompany = await companiesCollection.findOne({ 
      subdomain: subdomain,
      _id: { $ne: new ObjectId(req.params.id) }
    });
    
    if (existingCompany) {
      return res.status(400).json({ success: false, error: 'النطاق الفرعي موجود بالفعل' });
    }
    
    const updatedCompany = {
      companyName,
      contactInfo,
      subdomain,
      updatedAt: new Date()
    };
    
    const result = await companiesCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updatedCompany }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: 'الشركة غير موجودة' });
    }
    
    res.json({ success: true, message: 'تم تحديث الشركة بنجاح' });
  } catch (err) {
    console.error('Error updating company:', err);
    res.status(500).json({ success: false, error: 'خطأ في تحديث الشركة' });
  }
});

// ==================== End Companies API ====================


// ==================== Projects API ====================

// Get all projects for a company (with role-based filtering)
app.get('/projects', async (req, res) => {
  console.log('📋 GET /projects called with query:', req.query);
  try {
    // الأولوية للـ companyId من الـ subdomain middleware
    const companyId = req.companyId || req.query.companyId;
    const { userId, userRole } = req.query; // userId و role للفلترة
    
    // ⚠️ إلزامي: يجب وجود companyId لمنع عرض بيانات كل الشركات
    if (!companyId) {
      console.error('❌ GET /projects: companyId مفقود!');
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    let filter = { companyId };
    
    // استخدام collection المشاريع الخاص بالشركة
    const projectsCol = req.companyProjectsCollection || projectsCollection;
    
    // إذا كان المستخدم عادي (ليس admin)، عرض المشاريع المخصصة له فقط
    if (userId && userRole !== 'admin') {
      // البحث عن المستخدم للحصول على projectIds
      const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
      if (user && user.projectIds && user.projectIds.length > 0) {
        // فلترة المشاريع حسب IDs المخصصة للمستخدم
        filter._id = { $in: user.projectIds.map(id => new ObjectId(id)) };
        console.log(`🔒 مستخدم عادي مع مشاريع محددة: ${user.projectIds.length} مشروع`);
      } else {
        // إذا لم يكن له مشاريع مخصصة، اعرض جميع مشاريع الشركة (مؤقتاً)
        console.log(`⚠️ مستخدم بدون مشاريع محددة - عرض جميع مشاريع الشركة`);
        // نترك الـ filter كما هو (فقط companyId)
      }
    }
    
    const projects = await projectsCol.find(filter).sort({ createdAt: -1 }).toArray();
    
    console.log(`✅ Found ${projects.length} projects for companyId: ${companyId}${req.companyId ? ' (from subdomain)' : ''}${userRole !== 'admin' ? ' (user filtered)' : ' (admin - all projects)'}`);
    res.json(projects);
  } catch (err) {
    console.error('Error fetching projects:', err);
    res.status(500).json({ error: 'خطأ في جلب المشاريع' });
  }
});

// Get single project
app.get('/projects/:id', async (req, res) => {
  try {
    const projectsCol = req.companyProjectsCollection || projectsCollection;
    const project = await projectsCol.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!project) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }
    
    res.json(project);
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'خطأ في جلب المشروع' });
  }
});

// Create new project
app.post('/projects', async (req, res) => {
  try {
    const { 
      companyId, 
      projectName, 
      projectCode, 
      location, 
      description,
      startDate,
      endDate 
    } = req.body;
    
    // التأكد من وجود companyName
    if (!req.companyName && !companyId) {
      return res.status(400).json({ error: 'Company information is required' });
    }
    
    const newProject = {
      companyId: companyId || req.companyId,
      projectName,
      projectCode,
      location: location || '',
      description: description || '',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // استخدام collection المشاريع الخاص بالشركة
    const projectsCol = req.companyProjectsCollection || projectsCollection;
    const result = await projectsCol.insertOne(newProject);
    
    res.json({ 
      success: true, 
      message: 'تم إضافة المشروع بنجاح',
      projectId: result.insertedId 
    });
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ error: 'خطأ في إضافة المشروع' });
  }
});

// Update project
app.put('/projects/:id', async (req, res) => {
  try {
    const { 
      projectName, 
      projectCode, 
      location, 
      description,
      startDate,
      endDate,
      status 
    } = req.body;
    
    const updateData = {
      projectName,
      projectCode,
      location: location || '',
      description: description || '',
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      status: status || 'active',
      updatedAt: new Date()
    };
    
    const result = await projectsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }
    
    res.json({ success: true, message: 'تم تحديث المشروع بنجاح' });
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ error: 'خطأ في تحديث المشروع' });
  }
});

// Delete project
app.delete('/projects/:id', async (req, res) => {
  try {
    // استخدام collection المشاريع الخاص بالشركة
    const projectsCol = req.companyProjectsCollection || projectsCollection;
    
    // الحصول على بيانات المشروع قبل الحذف
    const project = await projectsCol.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!project) {
      return res.status(404).json({ error: 'المشروع غير موجود' });
    }
    
    console.log(`🗑️ بدء حذف المشروع: ${project.projectName} (ID: ${req.params.id})`);
    
    // إذا كان هناك companyName، نحذف collections المشروع
    if (req.companyName) {
      const sanitized = sanitizeCompanyName(req.companyName);
      const prefix = `${sanitized}_project_${req.params.id}_`;
      
      // الحصول على قائمة جميع collections
      const collections = await db.listCollections().toArray();
      
      // حذف جميع collections التي تبدأ بـ prefix المشروع
      let deletedCount = 0;
      for (const coll of collections) {
        if (coll.name.startsWith(prefix)) {
          try {
            await db.collection(coll.name).drop();
            console.log(`  ✅ تم حذف: ${coll.name}`);
            deletedCount++;
          } catch (err) {
            console.error(`  ❌ خطأ في حذف ${coll.name}:`, err.message);
          }
        }
      }
      
      console.log(`✅ تم حذف ${deletedCount} collection(s) للمشروع`);
    }
    
    // حذف سجل المشروع
    const result = await projectsCol.deleteOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ 
      success: true, 
      message: 'تم حذف المشروع وجميع بياناته بنجاح',
      collectionsDeleted: req.companyName ? deletedCount : 0
    });
  } catch (err) {
    console.error('Error deleting project:', err);
    res.status(500).json({ error: 'خطأ في حذف المشروع' });
  }
});

// Fix old extracts - إضافة projectId و companyId للمستخلصات القديمة
app.post('/admin/fix-extracts-projectid', async (req, res) => {
  try {
    const { projectId, companyId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    // عرض المستخلصات بدون projectId أو companyId
    const extractsWithoutProject = await extractsCollection.find({ 
      $or: [
        { projectId: { $exists: false } },
        { companyId: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📋 وجدنا ${extractsWithoutProject.length} مستخلص يحتاج تحديث`);
    
    // تحديث المستخلصات
    const result = await extractsCollection.updateMany(
      {
        $or: [
          { projectId: { $exists: false } },
          { companyId: { $exists: false } }
        ]
      },
      { 
        $set: { 
          projectId: projectId,
          companyId: companyId
        } 
      }
    );
    
    console.log(`✅ تم تحديث ${result.modifiedCount} مستخلص بـ projectId: ${projectId} و companyId: ${companyId}`);
    
    res.json({ 
      message: 'تم تحديث المستخلصات بنجاح',
      found: extractsWithoutProject.length,
      modified: result.modifiedCount,
      extracts: extractsWithoutProject.map(e => ({
        number: e.number,
        date: e.date,
        contractor: e.contractor
      }))
    });
  } catch (err) {
    console.error('خطأ في تحديث المستخلصات:', err);
    res.status(500).json({ error: err.message });
  }
});

// Fix old drawings - إضافة projectId و companyId للمخططات القديمة
app.post('/admin/fix-drawings-projectid', async (req, res) => {
  try {
    const { projectId, companyId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' });
    }
    
    // عرض المخططات بدون projectId أو companyId
    const drawingsWithoutProject = await drawingsCollection.find({ 
      $or: [
        { projectId: { $exists: false } },
        { companyId: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📋 وجدنا ${drawingsWithoutProject.length} مخطط يحتاج تحديث`);
    
    // تحديث المخططات
    const result = await drawingsCollection.updateMany(
      {
        $or: [
          { projectId: { $exists: false } },
          { companyId: { $exists: false } }
        ]
      },
      { 
        $set: { 
          projectId: projectId,
          companyId: companyId
        } 
      }
    );
    
    console.log(`✅ تم تحديث ${result.modifiedCount} مخطط بـ projectId: ${projectId} و companyId: ${companyId}`);
    
    res.json({ 
      message: 'تم تحديث المخططات بنجاح',
      found: drawingsWithoutProject.length,
      modified: result.modifiedCount,
      drawings: drawingsWithoutProject.map(d => ({
        drawingNumber: d.drawingNumber,
        drawingName: d.drawingName
      }))
    });
  } catch (err) {
    console.error('خطأ في تحديث المخططات:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== End Projects API ====================

// ==================== Static Files ====================
// ملاحظة: static files middleware تم نقله لأعلى الملف (بعد cors و json)
// هذا يضمن خدمة permissions.js و favicon بشكل صحيح
// Serve uploaded files
app.use('/uploads', express.static('uploads'));
// ==================== End Static Files ====================

