import app from "./app.js";
import { preWarmImages } from "#src/services/dockerExecutor.js";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    // Pull images on startup so we don't hit the 3s timeout pull during first execution
    await preWarmImages();
  } catch (err) {
    console.warn(
      `[server]: WARNING: Image pre-warming encountered an error:`,
      err,
    );
  } finally {
    app.listen(PORT, () => {
      console.log(`[server]: Server is running on http://localhost:${PORT}`);
    });
  }
};

startServer();
