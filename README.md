# 🪔 Premium Single-Page Diwali Shopping & Booking Website

A visually stunning, nature-inspired, single-page seasonal ordering website for Diwali essentials: **Fresh Living Banana Trees**, **Handcrafted Ready-Made Torans**, and **Natural Banana Leaf Plates**.

---

## 🌟 Key Features

1. **Strictly Single-Page Customer Journey**:
   - Entire browsing, variant selection, basket summary, customer details, Cashfree payment, and order confirmation happen on one landing page.
   - Zero redirects or external confirmation pages.

2. **Nature-Inspired Indian Festive Design**:
   - **Color Palette**: Deep Forest Green (`#0C2517`), Fresh Banana Leaf Green (`#3E8E41`), Warm Ivory Plaster (`#FDFBF7`), and Soft Golden Accents (`#D4AF37`).
   - **Hero Section**: Photorealistic sunlight theme with gently waving banana leaves on both sides, natural morning god rays, traditional entrance archway, and subtle Diwali atmosphere.
   - **Realistic Photography**: Custom photographic assets for the hero banner, banana trees, traditional torans, and banana leaf dining plates.
   - **Typography**: Editorial typography using *Cormorant Garamond* and *Plus Jakarta Sans*.

3. **Three Product Categories with Dynamic Variant Selection**:
   - **Fresh Banana Tree**: Selectable 3 Feet, 5 Feet, and 7 Feet heights with dynamic price calculation and quantity selectors.
   - **Traditional Ready-Made Toran**: Selectable lengths (3 Feet, 4 Feet, 6 Feet) with clean focus on toran craftsmanship.
   - **Natural Banana Leaf Plates**: Sacred offering & dining plates with selectable pack sizes (15, 25, 50 plates).
   - **Configurable Pricing**: Clean data structure in [server/config/products.json](file:///Users/kunalmatale/Desktop/diwali/server/config/products.json) with clearly marked price placeholders.

4. **Interactive Multi-Product Order Summary**:
   - Live real-time order calculation.
   - Modify quantities or remove items directly in the summary table.
   - Calculates Total Order Value, Flat ₹50 Booking Advance, and Remaining Balance Due on Delivery.
   - Empty order validation preventing accidental zero-item submissions.

5. **Customer Booking Form**:
   - Required fields: Full Name, 10-digit Indian Mobile Number.
   - Optional fields: Delivery Address, Special Instructions (e.g. morning puja delivery notes).
   - Inline selection chips and payment breakdown.
   - Prominent assurance notice: *"Pay just ₹50 now to confirm your Diwali booking. The remaining balance will be collected separately."*

6. **Cashfree Payment Gateway Integration**:
   - Customer pays flat advance fee of ₹50.
   - Secure backend order creation via Cashfree PG API (`POST /pg/orders`).
   - Cashfree Web SDK checkout (`_modal` hosted in-context checkout).
   - Backend order verification (`POST /api/orders/verify`) and webhook signature validation (`POST /api/webhook`).
   - Prevents duplicate submissions and duplicate payment processing.
   - Default Sandbox & Simulation mode: Runs seamlessly right out of the box for testing, and connects automatically to Cashfree live/sandbox once credentials are added in `.env`.

7. **Instant Single-Page Order Confirmation**:
   - Instant elegant festive confirmation modal on the same page.
   - Unique Order ID (e.g. `DWL-5FEO-6430`).
   - Displays customer details, ordered products, variants, quantities, total order amount, ₹50 paid status, and remaining balance.
   - Celebratory festive confetti blast!
   - Persisted in SQLite database ([server/data/diwali_orders.db](file:///Users/kunalmatale/Desktop/diwali/server/data/diwali_orders.db)).

---

## 🚀 Running the Project

### Start Development Server
```bash
npm run dev
```
This runs both the Express backend on `http://localhost:5001` and the Vite frontend on `http://localhost:5173` concurrently.

Visit:
```
http://localhost:5173/
```

---

## ⚙️ Cashfree Payment Configuration

Edit [.env](file:///Users/kunalmatale/Desktop/diwali/.env):

```env
PORT=5001
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENV=sandbox # change to 'production' for live payments
```

- When valid Cashfree credentials are set, the app connects to Cashfree's hosted checkout.
- If credentials are left as placeholders, the built-in Sandbox Simulation mode lets you test the entire booking flow without restrictions.

---

## 📦 Configurable Product Data

To adjust product prices, toran lengths, or plate pack sizes, edit:
[server/config/products.json](file:///Users/kunalmatale/Desktop/diwali/server/config/products.json)
