import dotenv from "dotenv";
import path from "path";

// Prefer local .env in development; production (Docker/Render) uses process env.
dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  quiet: true,
});
