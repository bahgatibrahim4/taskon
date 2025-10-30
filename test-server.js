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

MongoClient.connect(uri)
  .then(client => {
    console.log('✅ Connected to MongoDB!');
    db = client.db('taskon');
    externalServicesCollection = db.collection('external-services');
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

// Start server
app.listen(PORT, () => {
  console.log('🚀 Test server running on port', PORT);
  console.log('📋 Available APIs:');
  console.log('   GET  /external-services - جلب التعاملات الخارجية');
  console.log('   POST /external-services - إضافة تعامل خارجي');
  console.log('   PUT  /external-services/:id - تحديث تعامل خارجي');
  console.log('   DELETE /external-services/:id - حذف تعامل خارجي');
});