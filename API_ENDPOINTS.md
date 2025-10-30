# Taskon API Endpoints Documentation

## Base URL
- **Production**: `https://taskon-production.up.railway.app`
- **Local**: `http://localhost:4000`

---

## 📋 External Services API

### Get all external services
```
GET /external-services
```

### Add new external service
```
POST /external-services
Body: { name, category, amount, date, notes }
```

### Update external service
```
PUT /external-services/:id
Body: { name, category, amount, date, notes }
```

### Delete external service
```
DELETE /external-services/:id
```

### Export to Excel
```
GET /external-services/export
```

---

## 🖼️ Drawings API

### Get all drawings
```
GET /drawings
```

### Get single drawing
```
GET /drawings/:id
```

### Add new drawing
```
POST /drawings
Body: { title, location, date, items: [{name, quantity, unit, unitPrice, notes}] }
```

### Update drawing
```
PUT /drawings/:id
Body: { title, location, date, items }
```

### Delete drawing
```
DELETE /drawings/:id
```

### Update drawing items
```
PUT /drawings/:id/items
Body: { items: [] }
```

---

## 📊 Daily Reports API

### Get all daily reports
```
GET /daily-reports
```

### Get single daily report
```
GET /daily-reports/:id
```

### Add new daily report
```
POST /daily-reports
Body: { reportNumber, date, title, workItems: [], equipment: {} }
```

### Update daily report
```
PUT /daily-reports/:id
Body: { workItems, equipment }
```

### Delete daily report
```
DELETE /daily-reports/:id
```

---

## 👥 Users API

### Get all users
```
GET /users
```

### Get user permissions
```
GET /users/:id/permissions
```

### Update user permissions
```
PUT /users/:id/permissions
Body: { permissions: [] }
```

### User login
```
POST /login
Body: { username, password }
```

---

## 👷 Contractors API

### Get all contractors
```
GET /contractors
```

### Get single contractor
```
GET /contractors/:id
```

### Get unique work items
```
GET /contractors/work-items/unique
```

### Add new contractor
```
POST /contractors
Body: { name, phone, workItem }
```

### Update contractor
```
PUT /contractors/:id
Body: { name, phone, workItem, materials, contracts, etc. }
```

### Delete contractor
```
DELETE /contractors/:id
```

### Get contractor contracts
```
GET /contractors/:id/contracts
```

### Get contractor extracts
```
GET /contractors/:id/extracts
```

### Get contractor pulled works
```
GET /contractors/:id/pulled-works
```

### Delete contractor material
```
DELETE /contractors/:id/materials/:index
```

---

## 📑 Extracts (المستخلصات) API

### Get all extracts
```
GET /extracts
```

### Get single extract
```
GET /extracts/:id
```

### Add new extract
```
POST /extracts
Body: { contractorId, extractNumber, date, workItems: [], deductions: [] }
```

### Update extract
```
PUT /extracts/:id
Body: { workItems, deductions, etc. }
```

### Delete extract
```
DELETE /extracts/:id
```

### Delete work item from extract
```
DELETE /extracts/:id/work-items/:index
```

---

## 📁 File Upload API

### Upload files
```
POST /upload
Content-Type: multipart/form-data
Body: files (multiple files supported)
```

### Get uploaded file
```
GET /uploads/:filename
```

---

## 🔧 Utility Endpoints

### API Test
```
GET /api/test
```

### Server Status
```
GET /status
```

---

## 📝 Notes

1. **Authentication**: Currently using localStorage for user sessions
2. **Permissions**: Each user has an array of permissions checked by `permissions-check.js`
3. **File Uploads**: Use multer middleware, files stored in `/uploads` directory
4. **Database**: MongoDB with collections:
   - `external-services`
   - `drawings`
   - `daily_reports`
   - `users`
   - `contractors`
   - `extracts`

---

## 🎯 Permission Names

- `external-services`
- `drawings`
- `daily-reports`
- `contractors`
- `users`
- `dashboard-card-*` (for dashboard cards)

---

**Last Updated**: October 30, 2025
