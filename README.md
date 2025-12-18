# 🎫 Queue Management System

A modern, real-time queue management platform designed for clinics, pharmacies, government offices, and service-based businesses. Built with **Next.js 16** frontend and **Express.js** backend with **Socket.IO** for live updates.

![Queue Management System](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

## ✨ Features

### 👥 For Customers
- 🎟️ **Digital Ticket Booking** - Book your spot in queue from anywhere
- 📍 **Real-time Position Tracking** - Live updates on your queue position
- 🔔 **Smart Notifications** - Get notified when your turn is approaching
- ⭐ **Reviews & Ratings** - Rate and review your experience
- 🌍 **Multi-language Support** - Available in English and Arabic (RTL supported)
- 🌙 **Dark/Light Mode** - Choose your preferred theme

### 🏢 For Businesses
- 📊 **Business Dashboard** - Comprehensive queue and ticket management
- 👨‍💼 **Walk-in Customer Support** - Add customers directly at the counter
- 💳 **Payment Processing** - Accept Cash and Stripe Card payments
- 📈 **Analytics & Statistics** - Track performance and customer flow
- 🔄 **Real-time Queue Updates** - Socket.IO powered live updates
- 📋 **Multi-service Support** - Manage different service types
- 🧾 **Receipt Generation** - Generate PDF receipts for transactions

### 🛡️ For Administrators
- 👤 **User Management** - Manage users and businesses
- 📊 **System Analytics** - Monitor platform-wide statistics
- 🔐 **Role-based Access Control** - Admin, Business, and User roles
- 📤 **Data Export** - Export data for reporting
- 🏥 **System Health Monitoring** - Track system status

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React Framework with App Router |
| React 19 | UI Library |
| Tailwind CSS 4 | Styling |
| Socket.IO Client | Real-time Communication |
| Redux Toolkit | State Management |
| next-intl | Internationalization (i18n) |
| Framer Motion | Animations |
| Recharts | Charts & Analytics |
| Stripe.js | Payment Integration |

### Backend
| Technology | Purpose |
|------------|---------|
| Express.js 5 | Web Framework |
| Socket.IO | Real-time Events |
| MongoDB + Mongoose | Database |
| JWT | Authentication |
| Passport.js | Google OAuth |
| Stripe | Payment Processing |
| Nodemailer | Email Notifications |
| Zod | Validation |

## 📁 Project Structure

```
Queue-Management-System/
├── Backend/
│   ├── server.js              # Entry point
│   ├── vercel.json            # Vercel deployment config
│   └── src/
│       ├── config/            # Database & Passport config
│       ├── controllers/       # Route handlers
│       ├── middlewares/       # Auth & validation
│       ├── models/            # MongoDB schemas
│       ├── routes/            # API routes
│       ├── sockets/           # Socket.IO handlers
│       ├── utils/             # Helper functions
│       └── validations/       # Request validation
│
├── Frontend/
│   ├── next.config.mjs        # Next.js configuration
│   └── src/
│       ├── app/               # Next.js App Router pages
│       ├── components/        # React components
│       ├── contexts/          # React contexts
│       ├── hooks/             # Custom hooks
│       ├── i18n/              # Translations (en/ar)
│       ├── lib/               # Utilities
│       └── redux/             # Redux store & slices
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- MongoDB database
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HussienKhaaleed/Queue-Management-System.git
   cd Queue-Management-System
   ```

2. **Setup Backend**
   ```bash
   cd Backend
   npm install
   ```
   
   Create `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   FRONTEND_URL=http://localhost:3000
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Email
   EMAIL_USER=your_email
   EMAIL_PASS=your_email_password
   ```

3. **Setup Frontend**
   ```bash
   cd ../Frontend
   npm install
   ```
   
   Create `.env` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   ```

4. **Run Development Servers**
   
   Backend (Terminal 1):
   ```bash
   cd Backend
   npm run dev
   ```
   
   Frontend (Terminal 2):
   ```bash
   cd Frontend
   npm run dev
   ```

5. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🌐 API Endpoints

| Route | Description |
|-------|-------------|
| `/api/v1/auth` | Authentication (login, register, OAuth) |
| `/api/v1/users` | User management |
| `/api/v1/businesses` | Business operations |
| `/api/v1/queues` | Queue management |
| `/api/v1/tickets` | Ticket operations |
| `/api/v1/payments` | Payment processing |
| `/api/v1/reviews` | Reviews & ratings |
| `/api/v1/notifications` | Notification system |
| `/api/v1/subscriptions` | Subscription plans |
| `/api/v1/admin` | Admin operations |
| `/api/v1/analytics` | Analytics data |
| `/api/v1/stats` | Statistics |
| `/api/v1/search` | Search functionality |

## 🚀 Deployment

### Vercel Deployment

Both Frontend and Backend are configured for Vercel deployment.

1. Push to GitHub
2. Import repository to Vercel
3. Deploy Backend (set root directory to `Backend`)
4. Deploy Frontend (set root directory to `Frontend`)
5. Configure environment variables in Vercel dashboard
6. Update CORS and API URLs for production

### Environment Variables on Vercel

Set all the environment variables from your `.env` files in the Vercel dashboard for each project.

## 🌍 Internationalization

The application supports:
- 🇺🇸 **English** (LTR)
- 🇸🇦 **Arabic** (RTL)

Translation files are located in `Frontend/src/i18n/messages/`

## 📱 Features Breakdown

### Queue Management
- Create and manage multiple queues
- Real-time queue status updates
- Capacity management
- Service-specific queues

### Ticket System
- Digital ticket generation
- Status tracking (waiting, called, serving, completed, skipped, cancelled)
- Walk-in customer support
- Service type selection

### Payment System
- Cash payments
- Stripe card payments
- Payment history
- Receipt generation (PDF)

### Notification System
- Real-time notifications via Socket.IO
- Email notifications
- Queue position updates
- Turn notifications

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Hussien Khaaleed**

---

<p align="center">
  Made with ❤️ for ITI Graduation Project
</p>
