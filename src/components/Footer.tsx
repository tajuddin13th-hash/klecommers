import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const { categories } = useStore();

  return (
    <footer className="bg-[#0B192C] text-slate-300 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5 text-white">
            <span className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-display font-extrabold text-sm">
              K
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              KLE COMMERCE
            </span>
          </Link>
          <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-xs">
            Curated marketplace for campus, studio, and everyday essentials across 9 verified product categories.
          </p>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-white mb-4">Categories</h3>
          <ul className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-sm">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  to={`/category/${cat.slug}`}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-white mb-4">Customer Account</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/profile" className="text-slate-400 hover:text-white transition-colors">
                My Profile & Orders
              </Link>
            </li>
            <li>
              <Link to="/cart" className="text-slate-400 hover:text-white transition-colors">
                Shopping Bag
              </Link>
            </li>
            <li>
              <Link to="/wishlist" className="text-slate-400 hover:text-white transition-colors">
                Saved Wishlist
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                Sign In / Student Register
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-semibold text-white mb-4">Platform & Admin</h3>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link to="/admin" className="text-slate-400 hover:text-white transition-colors">
                Admin Console
              </Link>
            </li>
            <li>
              <Link
                to="/category/all?collection=specialOffer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                Special Offers
              </Link>
            </li>
            <li className="text-slate-400">Free delivery on orders over ₹999</li>
            <li className="text-slate-400">Support: care@klecommerce.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} KLE COMMERCE. All rights reserved.</p>
          <p>Safe Test Checkout · Verified Inventory</p>
        </div>
      </div>
    </footer>
  );
}
