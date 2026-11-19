import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../types';

export function CartPage() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    cartSavings,
    shippingFee,
    cartTotal,
  } = useStore();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="border-b border-slate-200 pb-6 mb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
          KLE COMMERCE Bag
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-[#0B192C]">Shopping Cart</h1>
      </div>

      {cart.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#0B192C]">Your shopping cart is empty</h2>
          <p className="mt-1 text-sm text-slate-500">
            Browse our catalog and add products to begin your order.
          </p>
          <Link
            to="/category/all"
            className="mt-6 inline-block px-6 py-3 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Items List */}
          <div className="lg:col-span-8 divide-y divide-slate-200 border border-slate-200 rounded-3xl bg-white overflow-hidden">
            {cart.map(({ product, quantity }) => (
              <div key={product.id} className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                <Link
                  to={`/product/${product.id}`}
                  className="w-28 h-24 rounded-2xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100"
                >
                  <SmartImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 uppercase tracking-wider">
                    {product.brand} · {product.categoryName}
                  </p>
                  <Link
                    to={`/product/${product.id}`}
                    className="mt-1 block font-display text-base font-bold text-[#0B192C] hover:text-purple-700"
                  >
                    {product.name}
                  </Link>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-semibold text-sm text-[#0B192C] tabular-nums">
                      {formatPrice(product.discountPrice)}
                    </span>
                    {product.originalPrice > product.discountPrice && (
                      <span className="text-xs text-slate-400 line-through tabular-nums">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-center">
                  <div className="inline-flex items-center border border-slate-200 rounded-full bg-slate-50">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(product.id, quantity - 1)}
                      aria-label="Decrease quantity"
                      className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-[#0B192C] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-sm font-bold tabular-nums text-[#0B192C]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= product.stock}
                      onClick={() => updateCartQuantity(product.id, quantity + 1)}
                      aria-label="Increase quantity"
                      className="w-9 h-9 flex items-center justify-center text-slate-600 hover:text-[#0B192C] disabled:opacity-40 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="w-24 text-right font-display font-bold text-[#0B192C] tabular-nums">
                    {formatPrice(product.discountPrice * quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Remove ${product.name}`}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <aside className="lg:col-span-4 rounded-3xl border border-slate-200 bg-slate-50/70 p-6 sm:p-7 space-y-4">
            <h2 className="font-display text-lg font-bold text-[#0B192C]">Order Summary</h2>

            <div className="space-y-2.5 text-sm pt-2 border-t border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums font-semibold text-[#0B192C]">
                  {formatPrice(cartSubtotal)}
                </span>
              </div>
              {cartSavings > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount Savings</span>
                  <span className="tabular-nums font-semibold">-{formatPrice(cartSavings)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges</span>
                <span className="tabular-nums font-semibold text-[#0B192C]">
                  {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                </span>
              </div>
              {cartSubtotal < 999 && (
                <p className="text-xs text-purple-700">
                  Add {formatPrice(999 - cartSubtotal)} more for free express delivery.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
              <span className="font-display text-base font-bold text-[#0B192C]">Final Amount</span>
              <span className="font-display text-2xl font-extrabold text-[#0B192C] tabular-nums">
                {formatPrice(cartTotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => navigate('/checkout')}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-full bg-purple-700 text-white text-sm font-semibold hover:bg-[#0B192C] transition-colors cursor-pointer"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
