import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../types';
import { SmartImage } from './SmartImage';

export function CartDrawer() {
  const {
    cart,
    isCartDrawerOpen,
    closeCartDrawer,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    shippingFee,
    cartTotal,
    cartSavings,
  } = useStore();
  const navigate = useNavigate();

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div
        className="fixed inset-0 bg-[#0B192C]/40 backdrop-blur-[2px]"
        onClick={closeCartDrawer}
      />

      <aside className="relative z-10 w-full max-w-md bg-white h-full flex flex-col shadow-2xl border-l border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-purple-700" />
            <h2 className="font-display text-lg font-bold text-[#0B192C]">Shopping Bag</h2>
          </div>
          <button
            type="button"
            onClick={closeCartDrawer}
            aria-label="Close shopping bag"
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="font-display text-base font-semibold text-[#0B192C]">Your cart is empty</p>
              <p className="mt-1 text-sm text-slate-500 max-w-xs">
                Explore our 9 curated categories to add items to your bag.
              </p>
              <Link
                to="/category/all"
                onClick={closeCartDrawer}
                className="mt-5 px-5 py-2.5 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {cart.map(({ product, quantity }) => (
                <li key={product.id} className="py-4 flex gap-4">
                  <Link
                    to={`/product/${product.id}`}
                    onClick={closeCartDrawer}
                    className="w-20 h-20 rounded-xl bg-slate-50 overflow-hidden shrink-0 border border-slate-100"
                  >
                    <SmartImage
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/product/${product.id}`}
                        onClick={closeCartDrawer}
                        className="text-sm font-semibold text-[#0B192C] hover:text-purple-700 line-clamp-2"
                      >
                        {product.name}
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        aria-label={`Remove ${product.name}`}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5">{product.brand}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center border border-slate-200 rounded-full bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product.id, quantity - 1)}
                          aria-label="Decrease quantity"
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#0B192C] cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-semibold tabular-nums text-[#0B192C]">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={quantity >= product.stock}
                          onClick={() => updateCartQuantity(product.id, quantity + 1)}
                          aria-label="Increase quantity"
                          className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-[#0B192C] disabled:opacity-40 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-bold text-[#0B192C] tabular-nums">
                        {formatPrice(product.discountPrice * quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-5 bg-slate-50/70 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium">{formatPrice(cartSubtotal)}</span>
              </div>
              {cartSavings > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Savings</span>
                  <span className="tabular-nums font-medium">-{formatPrice(cartSavings)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Delivery</span>
                <span className="tabular-nums font-medium">
                  {shippingFee === 0 ? 'Free' : formatPrice(shippingFee)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-bold text-[#0B192C]">
                <span>Total Amount</span>
                <span className="tabular-nums">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  closeCartDrawer();
                  navigate('/cart');
                }}
                className="px-4 py-2.5 rounded-full border border-slate-300 bg-white text-sm font-semibold text-[#0B192C] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                View Cart
              </button>
              <button
                type="button"
                onClick={() => {
                  closeCartDrawer();
                  navigate('/checkout');
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-purple-700 text-white text-sm font-semibold hover:bg-[#0B192C] transition-colors cursor-pointer"
              >
                Checkout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
