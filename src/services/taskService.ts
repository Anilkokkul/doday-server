import mongoose from "mongoose";
import Task, { ITask } from "../models/Task.js";
import TaskOccurrence, { ITaskOccurrence } from "../models/TaskOccurrence.js";
import { generateOccurrenceDates, DateRange } from "./recurrence.js";

function getRollingWindow(days: number = 60): DateRange {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  const from = `${y}-${m}-${d}`;

  const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const fy = future.getUTCFullYear();
  const fm = String(future.getUTCMonth() + 1).padStart(2, "0");
  const fd = String(future.getUTCDate()).padStart(2, "0");
  const to = `${fy}-${fm}-${fd}`;

  return { from, to };
}

function parseOccurrenceDate(dateStr: string, dueTime: string | null): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  let hour = 9;
  let minute = 0;

  if (dueTime) {
    const parts = dueTime.split(":").map(Number);
    if (!isNaN(parts[0])) hour = parts[0];
    if (!isNaN(parts[1])) minute = parts[1];
  }

  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
}

export async function generateOccurrencesForTask(
  task: ITask,
  range?: DateRange
): Promise<ITaskOccurrence[]> {
  const windowRange = range || getRollingWindow(60);
  const dates = generateOccurrenceDates(task.startDate, task.recurrence, windowRange);

  const createdOccurrences: ITaskOccurrence[] = [];

  for (const dateStr of dates) {
    const scheduledAt = parseOccurrenceDate(dateStr, task.dueTime);

    try {
      // Upsert using the unique compound index (taskId, scheduledAt)
      const occurrence = await TaskOccurrence.findOneAndUpdate(
        { taskId: task._id, scheduledAt },
        {
          $setOnInsert: {
            taskId: task._id,
            userId: task.userId,
            scheduledAt,
            status: "pending",
            reminderCount: 0,
          },
        },
        { upsert: true, new: true }
      );
      if (occurrence) createdOccurrences.push(occurrence);
    } catch (err: unknown) {
      // Ignore duplicate key error (11000) if concurrent creation occurs
      const mongoErr = err as { code?: number };
      if (mongoErr?.code !== 11000) {
        console.error("[TaskService] Error upserting occurrence:", err);
      }
    }
  }

  return createdOccurrences;
}

export async function createTaskWithOccurrences(
  taskData: Partial<ITask>
): Promise<{ task: ITask; occurrences: ITaskOccurrence[] }> {
  const task = new Task(taskData);
  await task.save();

  const occurrences = await generateOccurrencesForTask(task);
  return { task, occurrences };
}

export async function ensureOccurrencesForRange(
  userId: string,
  range: DateRange
): Promise<void> {
  const tasks = await Task.find({ userId, status: "active" });
  for (const task of tasks) {
    await generateOccurrencesForTask(task, range);
  }
}
