import 'dotenv/config';
import bcrypt from 'bcryptjs';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, sanitizeUser } from './server/db.ts';
import type { OrderItem, OrderStatus, PaymentMethod, UserRole } from './server/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'kle-commerce-dev-secret-change-in-production';

interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

interface AuthenticatedRequest extends Request {
  auth?: AuthPayload;
}

function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function extractAuth(req: AuthenticatedRequest): AuthPayload | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const payload = extractAuth(req);
  if (!payload) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  req.auth = payload;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const payload = extractAuth(req);
  if (!payload) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (payload.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required' });
    return;
  }
  req.auth = payload;
  next();
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function startServer() {
  await db.init();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'KLE COMMERCE API' });
  });

  // Google Maps runtime config & server-side Geocoding proxy (avoids client CORS trap)
  app.get('/api/config/maps', (_req, res) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.GOOGLE_MAPS_API_KEY?.trim() ||
      '';
    res.json({ apiKey });
  });

  app.get('/api/maps/geocode', async (req, res) => {
    const address = String(req.query.address || '').trim();
    if (!address) {
      res.status(400).json({ error: 'Address query parameter is required' });
      return;
    }

    const apiKey =
      process.env.GOOGLE_MAPS_API_KEY?.trim() ||
      process.env.VITE_GOOGLE_MAPS_API_KEY?.trim() ||
      '';
    if (!apiKey) {
      res.status(503).json({ error: 'Google Maps API key not configured on server' });
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&key=${encodeURIComponent(apiKey)}`;
      const geoRes = await fetch(url);
      if (geoRes.status === 429) {
        res.status(429).json({ error: 'Google Maps quota exceeded', status: 'RESOURCE_EXHAUSTED' });
        return;
      }
      const data = (await geoRes.json()) as {
        status?: string;
        error_message?: string;
        results?: Array<{
          formatted_address?: string;
          geometry?: { location?: { lat: number; lng: number } };
        }>;
      };

      if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'OVER_DAILY_LIMIT') {
        res.status(429).json({
          error: data.error_message || 'Google Maps quota exceeded',
          status: 'RESOURCE_EXHAUSTED',
        });
        return;
      }

      if (data.status !== 'OK' || !data.results?.length || !data.results[0].geometry?.location) {
        res.status(404).json({ error: 'Unable to locate address on map', status: data.status });
        return;
      }

      res.json({
        location: data.results[0].geometry.location,
        formattedAddress: data.results[0].formatted_address || address,
      });
    } catch {
      res.status(502).json({ error: 'Failed to reach Google Geocoding service' });
    }
  });

  // Categories
  app.get('/api/categories', async (_req, res) => {
    try {
      const categories = await db.getCategories();
      res.json(categories);
    } catch {
      res.status(500).json({ error: 'Failed to load categories' });
    }
  });

  app.post('/api/categories', requireAdmin, async (req, res) => {
    const { name, description, image } = req.body as {
      name?: string;
      description?: string;
      image?: string;
    };
    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Category name is required (min 2 characters)' });
      return;
    }
    const slug = slugify(name);
    const existing = (await db.getCategories()).find((c) => c.slug === slug);
    if (existing) {
      res.status(409).json({ error: 'A category with this name already exists' });
      return;
    }
    const created = await db.createCategory({
      name: name.trim(),
      slug,
      description: description?.trim() || `${name.trim()} collection curated by KLE COMMERCE.`,
      image: image?.trim() || '/src/assets/images/cat_accessories_1795067785551.jpg',
    });
    res.status(201).json(created);
  });

  app.put('/api/categories/:id', requireAdmin, async (req, res) => {
    const { name, description, image } = req.body as {
      name?: string;
      description?: string;
      image?: string;
    };
    const updates: Record<string, string> = {};
    if (name && name.trim().length >= 2) {
      updates.name = name.trim();
      updates.slug = slugify(name);
    }
    if (typeof description === 'string') updates.description = description.trim();
    if (typeof image === 'string' && image.trim()) updates.image = image.trim();

    const updated = await db.updateCategory(String(req.params.id), updates);
    if (!updated) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/categories/:id', requireAdmin, async (req, res) => {
    const deleted = await db.deleteCategory(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Category not found' });
      return;
    }
    res.json({ deleted: true });
  });

  // Products
  app.get('/api/products', async (req, res) => {
    try {
      const { category, q, collection, sort, minPrice, maxPrice } = req.query as Record<
        string,
        string | undefined
      >;
      let products = await db.getProducts();

      if (category && category !== 'all') {
        products = products.filter((p) => p.categorySlug === category);
      }

      if (collection === 'trending') {
        products = products.filter((p) => p.isTrending);
      } else if (collection === 'bestSeller') {
        products = products.filter((p) => p.isBestSeller);
      } else if (collection === 'specialOffer') {
        products = products.filter((p) => p.isSpecialOffer);
      } else if (collection === 'newArrival') {
        products = products.filter((p) => p.isNewArrival);
      }

      if (q && q.trim()) {
        const needle = q.trim().toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(needle) ||
            p.brand.toLowerCase().includes(needle) ||
            p.categoryName.toLowerCase().includes(needle) ||
            p.description.toLowerCase().includes(needle)
        );
      }

      if (minPrice && !Number.isNaN(Number(minPrice))) {
        products = products.filter((p) => p.discountPrice >= Number(minPrice));
      }
      if (maxPrice && !Number.isNaN(Number(maxPrice))) {
        products = products.filter((p) => p.discountPrice <= Number(maxPrice));
      }

      if (sort === 'price_asc') {
        products.sort((a, b) => a.discountPrice - b.discountPrice);
      } else if (sort === 'price_desc') {
        products.sort((a, b) => b.discountPrice - a.discountPrice);
      } else if (sort === 'rating') {
        products.sort((a, b) => b.rating - a.rating);
      } else if (sort === 'newest') {
        products.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }

      res.json(products);
    } catch {
      res.status(500).json({ error: 'Failed to load products' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    const product = await db.getProductById(String(req.params.id));
    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(product);
  });

  app.post('/api/products', requireAdmin, async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const name = String(body.name || '').trim();
    const brand = String(body.brand || 'KLE Studio').trim();
    const categorySlug = String(body.categorySlug || '').trim();
    const description = String(body.description || '').trim();
    const originalPrice = Number(body.originalPrice);
    const discountPrice = Number(body.discountPrice);
    const stock = Number(body.stock ?? 0);

    if (!name || !categorySlug || !description || Number.isNaN(originalPrice) || Number.isNaN(discountPrice)) {
      res.status(400).json({ error: 'Missing required product fields' });
      return;
    }

    const categories = await db.getCategories();
    const matchedCat = categories.find((c) => c.slug === categorySlug);
    const categoryName = matchedCat?.name || String(body.categoryName || categorySlug);

    const highlightsRaw = Array.isArray(body.highlights)
      ? body.highlights.map((h) => String(h).trim()).filter(Boolean)
      : String(body.highlights || '')
          .split(',')
          .map((h) => h.trim())
          .filter(Boolean);

    const created = await db.createProduct({
      name,
      brand,
      sku: String(body.sku || `KLE-${Date.now().toString().slice(-5)}`).trim(),
      categorySlug,
      categoryName,
      description,
      highlights: highlightsRaw.length > 0 ? highlightsRaw : ['Verified KLE COMMERCE quality'],
      originalPrice,
      discountPrice,
      stock: Math.max(0, stock),
      image:
        String(body.image || '').trim() ||
        matchedCat?.image ||
        '/src/assets/images/cat_electronics_1795067785332.jpg',
      isTrending: Boolean(body.isTrending),
      isBestSeller: Boolean(body.isBestSeller),
      isSpecialOffer: Boolean(body.isSpecialOffer),
      isNewArrival: body.isNewArrival !== undefined ? Boolean(body.isNewArrival) : true,
    });

    res.status(201).json(created);
  });

  app.put('/api/products/:id', requireAdmin, async (req, res) => {
    const body = req.body as Record<string, unknown>;
    const categories = await db.getCategories();
    const updates: Record<string, unknown> = {};

    if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim();
    if (typeof body.brand === 'string' && body.brand.trim()) updates.brand = body.brand.trim();
    if (typeof body.sku === 'string' && body.sku.trim()) updates.sku = body.sku.trim();
    if (typeof body.description === 'string' && body.description.trim()) {
      updates.description = body.description.trim();
    }
    if (typeof body.categorySlug === 'string' && body.categorySlug.trim()) {
      updates.categorySlug = body.categorySlug.trim();
      const matched = categories.find((c) => c.slug === updates.categorySlug);
      if (matched) updates.categoryName = matched.name;
    }
    if (body.originalPrice !== undefined && !Number.isNaN(Number(body.originalPrice))) {
      updates.originalPrice = Number(body.originalPrice);
    }
    if (body.discountPrice !== undefined && !Number.isNaN(Number(body.discountPrice))) {
      updates.discountPrice = Number(body.discountPrice);
    }
    if (body.stock !== undefined && !Number.isNaN(Number(body.stock))) {
      updates.stock = Math.max(0, Number(body.stock));
    }
    if (typeof body.image === 'string' && body.image.trim()) {
      updates.image = body.image.trim();
    }
    if (Array.isArray(body.highlights)) {
      updates.highlights = body.highlights.map((h) => String(h).trim()).filter(Boolean);
    }
    for (const flag of ['isTrending', 'isBestSeller', 'isSpecialOffer', 'isNewArrival']) {
      if (typeof body[flag] === 'boolean') updates[flag] = body[flag];
    }

    const updated = await db.updateProduct(String(req.params.id), updates);
    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(updated);
  });

  app.delete('/api/products/:id', requireAdmin, async (req, res) => {
    const deleted = await db.deleteProduct(String(req.params.id));
    if (!deleted) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json({ deleted: true });
  });

  app.post('/api/products/:id/reviews', async (req: AuthenticatedRequest, res) => {
    const auth = extractAuth(req);
    const { userName, rating, title, comment } = req.body as {
      userName?: string;
      rating?: number;
      title?: string;
      comment?: string;
    };

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ error: 'Rating must be between 1 and 5' });
      return;
    }
    if (!comment || comment.trim().length < 5) {
      res.status(400).json({ error: 'Review comment must be at least 5 characters' });
      return;
    }

    let resolvedName = userName?.trim() || 'Verified Shopper';
    if (auth) {
      const user = await db.findUserById(auth.userId);
      if (user) resolvedName = user.name;
    }

    const updated = await db.addProductReview(String(req.params.id), {
      userId: auth?.userId,
      userName: resolvedName,
      rating: numericRating,
      title: title?.trim() || 'Customer Review',
      comment: comment.trim(),
    });

    if (!updated) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.status(201).json(updated);
  });

  // Auth
  app.post('/api/auth/register', async (req, res) => {
    const { name, email, password, studentId, phone } = req.body as {
      name?: string;
      email?: string;
      password?: string;
      studentId?: string;
      phone?: string;
    };

    if (!name || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name' });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      res.status(400).json({ error: 'Please enter a valid email address' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.createUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'customer',
      studentId: studentId?.trim() || undefined,
      phone: phone?.trim() || undefined,
    });

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.status(201).json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = signToken({ userId: user.id, email: user.email, role: user.role });
    res.json({ token, user: sanitizeUser(user) });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    const { email, newPassword } = req.body as { email?: string; newPassword?: string };
    if (!email || !email.includes('@')) {
      res.status(400).json({ error: 'Please provide a valid registered email address' });
      return;
    }

    const user = await db.findUserByEmail(email);
    if (!user) {
      res.status(404).json({ error: 'No account found with that email address' });
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters' });
        return;
      }
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await db.updateUser(user.id, { passwordHash });
      res.json({ reset: true, message: 'Password updated successfully. You can now sign in.' });
      return;
    }

    res.json({
      verified: true,
      message: 'Account verified. Enter your new password to complete the reset.',
    });
  });

  app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = await db.findUserById(req.auth!.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: sanitizeUser(user) });
  });

  app.put('/api/auth/profile', requireAuth, async (req: AuthenticatedRequest, res) => {
    const { name, studentId, phone, address, city, pinCode } = req.body as {
      name?: string;
      studentId?: string;
      phone?: string;
      address?: string;
      city?: string;
      pinCode?: string;
    };

    const updates: Record<string, string | undefined> = {};
    if (name && name.trim().length >= 2) updates.name = name.trim();
    if (typeof studentId === 'string') updates.studentId = studentId.trim();
    if (typeof phone === 'string') updates.phone = phone.trim();
    if (typeof address === 'string') updates.address = address.trim();
    if (typeof city === 'string') updates.city = city.trim();
    if (typeof pinCode === 'string') updates.pinCode = pinCode.trim();

    const updated = await db.updateUser(req.auth!.userId, updates);
    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ user: sanitizeUser(updated) });
  });

  // Orders
  app.post('/api/orders', async (req: AuthenticatedRequest, res) => {
    const auth = extractAuth(req);
    const {
      customerName,
      customerEmail,
      mobile,
      address,
      city,
      pinCode,
      items,
      paymentMethod,
    } = req.body as {
      customerName?: string;
      customerEmail?: string;
      mobile?: string;
      address?: string;
      city?: string;
      pinCode?: string;
      items?: Array<{ productId: string; quantity: number }>;
      paymentMethod?: PaymentMethod;
    };

    if (!customerName || customerName.trim().length < 2) {
      res.status(400).json({ error: 'Customer name is required' });
      return;
    }
    if (!mobile || !/^\d{10}$/.test(mobile.replace(/\D/g, '').slice(-10))) {
      res.status(400).json({ error: 'Please enter a valid 10-digit mobile number' });
      return;
    }
    if (!address || address.trim().length < 5 || !city || !pinCode || !/^\d{6}$/.test(pinCode.trim())) {
      res.status(400).json({ error: 'Please enter complete delivery address, city, and 6-digit PIN code' });
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Your cart is empty' });
      return;
    }

    const resolvedItems: OrderItem[] = [];
    let subtotal = 0;

    for (const entry of items) {
      const product = await db.getProductById(entry.productId);
      if (!product) {
        res.status(404).json({ error: `Product ${entry.productId} no longer exists` });
        return;
      }
      const qty = Math.max(1, Math.floor(Number(entry.quantity) || 1));
      if (product.stock < qty) {
        res.status(400).json({
          error: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
        return;
      }
      resolvedItems.push({
        productId: product.id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        price: product.discountPrice,
        quantity: qty,
      });
      subtotal += product.discountPrice * qty;
    }

    const shippingFee = subtotal >= 999 ? 0 : 99;
    const totalAmount = subtotal + shippingFee;
    const method: PaymentMethod =
      paymentMethod === 'upi_test' || paymentMethod === 'card_test' ? paymentMethod : 'cod';

    for (const item of resolvedItems) {
      await db.decrementStock(item.productId, item.quantity);
    }

    const order = await db.createOrder({
      userId: auth?.userId,
      customerName: customerName.trim(),
      customerEmail: customerEmail?.trim() || auth?.email || 'guest@klecommerce.com',
      mobile: mobile.trim(),
      address: address.trim(),
      city: city.trim(),
      pinCode: pinCode.trim(),
      items: resolvedItems,
      subtotal,
      shippingFee,
      totalAmount,
      paymentMethod: method,
      paymentStatus: method === 'cod' ? 'Cash on Delivery' : 'Test Paid',
      status: 'Confirmed',
    });

    res.status(201).json(order);
  });

  app.get('/api/orders/my', requireAuth, async (req: AuthenticatedRequest, res) => {
    const orders = await db.getOrdersByUserId(req.auth!.userId);
    res.json(orders);
  });

  app.get('/api/orders/:id', async (req, res) => {
    const order = await db.getOrderById(String(req.params.id));
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(order);
  });

  // Admin analytics & orders
  app.get('/api/admin/stats', requireAdmin, async (_req, res) => {
    const [products, orders, categories] = await Promise.all([
      db.getProducts(),
      db.getAllOrders(),
      db.getCategories(),
    ]);

    const activeOrders = orders.filter((o) => o.status !== 'Cancelled');
    const totalSales = activeOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalUnitsSold = activeOrders.reduce(
      (acc, o) => acc + o.items.reduce((sum, i) => sum + i.quantity, 0),
      0
    );
    const lowStockCount = products.filter((p) => p.stock <= 10).length;

    res.json({
      totalSales,
      totalOrders: orders.length,
      totalProducts: products.length,
      totalCategories: categories.length,
      totalUnitsSold,
      lowStockCount,
    });
  });

  app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
    const orders = await db.getAllOrders();
    res.json(orders);
  });

  app.patch('/api/admin/orders/:id/status', requireAdmin, async (req, res) => {
    const { status } = req.body as { status?: OrderStatus };
    const allowed: OrderStatus[] = ['Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !allowed.includes(status)) {
      res.status(400).json({ error: 'Invalid order status' });
      return;
    }
    const updated = await db.updateOrderStatus(String(req.params.id), status);
    if (!updated) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    res.json(updated);
  });

  // Vite / Static Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KLE COMMERCE] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start KLE COMMERCE server:', err);
  process.exit(1);
});
