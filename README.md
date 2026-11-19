# KLE COMMERCE (`tajcommers`)

A full-stack, responsive e-commerce web application built with React, React Router, Tailwind CSS, Node.js, Express, and MongoDB Atlas (with automatic local JSON persistence fallback).

## Tech Stack

- **Frontend:** React 19, TypeScript, React Router (`react-router-dom`), Tailwind CSS v4, Lucide Icons
- **Backend:** Node.js, Express.js (`server.ts`), JWT authentication (`jsonwebtoken`), Password hashing (`bcryptjs`)
- **Database:** MongoDB Atlas via Mongoose (`MONGODB_URI`), with automatic persistent local JSON store fallback (`data/kle-commerce-db.json`) when `MONGODB_URI` is not configured
- **Build & Tooling:** Vite, `tsx`, TypeScript

## Features

### Storefront & Catalog
- **Homepage:** Promotional announcement bar, featured hero showcase, 9 category cards, interactive collection tabs (**Trending Now**, **Best Sellers**, **Special Offers**, **New Arrivals**), and offer spotlight.
- **9 Product Categories:**
  1. Fashion
  2. Electronics
  3. Mobiles
  4. Groceries
  5. Home Appliances
  6. Beauty Products
  7. Books
  8. Sports & Fitness
  9. Accessories
- **Search & Filtering:** Header search bar, category filters, collection tabs, max-price range slider, and sorting (featured, price low-to-high, price high-to-low, rating, newest).
- **Product Details & Reviews:** High-resolution product imagery, SKU & highlights, original vs. discounted pricing, savings calculation, live stock count, quantity stepper, **Add to Cart**, **Buy Now**, **Wishlist** toggle, and interactive **Customer Reviews** submission.

### Accounts, Cart & Safe Test Checkout
- **User Authentication:** Student/customer registration (`/register`), login (`/login`) with email/password validation, 2-step password reset (`/forgot-password`), and editable profile & order history (`/profile`).
- **Shopping Cart & Wishlist:** Slide-over cart drawer, full `/cart` page with quantity controls, automatic subtotal, savings, and shipping calculation (free delivery over ₹999), plus `/wishlist`.
- **Safe Test Checkout (`/checkout`):** Validated shipping form (name, 10-digit mobile, address, city, 6-digit PIN code), simulated payment methods (**Cash on Delivery**, **UPI Test Mode**, **Test Card Checkout** — no real payment details collected), stock decrementing, and Order Confirmation receipt (`/order-confirmation/:id`).

### Admin Dashboard (`/admin`)
- Protected administrator console with sales & inventory KPIs (total revenue, total orders, active products, low-stock alerts).
- **Products & Inventory:** Add, edit, and delete products; adjust stock quantities inline.
- **Categories:** Create, rename/edit, and delete product categories.
- **Customer Orders:** View customer orders and update order status (`Confirmed`, `Packed`, `Shipped`, `Delivered`, `Cancelled`).

## Project Structure

```text
├── server.ts                  # Express server, REST APIs, and Vite middleware
├── server/
│   ├── db.ts                  # MongoDB Atlas (Mongoose) + local JSON persistence layer
│   ├── seedData.ts            # Seeded categories, 22 products, demo users, sample orders
│   └── types.ts               # Shared backend TypeScript types
├── src/
│   ├── App.tsx                # React Router routes and layout shell
│   ├── context/StoreContext.tsx # Auth, catalog, cart, wishlist, and toast state
│   ├── lib/api.ts             # Typed fetch wrapper with JWT authorization header
│   ├── components/            # Navbar, Footer, ProductCard, CartDrawer, SmartImage
│   └── pages/                 # Home, Category, ProductDetail, Cart, Wishlist, Checkout,
│                              # OrderConfirmation, Auth, Profile, AdminDashboard
├── .env.example               # Environment variable template
└── package.json               # Scripts and dependencies
```

## Environment Variables

Copy `.env.example` to `.env` and configure values as needed:

```env
MONGODB_URI=""                 # Optional MongoDB Atlas URI (falls back to ./data/kle-commerce-db.json if empty)
JWT_SECRET="your-jwt-secret"   # Signing secret for user and admin tokens
APP_URL="http://localhost:3000"
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server (Express + Vite on port 3000):**
   ```bash
   npm run dev
   ```

3. **Type-check and build for production:**
   ```bash
   npm run lint
   npm run build
   ```

## Demo Accounts

- **Student / Customer Account:** `student@klecommerce.com` / `Student@123`
- **Admin Account:** `admin@klecommerce.com` / `Admin@123`

## API Endpoints

- `GET /api/health` — Server health check
- `GET /api/categories` — List all categories (`POST`, `PUT`, `DELETE` require admin)
- `GET /api/products` — Query products by `category`, `q`, `collection`, `sort`, `minPrice`, `maxPrice`
- `GET /api/products/:id` — Product details (`POST`, `PUT`, `DELETE` require admin)
- `POST /api/products/:id/reviews` — Submit customer review
- `POST /api/auth/register` · `POST /api/auth/login` · `POST /api/auth/forgot-password`
- `GET /api/auth/me` · `PUT /api/auth/profile`
- `POST /api/orders` · `GET /api/orders/my` · `GET /api/orders/:id`
- `GET /api/admin/stats` · `GET /api/admin/orders` · `PATCH /api/admin/orders/:id/status`
