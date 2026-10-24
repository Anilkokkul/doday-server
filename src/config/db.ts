import mongoose from "mongoose";

export async function connectDB(uri?: string): Promise<void> {
  const mongoUri = uri || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/personal-todo";

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`[Database] MongoDB connected: ${mongoUri}`);
  } catch (error) {
    console.warn(`[Database] MongoDB connection warning (${mongoUri}):`, (error as Error).message);
    console.warn("[Database] Running without MongoDB connection. DB operations will fail until MongoDB is started.");
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
