# JustMine - Concert Event Management Platform

A modern, full-stack concert event management and ticketing platform built with Next.js 14, TypeScript, Tailwind CSS, and PostgreSQL.

## 🎯 Overview

JustMine is an all-in-one platform for concert music events that provides:

- **For Fans:** Discover concerts, buy tickets, manage bookings
- **For Organizers:** Create events, manage ticketing, view analytics
- **For Artists:** Connect with fans, track sales

## 🚀 Features

### Core Features

- ✅ User Authentication (Register, Login, Role-based access)
- ✅ Event Discovery with Filters (city, genre, date)
- ✅ Ticket Selection and Purchase Flow
- ✅ Secure Payment Integration (Midtrans, Xendit)
- ✅ QR-based E-tickets
- ✅ Check-in System (QR Scanning)

### Organizer Features

- ✅ Create & Manage Events (3-step wizard)
- ✅ Flexible Ticket Types (Regular, VIP, Early Bird)
- ✅ Real-time Sales Tracking
- ✅ Analytics Dashboard

### Fan Engagement

- ✅ Follow Artists/Events
- ✅ Notification System
- ✅ Affiliate/Referral Program (coming soon)

### Differentiators

- ✅ Anti-scalping protection
- ✅ Limit per order
- ✅ Real-time seat/stock locking

## 🏗️ Architecture

```
Next.js 14 (App Router)
├── Tailwind CSS (Design System)
├── NextAuth.js (Authentication)
├── Drizzle ORM (Database)
├── PostgreSQL (Database)
├── Redis (Queue & Locking)
└── Midtrans/Xendit (Payment)
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Dashboard routes
│   │   ├── organizer/     # Organizer dashboard
│   │   └── user/         # User dashboard
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication
│   │   ├── events/       # Events CRUD
│   │   ├── tickets/      # Ticket management
│   │   ├── orders/       # Order processing
│   │   └── checkin/      # Check-in scanning
│   ├── events/[id]/      # Event detail page
│   ├── checkout/         # Checkout flow
│   └── checkin/          # QR scanner
├── components/           # React components
│   ├── ui/              # UI primitives
│   ├── layout/          # Layout components
│   └── event/           # Event-specific components
├── lib/                 # Utilities & config
│   ├── db.ts           # Database connection
│   ├── schema.ts       # Drizzle schema
│   └── utils.ts        # Helper functions
├── types/              # TypeScript definitions
└── hooks/             # Custom hooks
```

## 🎨 Design System

Based on the provided design specification:

- **Primary:** #6C5CE7 (Indigo)
- **Accent:** #00D1B2 (Teal)
- **Background:** #0F1222 (Dark SaaS)
- **Surface:** #171A2F
- **Radius:** 12px (cards), 16px (modals)
- **Font:** Inter

## 🔧 Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for production)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eventmanagement
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Configure environment variables**

   Copy `.env.example` to `.env.local` and fill in the values:

   ```bash
   cp .env.example .env.local
   ```

   Required variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `AUTH_SECRET` - NextAuth secret
   - `MIDTRANS_SERVER_KEY` - Payment gateway (optional for dev)

4. **Set up the database**

   ```bash
   # Run migrations
   npx drizzle-kit generate
   npx drizzle-kit migrate

   # Seed sample data
   npx tsx scripts/seed.ts
   ```

5. **Start the development server**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Database CLI

```bash
# Generate migration files
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Studio (GUI)
npx drizzle-kit studio
```

## 🔐 Authentication

- **Method:** Credentials (email/password) + OAuth providers (Google, GitHub ready)
- **Session:** JWT-based with NextAuth.js
- **Roles:** `user`, `organizer`, `admin`

## 💳 Payment Integration

### Midtrans (Snapcart)

- **Sandbox:** Enabled by default
- **Production:** Set `MIDTRANS_IS_PRODUCTION=true`

### Xendit

- Configure via env vars
- SupportsInvoice & Virtual Account

## 🚀 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project to Vercel
3. Configure environment variables
4. Deploy

### Docker

```bash
docker build -t justmine-platform .
docker run -p 3000:3000 --env-file .env.local justmine-platform
```

## 📊 API Reference

### Public Endpoints

- `GET /api/events` - List events (with filters)
- `GET /api/events/[id]` - Get event details
- `GET /api/events/slug/[slug]` - Get event by slug

### Protected Endpoints

- `POST /api/orders` - Create order
- `GET /api/orders/[id]` - Get order details
- `POST /api/checkin` - Scan & validate ticket

## 🧪 Testing

```bash
# Run type check
npm run typecheck

# Run lint
npm run lint

# Build
npm run build
```

## 📱 Mobile Responsive

The UI is fully responsive with:

- Mobile-first design approach
- Touch-friendly UI elements
- Optimized checkout flow for mobile

## 🔒 Security Features

- Password hashing with bcrypt
- JWT with secure cookies
- Rate limiting on auth endpoints
- SQL injection protection (Drizzle ORM)
- XSS protection
- CSRF protection

## ⚡ Performance

- Image optimization (Next.js Image)
- Static generation for event pages
- Server-side rendering for SEO
- Lazy loading components
- Redis caching (optional)

## 📈 Roadmap

### Phase 1 (MVP) - ✅ Complete
- Basic authentication
- Event creation & management
- Ticket purchasing
- QR ticket delivery
- Check-in scanning

### Phase 2
- Advanced analytics dashboard
- Affiliate/reseller system
- Push notifications
- White-label customization

### Phase 3
- AI dynamic pricing
- NFT tickets
- Resale marketplace

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
- Create an issue on GitHub
- Email support@justmine.id
- Follow us on Twitter @JustMineID

---

Built with ❤️ by JustMine Team
