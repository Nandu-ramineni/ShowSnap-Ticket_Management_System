# Theatre Owner Management Portal

A complete, production-ready theatre management application built with Next.js, Supabase, and Tailwind CSS. This application enables theatre owners to manage their cinema operations efficiently.

## Features

### 1. **Authentication & Security**
- User registration and login system
- Secure password management with Supabase Auth
- Role-based access control (Owner, Manager, Staff)
- Session management with HTTP-only cookies
- Protected routes with automatic redirects

### 2. **Dashboard**
- Real-time overview of key metrics:
  - Total revenue and bookings
  - Average occupancy rate
  - Active shows count
- Revenue and booking trends visualization
- Screen occupancy charts
- Business performance insights

### 3. **Theatre & Screen Management**
- Create and manage multiple theatre locations
- Track theatre details (name, location, contact info)
- Add/edit/delete theatres
- Screen configuration and management
- Status tracking (Active/Inactive)

### 4. **Movie/Show Scheduling**
- Add and manage movie releases
- Schedule shows across different screens and timings
- Set ticket pricing per show
- Support for multiple formats (2D/3D)
- Show status management

### 5. **Booking Management**
- View all customer bookings in real-time
- Booking confirmation and cancellation
- Customer details and contact information
- Seat allocation tracking
- Booking status monitoring (Confirmed/Pending/Cancelled)
- Detailed booking information view

### 6. **Analytics & Reports**
- Comprehensive business intelligence dashboard
- Revenue trends and analysis
- Movie performance metrics
- Occupancy rate analysis
- Booking distribution by status
- Genre-wise performance tracking
- Exportable reports

### 7. **Staff Management**
- Add and manage theatre staff
- Role assignment (Manager, Cashier, Staff)
- Staff contact information
- Join date tracking
- Status management
- Theatre assignment for staff

### 8. **Payment & Refunds Tracking**
- Transaction history with payment details
- Multiple payment method support (Credit Card, Debit Card, UPI, Wallet)
- Payment status tracking
- Refund management and processing
- Refund reason tracking
- Payment trend analysis
- Revenue reconciliation

### 9. **Settings & Configuration**
- General theatre settings (name, owner, location)
- Tax information (GST Number, License)
- Refund and cancellation policies
- Advance booking configuration
- Security settings (password management, 2FA)
- Notification preferences
- Email and SMS alerts

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS v4** - Utility-first CSS framework
- **Shadcn/UI** - High-quality, accessible component library
- **Recharts** - Chart visualization library
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Backend & Database
- **Supabase** - PostgreSQL database with authentication
- **Next.js API Routes** - Serverless backend
- **Row Level Security (RLS)** - Data isolation and security

### Deployment
- **Vercel** - Deployment platform

## Project Structure

```
/vercel/share/v0-project/
├── app/
│   ├── (auth)/              # Authentication routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── layout.tsx
│   ├── (dashboard)/         # Protected dashboard routes
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── theatres/
│   │   │   ├── shows/
│   │   │   ├── bookings/
│   │   │   ├── analytics/
│   │   │   ├── staff/
│   │   │   ├── payments/
│   │   │   └── settings/
│   │   └── layout.tsx
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx
├── components/
│   ├── dashboard/
│   │   └── sidebar.tsx      # Navigation sidebar
│   └── ui/                  # Shadcn components
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client
│   │   └── server.ts        # Server client
│   ├── context/
│   │   └── auth-context.tsx # Authentication context
│   ├── types/
│   │   └── auth.ts          # Type definitions
│   └── utils.ts
├── scripts/
│   └── 01_create_schema.sql # Database schema migration
└── package.json
```

## Database Schema

The application uses 14 tables for complete theatre management:

1. **theatre_owners** - Theatre owner profiles
2. **theatres** - Cinema locations
3. **screens** - Cinema screens within theatres
4. **seats** - Individual seat mappings
5. **seat_types** - Seat classifications (standard, premium)
6. **movies** - Movie catalog
7. **shows** - Movie shows/screenings
8. **bookings** - Customer reservations
9. **payments** - Transaction records
10. **refunds** - Refund tracking
11. **staff** - Employee records
12. **staff_roles** - Role definitions
13. **theatre_settings** - Theatre-specific configurations
14. **users** (Supabase built-in) - Authentication

All tables include RLS policies for data security and isolation.

## Getting Started

### Prerequisites
- Node.js 16+
- npm/pnpm
- Supabase account

### Installation

1. **Clone/Download the project**

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Supabase**
   - Create a Supabase project
   - Run the database migration from `scripts/01_create_schema.sql`
   - Get your Supabase URL and Anon Key

4. **Configure environment variables**
   Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Run development server**
   ```bash
   pnpm dev
   ```

6. **Access the application**
   - Open http://localhost:3000
   - Sign up as a theatre owner
   - Login and start managing your theatre

## Key Pages & Routes

| Route | Description |
|-------|-------------|
| `/login` | Theatre owner login |
| `/signup` | Create new theatre account |
| `/dashboard` | Main dashboard with metrics |
| `/dashboard/theatres` | Theatre management |
| `/dashboard/shows` | Show/movie scheduling |
| `/dashboard/bookings` | Booking management |
| `/dashboard/analytics` | Reports and analytics |
| `/dashboard/staff` | Employee management |
| `/dashboard/payments` | Payment tracking |
| `/dashboard/settings` | Configuration & preferences |

## Features Summary

✅ Complete authentication system
✅ Multi-theatre support
✅ Real-time booking management
✅ Comprehensive analytics dashboard
✅ Staff & role management
✅ Payment & refund tracking
✅ Revenue reporting
✅ Configurable policies
✅ Responsive design
✅ Dark mode support
✅ Role-based access control
✅ Data security with RLS

## API Integration Points

The application is designed to connect with:

1. **Supabase Auth** - For user authentication
2. **Supabase Database** - For all data persistence
3. **Payment Gateway** (Future) - For online payments
4. **Email Service** (Future) - For notifications
5. **SMS Service** (Future) - For alerts

## Security Features

- Supabase Row Level Security (RLS)
- Secure password hashing
- HTTP-only cookie sessions
- Input validation with Zod
- Protected API routes
- User authentication checks
- Role-based authorization

## Future Enhancements

- Seat layout designer with visual interface
- Real-time notifications
- Online payment integration
- Email/SMS notifications
- Customer management system
- Ticket barcode generation
- Dynamic pricing algorithms
- Concession management
- Show timing recommendations
- Inventory management

## Support & Documentation

For more information, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn/UI Components](https://ui.shadcn.com)

## License

This project is created with v0.app and is ready for deployment.

---

**Version:** 1.0.0  
**Last Updated:** 2024-04-14
