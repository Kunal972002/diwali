import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Truck, 
  Leaf, 
  ArrowDown, 
  Phone, 
  User, 
  MapPin, 
  AlertCircle,
  Flame,
  CheckCircle2,
  Table,
  Store
} from 'lucide-react';

// Fallback configuration if API takes a moment or offline
const DEFAULT_PRODUCTS_DATA = {
  farmName: 'Bhaskar Banana Farm',
  currency: '₹',
  paymentNotice: 'No advance booking fee required. Easy Pay on Delivery after inspecting your farm-fresh Diwali essentials.',
  placeholderNotice: 'Prices shown are configurable placeholders for Diwali pre-booking calculations.',
  products: [
    {
      id: 'banana-tree',
      name: 'Fresh Banana Tree',
      tagline: 'Sacred Living Stems for Entrance Auspiciousness',
      description: 'Pair of freshly harvested young banana tree stems with lush, vibrant broad leaves. Traditionally erected on both sides of the main entrance to usher in prosperity, positive energy, and divine blessings of Goddess Lakshmi during Diwali.',
      image: '/assets/fresh_banana_tree.jpg',
      variantType: 'Height',
      unitLabel: 'Pair of 2 Stems',
      features: [
        'Freshly cut on Diwali morning for peak vibrancy',
        'Tied with auspicious red & yellow sacred thread (Mauli)',
        'Includes sturdy earthen base support recommendations'
      ],
      variants: [
        { id: 'tree-3ft', label: '3 Feet', dimension: '3 Feet Height', price: 350, placeholderTag: '₹[Price Placeholder]', description: 'Apartment doorways & mandir' },
        { id: 'tree-5ft', label: '5 Feet', dimension: '5 Feet Height', price: 550, placeholderTag: '₹[Price Placeholder]', popular: true, description: 'Standard main entrance' },
        { id: 'tree-7ft', label: '7 Feet', dimension: '7 Feet Height', price: 750, placeholderTag: '₹[Price Placeholder]', description: 'Grand villa gates & courtyard' }
      ]
    },
    {
      id: 'ready-made-toran',
      name: 'Traditional Ready-Made Toran',
      tagline: 'Handcrafted Fresh Mango Leaves & Fragrant Marigolds',
      description: 'Clean, authentic festive entrance toran crafted by traditional artisans using fresh organic mango leaves and alternating bright yellow & saffron marigold blossoms. Ready to hang right out of the eco-friendly box.',
      image: '/assets/traditional_toran.jpg',
      variantType: 'Length',
      unitLabel: 'Ready-to-Hang Garland',
      features: [
        'Aromatic fresh mango leaves (Amba pan) symbolizing good luck',
        'Plump golden and orange marigolds strung tightly',
        'Reinforced natural jute rope with hanging end-loops'
      ],
      variants: [
        { id: 'toran-3ft', label: '3 Feet', dimension: '3 Feet Length', price: 240, placeholderTag: '₹[Price Placeholder]', description: 'Standard single door' },
        { id: 'toran-4ft', label: '4 Feet', dimension: '4 Feet Length', price: 320, placeholderTag: '₹[Price Placeholder]', popular: true, description: 'Wide entryway (Most Popular)' },
        { id: 'toran-6ft', label: '6 Feet', dimension: '6 Feet Length', price: 460, placeholderTag: '₹[Price Placeholder]', description: 'Grand double door arch' }
      ]
    },
    {
      id: 'banana-leaf-plates',
      name: 'Natural Banana Leaf Round Cuts',
      tagline: 'Fresh Circular Cut Banana Leaves for Puja & Traditional Dining',
      description: 'Traditional natural round cut banana leaves for offering food to God during Diwali पूजा and other religious rituals.',
      image: '/assets/banana_leaf_plates.jpg',
      variantType: 'Pack Size',
      unitLabel: 'Pack',
      features: [
        '100% natural, fresh circular cut organic banana leaf dining surface',
        'Traditional shape for sacred puja naivedya and feast serving',
        'Naturally antimicrobial, fresh aroma and eco-friendly'
      ],
      variants: [
        { id: 'plates-pack-15', label: 'Pack of 15 Rounds', dimension: '15 Round Cuts', price: 180, placeholderTag: '₹[Price Placeholder]', description: 'Puja Naivedya & close family' },
        { id: 'plates-pack-25', label: 'Pack of 25 Rounds', dimension: '25 Round Cuts', price: 280, placeholderTag: '₹[Price Placeholder]', popular: true, description: 'Family feast & prasad distribution' },
        { id: 'plates-pack-50', label: 'Pack of 50 Rounds', dimension: '50 Round Cuts', price: 500, placeholderTag: '₹[Price Placeholder]', description: 'Festive community feast' }
      ]
    }
  ]
};

