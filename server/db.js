import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, 'data');
const dbPath = path.join(dbDir, 'diwali_orders.db');

// In-memory fallback map (active on Vercel and whenever SQLite is not needed)
const memoryStore = new Map();
let db = null;

// Initialize database schema
export async function initDb() {
  if (process.env.VERCEL) {
    console.log('Running on Vercel serverless: using resilient memoryStore + Google Sheets sync.');
    return;
  }

  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const sqliteModule = await import('sqlite3');
    const sqlite3 = sqliteModule.default || sqliteModule;

    await new Promise((resolve) => {
      db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.warn('SQLite init warning:', err.message);
          db = null;
          return resolve();
        }
        console.log('Connected to SQLite database at:', dbPath);

        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            delivery_address TEXT,
            special_instructions TEXT,
            items TEXT NOT NULL,
            total_order_value REAL NOT NULL,
            booking_amount REAL NOT NULL DEFAULT 50.0,
            remaining_balance REAL NOT NULL,
            payment_status TEXT NOT NULL DEFAULT 'PENDING',
            cashfree_order_id TEXT,
            cashfree_payment_id TEXT,
            cashfree_payment_session_id TEXT,
            payment_details TEXT,
            fulfillment_type TEXT DEFAULT 'delivery',
            delivery_fee REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `;

        db.run(createTableQuery, () => {
          db.run("ALTER TABLE orders ADD COLUMN fulfillment_type TEXT DEFAULT 'delivery'", () => {});
          db.run("ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0", () => {});
          console.log('Orders table verified/created successfully.');
          resolve();
        });
      });
    });
  } catch (err) {
    console.warn('SQLite loading skipped, using in-memory store:', err.message);
    db = null;
  }
}

// Create a new order
export function createOrderRecord(order) {
  // Always record in memoryStore
  memoryStore.set(order.id, { ...order });

  return new Promise((resolve) => {
    if (!db) {
      return resolve({ id: order.id, ...order });
    }

    const sql = `
      INSERT INTO orders (
        id,
        customer_name,
        customer_phone,
        delivery_address,
        special_instructions,
        items,
        total_order_value,
        booking_amount,
        remaining_balance,
        payment_status,
        cashfree_order_id,
        cashfree_payment_session_id,
        fulfillment_type,
        delivery_fee,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;

    const params = [
      order.id,
      order.customer_name,
      order.customer_phone,
      order.delivery_address || '',
      order.special_instructions || '',
      JSON.stringify(order.items),
      order.total_order_value,
      order.booking_amount || 0,
      order.remaining_balance,
      order.payment_status || 'CONFIRMED',
      order.cashfree_order_id || null,
      order.cashfree_payment_session_id || null,
      order.fulfillment_type || 'delivery',
      order.delivery_fee || 0
    ];

    db.run(sql, params, function (err) {
      if (err) {
        console.warn('SQLite insert warning (preserved in memoryStore):', err.message);
      }
      resolve({ id: order.id, ...order });
    });
  });
}

// Get order by ID
export function getOrderById(orderId) {
  return new Promise((resolve) => {
    if (!db) {
      return resolve(memoryStore.get(orderId) || null);
    }

    const sql = `SELECT * FROM orders WHERE id = ?`;
    db.get(sql, [orderId], (err, row) => {
      if (err || !row) {
        return resolve(memoryStore.get(orderId) || null);
      }
      try {
        row.items = JSON.parse(row.items);
        if (row.payment_details) {
          row.payment_details = JSON.parse(row.payment_details);
        }
      } catch (e) {
        // preserve as string if parse fails
      }
      resolve(row);
    });
  });
}

// Update payment status for order
export function markOrderPaymentStatus(orderId, { status, paymentId, paymentDetails }) {
  const existing = memoryStore.get(orderId);
  if (existing) {
    existing.payment_status = status;
    if (paymentId) existing.cashfree_payment_id = paymentId;
    if (paymentDetails) existing.payment_details = paymentDetails;
    memoryStore.set(orderId, existing);
  }

  return new Promise((resolve) => {
    if (!db) {
      return resolve({ changes: 1 });
    }

    const sql = `
      UPDATE orders 
      SET 
        payment_status = ?,
        cashfree_payment_id = COALESCE(?, cashfree_payment_id),
        payment_details = COALESCE(?, payment_details),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const detailsStr = paymentDetails ? JSON.stringify(paymentDetails) : null;

    db.run(sql, [status, paymentId || null, detailsStr, orderId], function (err) {
      if (err) {
        console.warn('SQLite update warning:', err.message);
      }
      resolve({ changes: this ? this.changes : 1 });
    });
  });
}

export default {
  initDb,
  createOrderRecord,
  getOrderById,
  markOrderPaymentStatus
};
