# AI Coding Agent Instructions for Telkom Asset Management System

## Project Overview
**Telkom Asset Management System** - A two-tier role-based asset/report management web application. Admins create and manage asset reports; Teknisi (technicians) can view assigned reports. Full-stack Node.js + React + SQLite.

## Architecture Fundamentals

### Tech Stack
- **Backend**: Express.js (CommonJS), SQLite3, JWT auth, Bcryptjs hashing
- **Frontend**: React 19 + React Router 7, Vite (rolldown), CSS (no styling frameworks)
- **Dev**: Concurrently for parallel dev servers, ESLint for code quality

### Critical Data Flow
1. **Auth**: Login → JWT token + role stored in localStorage → Protected API calls via `Authorization: Bearer {token}` header
2. **Reports**: Admin creates → SQLite stores (id, email_pelapor, nama_barang, unit, deskripsi, image_url[1-3], status, tanggal) → Frontend fetches via `/api/reports`
3. **Role-based Access**: Backend middleware enforces roles at route level; frontend uses localStorage role for conditional routing

### Database Schema (SQLite)
- `admins` - Admin accounts (username, password_hash, password_changed_at)
- `teknisi` - Technician accounts (same structure as admins)
- `reports` - Asset reports with 3 image URLs, status tracking (To-Do/In Progress/Done)
- `users` - General users (minimal, for future expansion)

## Development Workflows

### Start Development
```bash
npm run dev              # Runs backend (port 4000) + frontend (port 5173) concurrently
npm run backend:dev     # Backend only (http://localhost:4000)
npm run frontend:dev    # Frontend only (http://localhost:5173)
```

### Build & Preview
```bash
npm run build           # Builds frontend for production
npm run preview         # Previews production build locally
npm run lint            # ESLint check
```

### Test APIs (with auth)
1. Login: `POST /api/login` → get JWT token
2. Use token header: `Authorization: Bearer {token}`
3. Key endpoints: `/api/reports`, `/api/reports/{id}/status` (PUT)

## Code Patterns & Conventions

### Backend
- **Auth Middleware** ([backend/middleware/auth.js](backend/middleware/auth.js#L1)): 
  - `authenticateToken()` - Validates JWT, checks if password changed since token issued (auto-logout)
  - `requireAdmin()`, `requireAdminOrTeknisi()` - Role-based access control
- **Route Organization**: Shared routes (auth, reports) in [backend/routes/shared/](backend/routes/shared/) are role-agnostic; admin/teknisi folders for role-specific logic
- **Error Handling**: Return descriptive errors with status codes; rate-limit errors on login (`5 attempts/15min`)
- **Input Validation**: Use `express-validator` (body validators) on all routes accepting data

### Frontend
- **State Management**: useState for local component state; localStorage for auth persistence (token, role, userName)
- **Auth Sync**: [App.jsx](frontend/src/App.jsx#L24) uses `useLayoutEffect` to hydrate auth state before render; `useEffect` watches storage for multi-tab sync
- **API Calls**: Fetch with `Authorization: Bearer` header; always include `Content-Type: application/json`
- **Routing**: 
  - Unauthenticated: `/login`
  - Admin: `/laporan-aset`, `/laporan/{id}`
  - Teknisi: `/teknisi/laporan-aset`, `/teknisi/laporan/{id}`
- **Component Structure**: Split by role (admin/, teknisi/, shared/) with CSS files co-located
- **History Prevention**: Custom popstate handler prevents navigation back to login page ([App.jsx](frontend/src/App.jsx#L39))

### Session Handling
- Backend stores session in `req.session.user` (Express-session with SQLite store)
- Frontend relies on JWT (stateless) with localStorage persistence
- Password-changed detection in JWT middleware ([backend/middleware/auth.js](backend/middleware/auth.js#L29)) forces re-login if admin changes password

## Security Practices
- ✅ **JWT expiry**: 2 hours (configurable via `JWT_EXPIRY` env var)
- ✅ **Rate limiting**: 5 login attempts/15min; 100 req/15min general
- ✅ **Password hashing**: Bcryptjs (12 rounds)
- ✅ **CORS**: Whitelist in `ALLOWED_ORIGINS` env var (default: localhost:5173)
- ✅ **Helmet security headers**: CSP, HSTS enabled
- ✅ **Request validation**: All form inputs validated via express-validator

## File Organization & Key Locations
- **Backend config**: [backend/index.js](backend/index.js) (middleware stack, JWT validation)
- **Database setup**: [backend/db.js](backend/db.js) (table schemas, promise-wrapped queries)
- **Auth logic**: [backend/routes/shared/auth.js](backend/routes/shared/auth.js) (login endpoint)
- **Protected routes**: [backend/routes/shared/reports.js](backend/routes/shared/reports.js) (report management)
- **Frontend router**: [frontend/src/App.jsx](frontend/src/App.jsx) (route definitions, auth guards)
- **Login page**: [frontend/src/shared/Login.jsx](frontend/src/shared/Login.jsx) (auth UI, token storage)

## Important Notes
- SQLite is sufficient for development; production with high concurrency should migrate to PostgreSQL/MySQL
- Frontend uses Vite with rolldown (custom bundler), not standard rollup
- No TypeScript—use JSDoc comments for critical type hints
- Image uploads handled via Multer; verify destination paths exist ([backend/data/uploads/](backend/data/uploads/))
- Environment variables required: `JWT_SECRET` (≥32 chars), `NODE_ENV`, `PORT`, `ALLOWED_ORIGINS`
