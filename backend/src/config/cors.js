import env from './env.js';

// Helper to normalize origin string (trim and strip trailing slash)
const normalizeOrigin = (url) => (url ? url.trim().replace(/\/+$/, '') : '');

/**
 * Build dynamic list of allowed origins from .env configuration
 */
const getAllowedOrigins = () => {
  const origins = new Set();

  // 1. Primary Client URL from .env
  if (env.CLIENT_URL) {
    origins.add(normalizeOrigin(env.CLIENT_URL));
  }

  // 2. Comma-separated ALLOWED_ORIGINS from .env
  if (env.ALLOWED_ORIGINS) {
    env.ALLOWED_ORIGINS.split(',')
      .map(normalizeOrigin)
      .filter(Boolean)
      .forEach((o) => origins.add(o));
  }

  // 3. Fallback defaults for local development only
  if (env.NODE_ENV === 'development') {
    origins.add('http://localhost:5173');
    origins.add('http://localhost:3000');
    origins.add('http://127.0.0.1:5173');
    origins.add('http://127.0.0.1:3000');
  }

  return origins;
};

export const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);

    const allowedOrigins = getAllowedOrigins();
    const reqOrigin = normalizeOrigin(origin);

    // If wildcard '*' is explicitly specified in .env ALLOWED_ORIGINS
    if (allowedOrigins.has('*')) {
      return callback(null, true);
    }

    // Direct match against .env configured origins
    if (allowedOrigins.has(reqOrigin)) {
      return callback(null, true);
    }

    // In development mode, allow any localhost/127.0.0.1 port
    if (env.NODE_ENV === 'development' && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['set-cookie'],
};

export default corsOptions;
