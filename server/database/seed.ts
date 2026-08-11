import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../src/config/database.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seed...");
    const password = "Admin@123";
    const passwordHash = await bcrypt.hash(password, 12);

    const users = [
      {
        name: "System Admin",
        email: "admin@erpflow.com",
        role: "ADMIN",
      },
      {
        name: "Sales User",
        email: "sales@erpflow.com",
        role: "SALES",
      },
      {
        name: "Warehouse User",
        email: "warehouse@erpflow.com",
        role: "WAREHOUSE",
      },
      {
        name: "Accounts User",
        email: "accounts@erpflow.com",
        role: "ACCOUNTS",
      },
    ];

    for (const user of users) {
      await pool.execute(
        `
        INSERT INTO users (id, name, email, password_hash, role)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          password_hash = VALUES(password_hash),
          role = VALUES(role)
        `,
        [crypto.randomUUID(), user.name, user.email, passwordHash, user.role]
      );
    }

    console.log("✅ Users seeded (insert or update)");

    const [userRows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, email, role FROM users WHERE email IN (?, ?, ?, ?)`,
      users.map((u) => u.email)
    );

    const warehouseUser = userRows.find((u) => u.role === "WAREHOUSE");
    if (!warehouseUser) {
      throw new Error("Warehouse user not found after seed");
    }

    const customers = [
      {
        name: "Rahul Sharma",
        mobile: "9876543210",
        email: "rahul@abctraders.com",
        businessName: "ABC Traders",
        gstNumber: "24ABCDE1234F1Z5",
        customerType: "WHOLESALE",
        address: "Ahmedabad, Gujarat",
        status: "ACTIVE",
        followUpDate: "2026-08-15",
        notes: "Regular wholesale customer",
      },
      {
        name: "Priya Patel",
        mobile: "9876543211",
        email: "priya@xyzretail.com",
        businessName: "XYZ Retail",
        gstNumber: null,
        customerType: "RETAIL",
        address: "Vadodara, Gujarat",
        status: "LEAD",
        followUpDate: "2026-08-18",
        notes: "Interested in bulk purchase",
      },
      {
        name: "Amit Shah",
        mobile: "9876543212",
        email: "amit@kumarco.com",
        businessName: "Kumar & Co.",
        gstNumber: "24FGHIJ5678K1Z2",
        customerType: "DISTRIBUTOR",
        address: "Surat, Gujarat",
        status: "ACTIVE",
        followUpDate: "2026-08-20",
        notes: "Distributor for South Gujarat",
      },
    ];

    for (const customer of customers) {
      const [existing] = await pool.execute<RowDataPacket[]>(
        `SELECT id FROM customers WHERE mobile = ? LIMIT 1`,
        [customer.mobile]
      );

      if (existing.length > 0) {
        continue;
      }

      await pool.execute(
        `
        INSERT INTO customers (
          id, name, mobile, email, business_name, gst_number,
          customer_type, address, status, follow_up_date, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          crypto.randomUUID(),
          customer.name,
          customer.mobile,
          customer.email,
          customer.businessName,
          customer.gstNumber,
          customer.customerType,
          customer.address,
          customer.status,
          customer.followUpDate,
          customer.notes,
        ]
      );
    }

    console.log("✅ Customers seeded (skipped existing)");

    const products = [
      {
        name: "Wireless Keyboard",
        sku: "KB001",
        category: "Electronics",
        unitPrice: 899.0,
        currentStock: 50,
        minStockAlert: 10,
        warehouseLocation: "A-01",
      },
      {
        name: "Wireless Mouse",
        sku: "MS001",
        category: "Electronics",
        unitPrice: 499.0,
        currentStock: 100,
        minStockAlert: 20,
        warehouseLocation: "A-02",
      },
      {
        name: "USB-C Cable",
        sku: "CB001",
        category: "Accessories",
        unitPrice: 299.0,
        currentStock: 15,
        minStockAlert: 20,
        warehouseLocation: "B-01",
      },
      {
        name: "Laptop Stand",
        sku: "LS001",
        category: "Accessories",
        unitPrice: 1299.0,
        currentStock: 30,
        minStockAlert: 5,
        warehouseLocation: "B-02",
      },
    ];

    for (const product of products) {
      const [result] = await pool.execute<ResultSetHeader>(
        `
        INSERT INTO products (
          id, name, sku, category, unit_price,
          current_stock, min_stock_alert, warehouse_location
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          category = VALUES(category),
          unit_price = VALUES(unit_price),
          min_stock_alert = VALUES(min_stock_alert),
          warehouse_location = VALUES(warehouse_location)
        `,
        [
          crypto.randomUUID(),
          product.name,
          product.sku,
          product.category,
          product.unitPrice,
          product.currentStock,
          product.minStockAlert,
          product.warehouseLocation,
        ]
      );

      // Only create initial stock movement for newly inserted products
      if (result.affectedRows === 1) {
        const [rows] = await pool.execute<RowDataPacket[]>(
          `SELECT id, current_stock FROM products WHERE sku = ? LIMIT 1`,
          [product.sku]
        );
        const saved = rows[0];
        if (!saved) continue;

        await pool.execute(
          `
          INSERT INTO stock_movements (
            id, product_id, quantity, movement_type, reason, created_by
          )
          VALUES (?, ?, ?, 'IN', ?, ?)
          `,
          [
            crypto.randomUUID(),
            saved.id,
            saved.current_stock,
            "Initial stock",
            warehouseUser.id,
          ]
        );
      }
    }

    console.log("✅ Products seeded (insert or update)");
    console.log("✅ Stock movements seeded for new products only");

    console.log("");
    console.log("🎉 Database seeded successfully!");
    console.log("");
    console.log("Test credentials:");
    console.log("--------------------------------");
    console.log("ADMIN:     admin@erpflow.com / Admin@123");
    console.log("SALES:     sales@erpflow.com / Admin@123");
    console.log("WAREHOUSE: warehouse@erpflow.com / Admin@123");
    console.log("ACCOUNTS:  accounts@erpflow.com / Admin@123");
    console.log("--------------------------------");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Database seed failed:");
    console.error(error);
    await pool.end();
    process.exit(1);
  }
};

seedDatabase();
