import { ChevronDown, Heart, Menu, Search, ShieldCheck, ShoppingBag, User as UserIcon, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export function Navbar() {
  const { user, categories, cartCount, wishlist, openCartDrawer } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    navigate(trimmed ? `/category/all?q=${encodeURIComponent(trimmed)}` : '/category/all');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Brand Mark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group"
          onClick={() => setMobileMenuOpen(false)}
        >
          <span className="w-8 h-8 rounded-lg bg-[#0B192C] text-white flex items-center justify-center font-display font-extrabold text-sm tracking-tight group-hover:bg-purple-700 transition-colors">
            K
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-[#0B192C]">
            kl commerce
          </span>
        </Link>

        {/* Search Bar (Desktop) */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md items-center relative"
          role="search"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fashion, mobiles, electronics, books..."
            aria-label="Search products"
            className="w-full pl-10 pr-20 py-2 text-sm bg-slate-50 border border-slate-200 rounded-full text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-600/15 transition-all"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3.5 py-1 rounded-full bg-[#0B192C] text-white text-xs font-semibold hover:bg-purple-700 transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Primary Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link
            to="/category/all"
            className="hover:text-[#0B192C] transition-colors whitespace-nowrap shrink-0"
          >
            Shop All
          </Link>

          <div
            className="relative"
            onMouseEnter={() => setCatMenuOpen(true)}
            onMouseLeave={() => setCatMenuOpen(false)}
          >
            <button
              type="button"
              onClick={() => setCatMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1 hover:text-[#0B192C] transition-colors whitespace-nowrap shrink-0 cursor-pointer py-2"
            >
              Categories
              <ChevronDown className="w-4 h-4" />
            </button>

            {catMenuOpen && (
              <div className="absolute left-0 top-full pt-1 w-64 z-50">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2 grid grid-cols-1 gap-0.5">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/category/${cat.slug}`}
                      onClick={() => setCatMenuOpen(false)}
                      className="px-3 py-2 rounded-xl text-sm text-slate-700 hover:bg-purple-50 hover:text-purple-700 font-medium transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Link
            to="/category/all?collection=specialOffer"
            className="hover:text-purple-700 transition-colors whitespace-nowrap shrink-0"
          >
            Offers
          </Link>

          <Link
            to="/admin"
            className="inline-flex items-center gap-1 hover:text-[#0B192C] transition-colors whitespace-nowrap shrink-0"
          >
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            Admin
          </Link>
        </nav>

        {/* Actions: Wishlist, Cart, Auth */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/wishlist"
            aria-label={`Wishlist (${wishlist.length} items)`}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-purple-700 transition-colors"
          >
            <Heart className="w-5 h-5" />
            {wishlist.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-purple-700 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {wishlist.length}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={openCartDrawer}
            aria-label={`Shopping cart (${cartCount} items)`}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 hover:text-[#0B192C] transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#0B192C] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <Link
              to="/profile"
              className="hidden sm:inline-flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:border-purple-600 text-xs font-semibold text-[#0B192C] transition-colors whitespace-nowrap shrink-0"
            >
              <span className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-bold">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-[100px] truncate">{user.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 rounded-full text-xs font-semibold text-[#0B192C] hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-full text-xs font-semibold bg-purple-700 text-white hover:bg-[#0B192C] transition-colors whitespace-nowrap shrink-0"
              >
                Register
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle mobile menu"
            className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-20 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-purple-600"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3.5 py-1.5 rounded-full bg-[#0B192C] text-white text-xs font-semibold"
            >
              Go
            </button>
          </form>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <Link
              to="/category/all"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-slate-50 font-medium text-[#0B192C]"
            >
              Shop All
            </Link>
            <Link
              to="/category/all?collection=specialOffer"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-purple-50 font-medium text-purple-800"
            >
              Special Offers
            </Link>
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-slate-50 font-medium text-[#0B192C]"
            >
              Admin Dashboard
            </Link>
            <Link
              to={user ? '/profile' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-xl bg-slate-50 font-medium text-[#0B192C] inline-flex items-center gap-1.5"
            >
              <UserIcon className="w-4 h-4" />
              {user ? 'My Profile' : 'Login / Register'}
            </Link>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Categories
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
