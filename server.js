console.log('🚀 Starting Taskon Server...');
console.log('📅 Deploy Date:', new Date().toISOString());
console.log('🔧 Version: Railway Fix - October 30, 2025');

const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
const multer = require('multer');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic multer setup for early endpoints
const basicUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadsDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const baseName = path.basename(file.originalname, ext);
      cb(null, `${timestamp}_${baseName}${ext}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ========= IMMEDIATE TEST ENDPOINTS - NO DEPENDENCIES ==========
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Railway deployment WORKING!',
    timestamp: new Date().toISOString(),
    version: 'EMERGENCY FIX - October 30, 2025',
    status: 'Server is running correctly'
  });
});

app.get('/status', (req, res) => {
  res.json({
    server: 'online',
    time: new Date().toLocaleString(),
    uptime: process.uptime(),
    version: 'Emergency Railway Fix'
  });
});

// Drawings endpoint with proper database integration
app.get('/drawings', async (req, res) => {
  try {
    console.log('🔍 GET /drawings called at:', new Date().toISOString());
    
    // If database not connected yet, return empty array
    if (!drawingsCollection) {
      console.log('⏳ Database not connected yet, returning empty array');
      return res.json([]);
    }
    
    const drawings = await drawingsCollection.find({}).sort({ drawingDate: -1 }).toArray();
    console.log('✅ Found drawings:', drawings.length);
    
    // Return array directly (what frontend expects)
    res.json(drawings);
    
  } catch (err) {
    console.error('❌ Error fetching drawings:', err);
    // Return empty array on error so frontend doesn't break
    res.json([]);
  }
});

// POST drawings endpoint with proper handling
app.post('/drawings', basicUpload.fields([
  { name: 'attachment', maxCount: 1 },
  { name: 'pdfAttachment', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📝 POST /drawings called at:', new Date().toISOString());
    console.log('📄 Request body:', req.body);
    console.log('📎 Files:', req.files);
    
    if (!drawingsCollection) {
      return res.status(500).json({
        success: false,
        error: 'Database not connected yet'
      });
    }

    // التحقق من البيانات المطلوبة
    if (!req.body.drawingNumber || !req.body.drawingName) {
      return res.status(400).json({
        success: false,
        error: 'بيانات ناقصة - رقم المخطط واسم المخطط مطلوبان'
      });
    }

    const drawing = {
      drawingNumber: req.body.drawingNumber,
      drawingName: req.body.drawingName,
      drawingDate: new Date(req.body.drawingDate || Date.now()),
      contractorName: req.body.contractorName || '',
      drawingType: req.body.drawingType || '',
      drawingItem: req.body.drawingItem || '',
      notes: req.body.notes || '',
      createdAt: new Date(),
      lastUpdated: new Date()
    };

    // إضافة مسارات الملفات إذا تم رفعها
    if (req.files) {
      if (req.files.attachment && req.files.attachment[0]) {
        drawing.attachmentPath = `/uploads/${req.files.attachment[0].filename}`;
        drawing.attachmentOriginalName = req.files.attachment[0].originalname;
      }
      if (req.files.pdfAttachment && req.files.pdfAttachment[0]) {
        drawing.pdfAttachmentPath = `/uploads/${req.files.pdfAttachment[0].filename}`;
        drawing.pdfAttachmentOriginalName = req.files.pdfAttachment[0].originalname;
      }
    }

    const result = await drawingsCollection.insertOne(drawing);
    console.log('✅ Drawing created with ID:', result.insertedId);

    res.json({
      success: true,
      message: 'تم إنشاء المخطط بنجاح',
      id: result.insertedId
    });

  } catch (err) {
    console.error('❌ Error creating drawing:', err);
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء المخطط',
      details: err.message
    });
  }
});

// Notifications endpoints to fix 404 errors
app.get('/notifications/:userId', (req, res) => {
  // Return empty notifications for now
  res.json([]);
});

app.get('/notifications/:userId/unread-count', (req, res) => {
  // Return zero unread count for now
  res.json({ count: 0 });
});

console.log('✅ Basic endpoints registered');

// تقديم ملفات الواجهة من فولدر public
app.use(express.static(__dirname));

// تقديم الملفات المرفوعة من مجلد uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes للصفحات الرئيسية
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/drawings.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'drawings.html'));
});

// Railway deployment test endpoint
app.get('/railway-test', (req, res) => {
  res.json({
    status: 'Railway deployment successful!',
    timestamp: new Date().toISOString(),
    version: 'October 30, 2025 - Fixed version',
    endpoints: {
      drawings_get: '/drawings',
      drawings_post: '/drawings',
      test: '/api/test'
    }
  });
});

const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let extractsCollection, contractorsCollection, usersCollection, suppliesCollection, suppliersCollection, purchasesCollection, storeCollection, workersCollection, monthlyPaysCollection, paysCollection, chatsCollection, notificationsCollection, equipmentCollection, contractorIssuesCollection, purchaseReturnsCollection, draftsCollection, externalServicesCollection, receiptsCollection, drawingsCollection, notificationSettingsCollection; // أضف notificationSettingsCollection
// كولكشن بيانات المشروع
let projectDataCollection, contractAddonsCollection, supplyAddonsCollection, lettersCollection, estimatesCollection;

// الاتصال بقاعدة البيانات
async function connectDB() {
  try {
    await client.connect();
    const db = client.db('company_db');
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
    purchaseReturnsCollection = db.collection('purchase_returns'); // إضافة كولكشن مرتجعات المشتريات
    externalServicesCollection = db.collection('external_services'); // كولكشن التعاملات الخارجية
    receiptsCollection = db.collection('receipts'); // كولكشن سندات الاستلام
    drawingsCollection = db.collection('drawings'); // كولكشن الرسومات
    notificationSettingsCollection = db.collection('notification_settings'); // كولكشن إعدادات الإشعارات
    projectDataCollection = db.collection('project_data');
    contractAddonsCollection = db.collection('contract_addons');
    supplyAddonsCollection = db.collection('supply_addons');
    lettersCollection = db.collection('letters');
    estimatesCollection = db.collection('estimates');
    
    console.log("✅ Connected to MongoDB!");
    
    // تحقق من وجود المستخلصات
    const extractsCount = await extractsCollection.countDocuments();
    console.log(`📄 عدد المستخلصات في قاعدة البيانات: ${extractsCount}`);
    
    // تحقق من وجود المخططات
    const drawingsCount = await drawingsCollection.countDocuments();
    console.log(`📐 عدد المخططات في قاعدة البيانات: ${drawingsCount}`);
    
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
    
    // بدء الخادم بعد التأكد من الاتصال بقاعدة البيانات
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🔗 APIs متاحة:`);
      console.log(`   GET  /drawings - جلب المخططات`);
      console.log(`   POST /drawings - إضافة مخطط`);
      console.log(`   GET  /pays - جلب القبض`);
      console.log(`   POST /pays - إضافة قبض`);
      console.log(`   PUT  /pays/reorder - تحديث ترتيب الصفوف`);
      console.log(`   PUT  /pays/:id - تحديث قبض`);
      console.log(`   DELETE /pays/:id - حذف قبض`);
      console.log(`🌐 Database collections initialized: ${drawingsCollection ? '✅' : '❌'} drawings`);
    });
    
  } catch (error) {
    console.error("❌ خطأ في الاتصال بقاعدة البيانات:", error);
    process.exit(1); // إيقاف التطبيق إذا فشل الاتصال بقاعدة البيانات
  }
}

