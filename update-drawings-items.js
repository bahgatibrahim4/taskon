// سكريبت لتحديث حقل drawingItem للمخططات القديمة
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = "mongodb+srv://admin:Bb100200@db.diskpwp.mongodb.net/?retryWrites=true&w=majority&appName=DB";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function updateDrawings() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB!");
    
    const db = client.db('company_db');
    const drawingsCollection = db.collection('drawings');
    
    // البحث عن جميع المخططات التي ليس لها drawingItem
    const drawingsWithoutItem = await drawingsCollection.find({
      $or: [
        { drawingItem: { $exists: false } },
        { drawingItem: null },
        { drawingItem: "" }
      ]
    }).toArray();
    
    console.log(`📊 Found ${drawingsWithoutItem.length} drawings without item field`);
    
    if (drawingsWithoutItem.length === 0) {
      console.log("✨ All drawings already have item field!");
      return;
    }
    
    // تحديث جميع المخططات لتكون البند = "غير محدد"
    const result = await drawingsCollection.updateMany(
      {
        $or: [
          { drawingItem: { $exists: false } },
          { drawingItem: null },
          { drawingItem: "" }
        ]
      },
      {
        $set: { 
          drawingItem: "غير محدد",
          lastUpdated: new Date()
        }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} drawings!`);
    console.log("\n📋 Summary:");
    console.log(`   - Total drawings found: ${drawingsWithoutItem.length}`);
    console.log(`   - Successfully updated: ${result.modifiedCount}`);
    console.log(`   - New drawingItem value: "غير محدد"`);
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// تشغيل السكريبت
updateDrawings();
