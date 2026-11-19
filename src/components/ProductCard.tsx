import { Heart, ShoppingBag, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatPrice, getDiscountPercent, type Product } from '../types';
import { SmartImage } from './SmartImage';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const saved = isWishlisted(product.id);
  const discountPct = getDiscountPercent(product.originalPrice, product.discountPrice);

  return (
    <article className="group flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5">
      {/* Media Zone */}
      <div className="relative aspect-[4/3] bg-slate-50 overflow-hidden">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <SmartImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors shadow-sm cursor-pointer ${
            saved
              ? 'bg-purple-600 text-white'
              : 'bg-white/90 text-slate-700 hover:bg-white hover:text-purple-700'
          }`}
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
        </button>

        {discountPct > 0 && (
          <span className="absolute bottom-3 left-3 text-xs font-semibold text-white bg-[#0B192C]/90 px-2.5 py-1 rounded-full tabular-nums">
            Save {discountPct}%
          </span>
        )}
      </div>

      {/* Content Zone */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="uppercase tracking-wider font-medium truncate">
            {product.brand} · {product.categoryName}
          </span>
          <span className="inline-flex items-center gap-1 text-slate-700 font-medium tabular-nums shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {product.rating.toFixed(1)}
          </span>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="mt-2 font-display text-[16px] font-semibold text-[#0B192C] leading-snug line-clamp-2 hover:text-purple-700 transition-colors"
        >
          {product.name}
        </Link>

        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        <div className="mt-auto pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-lg font-bold text-[#0B192C] tabular-nums">
              {formatPrice(product.discountPrice)}
            </span>
            {product.originalPrice > product.discountPrice && (
              <span className="text-xs text-slate-400 line-through tabular-nums">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          <button
            type="button"
            disabled={product.stock <= 0}
            onClick={() => addToCart(product, 1, true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-[#0B192C] text-white hover:bg-purple-700 disabled:bg-slate-200 disabled:text-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {product.stock > 0 ? 'Add' : 'Sold Out'}
          </button>
        </div>
      </div>
    </article>
  );
}
