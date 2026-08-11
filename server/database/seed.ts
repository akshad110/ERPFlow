import crypto from "crypto";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { pool } from "../src/config/database.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seed...");
    const password = "Admin@123";

    const passwordHash = await bcrypt.hash(password, 12);
    const users = [
      {
        id: crypto.randomUUID(),
        name: "System Admin",
        email: "admin@erpflow.com",
        role: "ADMIN",
      },
      {
        id: crypto.randomUUID(),
        name: "Sales User",
        email: "sales@erpflow.com",
        role: "SALES",
      },
      {
        id: crypto.randomUUID(),
        name: "Warehouse User",
        email: "warehouse@erpflow.com",
        role: "WAREHOUSE",
      },
      {
        id: crypto.randomUUID(),
        name: "Accounts User",
        email: "accounts@erpflow.com",
        role: "ACCOUNTS",
      },
    ];

    for (const user of users) {
      await pool.execute(
        `
        INSERT INTO users (
          id,
          name,
          email,
          password_hash,
          role
        )
        VALUES (?, ?, ?, ?, ?)
        `,
        [
          user.id,
          user.name,
          user.email,
          passwordHash,
          user.role,
        ]
      );
    }

    console.log("✅ Users seeded successfully");

    const customers = [
      {
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
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
      await pool.execute(
        `
        INSERT INTO customers (
          id,
          name,
          mobile,
          email,
          business_name,
          gst_number,
          customer_type,
          address,
          status,
          follow_up_date,
          notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          customer.id,
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

    console.log("✅ Customers seeded successfully");


    const products = [
      {
        id: crypto.randomUUID(),
        name: "Wireless Keyboard",
        sku: "KB001",
        category: "Electronics",
        unitPrice: 899.0,
        currentStock: 50,
        minStockAlert: 10,
        warehouseLocation: "A-01",
      },
      {
        id: crypto.randomUUID(),
        name: "Wireless Mouse",
        sku: "MS001",
        category: "Electronics",
        unitPrice: 499.0,
        currentStock: 100,
        minStockAlert: 20,
        warehouseLocation: "A-02",
      },
      {
        id: crypto.randomUUID(),
        name: "USB-C Cable",
        sku: "CB001",
        category: "Accessories",
        unitPrice: 299.0,
        currentStock: 15,
        minStockAlert: 20,
        warehouseLocation: "B-01",
      },
      {
        id: crypto.randomUUID(),
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
      await pool.execute(
        `
        INSERT INTO products (
          id,
          name,
          sku,
          category,
          unit_price,
          current_stock,
          min_stock_alert,
          warehouse_location
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          product.id,
          product.name,
          product.sku,
          product.category,
          product.unitPrice,
          product.currentStock,
          product.minStockAlert,
          product.warehouseLocation,
        ]
      );
    }

    console.log("✅ Products seeded successfully");


    const warehouseUser = users.find(
      (user) => user.role === "WAREHOUSE"
    );

    if (!warehouseUser) {
      throw new Error("Warehouse user not found");
    }

    for (const product of products) {
      await pool.execute(
        `
        INSERT INTO stock_movements (
          id,
          product_id,
          quantity,
          movement_type,
          reason,
          created_by
        )
        VALUES (?, ?, ?, 'IN', ?, ?)
        `,
        [
          crypto.randomUUID(),
          product.id,
          product.currentStock,
          "Initial stock",
          warehouseUser.id,
        ]
      );
    }

    console.log("✅ Stock movements seeded successfully");

    console.log("");
    console.log("🎉 Database seeded successfully!");
    console.log("");
    console.log("Test credentials:");
    console.log("--------------------------------");
    console.log("ADMIN:");
    console.log("admin@erpflow.com / Admin@123");
    console.log("");
    console.log("SALES:");
    console.log("sales@erpflow.com / Admin@123");
    console.log("");
    console.log("WAREHOUSE:");
    console.log("warehouse@erpflow.com / Admin@123");
    console.log("");
    console.log("ACCOUNTS:");
    console.log("accounts@erpflow.com / Admin@123");
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