@echo off
echo 🚀 Starting Local Development Server...
echo 📁 Creating uploads directory if not exists...
if not exist uploads mkdir uploads

echo 🗃️ Installing dependencies...
call npm install

echo 🌐 Starting server on http://localhost:4000
echo 📐 Drawings page: http://localhost:4000/drawings.html
echo 🧪 Test page: http://localhost:4000/test-drawings.html
echo.
echo Press Ctrl+C to stop

node server.js