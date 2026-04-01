import app from "./app.js";

const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, () => {
  console.log(`[server]: Server is running on http://localhost:${PORT}`);
});
