import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createCashfreeOrder,
  getCashfreeConfig,
  verifyCashfreeOrder,
  verifyCashfreeWebhookSignature
} from '../cashfree.js';
import {
  createOrderRecord,
  getOrderById,
  markOrderPaymentStatus
} from '../db.js';
import { pushOrderToGoogleSheet } from '../services/googleSheets.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read products config with serverless multi-path fallback
let cachedProductsConfig = null;
function getProductsConfig() {
  if (cachedProductsConfig) return cachedProductsConfig;

  const candidatePaths = [
    path.join(__dirname, '..', 'config', 'products.json'),
    path.join(process.cwd(), 'server', 'config', 'products.json'),
    path.join(process.cwd(), 'config', 'products.json')
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        cachedProductsConfig = JSON.parse(fs.readFileSync(p, 'utf-8'));
        return cachedProductsConfig;
      }
    } catch (e) {
      // try next path
    }
  }

  return {
    farmName: 'Bhaskar Banana Farm',
    currency: '₹',
    products: []
  };
}

// 1. GET /api/products
router.get('/products', (req, res) => {
  try {
    const productsData = getProductsConfig();
    const config = getCashfreeConfig();
    res.json({
      success: true,
      ...productsData,
      gatewayInfo: {
        env: config.env,
        isConfigured: config.isConfigured
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load products data' });
  }
});

// Helper to generate a unique readable Festive Order ID
function generateOrderId() {
  const rand = Math.floor(1000 + Math.random() * 9000);
  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  return `DWL-${stamp}-${rand}`;
}

// 2. POST /api/orders/create
router.post('/orders/create', async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone, 
      deliveryAddress, 
      specialInstructions, 
      items, 
      fulfillmentType = 'delivery' 
    } = req.body;

    // Validate customer details
    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ success: false, message: 'Customer full name is required' });
    }

    const cleanPhone = (customerPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Please provide a valid 10-digit mobile number' });
    }

    // Validate order items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot place an empty order. Please select at least one item.' });
    }

    const productsConfig = getProductsConfig();
    const validatedItems = [];
    let calculatedItemsTotal = 0;

    for (const item of items) {
      const product = productsConfig.products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product ${item.productId} not found` });
      }

      const variant = product.variants.find(v => v.id === item.variantId);
      if (!variant) {
        return res.status(400).json({ success: false, message: `Variant ${item.variantId} not found for ${product.name}` });
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      const subtotal = variant.price * quantity;
      calculatedItemsTotal += subtotal;

      validatedItems.push({
        productId: product.id,
        productName: product.name,
        variantId: variant.id,
        variantLabel: variant.label,
        variantDimension: variant.dimension || variant.label,
        unitPrice: variant.price,
        quantity,
        subtotal
      });
    }

    if (calculatedItemsTotal <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid order amount' });
    }

    // Tree quantity count for delivery calculation (₹50 per bundle)
    const treeQuantity = validatedItems
      .filter(item => item.productId === 'banana-tree')
      .reduce((sum, item) => sum + item.quantity, 0);

    const isPickup = fulfillmentType === 'pickup';
    const PICKUP_POINT_ADDRESS = 'Bajrang Chaat House, Beside JIO BP petrol pump, Amgaon Road, Fulchur Naka, Gondia';

    let deliveryFee = 0;
    let effectiveAddress = '';

    if (isPickup) {
      deliveryFee = 0;
      effectiveAddress = `Self Pickup: ${PICKUP_POINT_ADDRESS}`;
    } else {
      // Home delivery: charged based on quantity of trees ordered (₹50 per bundle)
      // If 0 trees (only toran/plates), ₹50 flat delivery fee
      deliveryFee = treeQuantity > 0 ? (treeQuantity * 50) : 50;

      if (!deliveryAddress || !deliveryAddress.trim()) {
        return res.status(400).json({ success: false, message: 'Please enter your delivery address in Gondia for home delivery' });
      }
      effectiveAddress = deliveryAddress.trim();
    }

    const totalGrandAmount = calculatedItemsTotal + deliveryFee;
    const orderId = generateOrderId();

    const orderData = {
      id: orderId,
      customer_name: customerName.trim(),
      customer_phone: cleanPhone,
      delivery_address: effectiveAddress,
      special_instructions: (specialInstructions || '').trim(),
      items: validatedItems,
      total_order_value: totalGrandAmount,
      booking_amount: 0,
      remaining_balance: totalGrandAmount,
      payment_status: 'CONFIRMED',
      cashfree_order_id: null,
      cashfree_payment_session_id: null,
      fulfillment_type: isPickup ? 'pickup' : 'delivery',
      delivery_fee: deliveryFee
    };

    // Store order in SQLite DB as CONFIRMED (Pay on Delivery / Pickup)
    await createOrderRecord(orderData);

    // Push order details to Google Sheet (and local CSV export)
    const sheetSyncResult = await pushOrderToGoogleSheet(orderData);

    console.log(`[Order Success] Order ${orderId} confirmed for ${customerName} (${orderData.fulfillment_type}, fee ₹${deliveryFee}). Google Sheet sync:`, sheetSyncResult);

    res.json({
      success: true,
      order: orderData,
      orderId,
      itemsTotal: calculatedItemsTotal,
      deliveryFee,
      totalOrderValue: totalGrandAmount,
      fulfillmentType: orderData.fulfillment_type,
      pickupPoint: PICKUP_POINT_ADDRESS,
      paymentMode: isPickup ? 'Pay at Pickup' : 'Pay on Delivery',
      googleSheetSync: sheetSyncResult,
      items: validatedItems
    });
  } catch (err) {
    console.error('Order creation error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error while creating order' });
  }
});

// 3. POST /api/orders/verify
router.post('/orders/verify', async (req, res) => {
  try {
    const { orderId, paymentId, simulatedStatus } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Missing orderId' });
    }

    // Retrieve order from DB
    const existingOrder = await getOrderById(orderId);
    if (!existingOrder) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Prevent duplicate processing
    if (existingOrder.payment_status === 'PAID') {
      return res.json({
        success: true,
        alreadyProcessed: true,
        order: existingOrder,
        message: 'Order already verified and confirmed'
      });
    }

    // If sandbox simulated payment check
    if (simulatedStatus === 'SUCCESS') {
      const simPaymentId = paymentId || `SIM_PAY_${Date.now().toString().slice(-6)}`;
      await markOrderPaymentStatus(orderId, {
        status: 'PAID',
        paymentId: simPaymentId,
        paymentDetails: {
          gateway: 'Cashfree Sandbox Simulation',
          method: 'UPI / GPay Demo',
          verifiedAt: new Date().toISOString()
        }
      });

      const updated = await getOrderById(orderId);
      return res.json({
        success: true,
        order: updated
      });
    }

    // Otherwise verify with Cashfree API
    const verification = await verifyCashfreeOrder(orderId);

    if (verification.isPaid) {
      await markOrderPaymentStatus(orderId, {
        status: 'PAID',
        paymentId: verification.paymentId,
        paymentDetails: verification.orderData || { verified: true }
      });

      const updatedOrder = await getOrderById(orderId);
      return res.json({
        success: true,
        order: updatedOrder
      });
    } else {
      // Payment failed or is still pending
      await markOrderPaymentStatus(orderId, {
        status: verification.status || 'FAILED',
        paymentId: verification.paymentId,
        paymentDetails: verification.orderData || {}
      });

      return res.status(400).json({
        success: false,
        status: verification.status,
        message: 'Payment verification was not successful. Please retry.'
      });
    }
  } catch (err) {
    console.error('Payment verification error:', err);
    res.status(500).json({ success: false, message: err.message || 'Payment verification failed' });
  }
});

// 4. GET /api/orders/:orderId
router.get('/orders/:orderId', async (req, res) => {
  try {
    const order = await getOrderById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve order' });
  }
});

// 5. POST /api/webhook - Cashfree webhook listener
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.body.toString('utf8');

    // Signature verification
    const isValid = verifyCashfreeWebhookSignature(rawBody, timestamp, signature);
    if (!isValid) {
      console.warn('[Webhook] Invalid Cashfree signature received');
      return res.status(400).send('Invalid signature');
    }

    const payload = JSON.parse(rawBody);
    console.log('[Webhook] Received verified event:', payload.type);

    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const orderId = payload.data?.order?.order_id;
      const paymentId = payload.data?.payment?.cf_payment_id;

      if (orderId) {
        await markOrderPaymentStatus(orderId, {
          status: 'PAID',
          paymentId: String(paymentId),
          paymentDetails: payload.data
        });
        console.log(`[Webhook] Order ${orderId} successfully marked as PAID via webhook`);
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[Webhook Error]', err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
