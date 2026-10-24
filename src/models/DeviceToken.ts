import mongoose, { Schema, Document } from "mongoose";

export interface IDeviceToken extends Document {
  userId: string;
  expoPushToken: string;
  platform: string;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema<IDeviceToken>(
  {
    userId: { type: String, required: true, index: true },
    expoPushToken: { type: String, required: true, unique: true },
    platform: { type: String, default: "android" },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model<IDeviceToken>("DeviceToken", deviceTokenSchema);
