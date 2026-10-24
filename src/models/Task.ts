import mongoose, { Schema, Document } from "mongoose";

export interface IRecurrence {
  type: "none" | "daily" | "weekly" | "monthly" | "custom";
  interval: number;
  weekdays: number[];
  endDate?: string | null;
}

export interface IReminder {
  enabled: boolean;
  repeatEveryMinutes: number;
}

export interface ITask extends Document {
  userId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  timeZone: string;
  startDate: string; // YYYY-MM-DD
  dueTime: string | null; // HH:mm
  recurrence: IRecurrence;
  reminder: IReminder;
  status: "active" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    timeZone: {
      type: String,
      default: "Asia/Kolkata",
    },
    startDate: {
      type: String, // YYYY-MM-DD in user's timezone
      required: true,
    },
    dueTime: {
      type: String, // HH:mm; null means no fixed due time
      default: null,
    },
    recurrence: {
      type: {
        type: String,
        enum: ["none", "daily", "weekly", "monthly", "custom"],
        default: "none",
      },
      interval: {
        type: Number,
        default: 1,
        min: 1,
      },
      weekdays: {
        type: [Number], // 0=Sunday, 1=Monday, ... 6=Saturday
        default: [],
      },
      endDate: {
        type: String,
        default: null,
      },
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: true,
      },
      repeatEveryMinutes: {
        type: Number,
        default: 60,
        min: 60,
      },
    },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>("Task", taskSchema);
