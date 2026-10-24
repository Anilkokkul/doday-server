import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import Task from "../models/Task.js";
import TaskOccurrence from "../models/TaskOccurrence.js";
import { createTaskWithOccurrences, generateOccurrencesForTask } from "../services/taskService.js";

const router = Router();

const TaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  timeZone: z.string().default("Asia/Kolkata"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format must be YYYY-MM-DD"),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/, "Format must be HH:mm").nullable().optional(),
  recurrence: z
    .object({
      type: z.enum(["none", "daily", "weekly", "monthly", "custom"]).default("none"),
      interval: z.number().int().min(1).default(1),
      weekdays: z.array(z.number().min(0).max(6)).default([]),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional().default(null),
    })
    .default({ type: "none", interval: 1, weekdays: [], endDate: null }),
  reminder: z
    .object({
      enabled: z.boolean().default(true),
      repeatEveryMinutes: z.number().int().min(15).default(60),
    })
    .default({ enabled: true, repeatEveryMinutes: 60 }),
});

// POST /api/tasks - Create task + initial occurrences
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = TaskSchema.parse(req.body);
    const userId = req.user?.id || "default-user";

    const { task, occurrences } = await createTaskWithOccurrences({
      ...validated,
      userId,
    });

    res.status(201).json({ task, occurrences });
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks - List active tasks
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    const tasks = await Task.find({ userId, status: "active" }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// GET /api/tasks/:id - Get task details
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    const task = await Task.findOne({ _id: req.params.id, userId });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/tasks/:id - Update task
router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    const task = await Task.findOne({ _id: req.params.id, userId });
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const partialSchema = TaskSchema.partial();
    const validated = partialSchema.parse(req.body);
    Object.assign(task, validated);
    await task.save();

    // Regenerate upcoming occurrences if recurrence or start date changed
    if (validated.recurrence || validated.startDate || validated.dueTime !== undefined) {
      await generateOccurrencesForTask(task);
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tasks/:id - Archive task
router.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId },
      { status: "archived" },
      { new: true }
    );
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // Cancel pending occurrences
    await TaskOccurrence.deleteMany({
      taskId: task._id,
      status: "pending",
      scheduledAt: { $gte: new Date() },
    });

    res.json({ message: "Task archived successfully", task });
  } catch (error) {
    next(error);
  }
});

export default router;
