// Script to add subdomain to hosts file
// يجب تشغيل Node.js بصلاحيات Admin

const fs = require('fs');
const path = require('path');
const os = require('os');

function addSubdomainToHosts(subdomain) {
  try {
    // تحديد مسار ملف hosts حسب نظام التشغيل
    let hostsPath;
    if (os.platform() === 'win32') {
      hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    } else if (os.platform() === 'darwin' || os.platform() === 'linux') {
      hostsPath = '/etc/hosts';
    } else {
      console.error('❌ نظام التشغيل غير مدعوم');
      return false;
    }

    // قراءة محتوى ملف hosts الحالي
    let hostsContent = '';
    try {
      hostsContent = fs.readFileSync(hostsPath, 'utf8');
    } catch (err) {
      console.error(`❌ خطأ في قراءة ملف hosts: ${err.message}`);
      console.log('💡 يجب تشغيل Node.js بصلاحيات المسؤول (Run as Administrator)');
      return false;
    }

    // التحقق إذا كان الـ subdomain موجود بالفعل
    const fullDomain = `${subdomain}.taskon.local`;
    if (hostsContent.includes(fullDomain)) {
      console.log(`✅ النطاق ${fullDomain} موجود بالفعل في ملف hosts`);
      return true;
    }

    // إضافة السطر الجديد
    const newLine = `\n127.0.0.1 ${fullDomain}`;
    
    try {
      fs.appendFileSync(hostsPath, newLine, 'utf8');
      console.log(`✅ تم إضافة ${fullDomain} إلى ملف hosts بنجاح`);
      return true;
    } catch (err) {
      console.error(`❌ خطأ في الكتابة على ملف hosts: ${err.message}`);
      console.log('💡 يجب تشغيل Node.js بصلاحيات المسؤول (Run as Administrator)');
      return false;
    }

  } catch (err) {
    console.error(`❌ خطأ عام: ${err.message}`);
    return false;
  }
}

// إذا تم تشغيل الملف مباشرة
if (require.main === module) {
  const subdomain = process.argv[2];
  
  if (!subdomain) {
    console.error('❌ يرجى تحديد اسم الـ subdomain');
    console.log('استخدام: node add-to-hosts.js <subdomain>');
    console.log('مثال: node add-to-hosts.js mosbah');
    process.exit(1);
  }

  const success = addSubdomainToHosts(subdomain);
  process.exit(success ? 0 : 1);
}

module.exports = { addSubdomainToHosts };
