import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../env') });
dotenv.config();

// Normalize alternative env variable names
if (!process.env.JWT_ACCESS_SECRET && process.env.JWT_SECRET) {
  process.env.JWT_ACCESS_SECRET = process.env.JWT_SECRET;
}
if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
  process.env.MONGODB_URI = process.env.MONGO_URI;
}
if (!process.env.EMAIL_FROM && process.env.BREVO_SENDER_EMAIL) {
  process.env.EMAIL_FROM = process.env.BREVO_SENDER_EMAIL;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default(process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/campusflow_lite'),
  JWT_ACCESS_SECRET: z.string().default(process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret_key_change_in_production_123'),
  JWT_REFRESH_SECRET: z.string().default(process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_change_in_production_456'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(7),
  
  IMAGEKIT_PUBLIC_KEY: z.string().optional().default(''),
  IMAGEKIT_PRIVATE_KEY: z.string().optional().default(''),
  IMAGEKIT_URL_ENDPOINT: z.string().optional().default(''),
  
  LEAVE_MAX_DAYS: z.coerce.number().default(30),
  LEAVE_BACKDATE_DAYS: z.coerce.number().default(7),
  ESCALATION_HOURS: z.coerce.number().default(48),
  TZ: z.string().default('Asia/Kolkata'),
  
  EMAIL_ENABLED: z
    .string()
    .optional()
    .transform((val) => val === 'true')
    .default(false),
  BREVO_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().optional().default('no-reply@campusflow.edu'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  throw new Error('Environment configuration error');
}

export const env = parsed.data;
export default env;
