const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let serverProcess;

// إنشاء النافذة الرئيسية
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    icon: path.join(__dirname, 'favicon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    autoHideMenuBar: true, // إخفاء شريط القوائم
    title: 'TASKON - نظام إدارة المشاريع'
  });

  // إخفاء القائمة الافتراضية
  Menu.setApplicationMenu(null);

  // بدء السيرفر
  startServer();

  // الانتظار قليلاً حتى يبدأ السيرفر
  setTimeout(() => {
    mainWindow.loadURL('http://localhost:4000/company-setup.html');
  }, 3000);

  // فتح DevTools في وضع التطوير فقط
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
    stopServer();
  });

  // منع فتح روابط خارجية في نفس النافذة
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
}

// بدء السيرفر Node.js
function startServer() {
  console.log('🚀 بدء تشغيل السيرفر...');
  
  serverProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    stdio: 'inherit'
  });

  serverProcess.on('error', (err) => {
    console.error('❌ خطأ في تشغيل السيرفر:', err);
  });

  serverProcess.on('close', (code) => {
    console.log(`🛑 السيرفر توقف بكود: ${code}`);
  });
}

// إيقاف السيرفر
function stopServer() {
  if (serverProcess) {
    console.log('🛑 إيقاف السيرفر...');
    serverProcess.kill();
    serverProcess = null;
  }
}

// عند جاهزية التطبيق
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// إغلاق التطبيق عند إغلاق جميع النوافذ (ما عدا macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    stopServer();
    app.quit();
  }
});

// تنظيف عند إغلاق التطبيق
app.on('before-quit', () => {
  stopServer();
});
