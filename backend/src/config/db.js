import mongoose from 'mongoose';
import env from './env.js';

export const connectDB = async () => {
  try {
    const mongoUri = env.MONGODB_URI;

    if (!mongoUri || mongoUri.includes('<username>') || mongoUri.includes('<password>')) {
      console.warn('\n⚠️ WARNING: MONGO_URI is using placeholder values or is not set properly in .env.');
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Don't exit process in development to keep server up if mongo connection is retried or offline
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB;
