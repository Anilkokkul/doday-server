import express from "express";
import cors from "cors";
import { authMiddleware } from "./middleware/auth.js";
import { errorHandler } from "./middleware/errorHandler.js";
import tasksRouter from "./routes/tasks.js";
import occurrencesRouter from "./routes/occurrences.js";
import pushRouter from "./routes/push.js";
import settingsRouter from "./routes/settings.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Unauthenticated routes

app.get("/",(req,res)=>{
  res.json({ status: "ok", timestamp: new Date().toISOString(),message:"Server is running successfully "});
})


// Authenticated API routes
app.use("/api", authMiddleware);
app.use("/api/tasks", tasksRouter);
app.use("/api/occurrences", occurrencesRouter);
app.use("/api/push", pushRouter);
app.use("/api/settings", settingsRouter);

// Central error handler
app.use(errorHandler);

export default app;
