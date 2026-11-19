export type UserRole = 'customer' | 'admin';

export interface CategoryRecord {
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

export interface ProductRecord {
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

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  studentId?: string;
  phone?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  createdAt: string;
}

export type SafeUser = Omit<UserRecord, 'passwordHash'>;

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'Confirmed' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled';

export type PaymentMethod = 'cod' | 'upi_test' | 'card_test';

export interface OrderRecord {
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
