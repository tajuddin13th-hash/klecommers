import {
  ArrowLeft,
  Check,
  Heart,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Zap,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { apiRequest } from '../lib/api';
import { formatPrice, getDiscountPercent, type Product } from '../types';

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, user, addToCart, toggleWishlist, isWishlisted, showToast, refreshCatalog } =
    useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  // Review form state
  const [reviewerName, setReviewerName] = useState(user?.name || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setQuantity(1);
    apiRequest<Product>(`/api/products/${id}`)
      .then((data) => {
        if (active) setProduct(data);
      })
      .catch(() => {
        if (active) setProduct(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (user?.name && !reviewerName) setReviewerName(user.name);
  }, [user, reviewerName]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
      .slice(0, 3);
  }, [products, product]);

  const handleBuyNow = () => {
    if (!product || product.stock <= 0) return;
    addToCart(product, quantity, false);
    navigate('/checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setReviewError('');
    if (reviewComment.trim().length < 5) {
      setReviewError('Please write at least 5 characters in your review.');
      return;
    }

    setSubmittingReview(true);
    try {
      const updated = await apiRequest<Product>(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          userName: reviewerName.trim() || 'Verified Customer',
          rating: reviewRating,
          title: reviewTitle.trim() || 'Customer Review',
          comment: reviewComment.trim(),
        }),
      });
      setProduct(updated);
      setReviewTitle('');
      setReviewComment('');
      showToast('Thank you! Your review has been published.', 'success');
      void refreshCatalog();
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Failed to publish review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-pulse">
          <div className="lg:col-span-7 aspect-[4/3] bg-slate-100 rounded-3xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-6 bg-slate-100 rounded w-1/3" />
            <div className="h-10 bg-slate-100 rounded w-3/4" />
            <div className="h-24 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-[#0B192C]">Product not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          This item may have been removed or is no longer available.
        </p>
        <Link
          to="/category/all"
          className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#0B192C] text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalog
        </Link>
      </div>
    );
  }

  const saved = isWishlisted(product.id);
  const discountPct = getDiscountPercent(product.originalPrice, product.discountPrice);
  const savings = Math.max(0, product.originalPrice - product.discountPrice);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6">
        <Link to="/" className="hover:text-[#0B192C]">
          Home
        </Link>
        <span>/</span>
        <Link to={`/category/${product.categorySlug}`} className="hover:text-[#0B192C]">
          {product.categoryName}
        </Link>
        <span>/</span>
        <span className="text-[#0B192C] font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Split Module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left: Product Image */}
        <div className="lg:col-span-7 space-y-6">
          <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-slate-50 border border-slate-200">
            <SmartImage
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Highlights */}
          {product.highlights.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="font-display text-base font-bold text-[#0B192C] mb-3">
                Key Specifications & Highlights
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.highlights.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 space-y-5">
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
            <span className="uppercase tracking-wider font-semibold">
              {product.brand} · {product.categoryName}
            </span>
            <span className="font-mono">{product.sku}</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#0B192C] leading-tight">
            {product.name}
          </h1>

          {/* Rating */}
          <div className="flex items-center gap-3 text-sm">
            <div className="inline-flex items-center gap-1 font-semibold text-[#0B192C] tabular-nums">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
            <span className="text-slate-300">·</span>
            <a href="#reviews" className="text-slate-600 hover:text-purple-700 underline-offset-2 hover:underline">
              {product.reviewCount} customer {product.reviewCount === 1 ? 'review' : 'reviews'}
            </a>
          </div>

          {/* Pricing */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-baseline gap-3">
              <span className="font-display text-3xl font-extrabold text-[#0B192C] tabular-nums">
                {formatPrice(product.discountPrice)}
              </span>
              {product.originalPrice > product.discountPrice && (
                <span className="text-base text-slate-400 line-through tabular-nums">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {discountPct > 0 && (
                <span className="text-xs font-bold text-purple-700">
                  {discountPct}% OFF (Save {formatPrice(savings)})
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">Inclusive of all taxes</p>
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between py-2.5 px-4 rounded-xl bg-slate-50 text-xs font-medium">
            <span className="text-slate-600">Availability</span>
            {product.stock > 0 ? (
              <span className="text-emerald-700 font-semibold tabular-nums">
                In Stock · {product.stock} units available
              </span>
            ) : (
              <span className="text-red-600 font-semibold">Currently Out of Stock</span>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

          {/* Quantity & Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#0B192C]">Quantity</span>
              <div className="inline-flex items-center border border-slate-200 rounded-full bg-slate-50">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-[#0B192C] cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 text-sm font-bold tabular-nums text-[#0B192C]">
                  {quantity}
                </span>
                <button
                  type="button"
                  disabled={quantity >= product.stock}
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  aria-label="Increase quantity"
                  className="w-9 h-9 flex items-center justify-center text-slate-700 hover:text-[#0B192C] disabled:opacity-40 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={() => addToCart(product, quantity, true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
                Add to Cart
              </button>

              <button
                type="button"
                disabled={product.stock <= 0}
                onClick={handleBuyNow}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-purple-700 text-white text-sm font-semibold hover:bg-purple-800 disabled:bg-slate-200 disabled:text-slate-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                <Zap className="w-4 h-4" />
                Buy Now
              </button>
            </div>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                saved
                  ? 'border-purple-600 bg-purple-50 text-purple-700'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
              {saved ? 'Saved in Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-700" />
              <span>Free express delivery on orders above ₹999</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-700" />
              <span>7-day easy replacement & safe test checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews */}
      <section id="reviews" className="mt-16 pt-12 border-t border-slate-200">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#0B192C]">Customer Reviews</h2>
              <p className="text-sm text-slate-500 mt-1">
                Average rating {product.rating.toFixed(1)} out of 5 ({product.reviewCount} verified{' '}
                {product.reviewCount === 1 ? 'review' : 'reviews'})
              </p>
            </div>

            {product.reviews.length === 0 ? (
              <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                No reviews yet. Be the first customer to review this product.
              </div>
            ) : (
              <div className="space-y-4">
                {product.reviews.map((rev) => (
                  <article
                    key={rev.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-display text-sm font-bold text-[#0B192C]">
                          {rev.userName}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs text-slate-500">
                          {new Date(rev.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0B192C] tabular-nums">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        {rev.rating.toFixed(1)}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#0B192C]">{rev.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Write Review Form */}
          <div className="lg:col-span-5">
            <form
              onSubmit={handleReviewSubmit}
              className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6 space-y-4"
            >
              <h3 className="font-display text-lg font-bold text-[#0B192C]">Write a Review</h3>

              {reviewError && (
                <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  {reviewError}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Rating</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} stars`}
                      className="p-1 cursor-pointer"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  placeholder="Summarize your experience"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Review
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share build quality, sizing, or delivery feedback..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-purple-600"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-3 rounded-full bg-[#0B192C] text-white text-sm font-semibold hover:bg-purple-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submittingReview ? 'Publishing...' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 pt-12 border-t border-slate-200">
          <h2 className="font-display text-2xl font-bold text-[#0B192C] mb-6">
            More in {product.categoryName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
