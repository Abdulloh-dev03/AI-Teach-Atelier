import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import type { Request, Response } from "express";
import cookieParser from "cookie-parser";
import logger from "#config/logger.js";
import executeRoutes from "#routes/executeRoutes.js";
import authRoutes from "#routes/auth.route.js";
import problemRoutes from "#routes/problem.route.js";
import submissionRoutes from "#routes/submission.route.js";
import chatRoutes from "#routes/chat.routes.js"
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

app.use(cors(
  {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }
));

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

app.use("/api", executeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/chat", chatRoutes);

export default app;