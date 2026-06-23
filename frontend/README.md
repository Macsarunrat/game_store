# Game Store Management System (Frontend)

## 🌟 Key Features

### For Customers

- **Game Catalog:** Browse available games, filter by categories, and search by name.
- **Shopping & Checkout:** Secure payment integration via Stripe.
- **Game Library:** View purchased games and track order status.
- **Real-time Notifications:** Receive instant updates when an order is confirmed via Server-Sent Events (SSE).
- **Live Chat:** Communicate directly with admin or owner or user.

### For Admins & Owners

- **Role-Based Access Control (RBAC):** Distinct permissions for `admin` and `owner` roles.
- **Game Management:** Create, read, update, delete (CRUD) games. Upload game covers and manage categories.
- **Order Management:** View all customer orders, confirm payments, and manage order statuses in real-time.
- **Dashboard Analytics:** (Owner only) View sales statistics and store performance.
- **Admin Notifications:** Receive real-time alerts when new orders are placed.

## 🧑‍💻 My Responsibility

- **Research UX/UI design for web development:** Analyzed user flows and designed an intuitive, responsive user interface.
- **Frontend Development:** Implemented the web application using Angular and Angular Material based on UI/UX research.
- **API Integration:** Connected frontend interfaces with backend RESTful APIs and real-time SSE/WebSockets.
- **State Management:** Handled application state using RxJS to ensure a seamless user experience.

## 🚀 Installation Node.js

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
If not, download and install it from the official website.

## 💻 Run front-end

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure Environment:**
   Ensure your backend API is running locally or update the API endpoint configurations in the environment files.

3. **Run the development server:**
   ```bash
   npm start
   # OR
   ng serve
   ```
   Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## 📂 Project Structure

```text
src/app/
├── core/           # Core services (Auth, Role Guards)
├── features/       # Feature modules (Auth, Games, Orders, Chat, Dashboard)
├── layout/         # Layout components (Navbar, Main Layout)
└── shared/         # Shared components, pipes (StaticUrlPipe), and animations
```

## 🔐 Role Access Summary

- **`/login`**: Public
- **`/main`**: `customer` (Game Catalog)
- **`/library`**: `customer` (Purchased Games & Orders)
- **`/game-manage`**: `admin`, `owner` (Game Inventory Management)
- **`/order`**: `admin`, `owner` (Customer Orders Management)
- **`/dashboard`**: `owner` (Store Analytics)
- **`/chat`**: `customer`, `admin`, `owner`
