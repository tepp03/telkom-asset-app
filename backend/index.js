require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { init } = require('./db');
const { apiLimiter } = require('./middleware/rateLimiter');
const authRouter = require('./routes/shared/auth');
const reportsRouter = require('./routes/shared/reports');
const adminRouter = require('./routes/admin');
const teknisiRouter = require('./routes/teknisi');
const sessionConfig = require('./sessionConfig');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('ERROR: JWT_SECRET must be set in .env file and be at least 32 characters long');
  process.exit(1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration - only allow specific origins
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS policy: Origin not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(sessionConfig);

// Logging middleware
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Apply rate limiting to all API routes (dengan whitelist untuk teknisi endpoints)
const rateLimitMiddleware = (req, res, next) => {
  // Skip rate limiting untuk teknisi endpoints
  if (req.path.startsWith('/api/teknisi/reports')) {
    return next();
  }
  apiLimiter(req, res, next);
};

app.use(rateLimitMiddleware);

app.get('/api/health', (req, res) => {
  res.json({ ok: true, environment: NODE_ENV });
});

// Routers
app.use('/api', authRouter);        // /login, /me
app.use('/api', reportsRouter);     // /reports (shared)

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads')));
app.use('/api/admin', adminRouter);   // /admin/users, /admin/dashboard
app.use('/api/teknisi', teknisiRouter); // /teknisi/reports

// Global error handler
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message 
  });
});

init().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  process.exit(1);
});
