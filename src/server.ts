import "dotenv/config";
import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  const server = app.listen(PORT, () => {
    console.log(`[Server] DoDay API listening on http://localhost:${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[Server] Port ${PORT} is already in use by another instance.`);
    } else {
      console.error("[Server] Server error:", err);
    }
  });

  // Connect to DB in background
  connectDB().catch((err) => {
    console.warn("[Server] DB connection failed:", err.message);
  });
}

bootstrap().catch((err) => {
  console.error("[Server] Fatal startup error:", err);
  process.exit(1);
});
