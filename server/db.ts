import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import {
  SEED_CATEGORIES,
  SEED_ORDERS,
  SEED_PRODUCTS,
  createSeedUsers,
} from './seedData.ts';
import type {
  CategoryRecord,
  OrderRecord,
  OrderStatus,
  ProductRecord,
  ProductReview,
  SafeUser,
  UserRecord,
} from './types.ts';

interface LocalDatabaseSchema {
  categories: CategoryRecord[];
  products: ProductRecord[];
  users: UserRecord[];
  orders: OrderRecord[];
}

const DATA_FILE = path.resolve(process.cwd(), 'data', 'kle-commerce-db.json');

// Mongoose Schemas for MongoDB Atlas mode
const CategorySchema = new mongoose.Schema<CategoryRecord>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
});

const ReviewSchema = new mongoose.Schema<ProductReview>(
  {
    id: { type: String, required: true },
    userId: String,
    userName: { type: String, required: true },
    rating: { type: Number, required: true },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false }
);

const ProductSchema = new mongoose.Schema<ProductRecord>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  brand: { type: String, required: true },
  sku: { type: String, required: true },
  categorySlug: { type: String, required: true },
  categoryName: { type: String, required: true },
  description: { type: String, required: true },
  highlights: { type: [String], default: [] },
  originalPrice: { type: Number, required: true },
  discountPrice: { type: Number, required: true },
  rating: { type: Number, default: 4.5 },
  reviewCount: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  image: { type: String, required: true },
  isTrending: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  isSpecialOffer: { type: Boolean, default: false },
  isNewArrival: { type: Boolean, default: false },
  reviews: { type: [ReviewSchema], default: [] },
  createdAt: { type: String, required: true },
});

const UserSchema = new mongoose.Schema<UserRecord>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  studentId: String,
  phone: String,
  address: String,
  city: String,
  pinCode: String,
  createdAt: { type: String, required: true },
});

