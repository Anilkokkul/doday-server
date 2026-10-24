import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import DeviceToken from "../models/DeviceToken.js";
import { sendPushToUser } from "../services/pushService.js";

const router = Router();

const RegisterSchema = z.object({
  token: z.string().startsWith("ExponentPushToken["),
  platform: z.string().optional().default("android"),
});

// POST /api/push/register - Save / update Expo push token
router.post("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, platform } = RegisterSchema.parse(req.body);
    const userId = req.user?.id || "default-user";

    const saved = await DeviceToken.findOneAndUpdate(
      { expoPushToken: token },
      { userId, expoPushToken: token, platform, lastSeenAt: new Date() },
      { upsert: true, new: true }
    );

    res.json({ success: true, token: saved.expoPushToken });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/push/register - Unregister push token
router.delete("/register", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = z.object({ token: z.string() }).parse(req.body);
    const userId = req.user?.id || "default-user";

    await DeviceToken.deleteOne({ expoPushToken: token, userId });
    res.json({ success: true, message: "Token unregistered" });
  } catch (error) {
    next(error);
  }
});

// POST /api/push/test - Trigger a test push notification to user's registered devices
router.post("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || "default-user";
    await sendPushToUser(
      userId,
      "Test Push Notification",
      "Your push notification service is working properly!",
      { type: "test" }
    );
    res.json({ success: true, message: "Push message dispatched" });
  } catch (error) {
    next(error);
  }
});

export default router;
