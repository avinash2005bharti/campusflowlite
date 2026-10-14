import dns from 'node:dns';
import mongoose from 'mongoose';
import env from './env.js';

// Resolve DNS SRV query issues commonly encountered on Windows / local ISP DNS resolvers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);
} catch (dnsErr) {
  // If DNS reconfiguration fails in specific runtime environments, continue normally
}

export const connectDB = async () => {
  const mongoUri = env.MONGODB_URI;

  if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('<password>')) {
    console.warn('\n⚠️ WARNING: MONGO_URI is using placeholder values or is not set properly in .env.');
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // If local DNS fails with querySrv ECONNREFUSED, retry once with public DNS
    if (error.code === 'ECONNREFUSED' && error.syscall === 'querySrv') {
      try {
        console.warn('⚠️ MongoDB SRV lookup failed on local DNS. Retrying with Google/Cloudflare DNS (8.8.8.8)...');
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const conn = await mongoose.connect(mongoUri);
        console.log(`✅ MongoDB Connected (via DNS fallback): ${conn.connection.host}`);
        return conn;
      } catch (retryError) {
        console.error(`❌ MongoDB Connection Retry Error: ${retryError.message}`);
      }
    }

    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't exit process in development to keep server up if mongo connection is retried or offline
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
