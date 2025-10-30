const express = require('express');
const multer = require('multer');
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

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
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// MongoDB connection
const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
let db = null;
let externalServicesCollection = null;
let dailyReportsCollection = null;

MongoClient.connect(uri)
  .then(client => {
    console.log('✅ Connected to MongoDB!');
    db = client.db('taskon');
    externalServicesCollection = db.collection('external-services');
    dailyReportsCollection = db.collection('daily_reports');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Basic test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test server working!',
    timestamp: new Date().toISOString()
  });
});

// External Services API endpoints
app.get('/external-services', async (req, res) => {
  try {
    if (!externalServicesCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const services = await externalServicesCollection.find({}).sort({ serviceDate: -1 }).toArray();
    res.json(services);
  } catch (error) {
    console.error('Error fetching external services:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/external-services', upload.single('attachment'), async (req, res) => {
  try {
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
        size: req.file.size
      };
    }
    
    const result = await externalServicesCollection.insertOne(newService);
    
    res.json({
      success: true,
      insertedId: result.insertedId,
      message: 'Service added successfully'
    });
  } catch (error) {
    console.error('Error adding external service:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/external-services/:id', upload.single('attachment'), async (req, res) => {
  try {
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
        size: req.file.size
      };
    }
    
    const result = await externalServicesCollection.updateOne(
      { _id: serviceId },
      { $set: updateData }
    );
    
    res.json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: 'Service updated successfully'
    });
  } catch (error) {
    console.error('Error updating external service:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/external-services/:id', async (req, res) => {
  try {
    if (!externalServicesCollection) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    
    const { ObjectId } = require('mongodb');
    const serviceId = new ObjectId(req.params.id);
    
    const result = await externalServicesCollection.deleteOne({ _id: serviceId });
    
    res.json({
      success: true,
      deletedCount: result.deletedCount,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting external service:', error);
    res.status(500).json({ error: error.message });
  }
});

// File serving endpoint
// ==============================
// DAILY REPORTS API ENDPOINTS
// ==============================

// Get all daily reports
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

// Create daily report (accept any file fields)
app.post('/daily-reports', upload.any(), async (req, res) => {
  try {
    if (!dailyReportsCollection) return res.status(500).json({ error: 'DB not ready' });
    const { date, title } = req.body;
    const workItemsMeta = JSON.parse(req.body.workItems || '[]');
    const files = req.files || [];

    // build workItems with photos grouped by fieldname prefix photos_{idx}_
    const workItems = workItemsMeta.map((m) => ({ building: m.building || '', desc: m.desc || '', photos: [] }));
    files.forEach(f => {
      const m = f.fieldname.match(/^photos_(\d+)_/);
      if (m) {
        const idx = parseInt(m[1], 10);
        workItems[idx] = workItems[idx] || { building: '', desc: '', photos: [] };
        workItems[idx].photos.push({ filename: f.filename, originalname: f.originalname, path: `/uploads/${f.filename}`, size: f.size });
      }
    });

    const doc = { date: date || new Date().toISOString(), title: title || '', workItems, photoCount: files.length, createdAt: new Date(), updatedAt: new Date() };
    const result = await dailyReportsCollection.insertOne(doc);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (err) {
    console.error('Error creating daily report:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single daily report
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

// Update report (append new photos if provided)
app.put('/daily-reports/:id', upload.any(), async (req, res) => {
  try {
    const { ObjectId } = require('mongodb');
    const id = new ObjectId(req.params.id);
    const existing = await dailyReportsCollection.findOne({ _id: id });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const workItemsMeta = JSON.parse(req.body.workItems || '[]');
    const files = req.files || [];

    const workItems = workItemsMeta.map((m, idx) => ({ building: m.building || '', desc: m.desc || '', photos: (existing.workItems && existing.workItems[idx] && existing.workItems[idx].photos) ? existing.workItems[idx].photos.slice() : [] }));
    files.forEach(f => {
      const m = f.fieldname.match(/^photos_(\d+)_/);
      if (m) {
        const idx = parseInt(m[1], 10);
        workItems[idx] = workItems[idx] || { building: '', desc: '', photos: [] };
        workItems[idx].photos.push({ filename: f.filename, originalname: f.originalname, path: `/uploads/${f.filename}`, size: f.size });
      }
    });

    const photoCount = files.length + (existing.photoCount || 0);
    const update = { workItems, photoCount, updatedAt: new Date(), title: req.body.title || existing.title, date: req.body.date || existing.date };
    await dailyReportsCollection.updateOne({ _id: id }, { $set: update });
    const updated = await dailyReportsCollection.findOne({ _id: id });
    res.json(updated);
  } catch (err) {
    console.error('Error updating report:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete report
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

// ==============================
// END DAILY REPORTS API
// ==============================

// File serving endpoint
app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadsDir, filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Serve static HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/add-contractor.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'add-contractor.html'));
});

app.get('/daily-reports.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'daily-reports.html'));
});

app.get('/daily-report.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'daily-report.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Test server running on port', PORT);
  console.log('📋 Available APIs:');
  console.log('   GET  /external-services - جلب التعاملات الخارجية');
  console.log('   POST /external-services - إضافة تعامل خارجي');
  console.log('   PUT  /external-services/:id - تحديث تعامل خارجي');
  console.log('   DELETE /external-services/:id - حذف تعامل خارجي');
  console.log('   GET  /daily-reports - جلب التقارير اليومية');
  console.log('   POST /daily-reports - إضافة تقرير يومي');
  console.log('   PUT  /daily-reports/:id - تحديث تقرير يومي');
  console.log('   DELETE /daily-reports/:id - حذف تقرير يومي');
});