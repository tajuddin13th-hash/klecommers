import { ArrowRight, CheckCircle2, PackageCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { SmartImage } from '../components/SmartImage';
import { apiRequest } from '../lib/api';
import { formatPrice, type Order } from '../types';

export function OrderConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const stateOrder = (location.state as { order?: Order } | null)?.order;
  const [order, setOrder] = useState<Order | null>(stateOrder || null);
  const [loading, setLoading] = useState(!stateOrder);

  useEffect(() => {
    if (!order && id) {
      apiRequest<Order>(`/api/orders/${id}`)
        .then((data) => setOrder(data))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    }
  }, [id, order]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading order receipt...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#0B192C]">Order receipt not found</h1>
        <Link
          to="/"
          className="mt-6 inline-block px-6 py-2.5 rounded-full bg-[#0B192C] text-white text-sm font-semibold"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10">
        <div className="flex items-center gap-3 text-emerald-700 mb-4">
          <CheckCircle2 className="w-8 h-8" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider">Order Placed Successfully</p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B192C]">
              Order {order.orderNumber} Confirmed
            </h1>
          </div>
        </div>

        <p className="text-sm text-slate-600">
          Thank you, <span className="font-semibold text-[#0B192C]">{order.customerName}</span>. Your order is currently{' '}
          <span className="font-semibold text-purple-700">{order.status}</span> and being prepared for dispatch.
        </p>

        {/* Shipping & Payment Info */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Delivering To
            </p>
            <p className="mt-1 font-semibold text-[#0B192C]">{order.customerName}</p>
            <p className="text-slate-600">{order.address}</p>
            <p className="text-slate-600">
              {order.city} — {order.pinCode}
            </p>
            <p className="text-slate-600 mt-1">Mobile: {order.mobile}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Payment Summary
            </p>
            <p className="mt-1 font-semibold text-[#0B192C]">{order.paymentStatus}</p>
            <p className="text-slate-600">
              Method:{' '}
              {order.paymentMethod === 'cod'
                ? 'Cash on Delivery'
                : order.paymentMethod === 'upi_test'
                ? 'UPI Test Mode'
                : 'Test Card Checkout'}
            </p>
            <p className="text-slate-600 mt-1 tabular-nums">
              Date: {new Date(order.createdAt).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        {/* Items */}
        <div className="mt-6">
          <h2 className="font-display text-base font-bold text-[#0B192C] mb-3 flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-purple-700" />
            Items Ordered
          </h2>
          <ul className="divide-y divide-slate-100 border-t border-b border-slate-200">
            {order.items.map((item, idx) => (
              <li key={idx} className="py-3 flex items-center gap-4">
                <div className="w-14 h-12 rounded-xl bg-slate-50 overflow-hidden shrink-0">
                  <SmartImage
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0B192C] truncate">{item.name}</p>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className="font-display text-sm font-bold text-[#0B192C] tabular-nums">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Shipping</span>
              <span className="tabular-nums">
                {order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 font-display text-lg font-extrabold text-[#0B192C]">
              <span>Total Paid / Payable</span>
              <span className="tabular-nums">{formatPrice(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/category/all"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/profile"
            className="px-6 py-3 rounded-full border border-slate-300 text-sm font-semibold text-[#0B192C] hover:bg-slate-50 transition-colors"
          >
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
}
