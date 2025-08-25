const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
      retryWrites: true,
      w: 'majority',
      readPreference: 'primary',
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000,
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000
    });

    console.log(`📦 MongoDB Connected: ${conn.connection.host}`);
    
    // Enhanced connection monitoring
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
      // Attempt to reconnect
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to MongoDB...');
        connectDB().catch(console.error);
      }, 5000);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
      // Attempt to reconnect
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect to MongoDB...');
        connectDB().catch(console.error);
      }, 5000);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established');
    });

    // Monitor connection health
    setInterval(() => {
      const state = mongoose.connection.readyState;
      if (state !== 1) {
        console.warn(`⚠️  MongoDB connection state: ${state} (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)`);
      }
    }, 30000); // Check every 30 seconds

    // Graceful shutdown
    process.on('SIGINT', async () => {
      console.log('🔄 Closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed through app termination');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('🔄 Closing MongoDB connection...');
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed through app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error; // Re-throw to let the calling function handle it
  }
};

module.exports = connectDB;
