// Konfigurasi session
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

module.exports = session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: './data' }),
  secret: process.env.SESSION_SECRET || 'supersecretkeyyangpanjangbanget',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 2, 
    httpOnly: true,
    secure: false // set true jika pakai https
  }
});
