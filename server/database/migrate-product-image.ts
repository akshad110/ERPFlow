import "../src/config/env";
import { pool } from "../src/config/database";

async function main() {
  try {
    await pool.query(`
      ALTER TABLE products
      ADD COLUMN image_url VARCHAR(500) NULL AFTER warehouse_location
    `);
    console.log("Added products.image_url column");
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: string }).code)
        : "";

    if (code === "ER_DUP_FIELDNAME") {
      console.log("products.image_url already exists");
    } else {
      throw error;
    }
  } finally {
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
