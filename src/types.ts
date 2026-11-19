export type UserRole = 'customer' | 'admin';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
}

export interface ProductReview {
  id: string;
  userId?: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  sku: string;
  categorySlug: string;
  categoryName: string;
  description: string;
  highlights: string[];
  originalPrice: number;
  discountPrice: number;
  rating: number;
  reviewCount: number;
  stock: number;
  image: string;
  isTrending: boolean;
  isBestSeller: boolean;
  isSpecialOffer: boolean;
  isNewArrival: boolean;
  reviews: ProductReview[];
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  phone?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type OrderStatus = 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';
export type PaymentMethod = 'cod' | 'upi_test' | 'card_test';

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  mobile: string;
  address: string;
  city: string;
  pinCode: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Test Paid' | 'Cash on Delivery';
  status: OrderStatus;
  createdAt: string;
}

export interface AdminStats {
  totalSales: number;
  totalOrders: number;
  totalProducts: number;
  totalCategories: number;
  totalUnitsSold: number;
  lowStockCount: number;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getDiscountPercent(original: number, discount: number): number {
  if (original <= 0 || discount >= original) return 0;
  return Math.round(((original - discount) / original) * 100);
}
