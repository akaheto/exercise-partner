import { config } from "dotenv";

// Match Next.js precedence: .env.local wins over .env. Without this, scripts
// silently target a different database than the running app.
config({ path: ".env.local" });
config({ path: ".env" });
