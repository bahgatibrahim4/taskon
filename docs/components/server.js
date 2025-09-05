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

let extractsCollection, contractorsCollection, usersCollection, suppliesCollection, suppliersCollection, purchasesCollection, storeCollection, workersCollection, monthlyPaysCollection, paysCollection, chatsCollection, notificationsCollection; // أضف notificationsCollection

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
  paysCollection = db.collection('pays');
  chatsCollection = db.collection('chats');
  notificationsCollection = db.collection('notifications'); // أضف هذا السطر
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

// API المستخلصات
app.post('/extracts', async (req, res) => {
  try {
    const extract = req.body;
    const result = await extractsCollection.insertOne(extract);

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
    const result = await suppliesCollection.insertOne(supply);

    // إضافة التوريد إلى كولكشن المخزن
    await storeCollection.insertOne({
      date: supply.date,
      supplier: supply.supplier,
      item: supply.item,
      quantity: Number(supply.quantity) || 0,
      unit: supply.unit,
      unitPrice: supply.unitPrice,
      total: (Number(supply.quantity) * Number(supply.unitPrice || 0)).toFixed(2),
      operationType: 'توريد'
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

// API المشتريات
app.post('/purchases', async (req, res) => {
  try {
    const purchase = req.body;
    const result = await purchasesCollection.insertOne(purchase);

    // إضافة الشراء إلى كولكشن المخزن مع تعيين store->supplier و category->unitPrice
    await storeCollection.insertOne({
      date: purchase.date,
      supplier: purchase.store, // اسم المحل في عمود اسم المورد
      item: purchase.item,
      quantity: purchase.quantity,
      unit: purchase.unit,
      unitPrice: purchase.category, // الفئة في عمود سعر الوحدة
      category: purchase.category,
      total: purchase.total,
      invoice: purchase.invoice
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
          operationType: 'توريد'
        };
      }
      items[s.item].totalSupplied += Number(s.quantity) || 0;
      items[s.item].supplier = s.supplier || items[s.item].supplier;
      items[s.item].lastSupplyDate = s.date || items[s.item].lastSupplyDate;
      items[s.item].unit = s.unit || items[s.item].unit;
      items[s.item].unitPrice = s.unitPrice || items[s.item].unitPrice;
      items[s.item].operationType = 'توريد';
    });
    purchases.forEach(p => {
      if (!p.item) return;
      if (!items[p.item]) {
        items[p.item] = {
          item: p.item,
          unit: p.unit || '',
          unitPrice: p.unitPrice || p.category || '', // عدل هنا
          totalSupplied: 0,
          totalPurchased: 0,
          totalIssued: 0,
          supplier: p.supplier || '',
          lastSupplyDate: p.date || '',
          operationType: 'شراء'
        };
      }
      items[p.item].totalPurchased += Number(p.quantity) || 0;
      items[p.item].supplier = p.supplier || items[p.item].supplier;
      items[p.item].lastSupplyDate = p.date || items[p.item].lastSupplyDate;
      items[p.item].unit = p.unit || items[p.item].unit;
      items[p.item].unitPrice = p.unitPrice || p.category || items[p.item].unitPrice; // عدل هنا أيضاً
      items[p.item].operationType = 'شراء';
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
      quantity: (it.totalSupplied + it.totalPurchased - it.totalIssued), // <-- عدل هنا: جمع المشتريات
      unit: it.unit,
      unitPrice: it.unitPrice,
      total: ((it.totalSupplied + it.totalPurchased - it.totalIssued) * (Number(it.unitPrice) || 0)).toFixed(2), // <-- عدل هنا أيضاً
      operationType: it.operationType || ''
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

// صرف مواد من المخزن مباشرة (وليس للمقاول)
app.post('/store/issue', async (req, res) => {
  try {
    const { item, quantity, date, notes, contractor, unitPrice, userName } = req.body;
    if (!item || !quantity) return res.status(400).json({ error: 'item and quantity required' });

    let qtyToIssue = Number(quantity);
    const supplies = await suppliesCollection.find({ item }).sort({ date: 1 }).toArray();

    // احسب إجمالي الكمية المتاحة فعلياً
    const totalAvailable = supplies.reduce((sum, supply) => {
      const available = Number(supply.quantity) - Number(supply.issued || 0);
      return sum + (available > 0 ? available : 0);
    }, 0);

    if (qtyToIssue > totalAvailable) {
      return res.status(400).json({ error: 'الكمية غير متوفرة في المخزن' });
    }

    // نفذ الخصم من التوريدات (FIFO)
    let updates = [];
    let qtyLeft = qtyToIssue;
    for (const supply of supplies) {
      if (qtyLeft <= 0) break;
      const available = Number(supply.quantity) - Number(supply.issued || 0);
      if (available <= 0) continue;
      const deduct = Math.min(available, qtyLeft);
      updates.push({
        id: supply._id,
        issued: Number(supply.issued || 0) + deduct
      });
      qtyLeft -= deduct;
    }

    for (const u of updates) {
      await suppliesCollection.updateOne(
        { _id: u.id },
        { $set: { issued: u.issued } }
      );
    }

    // جلب سعر الوحدة من التوريد أو الشراء إذا لم يُرسل من الواجهة
    let finalUnitPrice = unitPrice;
    if (finalUnitPrice === undefined || finalUnitPrice === null || finalUnitPrice === '') {
      let found = null;
      for (const s of supplies) {
        if (s.unitPrice !== undefined && s.unitPrice !== null && s.unitPrice !== '') {
          found = s.unitPrice;
          break;
        }
      }
      if (found === null) {
        const purchase = await purchasesCollection.findOne({ item }, { sort: { date: 1 } });
        if (purchase && (purchase.unitPrice !== undefined && purchase.unitPrice !== null && purchase.unitPrice !== '')) {
          found = purchase.unitPrice;
        } else if (purchase && (purchase.category !== undefined && purchase.category !== null && purchase.category !== '')) {
          found = purchase.category;
        }
      }
      finalUnitPrice = found !== null ? found : '';
    }

    // سجل عملية الصرف في كولكشن store
    await storeCollection.insertOne({
      date: date || new Date(),
      item,
      quantity: Number(quantity),
      notes: notes || '',
      operationType: 'صرف',
      contractor: contractor || '',
      unitPrice: finalUnitPrice
    });

    // إذا تم اختيار مقاول، أضف المادة في خانة المواد عند المقاول (materials)
    if (contractor) {
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
        const matDate = date || new Date();
        const userField = userName || '';
        // استخدم نفس finalUnitPrice الذى تم استخدامه فى الصرف
        const matObj = {
          name: item,
          quantity: Number(quantity),
          date: matDate,
          unitPrice: finalUnitPrice,
          userName: userField,
          notes: notes || ''
        };
        await contractorsCollection.updateOne(
          { _id: contractorId },
          { $push: { materials: matObj } }
        );
      }
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

    // تحقق من صحة البيانات المطلوبة
    if (!item || quantity === undefined || quantity === null || quantity === '' || !date) {
      return res.status(400).json({ error: 'item, quantity, and date required' });
    }

    let qtyToIssue = Number(quantity);
    if (isNaN(qtyToIssue) || qtyToIssue <= 0) return res.status(400).json({ error: 'كمية غير صحيحة' });

    // إذا تم اختيار مقاول، أضف المادة في خانة المواد عند المقاول فقط (بدون أي منطق مخزن)
    if (contractor) {
      let contractorId = contractor;
      if (/^[0-9a-fA-F]{24}$/.test(contractorId)) contractorId = new ObjectId(contractorId);
      // تأكد أن materials مصفوفة
      const contractorDoc = await contractorsCollection.findOne({ _id: contractorId });
      if (contractorDoc) {
        if (!Array.isArray(contractorDoc.materials)) {
          await contractorsCollection.updateOne(
            { _id: contractorId },
            { $set: { materials: [] } }
          );
        }
        // دائماً أضف صف جديد مع unitPrice وuserName
        const matDate = date || new Date();
        const safeUnitPrice = unitPrice !== undefined && unitPrice !== null && unitPrice !== '' ? unitPrice : '';
        const userField = userName || '';
        const matObj = {
          name: item,
          quantity: qtyToIssue,
          date: matDate,
          unitPrice: safeUnitPrice,
          userName: userField,
          notes: notes || ''
        };
        await contractorsCollection.updateOne(
          { _id: contractorId },
          { $push: { materials: matObj } }
        );
        return res.json({ success: true });
      } else {
        return res.status(404).json({ error: 'Contractor not found' });
      }
    }

    // إذا لم يتم اختيار مقاول، نفذ الصرف من المخزن كالمعتاد
    const supplies = await suppliesCollection.find({ item }).sort({ date: 1 }).toArray();
    if (!supplies.length) {
      return res.status(400).json({ error: 'لا يوجد توريدات لهذه المادة في المخزن' });
    }

    // احسب إجمالي الكمية المتاحة فعلياً (تأكد من جمع كل التوريدات بشكل صحيح)
    let totalAvailable = 0;
    for (const supply of supplies) {
      const q = Number(supply.quantity);
      const issued = Number(supply.issued || 0);
      if (isNaN(q) || isNaN(issued)) continue;
      const available = q - issued;
      if (available > 0) totalAvailable += available;
    }

    // تصحيح: إذا الكمية المطلوبة أكبر من المتاح فقط أظهر الخطأ
    if (qtyToIssue > totalAvailable) {
      return res.status(400).json({ error: `الكمية غير متوفرة في المخزن (المتاح: ${totalAvailable})` });
    }

    // نفذ الخصم من التوريدات (FIFO)
    let updates = [];
    let qtyLeft = qtyToIssue;
    for (const supply of supplies) {
      if (qtyLeft <= 0) break;
      const q = Number(supply.quantity);
      const issued = Number(supply.issued || 0);
      if (isNaN(q) || isNaN(issued)) continue;
      const available = q - issued;
      if (available <= 0) continue;
      const deduct = Math.min(available, qtyLeft);
      updates.push({
        id: supply._id,
        issued: issued + deduct
      });
      qtyLeft -= deduct;
    }

    // إذا لم يتم خصم أي كمية (qtyLeft لم ينقص)، أظهر خطأ
    if (updates.length === 0 || qtyLeft > 0) {
      return res.status(400).json({ error: `الكمية غير متوفرة في المخزن (المتاح: ${totalAvailable})` });
    }

    for (const u of updates) {
      await suppliesCollection.updateOne(
        { _id: u.id },
        { $set: { issued: u.issued } }
      );
    }
    await storeCollection.insertOne({
      date: date || new Date(),
      item,
      quantity: qtyToIssue,
      notes: notes || '',
      operationType: 'صرف'
    });
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
    // إذا لم نجد رسائل، ابحث في شات otherUserId (قد يكون اتجاه الرسائل معكوس)
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
      from: fromUserId, // <-- هنا التغيير
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
