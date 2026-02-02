# Telkom Asset Management - Backend Server

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
File `.env` sudah ada dengan konfigurasi development. Untuk production, copy `.env.example` dan sesuaikan.

### 3. Run Server
```bash
npm start
```

Server akan jalan di `http://localhost:4000`

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `POST /api/login` - Login (rate limited: 5 attempts per 15 min)

### Protected Endpoints (Requires JWT Token)
- `GET /api/me` - Get current user info
- `GET /api/reports` - List all reports
- `GET /api/reports/:id` - Get single report
- `PUT /api/reports/:id/status` - Update report status (Admin/Teknisi)
- `DELETE /api/reports/:id` - Delete report (Admin/Teknisi)
- `GET /api/dashboard/summary` - Dashboard statistics

## Security Features

✅ JWT Authentication with expiry
✅ Role-based access control (Admin, Teknisi)
✅ Rate limiting (100 req/15min general, 5 attempts/15min login)
✅ CORS protection (whitelist domains)
✅ Input validation & sanitization
✅ Helmet security headers
✅ Request logging (Morgan)
✅ Bcrypt password hashing (12 rounds)

## Testing

### Test Login
```bash
curl -X POST http://localhost:4000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'
```

### Test Protected Route
```bash
# Get token from login first, then:
curl -X GET http://localhost:4000/api/reports \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test Rate Limiting
```bash
# Try login 6 times with wrong password:
for i in {1..6}; do 
  curl -X POST http://localhost:4000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"wrong"}'; 
  echo ""
done
# Should get blocked after 5th attempt
```

## Database

SQLite database: `data/app.db`

Tables:
- `admins` - Admin users
- `teknisi` - Teknisi users  
- `reports` - Asset reports

⚠️ **Note:** SQLite sudah cukup untuk development. Untuk production dengan concurrent access tinggi, pertimbangkan PostgreSQL/MySQL.

## Troubleshooting

### Port 4000 sudah dipakai
Edit `.env`:
```
PORT=5000
```

### CORS Error
Pastikan frontend origin ada di `.env`:
```
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### JWT_SECRET too short
Minimal 32 karakter. Generate baru:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Database locked
Stop semua instance server yang running:
```bash
# Windows
taskkill /f /im node.exe

# Linux/Mac
killall node
```

## Production Deployment

Lihat [SECURITY.md](./SECURITY.md) untuk checklist lengkap.

**Minimal requirements:**
1. Generate JWT_SECRET random
2. Set NODE_ENV=production
3. Update ALLOWED_ORIGINS dengan domain production
4. Setup HTTPS/SSL
5. Ganti default passwords
6. Setup database backup
7. Configure firewall

## Development Scripts

```bash
npm start       # Start server
npm run dev     # Start with nodemon (auto-reload)
```

## Dependencies

**Production:**
- express - Web framework
- cors - CORS middleware
- helmet - Security headers
- bcryptjs - Password hashing
- jsonwebtoken - JWT authentication
- express-validator - Input validation
- express-rate-limit - Rate limiting
- dotenv - Environment variables
- morgan - HTTP logging
- sqlite3 - Database

**Development:**
- nodemon - Auto-reload server

## Support

Untuk issues atau questions, contact tim development.
