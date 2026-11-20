import { LogOut, Package, Save, ShieldCheck, User as UserIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../lib/api';
import { formatPrice, type Order, type User } from '../types';

export function ProfilePage() {
  const { user, authLoading, logout, refreshUser, showToast } = useStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setStudentId(user.studentId || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setPinCode(user.pinCode || '');

      apiRequest<Order[]>('/api/orders/my')
        .then((data) => setOrders(data))
        .catch(() => setOrders([]))
        .finally(() => setLoadingOrders(false));
    } else if (!authLoading) {
      setLoadingOrders(false);
    }
  }, [user, authLoading]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest<{ user: User }>('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, studentId, phone, address, city, pinCode }),
      });
      await refreshUser();
      showToast('Profile details saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-slate-500">
        Loading your profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#0B192C]">Sign in to view profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your delivery address, student ID, and order history.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/login"
            className="px-6 py-2.5 rounded-full bg-[#0B192C] text-white text-sm font-semibold"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-6 py-2.5 rounded-full border border-slate-300 text-sm font-semibold text-[#0B192C]"
          >
            Register
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
            {user.role === 'admin' ? 'Administrator Account' : 'Student & Customer Profile'}
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-[#0B192C]">{user.name}</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>

        <div className="flex items-center gap-3">
          {user.role === 'admin' && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-700 text-white text-xs font-semibold hover:bg-[#0B192C] transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              Open Admin Console
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Form */}
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-[#0B192C] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-purple-700" />
            Account & Saved Address
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="KLE-2026-..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Default Delivery Address
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code</label>
              <input
                type="text"
                maxLength={6}
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:border-purple-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Order History */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0B192C] flex items-center gap-2">
            <Package className="w-4 h-4 text-purple-700" />
            Order History
          </h2>

          {loadingOrders ? (
            <div className="h-40 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse" />
          ) : orders.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
              <p className="font-display font-semibold text-[#0B192C]">No orders placed yet</p>
              <p className="text-xs text-slate-500 mt-1">
                When you complete a checkout, your order receipts will appear here.
              </p>
              <Link
                to="/category/all"
                className="mt-4 inline-block px-5 py-2 rounded-full bg-[#0B192C] text-white text-xs font-semibold"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div>
                      <p className="font-mono text-xs font-bold text-[#0B192C]">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        · {order.paymentStatus}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-purple-700">
                        Status: {order.status}
                      </span>
                      <span className="font-display text-base font-bold text-[#0B192C] tabular-nums">
                        {formatPrice(order.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {order.items.map((item, i) => (
                      <li key={i} className="flex justify-between">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span className="tabular-nums font-medium">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="pt-2 flex justify-end gap-4">
                    <Link
                      to={`/order-confirmation/${order.id}#shipping-map`}
                      className="text-xs font-semibold text-purple-700 hover:underline"
                    >
                      Track on Shipping Map →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
