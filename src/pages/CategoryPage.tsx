import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';

export function CategoryPage() {
  const { slug = 'all' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, products, catalogLoading } = useStore();

  const urlQuery = searchParams.get('q') || '';
  const urlCollection = searchParams.get('collection') || 'all';
  const [localSearch, setLocalSearch] = useState(urlQuery);
  const [sortBy, setSortBy] = useState('featured');
  const [maxPrice, setMaxPrice] = useState<number>(80000);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === slug),
    [categories, slug]
  );

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (slug !== 'all') {
      list = list.filter((p) => p.categorySlug === slug);
    }

    if (urlCollection === 'trending') list = list.filter((p) => p.isTrending);
    if (urlCollection === 'bestSeller') list = list.filter((p) => p.isBestSeller);
    if (urlCollection === 'specialOffer') list = list.filter((p) => p.isSpecialOffer);
    if (urlCollection === 'newArrival') list = list.filter((p) => p.isNewArrival);

    const needle = (localSearch || urlQuery).trim().toLowerCase();
    if (needle) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          p.brand.toLowerCase().includes(needle) ||
          p.categoryName.toLowerCase().includes(needle) ||
          p.description.toLowerCase().includes(needle)
      );
    }

    list = list.filter((p) => p.discountPrice <= maxPrice);

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.discountPrice - b.discountPrice);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.discountPrice - a.discountPrice);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return list;
  }, [products, slug, urlCollection, localSearch, urlQuery, maxPrice, sortBy]);

  const setCollection = (col: string) => {
    const next = new URLSearchParams(searchParams);
    if (col === 'all') {
      next.delete('collection');
    } else {
      next.set('collection', col);
    }
    setSearchParams(next);
  };

  const resetFilters = () => {
    setLocalSearch('');
    setSortBy('featured');
    setMaxPrice(80000);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">
          KLE COMMERCE Catalog
        </p>
        <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-[#0B192C] tracking-tight">
          {activeCategory ? activeCategory.name : 'All Products'}
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl">
          {activeCategory
            ? activeCategory.description
            : 'Browse all verified products across our nine shopping departments.'}
        </p>

        {/* Category Pills Strip */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1">
          <Link
            to="/category/all"
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
              slug === 'all'
                ? 'bg-[#0B192C] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Departments
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/category/${cat.slug}`}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                slug === cat.slug
                  ? 'bg-purple-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                const next = new URLSearchParams(searchParams);
                if (e.target.value) next.set('q', e.target.value);
                else next.delete('q');
                setSearchParams(next, { replace: true });
              }}
              placeholder="Filter by name or brand..."
              className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 text-sm focus:outline-none focus:border-purple-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-full">
            {[
              { id: 'all', label: 'All' },
              { id: 'trending', label: 'Trending' },
              { id: 'bestSeller', label: 'Best Sellers' },
              { id: 'specialOffer', label: 'Offers' },
              { id: 'newArrival', label: 'New' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCollection(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  urlCollection === item.id
                    ? 'bg-white text-[#0B192C] shadow-sm'
                    : 'text-slate-600 hover:text-[#0B192C]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="inline-flex items-center gap-2 text-slate-600 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Max Price: ₹{maxPrice.toLocaleString('en-IN')}</span>
            <input
              type="range"
              min={1000}
              max={80000}
              step={1000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-28 accent-purple-700 cursor-pointer"
            />
          </label>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            aria-label="Sort products"
            className="px-3.5 py-2 rounded-full border border-slate-200 bg-white text-xs font-semibold text-[#0B192C] focus:outline-none focus:border-purple-600 cursor-pointer"
          >
            <option value="featured">Sort: Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Customer Rating</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="py-4 flex items-center justify-between text-xs text-slate-500">
        <span className="tabular-nums">Showing {filteredProducts.length} products</span>
        {(localSearch || urlCollection !== 'all' || maxPrice < 80000) && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1 text-purple-700 font-semibold hover:underline cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {/* Grid */}
      {catalogLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-slate-50 border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
          <p className="font-display text-lg font-bold text-[#0B192C]">No matching products found</p>
          <p className="mt-1 text-sm text-slate-500">
            Try clearing your search filter or exploring another department.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-5 px-5 py-2.5 rounded-full bg-[#0B192C] text-white text-xs font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
