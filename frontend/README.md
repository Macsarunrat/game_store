# Nova Store (Game Store Management System)

Nova Store is a comprehensive web application for managing and purchasing digital games. Built with Angular, it provides a seamless experience for customers to browse, purchase, and manage their game library, while offering powerful administrative tools for store owners and admins to manage inventory, track orders, and interact with customers.

## 🌟 Key Features

### For Customers
* **Game Catalog:** Browse available games, filter by categories, and search by name.
* **Shopping & Checkout:** Secure payment integration via Stripe.
* **Game Library:** View purchased games and track order status.
* **Real-time Notifications:** Receive instant updates when an order is confirmed via Server-Sent Events (SSE).
* **Live Chat:** Communicate directly with support or admins.

### For Admins & Owners
* **Role-Based Access Control (RBAC):** Distinct permissions for `admin` and `owner` roles.
* **Game Management:** Create, read, update, delete (CRUD) games. Upload game covers and manage categories.
* **Order Management:** View all customer orders, confirm payments, and manage order statuses in real-time.
* **Dashboard Analytics:** (Owner only) View sales statistics and store performance.
* **Admin Notifications:** Receive real-time alerts when new orders are placed.

## 💻 Tech Stack

* **Framework:** [Angular](https://angular.io/) (v21)
* **Styling & UI:** CSS, Angular Material, SweetAlert2 for popups
* **Real-time Communication:** Server-Sent Events (SSE) via `event-source-polyfill`
* **Charts:** ApexCharts (`ng-apexcharts`)
* **State Management:** RxJS (BehaviorSubjects, Observables)
* **Routing:** Angular Router with Role Guards

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd angular-miniproject
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment:**
   Ensure your backend API is running locally or update the API endpoint configurations in the environment files.

4. **Run the development server:**
   You can start the server using either npm or the Angular CLI:
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

* **`/login`**: Public
* **`/main`**: `customer` (Game Catalog)
* **`/library`**: `customer` (Purchased Games & Orders)
* **`/game-manage`**: `admin`, `owner` (Game Inventory Management)
* **`/order`**: `admin`, `owner` (Customer Orders Management)
* **`/dashboard`**: `owner` (Store Analytics)
* **`/chat`**: `customer`, `admin`, `owner`

## 🛠 Building for Production

To build the project for production, run:
```bash
npm run build
```
The build artifacts will be stored in the `dist/` directory.
