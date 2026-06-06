import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import "dotenv/config";
import type { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import multer from "multer";
import logger from "#config/logger.js";
import { logstreamLogger, logstreamErrorHandler } from "#middleware/logstream.js";
import executeRoutes from "#routes/executeRoutes.js";
import authRoutes from "#routes/auth.route.js";
import problemRoutes from "#routes/problem.route.js";
import submissionRoutes from "#routes/submission.route.js";
import chatRoutes from "#routes/chat.routes.js";
import cloudinaryRoutes from "#routes/cloudinary.route.js";
import userRoutes from "#routes/user.route.js";
import cors from "cors";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

app.use(
  morgan("combined", {
    stream: { write: (message: string) => logger.info(message.trim()) },
  }),
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.get("/", (_req: Request, res: Response) => {
  logger.info("Hello from Code Execution API!");
  res.status(200).send("Hello from Code Execution API!");
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/api", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Code Execution API is running!" });
});

app.use(logstreamLogger);

app.use("/api", executeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/cloudinary", cloudinaryRoutes);

app.use(logstreamErrorHandler);

// Multer-specific error handler (file size / type violations → 400)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "File too large. Maximum allowed size is 2 MB." });
    }
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof Error && err.message.startsWith("Only image")) {
    return res.status(400).json({ error: err.message });
  }
  _next(err);
});

export default app;
