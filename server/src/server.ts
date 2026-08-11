import "./config/env";
import app from "./app";
import { pool } from "./config/database.js";

const PORT = Number(process.env.PORT) || 5000;

const startServer = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("MySQL connected successfully.");
    conn.release();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Connection failed:", error);
    process.exit(1);
  }
};

startServer();
