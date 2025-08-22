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

let extractsCollection, contractorsCollection, usersCollection, suppliesCollection, suppliersCollection, purchasesCollection, storeCollection, workersCollection, monthlyPaysCollection, paysCollection; // أضف paysCollection

// الاتصال بقاعدة البيانات
async function connectDB() {
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
  paysCollection = db.collection('pays'); // أضف هذا السطر
  console.log("Connected to MongoDB!");
}

connectDB().catch(console.dir);

// API المقاولين
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
    const contractors = await contractorsCollection.find({}).toArray();
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
    // إذا لم يوجد materials أعده كمصفوفة فارغة
    if (!Array.isArray(contractor.materials)) contractor.materials = [];
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

// API المستخلصات
app.post('/extracts', async (req, res) => {
  try {
    const extract = req.body;
    // أضف _id لكل بند إذا لم يوجد
    if (Array.isArray(extract.workItems)) {
      extract.workItems = extract.workItems.map(item => ({
        _id: item._id || new ObjectId(),
        ...item
      }));
    }
    // تحقق من وجود بنود أعمال حقيقية (ليست فواصل ومعبأة)
    if (
      !extract.contractor ||
      !extract.number ||
      !Array.isArray(extract.workItems) ||
      !extract.workItems.some(item =>
        !item.isSeparator &&
        item.buildingNumber && item.workItem
      )
    ) {
      return res.status(400).json({ error: 'يجب تعبئة بيانات المقاول ورقم المستخلص وبنود الأعمال.' });
    }
    // احفظ كل الحقول كما هي (بدون أي تعديل أو deep copy)
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
    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      extract = await extractsCollection.findOne({ _id: new ObjectId(req.params.id) });
    }
    if (!extract) {
      extract = await extractsCollection.findOne({ _id: req.params.id });
    }
    if (!extract) return res.status(404).json({ error: 'Extract not found' });

    // أرسل الحقل otherWorksHeaders كما هو مع الريسبونس
    extract.otherWorks = extract.otherWorks || [];
    extract.otherWorksHeaders = extract.otherWorksHeaders || [];

    res.json(extract);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// تعديل مستخلص
app.put('/extracts/:id', async (req, res) => {
  try {
    const oldExtract = await extractsCollection.findOne({ _id: new ObjectId(req.params.id) });
    if (!oldExtract) return res.status(404).json({ error: 'Extract not found' });

    // أضف _id لأي بند جديد
    if (Array.isArray(req.body.workItems)) {
      req.body.workItems = req.body.workItems.map((item, idx) => {
        const oldItem = oldExtract.workItems[idx];
        // إذا كان البند مقفول أعده كما هو
        if (oldItem && oldItem.locked) return oldItem;
        return {
          _id: item._id || new ObjectId(),
          ...item
        };
      });
    }

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
    const result = await suppliesCollection.insertOne(supply);
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
    let result;
    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      result = await suppliesCollection.deleteOne({ _id: new ObjectId(id) });
    } else {
      result = await suppliesCollection.deleteOne({ _id: id });
    }
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على التوريد' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// دالة لجلب كولكشن التوريدات الخاص بمورد
function getSupplierSuppliesCollection(supplierId) {
  return client.db('company_db').collection(`supplier_${supplierId}_supplies`);
}

// دالة لجلب كولكشن الحسابات الخاص بمورد
function getSupplierAccountsCollection(supplierId) {
  return client.db('company_db').collection(`supplier_${supplierId}_accounts`);
}

// إضافة توريد لمورد معين
app.post('/suppliers/:supplierId/supplies', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const data = req.body;
    const collection = getSupplierSuppliesCollection(supplierId);
    const result = await collection.insertOne(data);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل توريدات مورد معين
app.get('/suppliers/:supplierId/supplies', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const collection = getSupplierSuppliesCollection(supplierId);
    const supplies = await collection.find({}).toArray();
    res.json(supplies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة حساب لمورد معين
app.post('/suppliers/:supplierId/accounts', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const data = req.body;
    const collection = getSupplierAccountsCollection(supplierId);
    const result = await collection.insertOne(data);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب كل حسابات مورد معين
app.get('/suppliers/:supplierId/accounts', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const collection = getSupplierAccountsCollection(supplierId);
    const accounts = await collection.find({}).toArray();
    res.json(accounts);
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

// صرف مواد لمقاول: POST /contractors/:id/issue-material
app.post('/contractors/:id/issue-material', async (req, res) => {
  try {
    const contractorId = req.params.id;
    const { item, quantity, date, notes } = req.body;
    if (!item || !quantity) return res.status(400).json({ error: 'item and quantity required' });

    // خصم الكمية من المخزون (supplies)
    // اجلب أول توريد متاح فيه الكمية المطلوبة (FIFO)
    let qtyToIssue = Number(quantity);
    const supplies = await suppliesCollection.find({ item }).sort({ date: 1 }).toArray();
    let updates = [];
    for (const supply of supplies) {
      if (qtyToIssue <= 0) break;
      const available = Number(supply.quantity) - Number(supply.issued || 0);
      if (available <= 0) continue;
      const deduct = Math.min(available, qtyToIssue);
      updates.push({
        id: supply._id,
        issued: Number(supply.issued || 0) + deduct
      });
      qtyToIssue -= deduct;
    }
    if (qtyToIssue > 0) return res.status(400).json({ error: 'الكمية غير متوفرة في المخزن' });

    // نفذ الخصم فعلياً
    for (const u of updates) {
      await suppliesCollection.updateOne(
        { _id: u.id },
        { $set: { issued: u.issued } }
      );
    }

    // أضف المادة للمقاول
    const contractor = await contractorsCollection.findOne({ _id: new ObjectId(contractorId) });
    if (!contractor) return res.status(404).json({ error: 'Contractor not found' });
    const matObj = {
      name: item,
      quantity: Number(quantity),
      date: date || new Date(),
      notes: notes || ''
    };
    await contractorsCollection.updateOne(
      { _id: new ObjectId(contractorId) },
      { $push: { materials: matObj } }
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API المشتريات
app.post('/purchases', async (req, res) => {
  try {
    const purchase = req.body;
    const result = await purchasesCollection.insertOne(purchase);
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

// API المخزن: جلب ملخص المخزون (مادة/كمية/وحدة/سعر/إجمالي)
app.get('/store', async (req, res) => {
  try {
    // جلب كل التوريدات
    const supplies = await suppliesCollection.find({}).toArray();
    // جلب كل المشتريات
    const purchases = await purchasesCollection.find({}).toArray();
    // جلب كل عمليات الصرف للمقاولين (من حقل materials في المقاولين)
    const contractors = await contractorsCollection.find({}).toArray();
    let issuedMaterials = [];
    contractors.forEach(c => {
      if (Array.isArray(c.materials)) {
        issuedMaterials = issuedMaterials.concat(
          c.materials.map(m => ({
            item: m.name,
            quantity: Number(m.quantity) || 0
          }))
        );
      }
    });

    // بناء جدول المخزون: لكل مادة
    const items = {};
    supplies.forEach(s => {
      if (!s.item) return;
      if (!items[s.item]) {
        items[s.item] = {
          item: s.item,
          unit: s.unit || '',
          unitPrice: s.unitPrice || '',
          totalSupplied: 0,
          totalPurchased: 0,
          totalIssued: 0,
          supplier: s.supplier || '',
          lastSupplyDate: s.date || '',
        };
      }
      items[s.item].totalSupplied += Number(s.quantity) || 0;
      items[s.item].supplier = s.supplier || items[s.item].supplier;
      items[s.item].lastSupplyDate = s.date || items[s.item].lastSupplyDate;
      items[s.item].unit = s.unit || items[s.item].unit;
      items[s.item].unitPrice = s.unitPrice || items[s.item].unitPrice;
    });
    purchases.forEach(p => {
      if (!p.item || !items[p.item]) return;
      items[p.item].totalPurchased += Number(p.quantity) || 0;
    });
    issuedMaterials.forEach(im => {
      if (!im.item || !items[im.item]) return;
      items[im.item].totalIssued += Number(im.quantity) || 0;
    });

    // بناء صفوف الجدول
    const rows = Object.values(items).map((it, idx) => ({
      idx: idx + 1,
      date: it.lastSupplyDate,
      supplier: it.supplier,
      item: it.item,
      quantity: (it.totalSupplied - it.totalPurchased - it.totalIssued),
      unit: it.unit,
      unitPrice: it.unitPrice,
      total: ((it.totalSupplied - it.totalPurchased - it.totalIssued) * (Number(it.unitPrice) || 0)).toFixed(2)
    }));

    res.json(rows);
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

// دعم الرجوع للصفحة الرئيسية من المسار /
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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
    if (month) filter.month = month;
    const pays = await paysCollection.find(filter).sort({ _id: 1 }).toArray();
    res.json(pays);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة قبض جديد
app.post('/pays', async (req, res) => {
  try {
    const pay = req.body;
    // يجب أن يحتوى على name, date, value, month
    if (!pay.name || !pay.date || pay.value === undefined || !pay.month) {
      return res.status(400).json({ error: 'name, date, value, month مطلوبة' });
    }
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