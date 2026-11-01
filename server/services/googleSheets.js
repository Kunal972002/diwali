import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const csvPath = path.join(__dirname, '..', 'data', 'google_sheets_export.csv');

// Initialize local CSV file for Google Sheets compatibility
function initCsvExport() {
  const dir = path.dirname(csvPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(csvPath)) {
    const headers = [
      'Order ID',
      'Date & Time',
      'Customer Name',
      'Mobile Number',
      'Fulfillment Mode',
      'Delivery Address / Pickup Point',
      'Delivery Fee (INR)',
      'Special Instructions',
      'Ordered Items Summary',
      'Total Order Value (INR)',
      'Payment Mode',
      'Status'
    ].join(',') + '\n';
    fs.writeFileSync(csvPath, headers, 'utf8');
  }
}

initCsvExport();

/**
 * Append order record to local CSV (directly importable into Google Sheets)
 */
function appendToLocalCsv(order) {
  try {
    const itemsSummary = Array.isArray(order.items)
      ? order.items.map(i => `${i.productName} (${i.variantLabel}) x ${i.quantity}`).join(' | ')
      : '';

    const isPickup = order.fulfillment_type === 'pickup';
    const fulfillmentLabel = isPickup ? 'Self Pickup' : 'Home Delivery';
    const deliveryFee = order.delivery_fee || 0;
    const paymentMode = isPickup ? 'Pay at Pickup' : 'Pay on Delivery';

    const row = [
      `"${order.id || ''}"`,
      `"${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}"`,
      `"${(order.customer_name || '').replace(/"/g, '""')}"`,
      `"${order.customer_phone || ''}"`,
      `"${fulfillmentLabel}"`,
      `"${(order.delivery_address || '').replace(/"/g, '""')}"`,
      deliveryFee,
      `"${(order.special_instructions || '').replace(/"/g, '""')}"`,
      `"${itemsSummary.replace(/"/g, '""')}"`,
      order.total_order_value || 0,
      `"${paymentMode}"`,
      `"CONFIRMED"`
    ].join(',') + '\n';

    fs.appendFileSync(csvPath, row, 'utf8');
    console.log(`[Google Sheets Local Backup] Order ${order.id} appended to ${csvPath}`);
  } catch (err) {
    console.error('Failed to append to local CSV:', err.message);
  }
}

/**
 * Push order details to remote Google Sheet via Webhook (Google Apps Script Web App)
 */
export async function pushOrderToGoogleSheet(order) {
  // Always log to local Google Sheets CSV
  appendToLocalCsv(order);

  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;

  const itemsSummary = Array.isArray(order.items)
    ? order.items.map(i => `${i.productName} (${i.variantLabel}) x ${i.quantity}`).join(' | ')
    : '';

  const isPickup = order.fulfillment_type === 'pickup';
  const fulfillmentLabel = isPickup ? 'Self Pickup (Gondia Point)' : 'Home Delivery';
  const paymentModeLabel = isPickup ? 'Pay at Pickup (Cash / UPI)' : 'Pay on Delivery (Cash / UPI)';

  const formattedAddress = isPickup
    ? `[Self Pickup - Free] Bajrang Chaat House, Beside JIO BP petrol pump, Angaon Road, Fulchur Naka, Gondia`
    : `[Home Delivery | Fee: ₹${order.delivery_fee || 0}] ${order.delivery_address || 'Not specified'}`;

  const payload = {
    orderId: order.id,
    dateTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    fulfillmentType: fulfillmentLabel,
    deliveryFee: order.delivery_fee || 0,
    deliveryAddress: formattedAddress,
    specialInstructions: order.special_instructions || 'None',
    itemsSummary,
    totalAmount: order.total_order_value,
    paymentMode: paymentModeLabel,
    status: 'CONFIRMED'
  };

  if (!webhookUrl || webhookUrl.includes('YOUR_GOOGLE_SHEET_WEBHOOK_URL')) {
    console.log(`[Google Sheets Info] GOOGLE_SHEET_WEBHOOK_URL not configured in .env. Order ${order.id} safely stored in SQLite and exported to CSV (${csvPath}).`);
    return {
      synced: false,
      mode: 'local_csv',
      message: 'Logged locally to CSV. Set GOOGLE_SHEET_WEBHOOK_URL in .env to stream directly to your online Google Sheet.'
    };
  }

  try {
    console.log(`[Google Sheets] Sending order ${order.id} to Google Sheet webhook: ${webhookUrl}`);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`[Google Sheets Success] Order ${order.id} successfully pushed to Google Sheet.`);
      return { synced: true, mode: 'google_sheets_live' };
    } else {
      const text = await response.text();
      console.warn(`[Google Sheets Warning] Webhook responded with status ${response.status}: ${text}`);
      return { synced: false, error: text };
    }
  } catch (err) {
    console.error(`[Google Sheets Exception] Error pushing order ${order.id} to Google Sheet:`, err.message);
    return { synced: false, error: err.message };
  }
}

export default {
  pushOrderToGoogleSheet
};
