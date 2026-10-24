import { Router, Request, Response } from "express";
import { z } from "zod";

const router = Router();

// In-memory or fallback settings store for single user
let defaultSettings = {
  quietHoursEnabled: false,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  timeZone: "Asia/Kolkata",
  hourlyRemindersEnabled: true,
};

const SettingsSchema = z.object({
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timeZone: z.string().optional(),
  hourlyRemindersEnabled: z.boolean().optional(),
});

router.get("/", (req: Request, res: Response) => {
  res.json(defaultSettings);
});

router.patch("/", (req: Request, res: Response) => {
  const updates = SettingsSchema.parse(req.body);
  defaultSettings = { ...defaultSettings, ...updates };
  res.json(defaultSettings);
});

export default router;
