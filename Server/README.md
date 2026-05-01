# 🎬 SeatSecure Backend v2

BookMyShow-style movie ticket booking API. ES6 modules, Node.js + Express + MongoDB + Redis + Stripe.

## Architecture Overview

```
User → API Server (Node/Express) → MongoDB (data)
                                 → Redis  (seat locks + caching)
                                 → Stripe (payments + webhooks)
```

### Domain Model

```
Movie ──────────────────────────────────────────────────────────────
  │  has many Showtimes
  │  has many Reviews (only from users who booked + watched)
  ▼
Showtime ──────────────────────────────────────────────────────────
  │  belongs to Theatre + Screen
  │  has many Seats (generated from Screen.seatLayout on creation)
  ▼
Theatre ────────────────────────────────────────────────────────────
  │  has many Screens (IMAX, 4DX, Standard, etc.)
  │  belongs to a city + has geo-coordinates for nearby search
  ▼
Screen ─────────────────────────────────────────────────────────────
  │  holds seat layout template (rows, types, pricing)
  │  one Seat doc per seat per Showtime generated at schedule time
  ▼
Booking ────────────────────────────────────────────────────────────
  │  links User → Showtime → Seats
  │  includes pricing snapshot, Stripe payment details, QR code ref
  │  awards loyalty points on confirmation
```

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env .env.local
# Fill in MONGO_URI, JWT secrets, STRIPE keys

# 3a. Docker (recommended)
docker-compose -f docker/docker-compose.yml up

# 3b. Local (requires MongoDB + Redis running)
npm run dev
```

## API Reference

### Auth `/api/v1/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | — | Register |
| POST | /login | — | Login → access + refresh tokens |
| POST | /refresh-token | — | Rotate tokens |
| GET | /profile | ✅ | Get profile |
| PATCH | /profile | ✅ | Update name/phone/city |
| PATCH | /change-password | ✅ | Change password |

### Movies `/api/v1/movies`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | — | List (filter: city, date, genre, language, search) |
| GET | /:slug | — | Movie detail |
| GET | /:id/availability | — | Cities + dates where movie is playing |
| GET | /:movieId/showtimes | — | Showtimes grouped by theatre |
| GET | /:movieId/reviews | — | User reviews |
| POST | /:movieId/reviews | ✅ | Submit review (must have booking) |
| POST | / | Admin | Create movie |
| PUT | /:id | Admin | Update movie |
| DELETE | /:id | Admin | Soft delete |

### Theatres `/api/v1/theatres`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | — | List (filter: city, multiplex, search) |
| GET | /nearby?lat=&lng=&radius= | — | Nearby theatres (geo search) |
| GET | /:id | — | Theatre detail |
| GET | /:id/screens | — | List screens in theatre |
| POST | / | Owner/Admin | Create theatre |
| PUT | /:id | Owner/Admin | Update theatre |

### Screens `/api/v1/theatres/:theatreId/screens` or `/api/v1/screens`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /:id | — | Screen detail |
| GET | /:id/seat-layout | — | Seat layout for frontend map |
| POST | / | Owner/Admin | Create screen + seat layout |
| PUT | /:id | Owner/Admin | Update screen |
| DELETE | /:id | Owner/Admin | Deactivate screen |

### Showtimes `/api/v1/showtimes`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /movie/:movieId?city=&date= | — | Shows by movie (grouped by theatre) |
| GET | /:id | — | Showtime detail |
| POST | / | Admin | Create showtime (auto-generates Seat docs) |
| PATCH | /:id/cancel | Admin | Cancel showtime |

### Seats `/api/v1/showtimes/:showtimeId/seats`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | — | Live seat map with statuses |
| POST | /lock | ✅ | Lock seats (10 min TTL, Redis + DB) |
| POST | /release | ✅ | Release seat locks |

### Bookings `/api/v1/bookings`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | / | ✅ | Initiate booking → Stripe clientSecret |
| GET | /my | ✅ | My booking history |
| GET | /:id | ✅ | Booking detail (ticket) |
| POST | /:id/cancel | ✅ | Cancel + auto-refund |

### Payments
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /payments/webhook | Stripe sig | Stripe event handler |

## Booking Flow (User Journey)

```
1. Browse movies     GET /movies?city=Mumbai&date=2024-12-25
2. Pick a show       GET /showtimes/movie/:id?city=Mumbai&date=2024-12-25
3. See seat map      GET /showtimes/:showtimeId/seats
4. Lock seats        POST /showtimes/:showtimeId/seats/lock  ← Redis SET NX EX
5. Initiate booking  POST /bookings                          ← Stripe PaymentIntent
6. Pay on frontend   stripe.confirmPayment(clientSecret)
7. Webhook confirms  POST /payments/webhook                  ← atomic DB transaction
8. Show ticket       GET /bookings/:id
9. Cancel if needed  POST /bookings/:id/cancel               ← auto refund via Stripe
```

## Seat Locking Strategy

Two-layer distributed lock to handle race conditions across multiple API instances:

- **Redis** `SET key value NX EX 600` — fast, atomic, auto-expiring
- **MongoDB** `lockedUntil` field — durable fallback for DB queries
- Background cron clears stale DB locks every 2 minutes
- All acquired locks rolled back atomically if mid-lock failure occurs

## Key Features

- **Multiplex support** — Theatres → multiple Screens (IMAX/4DX/Standard) → Showtimes
- **Seat layout builder** — Screen stores seat template; Seat docs generated per showtime
- **Geo search** — Find nearby theatres by lat/lng using MongoDB 2dsphere index
- **Multi-language/format** — Shows support language + subtitle + format (2D/3D/IMAX/4DX)
- **Booking snapshot** — Seat labels/prices copied at booking time for immutable tickets
- **Loyalty points** — Earned on confirmation, reversed on cancellation
- **Verified reviews** — Only users with confirmed bookings can review
- **Cancellation policy** — Per-theatre configurable cutoff + refund percentage
- **Redis caching** — Movie, theatre, and showtime data cached with TTL
- **Human-readable booking refs** — `SS-20241225-X7K2`

## Environment Variables

See `.env` file for all required variables.
