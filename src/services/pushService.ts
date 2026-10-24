import DeviceToken from "../models/DeviceToken.js";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessagePayload {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  const tokens = await DeviceToken.find({ userId }).select("expoPushToken");
  if (!tokens || tokens.length === 0) return;

  const messages = tokens.map((t) => ({
    to: t.expoPushToken,
    title,
    body,
    data,
    sound: "default",
    channelId: "task-reminders",
    priority: "high",
  }));

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const result = (await response.json()) as {
      data?: Array<{
        status: "ok" | "error";
        message?: string;
        details?: { error?: string };
      }>;
    };

    if (result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const item = result.data[i];
        if (item.status === "error" && item.details?.error === "DeviceNotRegistered") {
          const badToken = messages[i]?.to;
          if (badToken) {
            await DeviceToken.deleteOne({ expoPushToken: badToken });
            console.log(`[Push] Cleaned up unregistered token: ${badToken}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("[Push] Failed to deliver push notification:", err);
  }
}
