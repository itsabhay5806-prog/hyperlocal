import mongoose from 'mongoose';

export let isDbConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI environment variable is not defined.');
    console.warn('Please provide MONGODB_URI in your environment or AI Studio Secrets.');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isDbConnected = true;
    console.log('✅ Connected successfully to MongoDB Atlas');
    return true;
  } catch (error: any) {
    console.error('❌ MongoDB Atlas connection error:', error.message);
    isDbConnected = false;
    return false;
  }
}

mongoose.connection.on('disconnected', () => {
  isDbConnected = false;
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  isDbConnected = true;
  console.log('🔄 MongoDB reconnected');
});
