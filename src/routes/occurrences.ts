import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import TaskOccurrence from "../models/TaskOccurrence.js";
import { ensureOccurrencesForRange } from "../services/taskService.js";

const router = Router();

// GET /api/occurrences?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    const fromStr = (req.query.from as string) || new Date().toISOString().slice(0, 10);
    const toStr = (req.query.to as string) || fromStr;

    // Ensure any recurring tasks have occurrences generated for this range
    await ensureOccurrencesForRange(userId, { from: fromStr, to: toStr });

    const fromDate = new Date(`${fromStr}T00:00:00.000Z`);
    const toDate = new Date(`${toStr}T23:59:59.999Z`);

    const occurrences = await TaskOccurrence.find({
      userId,
      scheduledAt: { $gte: fromDate, $lte: toDate },
    })
      .populate("taskId")
      .sort({ scheduledAt: 1 });

    res.json(occurrences);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/occurrences/:id/complete
router.patch("/:id/complete", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    const occurrence = await TaskOccurrence.findOne({ _id: req.params.id, userId });

    if (!occurrence) {
      res.status(404).json({ error: "Occurrence not found" });
      return;
    }

    occurrence.status = "completed";
    occurrence.completedAt = new Date();
    occurrence.nextReminderAt = null;
    await occurrence.save();

    res.json(occurrence);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/occurrences/:id/snooze
const SnoozeSchema = z.object({
  snoozedUntil: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
});

router.patch("/:id/snooze", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    const { snoozedUntil } = SnoozeSchema.parse(req.body);

    const occurrence = await TaskOccurrence.findOne({ _id: req.params.id, userId });
    if (!occurrence) {
      res.status(404).json({ error: "Occurrence not found" });
      return;
    }

    occurrence.snoozedUntil = new Date(snoozedUntil);
    occurrence.nextReminderAt = new Date(snoozedUntil);
    occurrence.reminderCount += 1;
    await occurrence.save();

    res.json(occurrence);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/occurrences/:id/reschedule
const RescheduleSchema = z.object({
  scheduledAt: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)),
});

router.patch("/:id/reschedule", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    const { scheduledAt } = RescheduleSchema.parse(req.body);

    const occurrence = await TaskOccurrence.findOne({ _id: req.params.id, userId });
    if (!occurrence) {
      res.status(404).json({ error: "Occurrence not found" });
      return;
    }

    occurrence.scheduledAt = new Date(scheduledAt);
    occurrence.nextReminderAt = new Date(scheduledAt);
    await occurrence.save();

    res.json(occurrence);
  } catch (error) {
    next(error);
  }
});

export default router;
