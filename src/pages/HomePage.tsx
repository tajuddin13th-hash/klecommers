import { ArrowRight, CheckCircle2, Sparkles, Tag, Truck, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { SmartImage } from '../components/SmartImage';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../types';

type CollectionTab = 'trending' | 'bestSeller' | 'specialOffer' | 'newArrival';

const HERO_IMAGE = '/src/assets/images/hero_kle_showcase_1795067785143.jpg';

const COLLECTION_TABS: Array<{ key: CollectionTab; label: string; subtitle: string }> = [
  { key: 'trending', label: 'Trending Now', subtitle: 'Most-viewed essentials across campus and studio' },
  { key: 'bestSeller', label: 'Best Sellers', subtitle: 'Top-rated customer favorites with verified reviews' },
  { key: 'specialOffer', label: 'Special Offers', subtitle: 'Seasonal markdowns up to 30% off original retail' },
  { key: 'newArrival', label: 'New Arrivals', subtitle: 'Latest releases added to the KLE COMMERCE catalog' },
];

export function HomePage() {
  const { categories, products, catalogLoading } = useStore();
  const [bannerVisible, setBannerVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<CollectionTab>('trending');

  const tabProducts = useMemo(() => {
    const filtered = products.filter((p) => {
      if (activeTab === 'trending') return p.isTrending;
      if (activeTab === 'bestSeller') return p.isBestSeller;
      if (activeTab === 'specialOffer') return p.isSpecialOffer;
      return p.isNewArrival;
    });
    return filtered.slice(0, 6);
  }, [products, activeTab]);

  const specialOfferHighlight = useMemo(
    () => products.find((p) => p.isSpecialOffer && p.id === 'prod-elec-1') || products.find((p) => p.isSpecialOffer),
    [products]
  );

  const newArrivalsRow = useMemo(
    () => products.filter((p) => p.isNewArrival).slice(0, 3),
    [products]
  );

  const bestSellersRow = useMemo(
    () => products.filter((p) => p.isBestSeller).slice(0, 3),
    [products]
  );

  return (
    <div>
      {/* Slim Dismissible Top Promotional Banner */}
      {bannerVisible && (
        <div className="bg-[#0B192C] text-white text-xs py-2 px-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <p className="flex-1 text-center font-medium tracking-wide">
              Free Express Delivery on orders above ₹999 · Safe Test Checkout Active
            </p>
            <button
              type="button"
              onClick={() => setBannerVisible(false)}
              aria-label="Dismiss announcement"
              className="text-slate-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Section 1: Storefront Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch rounded-3xl overflow-hidden border border-slate-200 bg-slate-50">
          <div className="lg:col-span-5 p-8 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-purple-700">
              KLE COMMERCE · Season Collection
            </p>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-[#0B192C] leading-[1.12] tracking-tight [text-wrap:balance]">
              Curated Essentials for Modern Living
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              Shop verified electronics, tailored fashion, flagship mobiles, studio books, and daily lifestyle upgrades in one unified storefront.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/category/all"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-purple-700 text-white text-sm font-semibold hover:bg-[#0B192C] transition-colors whitespace-nowrap shrink-0"
              >
                Shop Collection
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/category/all?collection=specialOffer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-300 bg-white text-[#0B192C] text-sm font-semibold hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                View Special Offers
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Free Shipping ₹999+</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Verified Quality</span>
              </div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-700 shrink-0" />
                <span>Student Specials</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[380px] lg:min-h-0">
            <SmartImage
              src={HERO_IMAGE}
              alt="KLE COMMERCE featured headphones, smartphone, tailored navy blazer, and skincare collection"
              className="w-full h-full lg:h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Section 2: 9 Product Categories */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B192C] tracking-tight">
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Nine dedicated departments tailored to campus, home, and studio life.
            </p>
          </div>
          <Link
            to="/category/all"
            className="text-sm font-semibold text-purple-700 hover:text-[#0B192C] transition-colors whitespace-nowrap shrink-0"
          >
            Explore All →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className="group relative rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-600/40 hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-slate-50 overflow-hidden">
                <SmartImage
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-3.5">
                <h3 className="font-display text-sm font-bold text-[#0B192C] group-hover:text-purple-700 transition-colors truncate">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Section 3: Curated Collections (Trending, Best-Selling, Special Offers, New Arrivals) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0B192C] tracking-tight">
              Featured Collections
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {COLLECTION_TABS.find((t) => t.key === activeTab)?.subtitle}
            </p>
          </div>

          <div
            className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-full"
            role="tablist"
            aria-label="Product collections"
          >
            {COLLECTION_TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B192C] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#0B192C]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {catalogLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200 bg-slate-50 h-96 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tabProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Section 4: Special Offer Spotlight + Best Sellers & New Arrivals Highlights */}
      {specialOfferHighlight && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-3xl bg-[#0B192C] text-white overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-purple-300">
                <Sparkles className="w-4 h-4" />
                Special Offer Spotlight
              </div>
              <h2 className="mt-3 font-display text-2xl sm:text-3xl font-bold leading-tight [text-wrap:balance]">
                {specialOfferHighlight.name}
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-lg">
                {specialOfferHighlight.description}
              </p>
              <div className="mt-5 flex items-baseline gap-3">
                <span className="font-display text-2xl font-bold text-white tabular-nums">
                  {formatPrice(specialOfferHighlight.discountPrice)}
                </span>
                <span className="text-sm text-slate-400 line-through tabular-nums">
                  {formatPrice(specialOfferHighlight.originalPrice)}
                </span>
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={`/product/${specialOfferHighlight.id}`}
                  className="px-6 py-3 rounded-full bg-purple-600 text-white text-sm font-semibold hover:bg-purple-500 transition-colors whitespace-nowrap shrink-0"
                >
                  View Offer Details
                </Link>
                <Link
                  to="/category/all?collection=specialOffer"
                  className="px-6 py-3 rounded-full border border-slate-600 text-slate-200 text-sm font-semibold hover:bg-white/10 transition-colors whitespace-nowrap shrink-0"
                >
                  All Special Offers
                </Link>
              </div>
            </div>
            <div className="lg:col-span-6 min-h-[260px]">
              <SmartImage
                src={specialOfferHighlight.image}
                alt={specialOfferHighlight.name}
                className="w-full h-full lg:h-full object-cover"
              />
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers & New Arrivals Compact Editorial Row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-[#0B192C]">Best Sellers</h3>
              <Link
                to="/category/all?collection=bestSeller"
                className="text-xs font-semibold text-purple-700 hover:underline"
              >
                See all →
              </Link>
            </div>
            <div className="space-y-3">
              {bestSellersRow.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="flex items-center gap-4 p-3 rounded-2xl border border-slate-200 bg-white hover:border-purple-600/40 hover:shadow-sm transition-all"
                >
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                    <SmartImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{item.categoryName}</p>
                    <p className="font-display text-sm font-semibold text-[#0B192C] truncate">
                      {item.name}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold text-[#0B192C] tabular-nums shrink-0">
                    {formatPrice(item.discountPrice)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-xl font-bold text-[#0B192C]">New Arrivals</h3>
              <Link
                to="/category/all?collection=newArrival"
                className="text-xs font-semibold text-purple-700 hover:underline"
              >
                See all →
              </Link>
            </div>
            <div className="space-y-3">
              {newArrivalsRow.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="flex items-center gap-4 p-3 rounded-2xl border border-slate-200 bg-white hover:border-purple-600/40 hover:shadow-sm transition-all"
                >
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-slate-50 shrink-0">
                    <SmartImage
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500">{item.categoryName}</p>
                    <p className="font-display text-sm font-semibold text-[#0B192C] truncate">
                      {item.name}
                    </p>
                  </div>
                  <span className="font-display text-sm font-bold text-[#0B192C] tabular-nums shrink-0">
                    {formatPrice(item.discountPrice)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
