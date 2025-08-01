const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

// تقديم ملفات الواجهة من فولدر public
app.use(express.static(__dirname));

const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let extractsCollection, contractorsCollection, usersCollection;

// الاتصال بقاعدة البيانات
async function connectDB() {
  await client.connect();
  const db = client.db('company_db');
  extractsCollection = db.collection('extracts');
  contractorsCollection = db.collection('contractors');
  usersCollection = db.collection('users'); // إضافة مجموعة المستخدمين
  console.log("Connected to MongoDB!");
}

connectDB().catch(console.dir);

// API المقاولين
app.post('/contractors', async (req, res) => {
  try {
    const contractor = req.body;
    console.log('بيانات المقاول المستلمة:', contractor); // لوج
    const result = await contractorsCollection.insertOne(contractor);
    res.status(201).json(result);
  } catch (err) {
    console.error('خطأ أثناء إضافة المقاول:', err); // لوج
    res.status(500).json({ error: err.message });
  }
});

app.get('/contractors', async (req, res) => {
  try {
    const contractors = await contractorsCollection.find({}).toArray();
    res.json(contractors);
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

// API المستخلصات
app.post('/extracts', async (req, res) => {
  try {
    const extract = req.body;
    const result = await extractsCollection.insertOne(extract);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/extracts', async (req, res) => {
  try {
    const extracts = await extractsCollection.find({}).toArray();
    const users = await usersCollection.find({}).toArray();

    const extractsWithUser = extracts.map(extract => {
      // Ensure both sides are strings for comparison
      const extractUserId = extract.userId ? extract.userId.toString() : (extract.createdBy ? extract.createdBy.toString() : '');
      const user = users.find(u => u._id && u._id.toString() === extractUserId);
      return {
        ...extract,
        username: user ? user.username : (extract.username || '')
      };
    });

    res.json(extractsWithUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب مستخلص واحد
app.get('/extracts/:id', async (req, res) => {
  try {
    let extract = null;
    // جرب البحث بـ ObjectId أولاً
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      extract = await extractsCollection.findOne({ _id: new ObjectId(req.params.id) });
    }
    // إذا لم يوجد أو الـ id ليس ObjectId، جرب البحث كنص
    if (!extract) {
      extract = await extractsCollection.findOne({ _id: req.params.id });
    }
    if (!extract) return res.status(404).json({ error: 'Extract not found' });
    res.json(extract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل مستخلص
app.put('/extracts/:id', async (req, res) => {
  try {
    await extractsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// حذف مستخلص
app.delete('/extracts/:id', async (req, res) => {
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
    let result;
    const id = req.params.id;
    // إذا كان id من نوع ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { permissions: req.body.permissions || [] } }
      );
    } else {
      result = await usersCollection.updateOne(
        { _id: id },
        { $set: { permissions: req.body.permissions || [] } }
      );
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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));