connectDB().catch((error) => {
  console.error("❌ Fatal error starting server:", error);
  process.exit(1);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: drawingsCollection ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'unknown'
  });
});

// Test endpoint for drawings
app.get('/test/drawings', async (req, res) => {
  try {
    const count = await drawingsCollection.countDocuments();
    res.json({
      success: true,
      message: 'Drawings collection accessible',
      count: count,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to access drawings collection',
      details: err.message
    });
  }
});

// Test endpoint for creating drawing without files
app.post('/test/drawings/simple', async (req, res) => {
  try {
    console.log('🧪 Simple drawing test request:', req.body);
    
    if (!drawingsCollection) {
      return res.status(500).json({ 
        success: false,
        error: 'Database not connected'
      });
    }

    const testDrawing = {
      drawingNumber: req.body.drawingNumber || 'TEST-' + Date.now(),
      drawingName: req.body.drawingName || 'Test Drawing',
      drawingDate: new Date(),
      contractorName: req.body.contractorName || 'Test Contractor',
      drawingType: req.body.drawingType || 'معماري',
      drawingItem: req.body.drawingItem || 'test',
      notes: req.body.notes || 'Test drawing - no files',
      createdAt: new Date(),
      lastUpdated: new Date(),
      testMode: true
    };

    const result = await drawingsCollection.insertOne(testDrawing);
    console.log('✅ Test drawing created:', result.insertedId);
    
    res.json({ 
      success: true, 
      message: 'Test drawing created successfully',
      id: result.insertedId
    });
  } catch (err) {
    console.error('❌ Test drawing error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to create test drawing',
      details: err.message
    });
  }
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Express error handler middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler triggered:', err);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('Request body:', req.body);
  
  // Make sure we send JSON response even for multer errors
  if (!res.headersSent) {
    // Set content type to JSON
    res.setHeader('Content-Type', 'application/json');
    
    let errorMessage = 'Internal Server Error';
    let statusCode = 500;
    
    // Handle specific error types
    if (err.code === 'ECONNREFUSED') {
      errorMessage = 'Database connection failed';
    } else if (err.name === 'ValidationError') {
      errorMessage = 'Validation failed';
      statusCode = 400;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      details: err.message || 'Unknown error occurred',
      timestamp: new Date().toISOString(),
      endpoint: `${req.method} ${req.url}`,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    details: `${req.method} ${req.url} not found`
  });
});

