const express = require('express');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Taskon Server...');
console.log('📅 Deploy Date:', new Date().toISOString());
console.log('🔧 Version: External Services Fix - October 30, 2025');

const app = express();
const PORT = process.env.PORT || 4000;

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Created uploads directory:', uploadsDir);
} else {
  console.log('📁 Uploads directory exists:', uploadsDir);
}

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, `${timestamp}-${originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    console.log('📎 File being uploaded:', {
      originalname: file.originalname,
      mimetype: file.mimetype
    });
    cb(null, true);
  }
});

// Serve static files
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadsDir));

// MongoDB connection
const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
let db = null;
let drawingsCollection = null;
let externalServicesCollection = null;
let dailyReportsCollection = null;
let usersCollection = null;
let contractorsCollection = null;

MongoClient.connect(uri)
  .then(client => {
    console.log('✅ Connected to MongoDB!');
    db = client.db('taskon');
    drawingsCollection = db.collection('drawings');
    externalServicesCollection = db.collection('external-services');
    dailyReportsCollection = db.collection('daily_reports');
    usersCollection = db.collection('users');
    contractorsCollection = db.collection('contractors');
    console.log('🌐 Database collections initialized:', {
      drawings: !!drawingsCollection,
      externalServices: !!externalServicesCollection,
      dailyReports: !!dailyReportsCollection,
      users: !!usersCollection,
      contractors: !!contractorsCollection
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Basic test endpoints
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'External Services Server WORKING!',
    timestamp: new Date().toISOString(),
    version: 'EXTERNAL SERVICES FIX - October 30, 2025',
    status: 'Server is running correctly'
  });
});

app.get('/status', (req, res) => {
  res.json({
    server: 'online',
    time: new Date().toLocaleString(),
    uptime: process.uptime(),
    version: 'External Services Update',
    collections: {
      drawings: !!drawingsCollection,
      externalServices: !!externalServicesCollection
    }
  });
});

// External Services API endpoints
app.get('/external-services', async (req, res) => {
  try {
    console.log('🔍 GET /external-services called');
    if (!externalServicesCollection) {
      console.log('🔄 External services collection not initialized yet');
      return res.json([]);
    }
    
    const services = await externalServicesCollection.find({}).sort({ serviceDate: -1 }).toArray();
    console.log('✅ Found external services:', services.length);
    res.json(services);
  } catch (error) {
    console.error('❌ Error fetching external services:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/external-services', upload.single('attachment'), async (req, res) => {
  try {
    console.log('📝 POST /external-services called');
    console.log('📄 Request body:', req.body);
    console.log('📎 File:', req.file);
    
    if (!externalServicesCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const {
      supplierName,
      serviceType,
      serviceDate,
      amount,
      paymentMethod,
      receiverName,
      description,
      notes
    } = req.body;
    
    const newService = {
      supplierName,
      serviceType,
      serviceDate,
      amount: parseFloat(amount),
      paymentMethod,
      receiverName: receiverName || '',
      description,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Handle file upload
    if (req.file) {
      newService.attachment = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
      console.log('📎 File attached:', newService.attachment);
    }
    
    const result = await externalServicesCollection.insertOne(newService);
    console.log('✅ External service added with ID:', result.insertedId);
    
    res.json({
      success: true,
      insertedId: result.insertedId,
      service: newService,
      message: 'Service added successfully'
    });
  } catch (error) {
    console.error('❌ Error adding external service:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/external-services/:id', upload.single('attachment'), async (req, res) => {
  try {
    console.log('🔄 PUT /external-services called for ID:', req.params.id);
    
    if (!externalServicesCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { ObjectId } = require('mongodb');
    const serviceId = new ObjectId(req.params.id);
    
    const {
      supplierName,
      serviceType,
      serviceDate,
      amount,
      paymentMethod,
      receiverName,
      description,
      notes
    } = req.body;
    
    const updateData = {
      supplierName,
      serviceType,
      serviceDate,
      amount: parseFloat(amount),
      paymentMethod,
      receiverName: receiverName || '',
      description,
      notes: notes || '',
      updatedAt: new Date()
    };
    
    // Handle file upload
    if (req.file) {
      updateData.attachment = {
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        size: req.file.size,
        mimetype: req.file.mimetype
      };
      console.log('📎 New file attached:', updateData.attachment);
    }
    
    const result = await externalServicesCollection.updateOne(
      { _id: serviceId },
      { $set: updateData }
    );
    
    console.log('✅ Service updated, modified count:', result.modifiedCount);
    
    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating external service:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/external-services/:id', async (req, res) => {
  try {
    console.log('🗑️ DELETE /external-services called for ID:', req.params.id);
    
    if (!externalServicesCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { ObjectId } = require('mongodb');
    const serviceId = new ObjectId(req.params.id);
    
    const result = await externalServicesCollection.deleteOne({ _id: serviceId });
    console.log('✅ Service deleted, deleted count:', result.deletedCount);
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting external service:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export external services to Excel
app.get('/external-services/export', async (req, res) => {
  try {
    console.log('📊 Export external services requested');
    
    if (!externalServicesCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const services = await externalServicesCollection.find({}).sort({ serviceDate: -1 }).toArray();
    console.log('📊 Exporting', services.length, 'services');
    
    // Create Excel data
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const excelData = services.map(service => ({
      'التاريخ': new Date(service.serviceDate).toLocaleDateString('ar-EG'),
      'اسم الجهة': service.supplierName,
      'نوع الخدمة': service.serviceType,
      'القيمة': service.amount,
      'طريقة الدفع': service.paymentMethod,
      'المستلم': service.receiverName || '',
      'الوصف': service.description,
      'ملاحظات': service.notes || '',
      'مرفق': service.attachment ? service.attachment.originalname : 'لا يوجد',
      'تاريخ الإضافة': new Date(service.createdAt).toLocaleDateString('ar-EG')
    }));
    
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'التعاملات الخارجية');
    
    // Generate Excel file
    const filename = `external-services-${Date.now()}.xlsx`;
    const filepath = path.join(uploadsDir, filename);
    XLSX.writeFile(wb, filepath);
    
    // Send file
    res.download(filepath, `التعاملات_الخارجية_${new Date().toISOString().split('T')[0]}.xlsx`, (err) => {
      if (err) {
        console.error('Error sending file:', err);
      }
      // Clean up temporary file
      fs.unlink(filepath, () => {});
    });
  } catch (error) {
    console.error('❌ Error exporting external services:', error);
    res.status(500).json({ error: error.message });
  }
});
    // ================================
    // DAILY REPORTS API ENDPOINTS
    // ================================

    app.get('/daily-reports', async (req, res) => {
      try {
        if (!dailyReportsCollection) return res.json([]);
        const docs = await dailyReportsCollection.find({}).sort({ date: -1 }).toArray();
        res.json(docs);
      } catch (err) {
        console.error('Error fetching daily reports:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/daily-reports', upload.any(), async (req, res) => {
      try {
        if (!dailyReportsCollection) return res.status(500).json({ error: 'DB not ready' });
        
        // Handle both JSON and multipart/form-data
        let workItems, equipmentData, date, title, reportNumber;
        
        if (req.is('application/json')) {
          // Simple JSON request (no files)
          const body = req.body;
          date = body.date;
          title = body.title;
          reportNumber = body.reportNumber;
          workItems = body.workItems || [];
          equipmentData = body.equipment || {};
        } else {
          // Multipart form data (with files)
          date = req.body.date;
          title = req.body.title;
          reportNumber = req.body.reportNumber;
          const workItemsMeta = JSON.parse(req.body.workItems || '[]');
          const files = req.files || [];
          
          workItems = workItemsMeta.map((m) => ({ 
            building: m.building || '', 
            desc: m.desc || '', 
            photos: [],
            addedBy: m.addedBy || 'غير محدد',
            addedAt: new Date().toISOString()
          }));
          
          files.forEach(f => {
            const m = f.fieldname.match(/^photos_(\d+)_/);
            if (m) {
              const idx = parseInt(m[1], 10);
              workItems[idx] = workItems[idx] || { building: '', desc: '', photos: [], addedBy: 'غير محدد', addedAt: new Date().toISOString() };
              workItems[idx].photos.push({ filename: f.filename, originalname: f.originalname, path: `/uploads/${f.filename}`, size: f.size });
            }
          });
          
          equipmentData = req.body.equipment ? JSON.parse(req.body.equipment) : {};
        }
        
        const doc = { 
          date: date || new Date().toISOString(), 
          title: title || '', 
          reportNumber: reportNumber || '',
          equipment: equipmentData,
          workItems, 
          photoCount: (workItems.reduce((sum, item) => sum + (item.photos?.length || 0), 0)), 
          createdAt: new Date(), 
          updatedAt: new Date() 
        };
        const result = await dailyReportsCollection.insertOne(doc);
        res.json({ success: true, insertedId: result.insertedId });
      } catch (err) {
        console.error('Error creating daily report:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.get('/daily-reports/:id', async (req, res) => {
      try {
        const { ObjectId } = require('mongodb');
        const id = new ObjectId(req.params.id);
        const doc = await dailyReportsCollection.findOne({ _id: id });
        if (!doc) return res.status(404).json({ error: 'Not found' });
        res.json(doc);
      } catch (err) {
        console.error('Error fetching report:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.put('/daily-reports/:id', upload.any(), async (req, res) => {
      try {
        const { ObjectId } = require('mongodb');
        const id = new ObjectId(req.params.id);
        const existing = await dailyReportsCollection.findOne({ _id: id });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        const workItemsMeta = JSON.parse(req.body.workItems || '[]');
        const files = req.files || [];
        const workItems = workItemsMeta.map((m, idx) => ({ 
          building: m.building || '', 
          desc: m.desc || '', 
          addedBy: m.addedBy || 'غير محدد',
          addedAt: m.addedAt || new Date().toISOString(),
          photos: (existing.workItems && existing.workItems[idx] && existing.workItems[idx].photos) ? existing.workItems[idx].photos.slice() : [] 
        }));
        files.forEach(f => {
          const m = f.fieldname.match(/^photos_(\d+)_/);
          if (m) {
            const idx = parseInt(m[1], 10);
            workItems[idx] = workItems[idx] || { building: '', desc: '', addedBy: 'غير محدد', photos: [] };
            workItems[idx].photos.push({ filename: f.filename, originalname: f.originalname, path: `/uploads/${f.filename}`, size: f.size });
          }
        });
        const photoCount = files.length + (existing.photoCount || 0);
        const equipmentData = req.body.equipment ? JSON.parse(req.body.equipment) : (existing.equipment || {});
        const update = { 
          workItems, 
          photoCount, 
          equipment: equipmentData,
          updatedAt: new Date(), 
          title: req.body.title || existing.title, 
          date: req.body.date || existing.date,
          reportNumber: req.body.reportNumber || existing.reportNumber
        };
        await dailyReportsCollection.updateOne({ _id: id }, { $set: update });
        const updated = await dailyReportsCollection.findOne({ _id: id });
        res.json(updated);
      } catch (err) {
        console.error('Error updating report:', err);
        res.status(500).json({ error: err.message });
      }
    });

    app.delete('/daily-reports/:id', async (req, res) => {
      try {
        const { ObjectId } = require('mongodb');
        const id = new ObjectId(req.params.id);
        const result = await dailyReportsCollection.deleteOne({ _id: id });
        res.json({ success: true, deletedCount: result.deletedCount });
      } catch (err) {
        console.error('Error deleting report:', err);
        res.status(500).json({ error: err.message });
      }
    });

    // File serving endpoint
    app.get('/uploads/:filename', (req, res) => {
      const filename = req.params.filename;
      const filePath = path.join(uploadsDir, filename);
  
      console.log('🔍 Trying to serve file:', filePath);
  
      if (fs.existsSync(filePath)) {
        console.log('✅ File found, serving:', filename);
        res.sendFile(filePath);
      } else {
        console.log('❌ File not found:', filename);
        res.status(404).json({ error: 'File not found' });
      }
    });

// Drawings endpoints (minimal for compatibility)
app.get('/drawings', async (req, res) => {
  try {
    if (!drawingsCollection) {
      return res.json([]);
    }
    const drawings = await drawingsCollection.find({}).sort({ drawingDate: -1 }).toArray();
    res.json(drawings);
  } catch (error) {
    console.error('Error fetching drawings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Basic notifications endpoints (placeholder)
app.get('/notifications/:userId', (req, res) => {
  res.json([]);
});

app.get('/notifications/:userId/unread-count', (req, res) => {
  res.json({ count: 0 });
});

// ==================== Users API ====================

// Get all users
app.get('/users', async (req, res) => {
  try {
    if (!usersCollection) {
      console.log('⚠️ Users collection not initialized, returning empty array');
      return res.json([]);
    }
    const users = await usersCollection.find({}).toArray();
    console.log(`✅ Fetched ${users.length} users`);
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'خطأ في جلب المستخدمين' });
  }
});

// Add new user
app.post('/users', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    console.log('✅ User added:', result.insertedId);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update user
app.put('/users/:id', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const { ObjectId } = require('mongodb');
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
    console.log('✅ User updated:', id);
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update user permissions
app.put('/users/:id/permissions', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const { ObjectId } = require('mongodb');
    const id = req.params.id;
    const { permissions } = req.body;
    
    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'Permissions must be an array' });
    }
    
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { permissions: permissions } }
      );
    } else {
      result = await usersCollection.updateOne(
        { _id: id },
        { $set: { permissions: permissions } }
      );
    }
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المستخدم' });
    }
    console.log('✅ User permissions updated:', id, permissions);
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error updating user permissions:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete('/users/:id', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const { ObjectId } = require('mongodb');
    const id = req.params.id;
    let result;
    
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await usersCollection.deleteOne({ _id: id });
    }
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على المستخدم' });
    }
    console.log('✅ User deleted:', id);
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    if (!usersCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const { email, password } = req.body;
    const user = await usersCollection.findOne({ email, password });
    
    if (user) {
      res.json({ success: true, user: { ...user, _id: user._id.toString() } });
    } else {
      res.status(401).json({ success: false, message: 'بيانات دخول غير صحيحة' });
    }
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== End Users API ====================

// ==================== Contractors API ====================

// Get all contractors
app.get('/contractors', async (req, res) => {
  try {
    if (!contractorsCollection) {
      return res.status(500).json({ error: 'Database not ready' });
    }
    const contractors = await contractorsCollection.find({}).toArray();
    res.json(contractors);
  } catch (err) {
    console.error('Error fetching contractors:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get unique work items
app.get('/contractors/work-items/unique', async (req, res) => {
  try {
    if (!contractorsCollection) {
      return res.status(500).json({ error: 'Database not ready' });
    }
    const workItems = await contractorsCollection.distinct('workItem');
    // Filter out empty/null values
    const filtered = workItems.filter(item => item && item.trim() !== '');
    res.json(filtered);
  } catch (err) {
    console.error('Error fetching work items:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single contractor by ID
app.get('/contractors/:id', async (req, res) => {
  try {
    if (!contractorsCollection) {
      return res.status(500).json({ error: 'Database not ready' });
    }
    const { ObjectId } = require('mongodb');
    const id = new ObjectId(req.params.id);
    const contractor = await contractorsCollection.findOne({ _id: id });
    
    if (!contractor) {
      return res.status(404).json({ error: 'Contractor not found' });
    }
    
    res.json(contractor);
  } catch (err) {
    console.error('Error fetching contractor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Add new contractor
app.post('/contractors', async (req, res) => {
  try {
    if (!contractorsCollection) {
      return res.status(500).json({ error: 'Database not ready' });
    }
    const contractorData = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const result = await contractorsCollection.insertOne(contractorData);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    console.error('Error adding contractor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update contractor
app.put('/contractors/:id', async (req, res) => {
  try {
    if (!contractorsCollection) {
      return res.status(500).json({ error: 'Database not ready' });
    }
    const { ObjectId } = require('mongodb');
    const id = new ObjectId(req.params.id);
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };
    delete updateData._id; // Remove _id from update data
    const result = await contractorsCollection.updateOne(
      { _id: id },
      { $set: updateData }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Error updating contractor:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete contractor
app.delete('/contractors/:id', async (req, res) => {
  try {
    if (!contractorsCollection) {
      return res.status(500).json({ error: 'Database not ready' });
    }
    const { ObjectId } = require('mongodb');
    const id = new ObjectId(req.params.id);
    const result = await contractorsCollection.deleteOne({ _id: id });
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Error deleting contractor:', err);
    res.status(500).json({ error: err.message });
  }
});

// ==================== End Contractors API ====================

// Serve static HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/add-contractor.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'add-contractor.html'));
});

app.get('/drawings.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'drawings.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Server running on port', PORT);
  console.log('📋 Available APIs:');
  console.log('   GET  /external-services - جلب التعاملات الخارجية');
  console.log('   POST /external-services - إضافة تعامل خارجي');
  console.log('   PUT  /external-services/:id - تحديث تعامل خارجي');
  console.log('   DELETE /external-services/:id - حذف تعامل خارجي');
  console.log('   GET  /external-services/export - تصدير إلى Excel');
  console.log('   GET  /drawings - جلب المخططات');
  console.log('   GET  /uploads/:filename - تحميل الملفات');
});