export const PICKUP_POINT_ADDRESS = 'Bajrang Chaat House, Beside JIO BP petrol pump, Amgaon Road, Fulchur Naka, Gondia';

export default function App() {
  const [catalog, setCatalog] = useState(DEFAULT_PRODUCTS_DATA);

  // Fulfillment Choice: 'delivery' (Home Delivery) or 'pickup' (Self Pickup)
  const [fulfillmentType, setFulfillmentType] = useState('delivery');

  // Product Selection States
  const [selectedVariants, setSelectedVariants] = useState({
    'banana-tree': 'tree-5ft',
    'ready-made-toran': 'toran-4ft',
    'banana-leaf-plates': 'plates-pack-25'
  });

  const [quantities, setQuantities] = useState({
    'banana-tree': 1,
    'ready-made-toran': 1,
    'banana-leaf-plates': 1
  });

  const [addedAnimation, setAddedAnimation] = useState({});

  // Active Basket
  const [basket, setBasket] = useState([]);

  // Customer Form State
  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    deliveryAddress: '',
    specialInstructions: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);

  // Order Confirmation State (displayed on the same page)
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Fetch product configuration from server on mount
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.products && Array.isArray(data.products)) {
          setCatalog(data);
        }
      })
      .catch(err => {
        console.log('Using default product catalog fallback:', err.message);
      });
  }, []);

  // Handle variant change
  const handleVariantChange = (productId, variantId) => {
    setSelectedVariants(prev => ({
      ...prev,
      [productId]: variantId
    }));
  };

  // Handle quantity change
  const handleCardQtyChange = (productId, delta) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  // Add item from card to basket
  const handleAddToOrder = (product) => {
    const variantId = selectedVariants[product.id];
    const variant = product.variants.find(v => v.id === variantId) || product.variants[0];
    const qty = quantities[product.id] || 1;

    setBasket(prevBasket => {
      const existingIndex = prevBasket.findIndex(
        item => item.productId === product.id && item.variantId === variant.id
      );

      if (existingIndex > -1) {
        const updated = [...prevBasket];
        updated[existingIndex].quantity += qty;
        return updated;
      } else {
        return [
          ...prevBasket,
          {
            productId: product.id,
            productName: product.name,
            variantId: variant.id,
            variantLabel: variant.label,
            dimension: variant.dimension || variant.label,
            unitPrice: variant.price,
            placeholderTag: variant.placeholderTag || '₹[Price]',
            quantity: qty,
            image: product.image
          }
        ];
      }
    });

    setAddedAnimation(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedAnimation(prev => ({ ...prev, [product.id]: false }));
    }, 1400);
  };

  // Modify quantity inside order summary
  const handleBasketQtyChange = (index, delta) => {
    setBasket(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        updated.splice(index, 1);
      } else {
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  // Remove item from basket
  const handleRemoveFromBasket = (index) => {
    setBasket(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const totalOrderValue = basket.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const totalItemsCount = basket.reduce((acc, item) => acc + item.quantity, 0);

  // Tree bundle count for delivery calculations (₹50 per tree bundle)
  const treeQuantity = basket
    .filter(item => item.productId === 'banana-tree')
    .reduce((sum, item) => sum + item.quantity, 0);

  // Delivery fee: ₹0 for pickup; for delivery: ₹50 per tree bundle (or flat ₹50 if 0 trees)
  const deliveryFee = fulfillmentType === 'pickup' 
    ? 0 
    : (treeQuantity > 0 ? (treeQuantity * 50) : 50);

  // Grand total payable
  const grandTotal = totalOrderValue + deliveryFee;

  // Validate Form
  const validateForm = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Please enter your full name';
    }
    const cleanPhone = formData.mobileNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }
    if (fulfillmentType === 'delivery' && !formData.deliveryAddress.trim()) {
      errors.deliveryAddress = 'Please enter your delivery address in Gondia for home delivery';
    }
    if (basket.length === 0) {
      errors.basket = 'Please add at least one item to your order before booking';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Smooth scroll helper
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Fire celebratory confetti on order confirmation
  const triggerFestiveConfetti = () => {
    try {
      const end = Date.now() + 3 * 1000;
      const colors = ['#D4AF37', '#FFD700', '#3E8E41', '#FF6B35', '#FFF9E6'];

      (function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch (e) {
      console.log('Confetti effect executed');
    }
  };

  // Handle Order Booking Submission (Direct Booking + Google Sheet Push)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!validateForm()) {
      if (basket.length === 0) {
        scrollToSection('collection');
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order on backend which immediately confirms and pushes to Google Sheet
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: formData.fullName,
          customerPhone: formData.mobileNumber,
          deliveryAddress: fulfillmentType === 'pickup' ? PICKUP_POINT_ADDRESS : formData.deliveryAddress,
          fulfillmentType,
          specialInstructions: formData.specialInstructions,
          items: basket
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to submit booking');
      }

      // Order successfully confirmed!
      setConfirmedOrder(result.order);
      setIsSubmitting(false);

      // Clear basket & form
      setBasket([]);
      setFormData({ fullName: '', mobileNumber: '', deliveryAddress: '', specialInstructions: '' });

      // Trigger festive confetti
      triggerFestiveConfetti();
    } catch (err) {
      setSubmissionError(err.message || 'Error occurred while processing booking');
      setIsSubmitting(false);
    }
  };

  // Close Confirmation and start fresh
  const handleCloseConfirmation = () => {
    setConfirmedOrder(null);
    scrollToSection('collection');
  };

  return (
    <div className="diwali-app">
      {/* Top Auspicious Announcement Bar */}
      <div className="announcement-bar">
        <span className="dot"></span>
        <span>Bhaskar Banana Farm • Direct Farm-Fresh Diwali Living Banana Trees, Handcrafted Torans &amp; Puja Pattal</span>
        <span className="dot"></span>
      </div>

      {/* Brand Navbar */}
      <nav className="site-navbar">
        <div className="container nav-content">
          <div className="nav-brand">
            <span className="brand-icon">🌱</span>
            <div className="brand-titles">
              <span className="brand-name">Bhaskar Banana Farm</span>
              <span className="brand-sub">भास्कर बनाना फार्म • Fresh Festive Harvest</span>
            </div>
          </div>
          <div className="nav-actions">
            <button className="nav-cta-btn" onClick={() => scrollToSection('collection')}>
              <span>Diwali Collection</span>
            </button>
            <button className="nav-book-btn" onClick={() => scrollToSection('booking')}>
              <span>Book Order (Pay on Delivery)</span>
            </button>
          </div>
        </div>
      </nav>

      {/* 1. HERO SECTION: NATURAL SUNLIGHT THEME (Uncovered & Clear Hero Photo) */}
      <header className="hero" id="hero">
        <div className="hero-background">
          <img 
            src="/assets/hero_sunlight.jpg" 
            alt="Bhaskar Banana Farm Diwali morning sunlight entrance with sacred banana trees" 
            className="hero-background-img"
          />
          <div className="hero-sunlight-overlay"></div>
        </div>

        {/* Unobstructed Hero Header (Clean floating typography without blocking container) */}
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={14} />
            <span>BHASKAR BANANA FARM • DIWALI SPECIAL COLLECTION</span>
          </div>

          <h1 className="hero-title">
            Celebrate Diwali the <span>Traditional Way</span>
          </h1>

          <p className="hero-subtitle">
            Bring home the beauty of tradition with fresh Banana Trees, Elegant Torans &amp; Natural Banana Leaf Plates.
          </p>

          <div className="hero-actions">
            <button 
              className="btn-primary" 
              onClick={() => scrollToSection('collection')}
              id="hero-book-cta"
            >
              <span>BOOK YOUR ORDER</span>
              <ArrowDown size={18} />
            </button>

            <div className="hero-booking-advance-note">
              <ShieldCheck size={16} />
              <span>Zero Advance Payment • Pay on Delivery • Bhaskar Banana Farm</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. DEDICATED CONTAINER TAKEN DOWN BELOW HERO TO KEEP HERO IMAGE CLEARLY VISIBLE */}
      <div className="hero-transition-container">
        <div className="container">
          <div className="hero-transition-card">
            <div className="transition-farm-header">
              <span className="farm-pill">
                <Leaf size={14} />
                <span>BHASKAR BANANA FARM EXCLUSIVE HARVEST</span>
              </span>
              <h3>Pure Tradition, Directly From Farm To Your Sacred Entrance</h3>
              <p>
                Grown with organic care at <strong>Bhaskar Banana Farm</strong> and cut fresh on Diwali morning for authentic spiritual rituals and festive grandeur.
              </p>
            </div>

            <div className="features-strip-down">
              <div className="feature-item-card">
                <div className="feature-icon-wrapper">
                  <Leaf size={22} />
                </div>
                <div className="feature-text">
                  <strong>100% Farm Fresh Harvest</strong>
                  <span>Cut fresh on Diwali morning directly at Bhaskar Banana Farm</span>
                </div>
              </div>

              <div className="feature-item-card">
                <div className="feature-icon-wrapper">
                  <Flame size={22} />
                </div>
                <div className="feature-text">
                  <strong>Vedic Ritual Ready</strong>
                  <span>Paired living stems tied with sacred thread for Lakshmi Puja</span>
                </div>
              </div>

              <div className="feature-item-card">
                <div className="feature-icon-wrapper">
                  <Truck size={22} />
                </div>
                <div className="feature-text">
                  <strong>Doorstep Farm Delivery</strong>
                  <span>Protective botanical packaging to ensure pristine green leaves</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. THREE PRODUCT CATEGORIES: OUR DIWALI COLLECTION */}
      <section className="section-products" id="collection">
        <div className="container">
          <div className="section-header">
            <span className="section-label">FESTIVE ESSENTIALS</span>
            <h2 className="section-title">Our Diwali Collection</h2>
            <p className="section-subtitle">
              Directly harvested from Bhaskar Banana Farm. Everything you need to decorate your entrance and celebrate traditional rituals.
            </p>
          </div>

          <div className="products-grid">
            {catalog.products.map((product) => {
              const activeVariantId = selectedVariants[product.id] || product.variants[0].id;
              const activeVariant = product.variants.find(v => v.id === activeVariantId) || product.variants[0];
              const currentQty = quantities[product.id] || 1;
              const isAdded = addedAnimation[product.id];

              return (
                <article className="product-card" key={product.id} id={`product-${product.id}`}>
                  <div className="product-image-container">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="product-image"
                      loading="lazy"
                    />
                    <span className="product-unit-badge">{product.unitLabel}</span>
                  </div>

                  <div className="product-body">
                    <h3 className="product-title">{product.name}</h3>

                    {/* Variant Selector */}
                    <div className="variant-section">
                      <div className="variant-header">
                        <span className="variant-label-title">
                          Select {product.variantType}:
                        </span>
                        <span className="variant-selected-hint">
                          {activeVariant.label}
                        </span>
                      </div>

                      <div className="variant-options-group">
                        {product.variants.map((v) => {
                          const isSelected = v.id === activeVariantId;
                          return (
                            <button
                              type="button"
                              key={v.id}
                              className={`variant-pill ${isSelected ? 'active' : ''}`}
                              onClick={() => handleVariantChange(product.id, v.id)}
                            >
                              <span className="variant-pill-text">{v.label}</span>
                              <span className="variant-pill-price">₹{v.price}</span>
                              {v.popular && <span className="variant-pill-badge">Popular</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dynamic Price Display */}
                    <div className="product-price-row">
                      <div>
                        <div className="price-main-box">
                          <span className="price-currency">₹</span>
                          <span className="price-value">{activeVariant.price}</span>
                          <span className="price-placeholder-note">Configurable Placeholder</span>
                        </div>
                      </div>
                      <span className="variant-pill-badge" style={{ background: '#E8F5E9', color: '#2E7D32' }}>
                        Farm Available
                      </span>
                    </div>

                    {/* Quantity Control & Add To Order Button */}
                    <div className="product-action-row">
                      <div className="qty-control" aria-label="Quantity Selector">
                        <button 
                          type="button" 
                          className="qty-btn"
                          onClick={() => handleCardQtyChange(product.id, -1)}
                          disabled={currentQty <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="qty-val">{currentQty}</span>
                        <button 
                          type="button" 
                          className="qty-btn"
                          onClick={() => handleCardQtyChange(product.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <button
                        type="button"
                        className={`btn-add-cart ${isAdded ? 'added' : ''}`}
                        onClick={() => handleAddToOrder(product)}
                        id={`add-btn-${product.id}`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={18} />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={18} />
                            <span>Add to Order</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* 4. INTERACTIVE ORDER SELECTION & SUMMARY TABLE */}
          <div className="order-summary-box" id="order-summary">
            <div className="summary-heading">
              <h3>
                <ShoppingBag size={22} color="#D4AF37" />
                <span>Your Selected Order Items</span>
              </h3>
              <span className="items-badge-count">
                {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'} Selected
              </span>
            </div>

            {basket.length === 0 ? (
              <div className="empty-basket">
                <ShoppingBag className="empty-basket-icon" />
                <h4>Your festive basket is empty</h4>
                <p>Choose your preferred banana trees, toran lengths, and plates from the collection above to build your order.</p>
              </div>
            ) : (
              <>
                <div className="basket-table-wrapper">
                  <table className="basket-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Unit Price</th>
                        <th>Quantity</th>
                        <th>Subtotal</th>
                        <th>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {basket.map((item, idx) => (
                        <tr key={`${item.productId}-${item.variantId}`}>
                          <td>
                            <div className="basket-item-title">{item.productName}</div>
                          </td>
                          <td>
                            <span className="basket-item-variant">{item.variantLabel}</span>
                          </td>
                          <td>
                            <span className="basket-price">₹{item.unitPrice}</span>
                          </td>
                          <td>
                            <div className="qty-control" style={{ padding: '2px' }}>
                              <button
                                type="button"
                                className="qty-btn"
                                style={{ width: '26px', height: '26px' }}
                                onClick={() => handleBasketQtyChange(idx, -1)}
                              >
                                <Minus size={12} />
                              </button>
                              <span className="qty-val" style={{ minWidth: '24px' }}>{item.quantity}</span>
                              <button
                                type="button"
                                className="qty-btn"
                                style={{ width: '26px', height: '26px' }}
                                onClick={() => handleBasketQtyChange(idx, 1)}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <strong className="basket-price">₹{item.unitPrice * item.quantity}</strong>
                          </td>
                          <td>
                            <button
                              type="button"
                              className="basket-remove-btn"
                              onClick={() => handleRemoveFromBasket(idx)}
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="basket-totals">
                  <div className="totals-row total-order-row">
                    <span>Selected Items Subtotal:</span>
                    <span>₹{totalOrderValue.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="totals-row fulfillment-breakdown-row">
                    <span>
                      {fulfillmentType === 'pickup' 
                        ? 'Fulfillment (Self Pickup - Gondia Point):' 
                        : `Home Delivery Fee (${treeQuantity > 0 ? `${treeQuantity} Tree Bundle${treeQuantity > 1 ? 's' : ''} × ₹50` : 'Standard Delivery'}):`}
                    </span>
                    <span style={{ color: fulfillmentType === 'pickup' ? '#2D6A2E' : '#8C6A18', fontWeight: 700 }}>
                      {fulfillmentType === 'pickup' ? 'FREE (₹0)' : `+₹${deliveryFee}`}
                    </span>
                  </div>

                  <div className="totals-row booking-advance-row">
                    <span>Advance Booking Amount Required:</span>
                    <span style={{ color: '#2D6A2E', fontWeight: 800 }}>₹0 (No Advance Needed)</span>
                  </div>

                  <div className="totals-row remaining-balance-row">
                    <span>Total Amount Payable on {fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}:</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800 }}>₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 5. CUSTOMER BOOKING FORM (DIRECT BOOKING & GOOGLE SHEET SYNC) */}
      <section className="section-booking-form" id="booking">
        <div className="container">
          <div className="booking-form-card">
            <div className="booking-form-header">
              <h2>Complete Your Diwali Booking</h2>
              <p>Choose your fulfillment option and enter contact details — no advance payment needed!</p>
            </div>

            <div className="booking-form-body">
              {/* Important Zero Advance Notice */}
              <div className="booking-advance-notice">
                <div className="booking-advance-notice-icon">
                  <Sparkles size={20} />
                </div>
                <p>
                  🌾 <strong>Zero Advance Required:</strong> Simply select delivery or pickup and provide your contact details. Your festive order is immediately synced to our dispatch sheet. Pay on delivery or pickup!
                </p>
              </div>

              {/* Items Selected Preview in Form */}
              <div className="form-items-preview">
                <div className="form-items-preview-title">Order Items Included in Booking:</div>
                {basket.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '0.88rem' }}>
                    No items selected yet. Please pick items from the collection above.
                  </p>
                ) : (
                  <div className="form-items-tags-list">
                    {basket.map((item) => (
                      <span key={`${item.productId}-${item.variantId}`} className="form-item-tag">
                        {item.productName} ({item.variantLabel}) × <strong>{item.quantity}</strong>
                      </span>
                    ))}
                  </div>
                )}
                {formErrors.basket && (
                  <span className="field-error-msg" style={{ marginTop: '8px' }}>
                    {formErrors.basket}
                  </span>
                )}
              </div>

              {/* 2 Fulfillment Options: Home Delivery vs Self Pickup */}
              <div className="fulfillment-section">
                <div className="fulfillment-section-header">
                  <span className="fulfillment-step-pill">Option</span>
                  <h3>Choose How You Want to Receive Your Order:</h3>
                </div>

                <div className="fulfillment-options-grid">
                  {/* Option 1: Home Delivery */}
                  <div
                    className={`fulfillment-card ${fulfillmentType === 'delivery' ? 'selected' : ''}`}
                    onClick={() => setFulfillmentType('delivery')}
                    role="button"
                    tabIndex={0}
                    id="option-home-delivery"
                  >
                    <div className="fulfillment-card-top">
                      <div className="fulfillment-radio-wrap">
                        <span className={`custom-radio ${fulfillmentType === 'delivery' ? 'checked' : ''}`}></span>
                        <div className="fulfillment-title-group">
                          <span className="fulfillment-badge delivery">Doorstep Gondia</span>
                          <h4 className="fulfillment-name">
                            <Truck size={18} />
                            <span>Home Delivery</span>
                          </h4>
                        </div>
                      </div>
                      <div className="fulfillment-price-tag">
                        {treeQuantity > 0 ? `₹${treeQuantity * 50}` : '₹50'}
                      </div>
                    </div>

                    <p className="fulfillment-card-desc">
                      Delivered directly to your home address in Gondia. Charged based on quantity of trees ordered: <strong>₹50 per banana tree bundle</strong>.
                    </p>

                    <div className="fulfillment-calc-note">
                      {treeQuantity > 0 ? (
                        <span>🚚 {treeQuantity} tree bundle{treeQuantity > 1 ? 's' : ''} in cart × ₹50 = <strong>₹{treeQuantity * 50} delivery fee</strong></span>
                      ) : (
                        <span>🚚 Standard flat delivery: <strong>₹50</strong> (No tree bundles in cart)</span>
                      )}
                    </div>
                  </div>

                  {/* Option 2: Self Pickup */}
                  <div
                    className={`fulfillment-card ${fulfillmentType === 'pickup' ? 'selected' : ''}`}
                    onClick={() => setFulfillmentType('pickup')}
                    role="button"
                    tabIndex={0}
                    id="option-self-pickup"
                  >
                    <div className="fulfillment-card-top">
                      <div className="fulfillment-radio-wrap">
                        <span className={`custom-radio ${fulfillmentType === 'pickup' ? 'checked' : ''}`}></span>
                        <div className="fulfillment-title-group">
                          <span className="fulfillment-badge pickup">Zero Extra Cost</span>
                          <h4 className="fulfillment-name">
                            <Store size={18} />
                            <span>Self Pickup Point</span>
                          </h4>
                        </div>
                      </div>
                      <div className="fulfillment-price-tag free">
                        FREE (₹0)
                      </div>
                    </div>

                    <p className="fulfillment-card-desc">
                      Collect your fresh Diwali essentials yourself from our central Gondia pickup point on Diwali morning with zero extra charge.
                    </p>

                    <div className="pickup-location-highlight">
                      <div className="pickup-loc-badge">
                        <MapPin size={14} />
                        <span>Pickup Point Address:</span>
                      </div>
                      <p className="pickup-loc-address">
                        <strong>Bajrang Chaat House</strong>, Beside JIO BP petrol pump, Amgaon Road, Fulchur Naka, Gondia
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Customer Form */}
              <form onSubmit={handleFormSubmit} noValidate style={{ marginTop: '24px' }}>
                <div className="form-grid">
                  {/* Full Name */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="fullName">
                      Full Name <span className="req">*</span>
                    </label>
                    <div className="input-wrapper">
                      <User size={18} className="input-icon" />
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        className={`form-input ${formErrors.fullName ? 'error' : ''}`}
                        placeholder="e.g. Ramesh Kulkarni"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    {formErrors.fullName && <span className="field-error-msg">{formErrors.fullName}</span>}
                  </div>

                  {/* Mobile Number */}
                  <div className="form-group">
                    <label className="form-label" htmlFor="mobileNumber">
                      Mobile Number <span className="req">*</span>
                    </label>
                    <div className="input-wrapper">
                      <Phone size={18} className="input-icon" />
                      <input
                        type="tel"
                        id="mobileNumber"
                        name="mobileNumber"
                        maxLength="10"
                        className={`form-input ${formErrors.mobileNumber ? 'error' : ''}`}
                        placeholder="10-digit mobile number"
                        value={formData.mobileNumber}
                        onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value.replace(/\D/g, '') })}
                        required
                      />
                    </div>
                    {formErrors.mobileNumber && <span className="field-error-msg">{formErrors.mobileNumber}</span>}
                  </div>

                  {/* Conditional Address Handling: Delivery vs Pickup */}
                  {fulfillmentType === 'delivery' ? (
                    <div className="form-group form-group-full">
                      <label className="form-label" htmlFor="deliveryAddress">
                        Home Delivery Address in Gondia <span className="req">*</span>
                      </label>
                      <div className="input-wrapper">
                        <MapPin size={18} className="input-icon" />
                        <input
                          type="text"
                          id="deliveryAddress"
                          name="deliveryAddress"
                          className={`form-input ${formErrors.deliveryAddress ? 'error' : ''}`}
                          placeholder="House/Flat No., Society / Mohalla, Landmark, Gondia"
                          value={formData.deliveryAddress}
                          onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                          required
                        />
                      </div>
                      {formErrors.deliveryAddress && (
                        <span className="field-error-msg">{formErrors.deliveryAddress}</span>
                      )}
                    </div>
                  ) : (
                    <div className="form-group form-group-full">
                      <div className="pickup-confirmed-info-box">
                        <div className="pickup-box-icon">
                          <Store size={22} color="#2D6A2E" />
                        </div>
                        <div className="pickup-box-text">
                          <strong>Self Pickup Point Selected:</strong>
                          <p>
                            Bajrang Chaat House, Beside JIO BP petrol pump, Amgaon Road, Fulchur Naka, Gondia.
                          </p>
                          <small>✓ No home address required. Simply visit on Diwali morning with your booking name or phone number.</small>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Special Instructions (Optional) */}
                  <div className="form-group form-group-full">
                    <label className="form-label" htmlFor="specialInstructions">
                      Special Instructions <span className="opt">(Optional)</span>
                    </label>
                    <div className="input-wrapper">
                      <textarea
                        id="specialInstructions"
                        name="specialInstructions"
                        className="form-textarea"
                        placeholder="e.g. Morning delivery preferred for Lakshmi Puja preparation, gate code, landmark, etc."
                        value={formData.specialInstructions}
                        onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                      ></textarea>
                    </div>
                  </div>
                </div>

                {/* Final Order Summary Card */}
                <div className="form-summary-card">
                  <div className="form-summary-row">
                    <span>Items Subtotal:</span>
                    <strong>₹{totalOrderValue.toLocaleString('en-IN')}</strong>
                  </div>
                  <div className="form-summary-row">
                    <span>Fulfillment Method:</span>
                    <strong>{fulfillmentType === 'pickup' ? 'Self Pickup (Bajrang Chaat House)' : 'Home Delivery (Gondia)'}</strong>
                  </div>
                  <div className="form-summary-row">
                    <span>Delivery Charges:</span>
                    <strong style={{ color: fulfillmentType === 'pickup' ? '#2D6A2E' : '#8C6A18' }}>
                      {fulfillmentType === 'pickup' 
                        ? 'FREE (₹0)' 
                        : `₹${deliveryFee} (${treeQuantity > 0 ? `${treeQuantity} tree bundle${treeQuantity > 1 ? 's' : ''} × ₹50` : 'Standard Delivery'})`}
                    </strong>
                  </div>
                  <div className="form-summary-row">
                    <span>Advance Payment Required:</span>
                    <strong style={{ color: '#2D6A2E' }}>₹0 (Zero Advance)</strong>
                  </div>
                  <div className="form-summary-row highlight-pay">
                    <span>Total Amount Payable {fulfillmentType === 'pickup' ? 'at Pickup' : 'on Delivery'}:</span>
                    <span className="pay-badge">₹{grandTotal.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {submissionError && (
                  <div className="field-error-msg" style={{ fontSize: '0.88rem', marginBottom: '16px', textAlign: 'center' }}>
                    <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                    {submissionError}
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  className="btn-submit-booking"
                  disabled={isSubmitting || basket.length === 0}
                  id="submit-booking-btn"
                >
                  {isSubmitting ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Confirming Booking &amp; Syncing with Farm Sheet...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={20} />
                      <span>
                        {fulfillmentType === 'pickup' 
                          ? `CONFIRM SELF PICKUP BOOKING (PAY ₹${grandTotal.toLocaleString('en-IN')} AT PICKUP)` 
                          : `CONFIRM HOME DELIVERY (PAY ₹${grandTotal.toLocaleString('en-IN')} ON DELIVERY)`}
                      </span>
                    </>
                  )}
                </button>

                <div className="payment-trust-strip">
                  <div className="payment-trust-item">
                    <ShieldCheck size={14} color="#3E8E41" />
                    <span>Pay Safely on {fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}</span>
                  </div>
                  <div className="payment-trust-item">
                    <Table size={14} color="#2D6A2E" />
                    <span>Direct Sync to Farm Dispatch Sheet</span>
                  </div>
                  <div className="payment-trust-item">
                    <Sparkles size={14} color="#D4AF37" />
                    <span>Instant Confirmation</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ORDER CONFIRMATION MODAL (DISPLAYED ON THE SAME PAGE) */}
      {confirmedOrder && (
        <div className="confirmation-overlay" role="dialog" aria-modal="true">
          <div className="confirmation-card">
            <div className="confirmation-header">
              <div className="conf-diya-icon">🪔</div>
              <h2>Your Diwali Booking is Confirmed!</h2>
              <p>Thank you for choosing Bhaskar Banana Farm. Your festive order has been successfully booked!</p>
            </div>

            <div className="confirmation-body">
              <div style={{ textAlign: 'center' }}>
                <span className="order-badge-pill">
                  Booking ID: {confirmedOrder.id}
                </span>
                <div style={{ marginTop: '6px', fontSize: '0.82rem', color: '#2D6A2E', fontWeight: 600 }}>
                  ✓ Order details recorded &amp; synced with Farm Dispatch Sheet
                </div>
              </div>

              {/* Customer Info */}
              <div className="conf-details-grid" style={{ marginTop: '16px' }}>
                <div className="conf-detail-item">
                  <strong>Customer Name</strong>
                  <span>{confirmedOrder.customer_name}</span>
                </div>
                <div className="conf-detail-item">
                  <strong>Mobile Number</strong>
                  <span>{confirmedOrder.customer_phone}</span>
                </div>
                <div className="conf-detail-item">
                  <strong>Fulfillment Option</strong>
                  <span style={{ fontWeight: 700, color: confirmedOrder.fulfillment_type === 'pickup' ? '#2D6A2E' : '#8C6A18' }}>
                    {confirmedOrder.fulfillment_type === 'pickup' ? '🏪 Self Pickup (FREE)' : '🚚 Home Delivery'}
                  </span>
                </div>
                <div className="conf-detail-item">
                  <strong>Delivery Fee</strong>
                  <span>{confirmedOrder.delivery_fee > 0 ? `₹${confirmedOrder.delivery_fee}` : 'FREE (₹0)'}</span>
                </div>
                <div className="conf-detail-item" style={{ gridColumn: 'span 2' }}>
                  <strong>{confirmedOrder.fulfillment_type === 'pickup' ? 'Pickup Point Location' : 'Delivery Address'}</strong>
                  <span>{confirmedOrder.delivery_address}</span>
                </div>
                {confirmedOrder.special_instructions && (
                  <div className="conf-detail-item" style={{ gridColumn: 'span 2' }}>
                    <strong>Special Instructions</strong>
                    <span>{confirmedOrder.special_instructions}</span>
                  </div>
                )}
              </div>

              {/* Ordered Products Breakdown */}
              <div className="conf-items-list">
                <strong style={{ display: 'block', fontSize: '0.82rem', color: '#555', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Ordered Items:
                </strong>
                {Array.isArray(confirmedOrder.items) && confirmedOrder.items.map((item, idx) => (
                  <div key={idx} className="conf-item-row">
                    <div>
                      <div className="conf-item-title">{item.productName}</div>
                      <div className="conf-item-sub">Variant: {item.variantLabel}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 600 }}>Qty: {item.quantity}</span>
                      <div style={{ fontSize: '0.82rem', color: '#555' }}>₹{item.subtotal}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment Status & Balance Breakdown */}
              <div className="conf-pricing-breakdown">
                <div className="conf-price-line">
                  <span>Grand Total Order Amount:</span>
                  <strong>₹{confirmedOrder.total_order_value}</strong>
                </div>
                <div className="conf-price-line">
                  <span>Delivery Charges Included:</span>
                  <span>{confirmedOrder.delivery_fee > 0 ? `₹${confirmedOrder.delivery_fee}` : 'FREE (₹0)'}</span>
                </div>
                <div className="conf-price-line paid-line">
                  <span>Advance Paid:</span>
                  <span>₹0 (Zero Advance Required)</span>
                </div>
                <div className="conf-price-line due-line">
                  <span>Amount Due on {confirmedOrder.fulfillment_type === 'pickup' ? 'Pickup' : 'Delivery'}:</span>
                  <span>₹{confirmedOrder.total_order_value} (Cash / UPI)</span>
                </div>
              </div>

              <div className="conf-actions">
                <button
                  type="button"
                  className="btn-primary"
                  style={{ flex: 1, padding: '14px' }}
                  onClick={handleCloseConfirmation}
                >
                  Book Another Festive Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. STICKY MOBILE CTA (Appears on mobile devices for easy access) */}
      <div className="sticky-mobile-cta">
        <div className="sticky-cta-info">
          <div className="sticky-cta-title">Bhaskar Banana Farm</div>
          <div className="sticky-cta-amount">
            {basket.length > 0 ? (
              <span>₹{grandTotal.toLocaleString('en-IN')} ({fulfillmentType === 'pickup' ? 'Self Pickup' : 'Pay on Delivery'})</span>
            ) : (
              <span>Zero Advance Required</span>
            )}
          </div>
        </div>
        <button 
          className="sticky-cta-btn" 
          onClick={() => {
            if (basket.length === 0) {
              scrollToSection('collection');
            } else {
              scrollToSection('booking');
            }
          }}
        >
          {basket.length > 0 ? 'Complete Booking' : 'Select Essentials'}
        </button>
      </div>

      {/* 8. SMALL ELEGANT FOOTER */}
      <footer className="site-footer">
        <div className="container">
          <div className="footer-diya">🪔</div>
          <h3 className="footer-title">Bhaskar Banana Farm</h3>
          <p className="footer-blessing">
            May Lord Ganesha and Goddess Lakshmi bless your home with divine prosperity, peace, and auspicious joy this Diwali.
          </p>

          <p className="footer-notes">
            Bhaskar Banana Farm seasonal Diwali harvest. Living banana trees and organic leaves are harvested fresh from our farm and dispatched in specialized botanical protective packaging. Prices displayed are configurable pre-booking values.
          </p>

          <div className="footer-copy">
            © {new Date().getFullYear()} Bhaskar Banana Farm. All Rights Reserved. Pure Nature, Pure Tradition.
          </div>
        </div>
      </footer>
    </div>
  );
}