// ========= NOTE: API test endpoints moved to top of file =========

// إنشاء مجلد uploads إذا لم يكن موجوداً
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
}

// إعداد multer للحفظ المحلي
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // إنشاء اسم ملف فريد
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    const uniqueName = `${timestamp}_${baseName}${ext}`;
    
    console.log('💾 Saving file as:', uniqueName);
    cb(null, uniqueName);
  }
});

// إعداد multer مع معالجة أخطاء
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB حد أقصى
  },
  fileFilter: (req, file, cb) => {
    console.log('📎 File being uploaded:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // السماح بجميع أنواع الملفات
    cb(null, true);
  }
});

// Test file upload endpoint - بعد تعريف upload
app.post('/test/upload', upload.single('testFile'), (req, res) => {
  try {
    console.log('🧪 Test file upload:', {
      body: req.body,
      file: req.file
    });
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });
  } catch (err) {
    console.error('❌ Test upload error:', err);
    res.status(500).json({
      success: false,
      error: 'Upload failed',
      details: err.message
    });
  }
});

// ========= NOTE: Basic drawings endpoints are at the top of file =========
// This section removed to prevent conflicts

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
    const result = await contractorsCollection.insertOne(contractor);
    res.status(201).json(result);
  } catch (err) {
    console.error('خطأ أثناء إضافة المقاول:', err); // لوج
    res.status(500).json({ error: err.message });
  }
});

