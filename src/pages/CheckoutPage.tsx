import { CheckCircle2, CreditCard, Lock, Smartphone, Truck } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../lib/api';
import { formatPrice, type Order, type PaymentMethod } from '../types';

export function CheckoutPage() {
  const {
    user,
    cart,
    cartSubtotal,
    shippingFee,
    cartTotal,
    clearCart,
    refreshCatalog,
    showToast,
  } = useStore();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [pinCode, setPinCode] = useState(user?.pinCode || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
      if (!mobile && user.phone) setMobile(user.phone);
      if (!address && user.address) setAddress(user.address);
      if (!city && user.city) setCity(user.city);
      if (!pinCode && user.pinCode) setPinCode(user.pinCode);
    }
  }, [user, customerName, customerEmail, mobile, address, city, pinCode]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobile.replace(/\D/g, '');
    if (customerName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }
    if (cleanMobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (address.trim().length < 5 || !city.trim()) {
      setError('Please enter your complete delivery address and city.');
      return;
    }
    if (!/^\d{6}$/.test(pinCode.trim())) {
      setError('Please enter a valid 6-digit PIN code.');
      return;
    }

    setSubmitting(true);
    try {
      const order = await apiRequest<Order>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim() || 'guest@klecommerce.com',
          mobile: cleanMobile.slice(-10),
          address: address.trim(),
          city: city.trim(),
          pinCode: pinCode.trim(),
          paymentMethod,
          items: cart.map((c) => ({ productId: c.product.id, quantity: c.quantity })),
        }),
      });
      clearCart();
      await refreshCatalog();
      showToast(`Order ${order.orderNumber} confirmed!`, 'success');
      navigate(`/order-confirmation/${order.id}`, { state: { order } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#0B192C]">No items to checkout</h1>
        <p className="mt-2 text-sm text-slate-500">
          Add products to your shopping cart before proceeding to checkout.
        </p>
        <Link
          to="/category/all"
          className="mt-6 inline-block px-6 py-3 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="border-b border-slate-200 pb-6 mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
          Safe Test Checkout
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-[#0B192C]">
          Shipping & Payment
        </h1>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Shipping Form */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-lg font-bold text-[#0B192C]">Delivery Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Aarav Kulkarni"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mobile Number (10 digits) *
                </label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="9880144556"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email for Order Receipt
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="you@klecommerce.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Delivery Address *
              </label>
              <textarea
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House / Hostel Block, Street, Landmark"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  City *
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Hubballi"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  PIN Code (6 digits) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="580031"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* Safe Test Payment Selection */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[#0B192C]">Payment Method</h2>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <Lock className="w-3.5 h-3.5" />
                Test Mode (No real charge)
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Select a safe simulated payment option below. No real card or banking credentials are collected.
            </p>

            <div className="space-y-3">
              {[
                {
                  id: 'cod' as PaymentMethod,
                  title: 'Cash on Delivery (COD)',
                  subtitle: 'Pay in cash or UPI upon doorstep delivery verification',
                  icon: Truck,
                },
                {
                  id: 'upi_test' as PaymentMethod,
                  title: 'UPI Test Payment (Simulated)',
                  subtitle: 'Instant simulated UPI approval without real bank transfer',
                  icon: Smartphone,
                },
                {
                  id: 'card_test' as PaymentMethod,
                  title: 'Test Card Checkout (Simulated)',
                  subtitle: 'Uses sandbox test authorization — no card numbers requested',
                  icon: CreditCard,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const selected = paymentMethod === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                      selected
                        ? 'border-purple-600 bg-purple-50/50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={opt.id}
                      checked={selected}
                      onChange={() => setPaymentMethod(opt.id)}
                      className="mt-1 accent-purple-700"
                    />
                    <Icon className={`w-5 h-5 mt-0.5 ${selected ? 'text-purple-700' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-sm font-semibold text-[#0B192C]">{opt.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{opt.subtitle}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="lg:col-span-5 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 space-y-5 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold text-[#0B192C]">Order Summary</h2>

          <ul className="divide-y divide-slate-200 max-h-72 overflow-y-auto pr-1">
            {cart.map(({ product, quantity }) => (
              <li key={product.id} className="py-3 flex items-center gap-3">
                <div className="w-14 h-12 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0">
                  <SmartImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#0B192C] truncate">{product.name}</p>
                  <p className="text-xs text-slate-500 tabular-nums">Qty: {quantity}</p>
                </div>
                <span className="text-xs font-bold text-[#0B192C] tabular-nums">
                  {formatPrice(product.discountPrice * quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="space-y-2 pt-3 border-t border-slate-200 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums font-medium">{formatPrice(cartSubtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="tabular-nums font-medium">
                {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-slate-200 text-base font-bold text-[#0B192C]">
              <span>Payable Total</span>
              <span className="tabular-nums text-xl">{formatPrice(cartTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-purple-700 text-white text-sm font-semibold hover:bg-[#0B192C] disabled:opacity-60 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? 'Placing Order...' : `Place Order · ${formatPrice(cartTotal)}`}
          </button>
        </aside>
      </form>
    </div>
  );
}