const OrderItemSchema = new mongoose.Schema(
  {
    productId: String,
    name: String,
    brand: String,
    image: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema<OrderRecord>({
  id: { type: String, required: true, unique: true },
  orderNumber: { type: String, required: true, unique: true },
  userId: String,
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pinCode: { type: String, required: true },
  items: { type: [OrderItemSchema], required: true },
  subtotal: { type: Number, required: true },
  shippingFee: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, required: true },
  status: { type: String, default: 'Confirmed' },
  createdAt: { type: String, required: true },
});

const CategoryModel =
  mongoose.models.Category || mongoose.model<CategoryRecord>('Category', CategorySchema);
const ProductModel =
  mongoose.models.Product || mongoose.model<ProductRecord>('Product', ProductSchema);
const UserModel = mongoose.models.User || mongoose.model<UserRecord>('User', UserSchema);
const OrderModel = mongoose.models.Order || mongoose.model<OrderRecord>('Order', OrderSchema);

function stripMongoDoc<T>(doc: unknown): T {
  if (!doc || typeof doc !== 'object') return doc as T;
  const obj = { ...(doc as Record<string, unknown>) };
  delete obj._id;
  delete obj.__v;
  return obj as T;
}

export function sanitizeUser(user: UserRecord): SafeUser {
  const { passwordHash: _ignored, ...safe } = user;
  return safe;
}

class StoreDatabase {
  private useMongo = false;
  private memoryCache: LocalDatabaseSchema | null = null;

  async init(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI?.trim();
    if (mongoUri) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
        this.useMongo = true;
        await this.seedMongoIfEmpty();
        console.log('[KLE COMMERCE] Connected to MongoDB Atlas.');
        return;
      } catch (err) {
        console.warn(
          '[KLE COMMERCE] MongoDB Atlas connection failed, using persistent local JSON store:',
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    this.useMongo = false;
    this.ensureLocalStore();
    console.log('[KLE COMMERCE] Running with persistent local JSON store at', DATA_FILE);
  }

  private async seedMongoIfEmpty(): Promise<void> {
    const catCount = await CategoryModel.countDocuments();
    if (catCount === 0) {
      await CategoryModel.insertMany(SEED_CATEGORIES);
    }
    const prodCount = await ProductModel.countDocuments();
    if (prodCount === 0) {
      await ProductModel.insertMany(SEED_PRODUCTS);
    }
    const userCount = await UserModel.countDocuments();
    if (userCount === 0) {
      await UserModel.insertMany(createSeedUsers());
    }
    const orderCount = await OrderModel.countDocuments();
    if (orderCount === 0) {
      await OrderModel.insertMany(SEED_ORDERS);
    }
  }

  private ensureLocalStore(): LocalDatabaseSchema {
    if (this.memoryCache) return this.memoryCache;
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.memoryCache = JSON.parse(raw) as LocalDatabaseSchema;
        return this.memoryCache;
      } catch {
        // Re-seed if file is corrupt
      }
    }
    this.memoryCache = {
      categories: [...SEED_CATEGORIES],
      products: [...SEED_PRODUCTS],
      users: createSeedUsers(),
      orders: [...SEED_ORDERS],
    };
    this.saveLocalStore();
    return this.memoryCache;
  }

  private saveLocalStore(): void {
    if (!this.memoryCache) return;
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.memoryCache, null, 2), 'utf-8');
  }

  // Categories
  async getCategories(): Promise<CategoryRecord[]> {
    if (this.useMongo) {
      const docs = await CategoryModel.find().lean();
      return docs.map((d) => stripMongoDoc<CategoryRecord>(d));
    }
    return this.ensureLocalStore().categories;
  }

  async createCategory(input: Omit<CategoryRecord, 'id'>): Promise<CategoryRecord> {
    const category: CategoryRecord = {
      id: `cat-${Date.now()}`,
      ...input,
    };
    if (this.useMongo) {
      await CategoryModel.create(category);
      return category;
    }
    const store = this.ensureLocalStore();
    store.categories.push(category);
    this.saveLocalStore();
    return category;
  }

  async updateCategory(
    id: string,
    updates: Partial<Omit<CategoryRecord, 'id'>>
  ): Promise<CategoryRecord | null> {
    if (this.useMongo) {
      const doc = await CategoryModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
      return doc ? stripMongoDoc<CategoryRecord>(doc) : null;
    }
    const store = this.ensureLocalStore();
    const idx = store.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    store.categories[idx] = { ...store.categories[idx], ...updates };
    this.saveLocalStore();
    return store.categories[idx];
  }

  async deleteCategory(id: string): Promise<boolean> {
    if (this.useMongo) {
      const res = await CategoryModel.deleteOne({ id });
      return res.deletedCount > 0;
    }
    const store = this.ensureLocalStore();
    const before = store.categories.length;
    store.categories = store.categories.filter((c) => c.id !== id);
    if (store.categories.length !== before) {
      this.saveLocalStore();
      return true;
    }
    return false;
  }

  // Products
  async getProducts(): Promise<ProductRecord[]> {
    if (this.useMongo) {
      const docs = await ProductModel.find().sort({ createdAt: -1 }).lean();
      return docs.map((d) => stripMongoDoc<ProductRecord>(d));
    }
    return [...this.ensureLocalStore().products].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  async getProductById(id: string): Promise<ProductRecord | null> {
    if (this.useMongo) {
      const doc = await ProductModel.findOne({ id }).lean();
      return doc ? stripMongoDoc<ProductRecord>(doc) : null;
    }
    return this.ensureLocalStore().products.find((p) => p.id === id) ?? null;
  }

  async createProduct(
    input: Omit<ProductRecord, 'id' | 'rating' | 'reviewCount' | 'reviews' | 'createdAt'>
  ): Promise<ProductRecord> {
    const product: ProductRecord = {
      ...input,
      id: `prod-${Date.now()}`,
      rating: 4.5,
      reviewCount: 0,
      reviews: [],
      createdAt: new Date().toISOString(),
    };
    if (this.useMongo) {
      await ProductModel.create(product);
      return product;
    }
    const store = this.ensureLocalStore();
    store.products.unshift(product);
    this.saveLocalStore();
    return product;
  }

  async updateProduct(
    id: string,
    updates: Partial<Omit<ProductRecord, 'id' | 'createdAt'>>
  ): Promise<ProductRecord | null> {
    if (this.useMongo) {
      const doc = await ProductModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
      return doc ? stripMongoDoc<ProductRecord>(doc) : null;
    }
    const store = this.ensureLocalStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    store.products[idx] = { ...store.products[idx], ...updates };
    this.saveLocalStore();
    return store.products[idx];
  }

  async deleteProduct(id: string): Promise<boolean> {
    if (this.useMongo) {
      const res = await ProductModel.deleteOne({ id });
      return res.deletedCount > 0;
    }
    const store = this.ensureLocalStore();
    const before = store.products.length;
    store.products = store.products.filter((p) => p.id !== id);
    if (store.products.length !== before) {
      this.saveLocalStore();
      return true;
    }
    return false;
  }

  async addProductReview(
    productId: string,
    reviewInput: Omit<ProductReview, 'id' | 'createdAt'>
  ): Promise<ProductRecord | null> {
    const product = await this.getProductById(productId);
    if (!product) return null;

    const newReview: ProductReview = {
      ...reviewInput,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedReviews = [newReview, ...product.reviews];
    const totalScore = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
    const avgRating = Number((totalScore / updatedReviews.length).toFixed(1));

    return this.updateProduct(productId, {
      reviews: updatedReviews,
      reviewCount: updatedReviews.length,
      rating: avgRating,
    });
  }

  async decrementStock(productId: string, qty: number): Promise<void> {
    const product = await this.getProductById(productId);
    if (!product) return;
    const nextStock = Math.max(0, product.stock - qty);
    await this.updateProduct(productId, { stock: nextStock });
  }

  // Users
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normalized = email.trim().toLowerCase();
    if (this.useMongo) {
      const doc = await UserModel.findOne({ email: normalized }).lean();
      return doc ? stripMongoDoc<UserRecord>(doc) : null;
    }
    return (
      this.ensureLocalStore().users.find((u) => u.email.toLowerCase() === normalized) ?? null
    );
  }

  async findUserById(id: string): Promise<UserRecord | null> {
    if (this.useMongo) {
      const doc = await UserModel.findOne({ id }).lean();
      return doc ? stripMongoDoc<UserRecord>(doc) : null;
    }
    return this.ensureLocalStore().users.find((u) => u.id === id) ?? null;
  }

  async createUser(input: Omit<UserRecord, 'id' | 'createdAt'>): Promise<UserRecord> {
    const user: UserRecord = {
      ...input,
      email: input.email.trim().toLowerCase(),
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    if (this.useMongo) {
      await UserModel.create(user);
      return user;
    }
    const store = this.ensureLocalStore();
    store.users.push(user);
    this.saveLocalStore();
    return user;
  }

  async updateUser(
    id: string,
    updates: Partial<Omit<UserRecord, 'id' | 'email' | 'role' | 'createdAt'>>
  ): Promise<UserRecord | null> {
    if (this.useMongo) {
      const doc = await UserModel.findOneAndUpdate({ id }, updates, { new: true }).lean();
      return doc ? stripMongoDoc<UserRecord>(doc) : null;
    }
    const store = this.ensureLocalStore();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    store.users[idx] = { ...store.users[idx], ...updates };
    this.saveLocalStore();
    return store.users[idx];
  }

  // Orders
  async createOrder(input: Omit<OrderRecord, 'id' | 'orderNumber' | 'createdAt'>): Promise<OrderRecord> {
    const seq = 1043 + Math.floor(Math.random() * 8900);
    const order: OrderRecord = {
      ...input,
      id: `ord-${Date.now()}`,
      orderNumber: `KLE-2026-${seq}`,
      createdAt: new Date().toISOString(),
    };
    if (this.useMongo) {
      await OrderModel.create(order);
      return order;
    }
    const store = this.ensureLocalStore();
    store.orders.unshift(order);
    this.saveLocalStore();
    return order;
  }

  async getOrdersByUserId(userId: string): Promise<OrderRecord[]> {
    if (this.useMongo) {
      const docs = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
      return docs.map((d) => stripMongoDoc<OrderRecord>(d));
    }
    return this.ensureLocalStore().orders
      .filter((o) => o.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAllOrders(): Promise<OrderRecord[]> {
    if (this.useMongo) {
      const docs = await OrderModel.find().sort({ createdAt: -1 }).lean();
      return docs.map((d) => stripMongoDoc<OrderRecord>(d));
    }
    return [...this.ensureLocalStore().orders].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  async getOrderById(id: string): Promise<OrderRecord | null> {
    if (this.useMongo) {
      const doc = await OrderModel.findOne({ id }).lean();
      return doc ? stripMongoDoc<OrderRecord>(doc) : null;
    }
    return this.ensureLocalStore().orders.find((o) => o.id === id) ?? null;
  }

  async updateOrderStatus(id: string, status: OrderStatus): Promise<OrderRecord | null> {
    if (this.useMongo) {
      const doc = await OrderModel.findOneAndUpdate({ id }, { status }, { new: true }).lean();
      return doc ? stripMongoDoc<OrderRecord>(doc) : null;
    }
    const store = this.ensureLocalStore();
    const idx = store.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    store.orders[idx] = { ...store.orders[idx], status };
    this.saveLocalStore();
    return store.orders[idx];
  }
}

export const db = new StoreDatabase();
