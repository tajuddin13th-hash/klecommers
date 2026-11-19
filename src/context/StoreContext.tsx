import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest, getStoredToken, setStoredToken } from '../lib/api';
import type { CartItem, Category, Product, User } from '../types';

interface ToastState {
  id: number;
  message: string;
  tone: 'success' | 'info' | 'error';
}

interface StoreContextValue {
  user: User | null;
  authLoading: boolean;
  categories: Category[];
  products: Product[];
  catalogLoading: boolean;
  cart: CartItem[];
  wishlist: Product[];
  isCartDrawerOpen: boolean;
  toast: ToastState | null;
  cartCount: number;
  cartSubtotal: number;
  cartSavings: number;
  shippingFee: number;
  cartTotal: number;
  openCartDrawer: () => void;
  closeCartDrawer: () => void;
  showToast: (message: string, tone?: 'success' | 'info' | 'error') => void;
  dismissToast: () => void;
  refreshCatalog: () => Promise<void>;
  addToCart: (product: Product, quantity?: number, openDrawer?: boolean) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (product: Product) => void;
  isWishlisted: (productId: string) => boolean;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const CART_KEY = 'kle_commerce_cart_v1';
const WISHLIST_KEY = 'kle_commerce_wishlist_v1';

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

function loadStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>(() => loadStorage<CartItem[]>(CART_KEY, []));
  const [wishlist, setWishlist] = useState<Product[]>(() => loadStorage<Product[]>(WISHLIST_KEY, []));
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, tone: 'success' | 'info' | 'error' = 'success') => {
      const id = Date.now();
      setToast({ id, message, tone });
      setTimeout(() => {
        setToast((prev) => (prev?.id === id ? null : prev));
      }, 3200);
    },
    []
  );

  const dismissToast = useCallback(() => setToast(null), []);

  const refreshCatalog = useCallback(async () => {
    try {
      const [cats, prods] = await Promise.all([
        apiRequest<Category[]>('/api/categories'),
        apiRequest<Product[]>('/api/products'),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setAuthLoading(false);
      return;
    }
    try {
      const res = await apiRequest<{ user: User }>('/api/auth/me');
      setUser(res.user);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCatalog();
    void refreshUser();
  }, [refreshCatalog, refreshUser]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  const setSession = useCallback((token: string, nextUser: User) => {
    setStoredToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    showToast('Signed out cleanly', 'info');
  }, [showToast]);

  const addToCart = useCallback(
    (product: Product, quantity = 1, openDrawer = true) => {
      if (product.stock <= 0) {
        showToast('This item is currently out of stock', 'error');
        return;
      }
      setCart((prev) => {
        const idx = prev.findIndex((item) => item.product.id === product.id);
        if (idx >= 0) {
          const next = [...prev];
          const updatedQty = Math.min(product.stock, next[idx].quantity + quantity);
          next[idx] = { product, quantity: updatedQty };
          return next;
        }
        return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
      });
      if (openDrawer) {
        setIsCartDrawerOpen(true);
      } else {
        showToast(`${product.name} added to cart`, 'success');
      }
    },
    [showToast]
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(item.product.stock, quantity) }
          : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    (product: Product) => {
      setWishlist((prev) => {
        const exists = prev.some((p) => p.id === product.id);
        if (exists) {
          showToast('Removed from wishlist', 'info');
          return prev.filter((p) => p.id !== product.id);
        }
        showToast('Saved to wishlist', 'success');
        return [product, ...prev];
      });
    },
    [showToast]
  );

  const isWishlisted = useCallback(
    (productId: string) => wishlist.some((p) => p.id === productId),
    [wishlist]
  );

  const cartCount = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.discountPrice * item.quantity, 0),
    [cart]
  );

  const cartSavings = useMemo(
    () =>
      cart.reduce(
        (acc, item) =>
          acc + Math.max(0, item.product.originalPrice - item.product.discountPrice) * item.quantity,
        0
      ),
    [cart]
  );

  const shippingFee = useMemo(() => {
    if (cartSubtotal === 0) return 0;
    return cartSubtotal >= 999 ? 0 : 99;
  }, [cartSubtotal]);

  const cartTotal = cartSubtotal + shippingFee;

  const value: StoreContextValue = {
    user,
    authLoading,
    categories,
    products,
    catalogLoading,
    cart,
    wishlist,
    isCartDrawerOpen,
    toast,
    cartCount,
    cartSubtotal,
    cartSavings,
    shippingFee,
    cartTotal,
    openCartDrawer: () => setIsCartDrawerOpen(true),
    closeCartDrawer: () => setIsCartDrawerOpen(false),
    showToast,
    dismissToast,
    refreshCatalog,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    toggleWishlist,
    isWishlisted,
    setSession,
    logout,
    refreshUser,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
