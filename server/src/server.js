import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);
const production = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET ?? "development-only-secret-change-me";

if (production && sessionSecret === "development-only-secret-change-me") {
  throw new Error("SESSION_SECRET must be configured in production.");
}

createApp({ sessionSecret, production }).listen(port, () => {
  console.log(`Cinema API: http://localhost:${port}`);
});
