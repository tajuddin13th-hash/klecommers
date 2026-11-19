import {
  Edit3,
  FolderKanban,
  LogOut,
  Package,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../lib/api';
import {
  formatPrice,
  type AdminStats,
  type Category,
  type Order,
  type OrderStatus,
  type Product,
  type User,
} from '../types';

type AdminTab = 'products' | 'categories' | 'orders';

const IMAGE_PRESETS = [
  { label: 'Fashion Blazer', url: '/src/assets/images/cat_fashion_1795067785241.jpg' },
  { label: 'Leather Sneakers', url: '/src/assets/images/prod_sneakers_fashion_1795067785645.jpg' },
  { label: 'Studio Headphones', url: '/src/assets/images/cat_electronics_1795067785332.jpg' },
  { label: 'Titanium Mobile', url: '/src/assets/images/cat_mobiles_1795067785340.jpg' },
  { label: 'Gourmet Pantry', url: '/src/assets/images/cat_groceries_1795067785832.jpg' },
  { label: 'Espresso Appliance', url: '/src/assets/images/cat_appliances_1795067785262.jpg' },
  { label: 'Botanical Serum', url: '/src/assets/images/cat_beauty_1795067785143.jpg' },
  { label: 'Hardcover Books', url: '/src/assets/images/cat_books_1795067785107.jpg' },
  { label: 'Running & Flask', url: '/src/assets/images/cat_sports_1795067785322.jpg' },
  { label: 'Watch & Eyewear', url: '/src/assets/images/cat_accessories_1795067785551.jpg' },
  { label: 'Smartwatch', url: '/src/assets/images/prod_smartwatch_1795067784818.jpg' },
];

export function AdminDashboardPage() {
  const { user, setSession, logout, categories, products, refreshCatalog, showToast } = useStore();

  // Admin Login state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  // Product modal state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pSku, setPSku] = useState('');
  const [pCategorySlug, setPCategorySlug] = useState('electronics');
  const [pDescription, setPDescription] = useState('');
  const [pHighlights, setPHighlights] = useState('');
  const [pOriginalPrice, setPOriginalPrice] = useState('4999');
  const [pDiscountPrice, setPDiscountPrice] = useState('3999');
  const [pStock, setPStock] = useState('25');
  const [pImage, setPImage] = useState(IMAGE_PRESETS[2].url);
  const [pTrending, setPTrending] = useState(true);
  const [pBestSeller, setPBestSeller] = useState(false);
  const [pSpecialOffer, setPSpecialOffer] = useState(false);
  const [pNewArrival, setPNewArrival] = useState(true);
  const [savingProduct, setSavingProduct] = useState(false);

  // Category form state
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const loadAdminData = useCallback(async () => {
    if (!user || user.role !== 'admin') return;
    try {
      const [st, ords] = await Promise.all([
        apiRequest<AdminStats>('/api/admin/stats'),
        apiRequest<Order[]>('/api/admin/orders'),
      ]);
      setStats(st);
      setOrders(ords);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    }
  }, [user]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await apiRequest<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: adminEmail.trim(), password: adminPassword }),
      });
      if (res.user.role !== 'admin') {
        setLoginError('This account does not have administrator privileges.');
        setLoggingIn(false);
        return;
      }
      setSession(res.token, res.user);
      showToast('Signed in to KLE COMMERCE Admin Console', 'success');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Admin login failed');
    } finally {
      setLoggingIn(false);
    }
  };

  const openAddProduct = () => {
    setEditingProduct(null);
    setPName('');
    setPBrand('KLE Studio');
    setPSku(`KLE-${Date.now().toString().slice(-4)}`);
    setPCategorySlug(categories[0]?.slug || 'fashion');
    setPDescription('');
    setPHighlights('Verified quality, 1-year warranty');
    setPOriginalPrice('4999');
    setPDiscountPrice('3999');
    setPStock('20');
    setPImage(IMAGE_PRESETS[0].url);
    setPTrending(true);
    setPBestSeller(false);
    setPSpecialOffer(false);
    setPNewArrival(true);
    setProductModalOpen(true);
  };

  const openEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPBrand(prod.brand);
    setPSku(prod.sku);
    setPCategorySlug(prod.categorySlug);
    setPDescription(prod.description);
    setPHighlights(prod.highlights.join(', '));
    setPOriginalPrice(String(prod.originalPrice));
    setPDiscountPrice(String(prod.discountPrice));
    setPStock(String(prod.stock));
    setPImage(prod.image);
    setPTrending(prod.isTrending);
    setPBestSeller(prod.isBestSeller);
    setPSpecialOffer(prod.isSpecialOffer);
    setPNewArrival(prod.isNewArrival);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    try {
      const payload = {
        name: pName,
        brand: pBrand,
        sku: pSku,
        categorySlug: pCategorySlug,
        description: pDescription,
        highlights: pHighlights
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        originalPrice: Number(pOriginalPrice),
        discountPrice: Number(pDiscountPrice),
        stock: Number(pStock),
        image: pImage,
        isTrending: pTrending,
        isBestSeller: pBestSeller,
        isSpecialOffer: pSpecialOffer,
        isNewArrival: pNewArrival,
      };

      if (editingProduct) {
        await apiRequest(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showToast('Product updated', 'success');
      } else {
        await apiRequest('/api/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast('New product added to catalog', 'success');
      }

      setProductModalOpen(false);
      await Promise.all([refreshCatalog(), loadAdminData()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save product', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    try {
      await apiRequest(`/api/products/${id}`, { method: 'DELETE' });
      showToast(`Deleted "${name}"`, 'info');
      await Promise.all([refreshCatalog(), loadAdminData()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const handleQuickStockChange = async (prod: Product, nextStock: number) => {
    try {
      await apiRequest(`/api/products/${prod.id}`, {
        method: 'PUT',
        body: JSON.stringify({ stock: Math.max(0, nextStock) }),
      });
      await Promise.all([refreshCatalog(), loadAdminData()]);
      showToast(`Updated ${prod.name} stock`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Stock update failed', 'error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      if (editingCat) {
        await apiRequest(`/api/categories/${editingCat.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() }),
        });
        showToast('Category updated', 'success');
      } else {
        await apiRequest('/api/categories', {
          method: 'POST',
          body: JSON.stringify({ name: catName.trim(), description: catDesc.trim() }),
        });
        showToast('Category created', 'success');
      }
      setCatName('');
      setCatDesc('');
      setEditingCat(null);
      await Promise.all([refreshCatalog(), loadAdminData()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Category save failed', 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    try {
      await apiRequest(`/api/categories/${cat.id}`, { method: 'DELETE' });
      showToast(`Removed category ${cat.name}`, 'info');
      await Promise.all([refreshCatalog(), loadAdminData()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  const handleOrderStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await apiRequest(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Order marked ${status}`, 'success');
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed', 'error');
    }
  };

  // Admin Login Gate
  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-14">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-[#0B192C] text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
            KLE COMMERCE Admin Portal
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-[#0B192C]">
            Administrator Sign In
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage products, inventory stock, categories, customer orders, and sales analytics.
          </p>

          {user && user.role !== 'admin' && (
            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Currently signed in as customer ({user.email}). Sign in with an admin account below.
            </div>
          )}

          {loginError && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@klecommerce.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full py-3 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
            >
              {loggingIn ? 'Verifying...' : 'Sign In to Admin Console'}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setAdminEmail('admin@klecommerce.com');
                setAdminPassword('Admin@123');
              }}
              className="w-full py-2 rounded-xl border border-purple-200 bg-purple-50/50 text-xs font-semibold text-purple-700 hover:bg-purple-50 cursor-pointer"
            >
              Fill Demo Admin (admin@klecommerce.com / Admin@123)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
            Store Operations
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-[#0B192C]">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openAddProduct}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-purple-700 text-white text-xs font-semibold hover:bg-[#0B192C] transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </button>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <p className="text-xs font-medium text-slate-500">Total Sales Revenue</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0B192C] tabular-nums">
            {stats ? formatPrice(stats.totalSales) : '—'}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <p className="text-xs font-medium text-slate-500">Customer Orders</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0B192C] tabular-nums">
            {stats ? stats.totalOrders : '—'}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <p className="text-xs font-medium text-slate-500">Active Products</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-[#0B192C] tabular-nums">
            {stats ? stats.totalProducts : products.length}
          </p>
        </div>
        <div className="p-5 rounded-2xl border border-slate-200 bg-white">
          <p className="text-xs font-medium text-slate-500">Low Stock Items (≤ 10)</p>
          <p className="mt-2 font-display text-2xl font-extrabold text-amber-600 tabular-nums">
            {stats ? stats.lowStockCount : '—'}
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-full bg-slate-100">
          {[
            { id: 'products' as AdminTab, label: 'Products & Inventory', icon: Package },
            { id: 'categories' as AdminTab, label: 'Categories', icon: FolderKanban },
            { id: 'orders' as AdminTab, label: 'Customer Orders', icon: ShoppingCart },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  active ? 'bg-[#0B192C] text-white' : 'text-slate-600 hover:text-[#0B192C]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'products' && (
          <input
            type="search"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter SKU, product, or category..."
            className="w-full sm:w-64 px-4 py-2 rounded-full border border-slate-200 text-xs focus:outline-none focus:border-purple-600"
          />
        )}
      </div>

      {/* Tab 1: Products & Inventory */}
      {activeTab === 'products' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-center">Inventory Stock</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <SmartImage
                          src={prod.image}
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0B192C] line-clamp-1">{prod.name}</p>
                        <p className="font-mono text-[11px] text-slate-400">
                          {prod.sku} · {prod.brand}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{prod.categoryName}</td>
                  <td className="py-3 px-4 text-right font-semibold text-[#0B192C] tabular-nums">
                    {formatPrice(prod.discountPrice)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickStockChange(prod, prod.stock - 1)}
                        className="w-7 h-7 rounded-full border border-slate-200 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        -
                      </button>
                      <span
                        className={`w-10 text-center font-mono text-xs font-bold tabular-nums ${
                          prod.stock <= 10 ? 'text-amber-600' : 'text-[#0B192C]'
                        }`}
                      >
                        {prod.stock}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuickStockChange(prod, prod.stock + 1)}
                        className="w-7 h-7 rounded-full border border-slate-200 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditProduct(prod)}
                        aria-label={`Edit ${prod.name}`}
                        className="p-2 rounded-full border border-slate-200 text-slate-600 hover:text-purple-700 hover:border-purple-300 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        aria-label={`Delete ${prod.name}`}
                        className="p-2 rounded-full border border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-300 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    <SmartImage src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display text-sm font-bold text-[#0B192C]">{cat.name}</p>
                    <p className="text-xs text-slate-500 truncate">{cat.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCat(cat);
                      setCatName(cat.name);
                      setCatDesc(cat.description);
                    }}
                    className="p-2 rounded-full border border-slate-200 text-slate-600 hover:text-purple-700 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-2 rounded-full border border-slate-200 text-slate-600 hover:text-red-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={handleSaveCategory}
            className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 space-y-4"
          >
            <h2 className="font-display text-base font-bold text-[#0B192C]">
              {editingCat ? `Edit "${editingCat.name}"` : 'Add New Category'}
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name
              </label>
              <input
                type="text"
                required
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Stationery"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="Short category summary..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-full bg-[#0B192C] text-white text-xs font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
              >
                {editingCat ? 'Update Category' : 'Create Category'}
              </button>
              {editingCat && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingCat(null);
                    setCatName('');
                    setCatDesc('');
                  }}
                  className="px-4 py-2.5 rounded-full border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Customer Orders */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3.5 px-4">Order ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Delivery Location</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4 font-mono text-xs font-bold text-[#0B192C]">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-[#0B192C] text-xs">{ord.customerName}</p>
                    <p className="text-[11px] text-slate-500">{ord.mobile}</p>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">
                    {ord.city} ({ord.pinCode})
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#0B192C] tabular-nums">
                    {formatPrice(ord.totalAmount)}
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600">{ord.paymentStatus}</td>
                  <td className="py-3 px-4">
                    <select
                      value={ord.status}
                      onChange={(e) =>
                        handleOrderStatusChange(ord.id, e.target.value as OrderStatus)
                      }
                      aria-label={`Order ${ord.orderNumber} status`}
                      className="px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-semibold text-[#0B192C] focus:outline-none focus:border-purple-600 cursor-pointer"
                    >
                      {(['Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'] as OrderStatus[]).map(
                        (st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        )
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Add / Edit Modal */}
      {productModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B192C]/50 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="font-display text-xl font-bold text-[#0B192C]">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={pCategorySlug}
                    onChange={(e) => setPCategorySlug(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={pSku}
                    onChange={(e) => setPSku(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pOriginalPrice}
                    onChange={(e) => setPOriginalPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discount Price (₹)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={pDiscountPrice}
                    onChange={(e) => setPDiscountPrice(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Image (Select Studio Asset or Custom Path)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={IMAGE_PRESETS.some((i) => i.url === pImage) ? pImage : ''}
                    onChange={(e) => {
                      if (e.target.value) setPImage(e.target.value);
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="">Choose preset studio photo...</option>
                    {IMAGE_PRESETS.map((preset) => (
                      <option key={preset.url} value={preset.url}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={pImage}
                    onChange={(e) => setPImage(e.target.value)}
                    placeholder="/src/assets/images/..."
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  rows={3}
                  required
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Highlights (comma-separated)
                </label>
                <input
                  type="text"
                  value={pHighlights}
                  onChange={(e) => setPHighlights(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1 text-xs font-medium text-slate-700">
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pTrending}
                    onChange={(e) => setPTrending(e.target.checked)}
                    className="accent-purple-700"
                  />
                  Trending
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pBestSeller}
                    onChange={(e) => setPBestSeller(e.target.checked)}
                    className="accent-purple-700"
                  />
                  Best Seller
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pSpecialOffer}
                    onChange={(e) => setPSpecialOffer(e.target.checked)}
                    className="accent-purple-700"
                  />
                  Special Offer
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pNewArrival}
                    onChange={(e) => setPNewArrival(e.target.checked)}
                    className="accent-purple-700"
                  />
                  New Arrival
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 py-2.5 rounded-full bg-purple-700 text-white text-xs font-semibold hover:bg-[#0B192C] transition-colors cursor-pointer"
                >
                  {savingProduct ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