app.get('/contractors', async (req, res) => {
  try {
    const { workItem } = req.query;
    let filter = {};
    if (workItem) {
      // دعم البحث في workItems (مصفوفة) أو workItem (نص)
      filter.$or = [
        { workItems: { $elemMatch: { $eq: workItem } } }, // إذا workItems مصفوفة
        { workItem: workItem } // إذا workItem نص
      ];
    }
    const contractors = await contractorsCollection.find(filter).toArray();
    res.json(contractors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب مقاول واحد (يدعم maxTotalPercent ويدعم المواد)
app.get('/contractors/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let contractor;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      contractor = await contractorsCollection.findOne({ _id: new ObjectId(id) });
    } else {
      contractor = await contractorsCollection.findOne({ _id: id });
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




// ============= API العقود =============

// إضافة عقد جديد لمقاول
app.post('/contractors/:id/contracts', upload.single('contractFile'), async (req, res) => {
  try {
    const contractorId = req.params.id;
    console.log('📄 إضافة عقد جديد للمقاول:', contractorId);
    console.log('📋 بيانات العقد:', req.body);
    
    // بناء كائن العقد
    const contract = {
      _id: new ObjectId(),
      contractNumber: req.body.contractNumber,
      contractDate: req.body.contractDate,
      contractType: req.body.contractType,
      workItem: req.body.workItem,
      contractValue: parseFloat(req.body.contractValue) || 0,
      executionDuration: parseInt(req.body.executionDuration) || 0,
      notes: req.body.notes || '',
      createdAt: new Date()
    };
    
    // إضافة رابط الملف إذا تم رفعه
    if (req.file) {
      contract.contractFile = req.file.path; // Cloudinary path
      contract.contractFileName = req.file.originalname;
    }
    
    // إضافة العقد للمقاول
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      result = await contractorsCollection.updateOne(
        { _id: new ObjectId(contractorId) },
        { $push: { contracts: contract } }
      );
    } else {
      result = await contractorsCollection.updateOne(
        { _id: contractorId },
        { $push: { contracts: contract } }
      );
    }
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'المقاول غير موجود' });
    }
    
    console.log('✅ تم إضافة العقد بنجاح');
    res.json({ success: true, contract });
  } catch (err) {
    console.error('❌ خطأ في إضافة العقد:', err);
    res.status(500).json({ error: err.message });
  }
});

// جلب جميع عقود مقاول
app.get('/contractors/:id/contracts', async (req, res) => {
  try {
    const contractorId = req.params.id;
    let contractor;
    
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      contractor = await contractorsCollection.findOne({ _id: new ObjectId(contractorId) });
    } else {
      contractor = await contractorsCollection.findOne({ _id: contractorId });
    }
    
    if (!contractor) {
      return res.status(404).json({ error: 'المقاول غير موجود' });
    }
    
    res.json(contractor.contracts || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف عقد
app.delete('/contractors/:id/contracts/:contractId', async (req, res) => {
  try {
    const contractorId = req.params.id;
    const contractId = req.params.contractId;
    
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      result = await contractorsCollection.updateOne(
        { _id: new ObjectId(contractorId) },
        { $pull: { contracts: { _id: new ObjectId(contractId) } } }
      );
    } else {
      result = await contractorsCollection.updateOne(
        { _id: contractorId },
        { $pull: { contracts: { _id: contractId } } }
      );
    }
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'المقاول غير موجود' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل عقد
app.put('/contractors/:id/contracts/:contractId', upload.single('contractFile'), async (req, res) => {
  try {
    const contractorId = req.params.id;
    const contractId = req.params.contractId;
    
    // بناء التحديثات
    const updates = {
      'contracts.$.contractNumber': req.body.contractNumber,
      'contracts.$.contractDate': req.body.contractDate,
      'contracts.$.contractType': req.body.contractType,
      'contracts.$.workItem': req.body.workItem,
      'contracts.$.contractValue': parseFloat(req.body.contractValue) || 0,
      'contracts.$.executionDuration': parseInt(req.body.executionDuration) || 0,
      'contracts.$.notes': req.body.notes || '',
      'contracts.$.updatedAt': new Date()
    };
    
    if (req.file) {
      updates['contracts.$.contractFile'] = req.file.path;
      updates['contracts.$.contractFileName'] = req.file.originalname;
    }
    
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(contractorId)) {
      result = await contractorsCollection.updateOne(
        { 
          _id: new ObjectId(contractorId),
          'contracts._id': new ObjectId(contractId)
        },
        { $set: updates }
      );
    } else {
      result = await contractorsCollection.updateOne(
        { 
          _id: contractorId,
          'contracts._id': contractId
        },
        { $set: updates }
      );
    }
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'المقاول أو العقد غير موجود' });
    }
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============= نهاية API العقود =============




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
    const contractors = await contractorsCollection.find({}).toArray();
    const uniqueWorkItems = new Set();
    
    contractors.forEach(contractor => {
      if (contractor.workItem && contractor.workItem.trim()) {
        uniqueWorkItems.add(contractor.workItem.trim());
      }
    });
    
    const workItemsArray = Array.from(uniqueWorkItems).sort();
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
    const result = await extractsCollection.insertOne(extract);

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
    console.log('جلب جميع المستخلصات...');
    const extracts = await extractsCollection.find({}).toArray();
    console.log(`تم جلب ${extracts.length} مستخلص`);
    
    const users = await usersCollection.find({}).toArray();
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
    const user = req.body;
    // يمكنك هنا التحقق من عدم تكرار الإيميل أو اسم المستخدم إذا أردت
    const result = await usersCollection.insertOne(user);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب جميع المستخدمين
app.get('/users', async (req, res) => {
  try {
    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (err) {
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

// تسجيل الدخول
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await usersCollection.findOne({ email, password });
    if (user) {
      // أرسل كل بيانات المستخدم مع تحويل _id لنص
      res.json({ success: true, user: { ...user, _id: user._id.toString() } });
    } else {
      res.json({ success: false, message: 'الإيميل أو كلمة المرور غير صحيحة' });
    }
  } catch (err) {
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
    // إضافة حقل issued للتوريدات (يبدأ بصفر)
    supply.issued = 0;
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
      supplyId: result.insertedId // ربط بالتوريد الأصلي
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
    const supplies = await suppliesCollection.find({}).toArray();
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
    const result = await suppliersCollection.insertOne(supplier);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب جميع الموردين
app.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await suppliersCollection.find({}).toArray();
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
    // إضافة حقل issued للمشتريات (يبدأ بصفر)
    purchase.issued = 0;
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
      purchaseId: result.insertedId // ربط بالشراء الأصلي
    });

    res.status(201).json({ ...result, insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/purchases', async (req, res) => {
  try {
    const purchases = await purchasesCollection.find({}).toArray();
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
    // جلب جميع العمليات من كولكشن المخزن
    const storeRecords = await storeCollection.find({}).sort({ date: -1 }).toArray();
    
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
    // جلب كل التوريدات
    const supplies = await suppliesCollection.find({}).toArray();
    // جلب كل المشتريات
    const purchases = await purchasesCollection.find({}).toArray();
    // جلب عمليات الصرف لتتبع آخر عملية
    const storeOperations = await storeCollection.find({}).toArray();

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
    const result = await workersCollection.insertOne(worker);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/workers', async (req, res) => {
  try {
    const workers = await workersCollection.find({}).toArray();
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
    console.log('📦 جلب جميع المعدات...');
    const equipments = await equipmentCollection.find({}).sort({ rentDate: -1 }).toArray();
    console.log(`✅ تم جلب ${equipments.length} معدة`);
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
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
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

// ==================== Notification Settings API ====================

// حفظ إعدادات الإشعارات
app.post('/notification-settings', async (req, res) => {
  try {
    if (!notificationSettingsCollection) {
      return res.status(503).json({ error: 'قاعدة البيانات غير متصلة بعد' });
    }
    
    const { settings } = req.body;
    
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'بيانات غير صحيحة' });
    }
    
    // حفظ أو تحديث الإعدادات (نستخدم upsert)
    await notificationSettingsCollection.updateOne(
      { _id: 'global_settings' },
      { $set: { settings, updatedAt: new Date() } },
      { upsert: true }
    );
    
    res.json({ success: true, message: 'تم حفظ الإعدادات بنجاح' });
  } catch (err) {
    console.error('خطأ في حفظ إعدادات الإشعارات:', err);
    res.status(500).json({ error: 'فشل في حفظ الإعدادات: ' + err.message });
  }
});

// جلب إعدادات الإشعارات
app.get('/notification-settings', async (req, res) => {
  try {
    // التأكد من أن MongoDB متصل
    if (!notificationSettingsCollection) {
      const db = client.db('company_db');
      notificationSettingsCollection = db.collection('notification_settings');
    }
    
    const settingsDoc = await notificationSettingsCollection.findOne({ _id: 'global_settings' });
    
    if (!settingsDoc) {
      // إعدادات افتراضية
      return res.json({ settings: {} });
    }
    
    res.json({ settings: settingsDoc.settings || {} });
  } catch (err) {
    console.error('خطأ في جلب إعدادات الإشعارات:', err);
    res.status(500).json({ error: 'فشل في جلب الإعدادات: ' + err.message });
  }
});

// ==================== End Notification Settings API ====================

// Global Error Handler - يجب أن يكون قبل app.listen
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(500).json({ 
    error: 'حدث خطأ في السيرفر',
    message: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
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
    const { month } = req.query;
    let filter = {};
    if (month) {
      filter.month = month;
      // استبعاد المسودات من البيانات المحفوظة
      filter.$or = [
        { isDraft: { $exists: false } },
        { isDraft: false }
      ];
    }
    
    console.log('جلب البيانات للشهر:', month);
    
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

// API لحفظ المسودة
app.post('/pays/draft', async (req, res) => {
  try {
    const { month, monthName, rows, savedAt } = req.body;
    
    console.log('📝 طلب حفظ مسودة:', { month, monthName, rowsCount: rows?.length });
    
    if (!month || !rows || !Array.isArray(rows)) {
      console.error('❌ بيانات غير صحيحة:', { month, rows: rows?.length });
      return res.status(400).json({ error: 'بيانات غير صحيحة' });
    }
    
    // حفظ كل صف من المسودة
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      console.log(`  - معالجة صف ${i}:`, { workerId: row.workerId, type: row.type, _id: row._id });
      
      const rowData = {
        ...row,
        month,
        order: i,
        isDraft: true,
        updatedAt: new Date()
      };
      
      if (row._id) {
        // تحديث صف موجود
        const result = await paysCollection.updateOne(
          { _id: new ObjectId(row._id) },
          { $set: rowData }
        );
        console.log(`    ✓ تم تحديث الصف:`, result.modifiedCount);
      } else {
        // إضافة صف جديد
        const result = await paysCollection.insertOne(rowData);
        console.log(`    ✓ تم إضافة الصف:`, result.insertedId);
      }
    }
    
    console.log('✅ تم حفظ المسودة بنجاح');
    res.json({ success: true, message: 'تم حفظ المسودة بنجاح' });
  } catch (err) {
    console.error('❌ خطأ في حفظ المسودة:', err.message);
    console.error('   التفاصيل:', err);
    res.status(500).json({ error: 'فشل في حفظ المسودة: ' + err.message });
  }
});

// API لجلب المسودة
app.get('/pays/draft/:month', async (req, res) => {
  try {
    const month = req.params.month;
    const drafts = await paysCollection.find({ 
      month: month, 
      isDraft: true
    }).sort({ order: 1 }).toArray();
    
    if (drafts && drafts.length > 0) {
      res.json({ rows: drafts });
    } else {
      res.status(404).json({ error: 'لا توجد مسودة محفوظة' });
    }
  } catch (err) {
    console.error('خطأ في جلب المسودة:', err);
    res.status(500).json({ error: 'فشل في جلب المسودة' });
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
        { month: pay.month },
        { sort: { order: -1 } }
      );
      pay.order = lastPay && lastPay.order !== undefined ? lastPay.order + 1 : 0;
    }
    
    const result = await paysCollection.insertOne(pay);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف كل القبوضات لشهر معين - يجب أن يأتي قبل /pays/:id
app.delete('/pays/delete-month/:month', async (req, res) => {
  try {
    const month = decodeURIComponent(req.params.month);
    console.log('طلب حذف بيانات الشهر:', month);
    const result = await paysCollection.deleteMany({ month: month });
    console.log(`تم حذف ${result.deletedCount} صف للشهر ${month}`);
    res.json({ 
      message: 'تم حذف البيانات بنجاح', 
      deletedCount: result.deletedCount 
    });
  } catch (err) {
    console.error('خطأ في حذف بيانات الشهر:', err);
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
    const rows = await storeCollection.find({}).toArray();
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
app.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع أي ملف' });
    }
    res.json({ 
      success: true,
      url: req.file.path, 
      filename: req.file.filename,
      name: req.file.originalname 
    });
  } catch (error) {
    console.error('خطأ في رفع الملف:', error);
    res.status(500).json({ error: error.message });
  }
});

// API المعدات
app.post('/equipment', async (req, res) => {
  try {
    const equipment = req.body;
    const result = await equipmentCollection.insertOne(equipment);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/equipment', async (req, res) => {
  try {
    const equipment = await equipmentCollection.find({}).toArray();
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/equipment/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await equipmentCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await equipmentCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المعدة' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/equipment/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await equipmentCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: req.body }
      );
    } else {
      result = await equipmentCollection.updateOne(
        { _id: id },
        { $set: req.body }
      );
    }
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المعدة' });
    }
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

// API لجلب الأعمال المسحوبة للمقاول
app.get('/contractors/:contractorId/pulled-works', async (req, res) => {
  try {
    const contractorId = req.params.contractorId;
    
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
    
    // جلب جميع المستخلصات للمقاول
    const extracts = await extractsCollection.find({ contractor: contractorObjectId }).toArray();
    
    // استخراج الأعمال المسحوبة من جميع المستخلصات
    const pulledWorks = [];
    extracts.forEach(extract => {
      if (extract.workItems && Array.isArray(extract.workItems)) {
        extract.workItems.forEach(work => {
          if (work.isPulledWork || work.pulledFromContractorId) {
            pulledWorks.push({
              ...work,
              extractNumber: extract.number,
              extractDate: extract.date
            });
          }
        });
      }
    });
    
    res.json(pulledWorks);
  } catch (error) {
    console.error('خطأ في جلب الأعمال المسحوبة:', error);
    res.status(500).json({ error: 'فشل في جلب الأعمال المسحوبة' });
  }
});

// API جديد لإضافة أعمال مسحوبة للمقاول الجديد
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
    const services = await externalServicesCollection.find({}).sort({ serviceDate: -1 }).toArray();
    console.log(`✅ Fetched ${services.length} external services`);
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
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await externalServicesCollection.insertOne(serviceData);
    console.log(`✅ Added new external service: ${serviceData.supplierName}`);
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
    const receipts = await receiptsCollection.find({}).sort({ receiptDate: -1 }).toArray();
    console.log(`✅ Fetched ${receipts.length} receipts`);
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
      contractorId,
      serviceDescription,
      amount,
      amountInWords,
      notes
    } = req.body;

    const receiptData = {
      receiptNumber,
      receiptDate,
      receiverName,
      contractorId: contractorId || null,
      serviceDescription,
      amount: parseFloat(amount) || 0,
      amountInWords: amountInWords || '',
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await receiptsCollection.insertOne(receiptData);
    console.log(`✅ Added new receipt: ${receiptData.receiptNumber}`, contractorId ? `for contractor: ${contractorId}` : '');
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
      contractorId,
      serviceDescription,
      amount,
      amountInWords,
      notes
    } = req.body;

    const updateData = {
      receiptNumber,
      receiptDate,
      receiverName,
      contractorId: contractorId || null,
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

// ========= ملاحظة: تم نقل Drawings API إلى أعلى الملف بعد connectDB() مباشرة =========

// ==================== Notifications API ====================

// إنشاء إشعار جديد
app.post('/notifications', async (req, res) => {
  try {
    const { 
      type,           // نوع العملية: 'extract-add', 'contractor-edit', 'pay-delete', etc
      userId,         // معرف المستخدم المستهدف (أو 'all' للجميع)
      message,        // نص الإشعار
      sourcePage,     // الصفحة المصدر: 'extracts', 'contractors', etc
      sourceId,       // معرف العنصر المرتبط
      performedBy     // من قام بالعملية
    } = req.body;
    
    const notification = {
      type,
      userId,
      message,
      sourcePage,
      sourceId,
      performedBy,
      isRead: false,
      createdAt: new Date()
    };
    
    const result = await notificationsCollection.insertOne(notification);
    
    res.json({ 
      success: true, 
      notificationId: result.insertedId,
      message: 'تم إنشاء الإشعار بنجاح'
    });
  } catch (err) {
    console.error('خطأ في إنشاء الإشعار:', err);
    res.status(500).json({ error: 'فشل في إنشاء الإشعار: ' + err.message });
  }
});

// جلب إشعارات مستخدم معين
app.get('/notifications/:userId', async (req, res) => {
  try {
    // التأكد من أن MongoDB متصل
    if (!notificationsCollection) {
      const db = client.db('company_db');
      notificationsCollection = db.collection('notifications');
    }
    
    // فك تشفير الـ userId في حالة وجود أحرف خاصة
    const userId = decodeURIComponent(req.params.userId);
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unreadOnly === 'true';
    console.log('📬 طلب جلب إشعارات للمستخدم:', userId);
    
    const query = {
      $or: [
        { userId: userId },
        { userId: 'all' }
      ]
    };
    
    if (unreadOnly) {
      query.isRead = false;
    }
    
    const notifications = await notificationsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();
    
    res.json(notifications);
  } catch (err) {
    console.error('خطأ في جلب الإشعارات:', err);
    res.status(500).json({ error: 'فشل في جلب الإشعارات: ' + err.message });
  }
});

// عدد الإشعارات غير المقروءة
app.get('/notifications/:userId/unread-count', async (req, res) => {
  try {
    // التأكد من أن MongoDB متصل
    if (!notificationsCollection) {
      const db = client.db('company_db');
      notificationsCollection = db.collection('notifications');
    }
    
    // فك تشفير الـ userId في حالة وجود أحرف خاصة
    const userId = decodeURIComponent(req.params.userId);
    console.log('📊 طلب عد الإشعارات للمستخدم:', userId);
    
    const count = await notificationsCollection.countDocuments({
      $or: [
        { userId: userId },
        { userId: 'all' }
      ],
      isRead: false
    });
    
    res.json({ count });
  } catch (err) {
    console.error('خطأ في عد الإشعارات:', err);
    res.status(500).json({ error: 'فشل في عد الإشعارات: ' + err.message });
  }
});

// تعليم إشعار كمقروء
app.put('/notifications/:id/read', async (req, res) => {
  try {
    const id = req.params.id;
    
    const result = await notificationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isRead: true, readAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }
    
    res.json({ success: true, message: 'تم تعليم الإشعار كمقروء' });
  } catch (err) {
    console.error('خطأ في تحديث الإشعار:', err);
    res.status(500).json({ error: 'فشل في تحديث الإشعار: ' + err.message });
  }
});

// تعليم كل إشعارات مستخدم كمقروءة
app.put('/notifications/:userId/read-all', async (req, res) => {
  try {
    // فك تشفير الـ userId في حالة وجود أحرف خاصة
    const userId = decodeURIComponent(req.params.userId);
    console.log('✅ تعليم كل الإشعارات كمقروءة للمستخدم:', userId);
    
    const result = await notificationsCollection.updateMany(
      {
        $or: [
          { userId: userId },
          { userId: 'all' }
        ],
        isRead: false
      },
      { $set: { isRead: true, readAt: new Date() } }
    );
    
    res.json({ 
      success: true, 
      modifiedCount: result.modifiedCount,
      message: 'تم تعليم جميع الإشعارات كمقروءة'
    });
  } catch (err) {
    console.error('خطأ في تحديث الإشعارات:', err);
    res.status(500).json({ error: 'فشل في تحديث الإشعارات: ' + err.message });
  }
});

// حذف إشعار
app.delete('/notifications/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const result = await notificationsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }
    
    res.json({ success: true, message: 'تم حذف الإشعار بنجاح' });
  } catch (err) {
    console.error('خطأ في حذف الإشعار:', err);
    res.status(500).json({ error: 'فشل في حذف الإشعار: ' + err.message });
  }
});

// حذف كل الإشعارات المقروءة لمستخدم
app.delete('/notifications/:userId/clear-read', async (req, res) => {
  try {
    // فك تشفير الـ userId في حالة وجود أحرف خاصة
    const userId = decodeURIComponent(req.params.userId);
    console.log('🗑️ حذف الإشعارات المقروءة للمستخدم:', userId);
    
    const result = await notificationsCollection.deleteMany({
      $or: [
        { userId: userId },
        { userId: 'all' }
      ],
      isRead: true
    });
    
    res.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: 'تم حذف الإشعارات المقروءة بنجاح'
    });
  } catch (err) {
    console.error('خطأ في حذف الإشعارات:', err);
    res.status(500).json({ error: 'فشل في حذف الإشعارات: ' + err.message });
  }
});

// ==================== End Notifications API ====================

// ==================== Backup & Restore APIs ====================

// إنشاء نسخة احتياطية يدوية
app.post('/backup/create', async (req, res) => {
  try {
    console.log('🔄 إنشاء نسخة احتياطية...');
    
    const backupData = {
      date: new Date(),
      type: req.body.type || 'manual',
      user: req.body.userId || 'system',
      data: {
        extracts: await extractsCollection.find({}).toArray(),
        contractors: await contractorsCollection.find({}).toArray(),
        users: await usersCollection.find({}).toArray(),
        workers: await workersCollection.find({}).toArray(),
        store: await storeCollection.find({}).toArray(),
        equipment: await equipmentCollection.find({}).toArray(),
        suppliers: await suppliersCollection.find({}).toArray(),
        supplies: await suppliesCollection.find({}).toArray(),
        purchases: await purchasesCollection.find({}).toArray(),
        monthlyPays: await monthlyPaysCollection.find({}).toArray(),
        pays: await paysCollection.find({}).toArray(),
        notifications: await notificationsCollection.find({}).toArray(),
        receipts: await receiptsCollection.find({}).toArray(),
        drawings: await drawingsCollection.find({}).toArray(),
        externalServices: await externalServicesCollection.find({}).toArray(),
        projectData: await projectDataCollection.find({}).toArray()
      }
    };
    
    // حساب حجم النسخة
    const backupSize = JSON.stringify(backupData).length;
    
    // حفظ معلومات النسخة في collection خاص
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('backups');
    }
    
    const backupInfo = {
      date: backupData.date,
      type: backupData.type,
      user: backupData.user,
      size: backupSize,
      createdAt: new Date()
    };
    
    const result = await draftsCollection.insertOne(backupInfo);
    backupInfo.id = result.insertedId.toString();
    
    console.log('✅ تم إنشاء نسخة احتياطية بنجاح - الحجم:', (backupSize / 1024).toFixed(2), 'KB');
    
    res.json({ 
      success: true, 
      backup: backupData,
      info: backupInfo,
      message: 'تم إنشاء النسخة الاحتياطية بنجاح'
    });
    
  } catch (err) {
    console.error('❌ خطأ في إنشاء النسخة الاحتياطية:', err);
    res.status(500).json({ error: 'فشل في إنشاء النسخة الاحتياطية: ' + err.message });
  }
});

// استعادة من نسخة احتياطية
app.post('/backup/restore', async (req, res) => {
  try {
    console.log('🔄 استعادة البيانات من نسخة احتياطية...');
    
    const backup = req.body.backup;
    
    if (!backup || !backup.data) {
      return res.status(400).json({ error: 'بيانات النسخة الاحتياطية غير صحيحة' });
    }
    
    // استعادة البيانات لكل collection
    const collections = {
      extracts: extractsCollection,
      contractors: contractorsCollection,
      users: usersCollection,
      workers: workersCollection,
      store: storeCollection,
      equipment: equipmentCollection,
      suppliers: suppliersCollection,
      supplies: suppliesCollection,
      purchases: purchasesCollection,
      monthlyPays: monthlyPaysCollection,
      pays: paysCollection,
      notifications: notificationsCollection,
      receipts: receiptsCollection,
      drawings: drawingsCollection,
      externalServices: externalServicesCollection,
      projectData: projectDataCollection
    };
    
    for (const [key, collection] of Object.entries(collections)) {
      if (backup.data[key] && backup.data[key].length > 0 && collection) {
        // حذف البيانات القديمة
        await collection.deleteMany({});
        // إدراج البيانات الجديدة
        await collection.insertMany(backup.data[key]);
        console.log(`✅ تم استعادة ${backup.data[key].length} سجل من ${key}`);
      }
    }
    
    console.log('✅ تم استعادة جميع البيانات بنجاح');
    
    res.json({ 
      success: true, 
      message: 'تم استعادة البيانات بنجاح'
    });
    
  } catch (err) {
    console.error('❌ خطأ في استعادة البيانات:', err);
    res.status(500).json({ error: 'فشل في استعادة البيانات: ' + err.message });
  }
});

// جلب سجل النسخ الاحتياطية
app.get('/backup/history', async (req, res) => {
  try {
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('backups');
    }
    
    const backups = await draftsCollection.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    
    const history = backups.map(b => ({
      id: b._id.toString(),
      date: b.date || b.createdAt,
      type: b.type || 'manual',
      user: b.user || 'system',
      size: b.size || 0
    }));
    
    res.json(history);
    
  } catch (err) {
    console.error('خطأ في جلب السجل:', err);
    res.status(500).json({ error: err.message });
  }
});

// تنزيل نسخة احتياطية محددة
app.get('/backup/download/:id', async (req, res) => {
  try {
    // في الوقع، ستحتاج لتخزين النسخ الكاملة
    // هنا سنقوم بإنشاء نسخة جديدة
    const backupData = {
      date: new Date(),
      data: {
        extracts: await extractsCollection.find({}).toArray(),
        contractors: await contractorsCollection.find({}).toArray(),
        users: await usersCollection.find({}).toArray(),
        workers: await workersCollection.find({}).toArray(),
        store: await storeCollection.find({}).toArray(),
        equipment: await equipmentCollection.find({}).toArray()
      }
    };
    
    res.json(backupData);
    
  } catch (err) {
    console.error('خطأ في التنزيل:', err);
    res.status(500).json({ error: err.message });
  }
});

// حذف نسخة احتياطية
app.delete('/backup/delete/:id', async (req, res) => {
  try {
    if (!draftsCollection) {
      const db = client.db('company_db');
      draftsCollection = db.collection('backups');
    }
    
    const result = await draftsCollection.deleteOne({ 
      _id: new ObjectId(req.params.id) 
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'النسخة الاحتياطية غير موجودة' });
    }
    
    res.json({ success: true, message: 'تم حذف النسخة الاحتياطية' });
    
  } catch (err) {
    console.error('خطأ في الحذف:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== End Backup APIs ====================

// 404 handler - يجب أن يكون في النهاية
app.use('*', (req, res) => {
  // إذا كان الطلب لملف HTML موجود، أرسله
  const requestedFile = req.originalUrl.split('?')[0];
  const filePath = path.join(__dirname, requestedFile);
  
  if (fs.existsSync(filePath) && requestedFile.endsWith('.html')) {
    return res.sendFile(filePath);
  }
  
  // إذا لم يكن موجود، أرسل الصفحة الرئيسية للـ SPA
  res.sendFile(path.join(__dirname, 'index.html'));
});

