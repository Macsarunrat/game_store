# game_store 

![Python](https://img.shields.io/badge/Python-3.12-blue?style=flat-square&logo=python&logoColor=white) 
![FastAPI](https://img.shields.io/badge/FastAPI-0.136.0-009688?style=flat-square&logo=fastapi&logoColor=white) 
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791?style=flat-square&logo=postgresql&logoColor=white)
![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat-square&logo=angular&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

## About The Project
A comprehensive Game Store Management System developed over a **2-month period at XTEN**. 



## Table of Contents
- [game\_store](#game_store)
  - [About The Project](#about-the-project)
  - [Table of Contents](#table-of-contents)
  - [Getting Started](#getting-started)
    - [Installation](#installation)
  - [API Document](#api-document)
  - [Tech Stack](#tech-stack)
  - [Features](#features)
  - [My Role \& Responsibilities](#my-role--responsibilities)
  - [Configuration (Optional Features)](#configuration-optional-features)
    - [Email Notification System](#email-notification-system)
    - [Stripe Payment Gateway](#stripe-payment-gateway)

## Getting Started
### Installation
1. Clone repository

    ```bash
        git clone https://github.com/Macsarunrat/game_store.git
    ```

2. Create .env file
    ```bash
        cp .env.example .env
    ```
3. Run Docker Service
    ```bash
        docker compose up -d --build
    ```
4. Run seed data
    ```bash
        docker compose exec backend python seed.py
    ```
5. Ready to use
    ```bash
        http://localhost:80/login
    ```

## API Document
* **Swagger: UI** 'http://localhost:8000/docs'
* **Redoc: UI** 'http://localhost:8000/redoc'

## Tech Stack
* **Backend:** Python 3.12, FastAPI
* **Frontend:** Angular
* **Database:** PostgreSQL 17
* **Caching & Broker:** Redis
* **Infrastructure:** Docker, Docker Compose

## Features
* **Role-Based Access Control (RBAC):** 
  * **Customer:** Browse games, Buying game
  * **Admin:** Manage game catalogs, update game information, and handle cover image/video uploads/removals.
  * **Owner:** Full system access, including an interactive dashboard to monitor sales.
* **Full Payment Integration:** Implemented an end-to-end checkout flow using Stripe. The system securely processes transactions, validates webhooks, and automatically updates order statuses.
* **Real-time Chat:** WebSocket-based chat system for real-time user communication.
* **Real-time Notifications:** Server-Sent Events (SSE) for instant alerts on new orders (Admin) and order confirmations (Customer).
* **Automated Email Alerts:** Email notifications for order status updates and system alerts.
* **Optimized Performance (Caching):** Implemented **Redis caching** to store frequently accessed data (such as game catalogs), significantly reducing database load and improving API response times.

## My Role & Responsibilities
During this internship, I worked as the Backend Developer. My main focus was on database architecture, building robust endpoints, and exploring advanced backend concepts. My key contributions include:

* **Database & Migrations:** Designed efficient relational database schemas and managed versions seamlessly using Alembic.

* **API Development & Security:** Built RESTful APIs with FastAPI and implemented secure JWT authentication for role-based protection.

* **Performance Optimization:** Integrated Redis caching to reduce database load and improve overall API throughput.

* **Project Structuring:** Set up a clean codebase with API versioning and standardized response templates for easier error handling and maintenance.

* **Real-time Communication:** Researched and implemented a real-time chat system using WebSockets and a push notification system using Server-Sent Events (SSE).


## Configuration (Optional Features)
To fully utilize all features in this project, you need to configure specific third-party services in your `.env` file.

### Email Notification System
To enable automated emails, provide your email credentials. If using Gmail, you must generate an **App Password**.

`MAIL_USERNAME=your_email@gmail.com`

`MAIL_PASSWORD=your_app_password`

### Stripe Payment Gateway
To test the purchasing flow, you need a Stripe account to get the API keys.

`STRIPE_PUBLIC_KEY=your_stripe_public_key`

`STRIPE_SECRET_KEY=your_stripe_secret_key`

`STRIPE_WEBHOOK=your_stripe_webhook_key`

If you want to test the Stripe integration in your local environment, follow these instructions:
1. Install Stripe CLI
   
* For Windows:
```bash
    winget install --id Stripe.StripeCli
```
* For macOS
```bash
    brew install stripe/stripe-cli/stripe
```
2. Login to your Stripe account
```bash
    stripe login
```
3. Forward webhooks to your local API
```bash
    stripe listen --forward-to localhost:8000/api/v1/stripe/webhook
```