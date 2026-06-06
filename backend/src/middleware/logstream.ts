import type { Request, Response, NextFunction } from "express";
import axios from "axios";
import "dotenv/config";

/**
 * Extract Browser + OS from User-Agent
 */
function parseUserAgent(userAgentStr: string | undefined) {
  if (!userAgentStr) {
    return {
      browser: "Unknown Browser",
      os: "Unknown OS",
    };
  }

  let os = "Unknown OS";

  if (userAgentStr.includes("Windows")) os = "Windows";
  else if (userAgentStr.includes("Macintosh")) os = "macOS";
  else if (userAgentStr.includes("Linux")) os = "Linux";
  else if (userAgentStr.includes("Android")) os = "Android";
  else if (
    userAgentStr.includes("iPhone") ||
    userAgentStr.includes("iPad")
  ) {
    os = "iOS";
  }

  let browser = "Unknown Browser";

  if (userAgentStr.includes("Firefox")) browser = "Firefox";
  else if (userAgentStr.includes("Chrome")) browser = "Chrome";
  else if (
    userAgentStr.includes("Safari") &&
    !userAgentStr.includes("Chrome")
  ) {
    browser = "Safari";
  } else if (userAgentStr.includes("Edge")) {
    browser = "Edge";
  }

  return { browser, os };
}

/**
 * Returns the real URL in both local and production environments.
 */
function getFullUrl(req: Request): string {
  const protocol =
    (req.headers["x-forwarded-proto"] as string) ||
    req.protocol ||
    "http";

  const host =
    (req.headers["x-forwarded-host"] as string) ||
    req.headers.host ||
    `localhost:${req.socket.localPort || 3000}`;

  return `${protocol}://${host}${req.originalUrl}`;
}

/**
 * Send log to LogStream
 */
async function streamLog(
  message: string,
  level: "INFO" | "WARNING" | "ERROR" | "CRITICAL",
  url: string,
  browser: string,
  os: string,
  stackTrace?: string
) {
  try {
    const payload: Record<string, unknown> = {
      apiKey: process.env.LOGSTREAM_API_KEY,
      message,
      level,
      url,
      browser,
      os,
    };

    if (stackTrace) {
      payload.stackTrace = stackTrace;
    }

    await axios.post(
      process.env.LOGSTREAM_INGEST_URL as string,
      payload
    );
  } catch (error: any) {
    if (error.response) {
      console.error(
        `🚨 LogStream Rejected [${error.response.status}]`,
        error.response.data
      );
    } else {
      console.error(
        "⚠️ LogStream transmission failed:",
        error.message
      );
    }
  }
}

/**
 * Request Logger Middleware
 */
export const logstreamLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const startTime = Date.now();

  const { browser, os } = parseUserAgent(
    req.headers["user-agent"]
  );

  res.on("finish", () => {
    const duration = Date.now() - startTime;

    const fullUrlWithHost = getFullUrl(req);

    if (res.statusCode < 400) {
      const message = `API Call Success: ${req.method} ${req.originalUrl} -> Status ${res.statusCode} (${duration}ms)`;

      streamLog(
        message,
        "INFO",
        fullUrlWithHost,
        browser,
        os
      );
    } else if (
      res.statusCode >= 400 &&
      res.statusCode < 500
    ) {
      const message = `API Client Warning: ${req.method} ${req.originalUrl} returned status ${res.statusCode}`;

      streamLog(
        message,
        "WARNING",
        fullUrlWithHost,
        browser,
        os
      );
    }
  });

  next();
};

/**
 * Central Error Handler Middleware
 */
export const logstreamErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { browser, os } = parseUserAgent(
    req.headers["user-agent"]
  );

  const fullUrlWithHost = getFullUrl(req);

  const statusCode = err.status || 500;

  const level =
    statusCode >= 500 ? "CRITICAL" : "ERROR";

  const errorMessage =
    `System Crash Intercepted: ` +
    `[${req.method} ${req.originalUrl}] ` +
    `Status ${statusCode} - ` +
    `Error: ${err.message || "Unknown Application Exception"}`;

  streamLog(
    errorMessage,
    level,
    fullUrlWithHost,
    browser,
    os,
    err.stack
  );

  res.status(statusCode).json({
    error:
      err.message ||
      "An internal application error occurred.",
  });
};