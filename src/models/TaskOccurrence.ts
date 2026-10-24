import mongoose, { Schema, Document } from "mongoose";

export interface ITaskOccurrence extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: string;
  scheduledAt: Date;
  status: "pending" | "completed" | "skipped";
  completedAt: Date | null;
  nextReminderAt: Date | null;
  lastReminderAt: Date | null;
  reminderCount: number;
  snoozedUntil: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const occurrenceSchema = new Schema<ITaskOccurrence>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    nextReminderAt: {
      type: Date,
      default: null,
    },
    lastReminderAt: {
      type: Date,
      default: null,
    },
    reminderCount: {
      type: Number,
      default: 0,
    },
    snoozedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

occurrenceSchema.index({ taskId: 1, scheduledAt: 1 }, { unique: true });
occurrenceSchema.index({ userId: 1, status: 1, scheduledAt: 1 });

export default mongoose.model<ITaskOccurrence>("TaskOccurrence", occurrenceSchema);
