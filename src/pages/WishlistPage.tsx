import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../types';

export function WishlistPage() {
  const { wishlist, toggleWishlist, addToCart } = useStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="border-b border-slate-200 pb-6 mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
            Saved Items
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-[#0B192C]">Your Wishlist</h1>
        </div>
        <span className="text-sm text-slate-500 tabular-nums">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {wishlist.length === 0 ? (
        <div className="py-20 text-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/50">
          <div className="w-14 h-14 mx-auto rounded-full bg-purple-50 text-purple-700 flex items-center justify-center mb-4">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-[#0B192C]">No saved products yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Tap the heart icon on any product to keep track of items you love.
          </p>
          <Link
            to="/category/all"
            className="mt-6 inline-block px-6 py-2.5 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-purple-700 transition-colors"
          >
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((product) => (
            <article
              key={product.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col"
            >
              <Link to={`/product/${product.id}`} className="aspect-[4/3] bg-slate-50 overflow-hidden">
                <SmartImage
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs text-slate-500 uppercase tracking-wider">
                  {product.brand} · {product.categoryName}
                </p>
                <Link
                  to={`/product/${product.id}`}
                  className="mt-1.5 font-display text-base font-semibold text-[#0B192C] hover:text-purple-700 line-clamp-2"
                >
                  {product.name}
                </Link>
                <p className="mt-2 font-display text-lg font-bold text-[#0B192C] tabular-nums">
                  {formatPrice(product.discountPrice)}
                </p>

                <div className="mt-auto pt-4 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() => addToCart(product, 1, true)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#0B192C] text-white text-xs font-semibold hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-500 transition-colors cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    Move to Cart
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-red-600 hover:border-red-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
