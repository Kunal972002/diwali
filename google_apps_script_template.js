/**
 * ============================================================================
 * BHASKAR BANANA FARM — GOOGLE APPS SCRIPT FOR AUTOMATIC GOOGLE SHEET SYNC
 * ============================================================================
 *
 * HOW TO SET UP IN 1 MINUTE:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. In Row 1, add these column headers:
 *    A1: Order ID
 *    B1: Date & Time
 *    C1: Customer Name
 *    D1: Mobile Number
 *    E1: Fulfillment Option (Home Delivery / Self Pickup)
 *    F1: Delivery Address / Pickup Point
 *    G1: Delivery Fee (₹)
 *    H1: Special Instructions
 *    I1: Ordered Items
 *    J1: Total Grand Amount (₹)
 *    K1: Payment Mode
 *    L1: Status
 *
 * 3. In Google Sheets menu, click: Extensions -> Apps Script
 * 4. Delete any code inside the editor and PASTE THIS ENTIRE SCRIPT.
 * 5. Click "Deploy" (top right) -> "New deployment".
 * 6. Click the gear icon next to "Select type" -> choose "Web app".
 * 7. Fill details:
 *    - Description: "Diwali Orders Webhook"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (Required so your website can post orders)
 *    - Click "Deploy".
 * 8. Copy the generated Web app URL and paste into .env:
 *     GOOGLE_SHEET_WEBHOOK_URL=https://script.google.com/macros/s/AKfycb.../exec
 *
 * Done! Every order booked on the website will automatically appear as a new row in your Google Sheet!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Append new customer booking row (supports both 10-column and 12-column setups)
    sheet.appendRow([
      data.orderId || '',
      data.dateTime || new Date().toLocaleString(),
      data.customerName || '',
      "'" + (data.customerPhone || ''), // Leading apostrophe preserves phone formatting
      data.fulfillmentType || 'Home Delivery',
      data.deliveryAddress || 'Not specified',
      data.deliveryFee !== undefined ? data.deliveryFee : 0,
      data.specialInstructions || 'None',
      data.itemsSummary || '',
      data.totalAmount || 0,
      data.paymentMode || 'Pay on Delivery',
      data.status || 'CONFIRMED'
    ]);

    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Bhaskar Banana Farm Google Sheets Webhook is active and running!')
    .setMimeType(ContentService.MimeType.TEXT);
}
