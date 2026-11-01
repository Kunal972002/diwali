import crypto from 'crypto';

const API_VERSION = '2023-08-01';

export function getCashfreeConfig() {
  const env = (process.env.CASHFREE_ENV || 'sandbox').toLowerCase();
  const appId = process.env.CASHFREE_APP_ID || '';
  const secretKey = process.env.CASHFREE_SECRET_KEY || '';
  const baseUrl = env === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg';

  const isConfigured = Boolean(
    appId && 
    secretKey && 
    !appId.includes('YOUR_') && 
    !secretKey.includes('YOUR_')
  );

  return {
    env,
    appId,
    secretKey,
    baseUrl,
    isConfigured
  };
}

/**
 * Create Cashfree Order for ₹50 booking fee
 */
export async function createCashfreeOrder({
  orderId,
  orderAmount = 50.0,
  customerName,
  customerPhone,
  customerEmail,
  returnUrl
}) {
  const config = getCashfreeConfig();

  // If live or real sandbox credentials are configured, call the official Cashfree API
  if (config.isConfigured) {
    try {
      const cleanPhone = customerPhone.replace(/\D/g, '').slice(-10) || '9999999999';
      const cleanName = customerName.trim() || 'Festive Customer';
      const cleanEmail = customerEmail || `customer_${cleanPhone}@diwalibooking.in`;

      const payload = {
        order_id: orderId,
        order_amount: Number(orderAmount.toFixed(2)),
        order_currency: 'INR',
        customer_details: {
          customer_id: `cust_${cleanPhone}`,
          customer_name: cleanName,
          customer_email: cleanEmail,
          customer_phone: cleanPhone
        },
        order_meta: {
          return_url: returnUrl || `http://localhost:5173/?order_id=${orderId}`
        },
        order_note: 'Diwali Essentials Festive Booking (₹50 advance)'
      };

      console.log(`[Cashfree] Initiating order creation at ${config.baseUrl}/orders for ${orderId}`);

      const response = await fetch(`${config.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'x-client-id': config.appId,
          'x-client-secret': config.secretKey,
          'x-api-version': API_VERSION,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[Cashfree Error]', data);
        throw new Error(data.message || 'Cashfree order creation failed');
      }

      console.log(`[Cashfree] Successfully created session for ${orderId}`);
      return {
        mode: config.env,
        order_id: data.order_id,
        payment_session_id: data.payment_session_id,
        is_mock: false,
        raw: data
      };
    } catch (err) {
      console.warn('[Cashfree API call warning]:', err.message);
      // If network fails or sandbox rejected keys in demo environment, gracefully allow sandbox simulation
      return {
        mode: 'sandbox_simulation',
        order_id: orderId,
        payment_session_id: `sim_session_${orderId}_${Date.now()}`,
        is_mock: true,
        note: `Sandbox simulated session (Cashfree API error: ${err.message})`
      };
    }
  }

  // Fallback to Sandbox Simulation when credentials are placeholder / not yet added
  console.log(`[Cashfree] Running in Sandbox Simulation mode for order ${orderId} (Credentials not configured in .env)`);
  return {
    mode: 'sandbox_simulation',
    order_id: orderId,
    payment_session_id: `sim_session_${orderId}_${Date.now()}`,
    is_mock: true,
    note: 'Sandbox Test Mode: Set CASHFREE_APP_ID & CASHFREE_SECRET_KEY in .env for real gateway connection.'
  };
}

/**
 * Verify Order status via Cashfree API
 */
export async function verifyCashfreeOrder(orderId) {
  const config = getCashfreeConfig();

  if (config.isConfigured) {
    try {
      const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'x-client-id': config.appId,
          'x-client-secret': config.secretKey,
          'x-api-version': API_VERSION
        }
      });

      if (!response.ok) {
        const errData = await response.json();
        console.error('[Cashfree Verification Error]', errData);
        return { isPaid: false, status: 'FAILED', message: errData.message };
      }

      const orderData = await response.json();

      // Fetch payment details
      let paymentId = null;
      let paymentMethod = 'UPI/Card';
      try {
        const paymentsRes = await fetch(`${config.baseUrl}/orders/${orderId}/payments`, {
          method: 'GET',
          headers: {
            'x-client-id': config.appId,
            'x-client-secret': config.secretKey,
            'x-api-version': API_VERSION
          }
        });
        if (paymentsRes.ok) {
          const payments = await paymentsRes.json();
          if (Array.isArray(payments) && payments.length > 0) {
            const successPayment = payments.find(p => p.payment_status === 'SUCCESS') || payments[0];
            paymentId = successPayment.cf_payment_id || successPayment.payment_id;
            paymentMethod = successPayment.payment_group || 'Online';
          }
        }
      } catch (payErr) {
        console.warn('Could not fetch payment specifics:', payErr.message);
      }

      const isPaid = orderData.order_status === 'PAID';
      return {
        isPaid,
        status: isPaid ? 'PAID' : orderData.order_status,
        paymentId: paymentId || `CF_PAY_${Date.now()}`,
        paymentMethod,
        orderData
      };
    } catch (err) {
      console.error('[Cashfree Verification Exception]', err);
      return { isPaid: false, status: 'ERROR', message: err.message };
    }
  }

  // Simulation mode verification
  return {
    isPaid: true,
    status: 'PAID',
    paymentId: `SIM_PAY_${Date.now().toString().slice(-6)}`,
    paymentMethod: 'UPI / GPay (Sandbox)',
    is_mock: true
  };
}

/**
 * Verify Cashfree Webhook Signature
 */
export function verifyCashfreeWebhookSignature(rawBody, timestamp, signature) {
  const config = getCashfreeConfig();
  if (!config.secretKey) return false;

  try {
    const dataToSign = timestamp + rawBody;
    const computedSignature = crypto
      .createHmac('sha256', config.secretKey)
      .update(dataToSign)
      .digest('base64');

    return computedSignature === signature;
  } catch (err) {
    console.error('Error verifying Cashfree webhook signature:', err);
    return false;
  }
}
