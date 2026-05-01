import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { fileURLToPath } from 'url';
import path from 'path';
import env from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: '🎬 SeatSecure API',
      version: '2.0.0',
      description: `
## SeatSecure — BookMyShow-style Movie Ticket Booking API

A production-grade REST API for movie ticket booking with:
- **Multiplex & single-screen theatre** management
- **Screen-level seat layout** (IMAX, 4DX, Dolby, Standard)
- **Distributed seat locking** via Redis (10-min TTL)
- **Stripe payment** processing + webhooks
- **Loyalty points**, **verified reviews**, **geo-search**

### Authentication
All protected endpoints require a **Bearer JWT** token.  
Obtain tokens via \`POST /auth/login\` or \`POST /auth/register\`.

### Booking Flow
\`\`\`
Browse Movies → Pick Showtime → View Seat Map →
Lock Seats → Initiate Booking → Pay (Stripe) →
Webhook Confirms → Ticket Ready
\`\`\`

### Rate Limits
| Scope | Window | Max Requests |
|-------|--------|-------------|
| Global API | 15 min | 100 |
| Auth endpoints | 15 min | 10 |
| Booking / Locking | 1 min | 20 |
      `,
      contact: {
        name: 'SeatSecure Team',
        email: 'dev@seatsecure.com',
        url: 'https://seatsecure.com',
      },
      license: { name: 'MIT' },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}/api/v1`,
        description: 'Local Development',
      },
      {
        url: 'https://api.seatsecure.com/api/v1',
        description: 'Production',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        // ─── Shared primitives ──────────────────────────────────
        MongoId: {
          type: 'string',
          pattern: '^[a-f\\d]{24}$',
          example: '64f1c2e3a1b2c3d4e5f60001',
        },
        Timestamp: {
          type: 'object',
          properties: {
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total:      { type: 'integer', example: 84 },
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 5 },
            hasNext:    { type: 'boolean', example: true },
            hasPrev:    { type: 'boolean', example: false },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string',  example: 'Success' },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success:    { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message:    { type: 'string',  example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field:   { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Invalid email format' },
                },
              },
            },
          },
        },

        // ─── User ───────────────────────────────────────────────
        UserPublic: {
          type: 'object',
          properties: {
            id:            { $ref: '#/components/schemas/MongoId' },
            name:          { type: 'string',  example: 'Priya Sharma' },
            email:         { type: 'string',  example: 'priya@example.com' },
            phone:         { type: 'string',  example: '+919876543210' },
            role:          { type: 'string',  enum: ['user', 'admin', 'theatre_owner'], example: 'user' },
            preferredCity: { type: 'string',  example: 'Mumbai' },
            loyaltyPoints: { type: 'integer', example: 120 },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name:     { type: 'string', example: 'Priya Sharma' },
            email:    { type: 'string', format: 'email', example: 'priya@example.com' },
            phone:    { type: 'string', example: '+919876543210' },
            password: { type: 'string', minLength: 8, example: 'SecurePass1' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email:    { type: 'string', format: 'email', example: 'priya@example.com' },
            password: { type: 'string', example: 'SecurePass1' },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            user:         { $ref: '#/components/schemas/UserPublic' },
            accessToken:  { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          },
        },

        // ─── Movie ──────────────────────────────────────────────
        Movie: {
          type: 'object',
          properties: {
            _id:           { $ref: '#/components/schemas/MongoId' },
            title:         { type: 'string',  example: 'Interstellar 2' },
            slug:          { type: 'string',  example: 'interstellar-2' },
            description:   { type: 'string',  example: 'A sequel to the epic space odyssey.' },
            duration:      { type: 'integer', example: 169, description: 'Runtime in minutes' },
            releaseDate:   { type: 'string',  format: 'date', example: '2024-11-15' },
            language:      { type: 'string',  example: 'English' },
            languages:     { type: 'array', items: { type: 'string' }, example: ['English', 'Hindi'] },
            genres:        { type: 'array', items: { type: 'string' }, example: ['Sci-Fi', 'Drama'] },
            certification: { type: 'string',  enum: ['U', 'UA', 'A', 'S'], example: 'UA' },
            cast: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name:     { type: 'string',  example: 'Matthew McConaughey' },
                  role:     { type: 'string',  example: 'Lead' },
                  imageUrl: { type: 'string',  example: 'https://cdn.seatsecure.com/cast/mm.jpg' },
                },
              },
            },
            posterUrl:    { type: 'string', example: 'https://cdn.seatsecure.com/posters/interstellar2.jpg' },
            bannerUrl:    { type: 'string', example: 'https://cdn.seatsecure.com/banners/interstellar2.jpg' },
            trailerUrl:   { type: 'string', example: 'https://youtube.com/watch?v=abc123' },
            imdbRating:   { type: 'number', example: 8.7 },
            appRating:    { type: 'number', example: 4.5 },
            totalRatings: { type: 'integer', example: 1240 },
            format:       { type: 'array', items: { type: 'string' }, example: ['2D', '3D', 'IMAX'] },
            isFeatured:   { type: 'boolean', example: true },
            isComingSoon: { type: 'boolean', example: false },
          },
        },
        CreateMovieRequest: {
          type: 'object',
          required: ['title', 'duration', 'releaseDate', 'language'],
          properties: {
            title:         { type: 'string',  example: 'Interstellar 2' },
            description:   { type: 'string' },
            duration:      { type: 'integer', example: 169 },
            releaseDate:   { type: 'string',  format: 'date', example: '2024-11-15' },
            language:      { type: 'string',  example: 'English' },
            languages:     { type: 'array',   items: { type: 'string' } },
            genres:        { type: 'array',   items: { type: 'string' } },
            certification: { type: 'string',  enum: ['U', 'UA', 'A', 'S'] },
            cast:          { type: 'array',   items: { type: 'object' } },
            posterUrl:     { type: 'string' },
            bannerUrl:     { type: 'string' },
            trailerUrl:    { type: 'string' },
            imdbRating:    { type: 'number' },
            format:        { type: 'array',   items: { type: 'string' } },
            isFeatured:    { type: 'boolean' },
            isComingSoon:  { type: 'boolean' },
            tags:          { type: 'array',   items: { type: 'string' } },
          },
        },

        // ─── Theatre ────────────────────────────────────────────
        Location: {
          type: 'object',
          required: ['address', 'city', 'state', 'pincode'],
          properties: {
            address:  { type: 'string',  example: '4th Floor, Phoenix Mills, Lower Parel' },
            city:     { type: 'string',  example: 'Mumbai' },
            state:    { type: 'string',  example: 'Maharashtra' },
            pincode:  { type: 'string',  example: '400013' },
            country:  { type: 'string',  example: 'India' },
            landmark: { type: 'string',  example: 'Near Phoenix Mall' },
            coordinates: {
              type: 'object',
              properties: {
                type:        { type: 'string', example: 'Point' },
                coordinates: { type: 'array', items: { type: 'number' }, example: [72.8258, 18.9947] },
              },
            },
          },
        },
        Theatre: {
          type: 'object',
          properties: {
            _id:          { $ref: '#/components/schemas/MongoId' },
            name:         { type: 'string',  example: 'PVR Phoenix Lower Parel' },
            slug:         { type: 'string',  example: 'pvr-phoenix-lower-parel' },
            isMultiplex:  { type: 'boolean', example: true },
            chainName:    { type: 'string',  example: 'PVR' },
            location:     { $ref: '#/components/schemas/Location' },
            totalScreens: { type: 'integer', example: 8 },
            amenities: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name:      { type: 'string',  example: 'Parking' },
                  available: { type: 'boolean', example: true },
                },
              },
            },
            cancellationPolicy: {
              type: 'object',
              properties: {
                allowed:          { type: 'boolean', example: true },
                cutoffHours:      { type: 'integer', example: 2 },
                refundPercentage: { type: 'integer', example: 100 },
              },
            },
            appRating:    { type: 'number',  example: 4.3 },
            isVerified:   { type: 'boolean', example: true },
          },
        },
        CreateTheatreRequest: {
          type: 'object',
          required: ['name', 'location'],
          properties: {
            name:        { type: 'string',  example: 'PVR Phoenix Lower Parel' },
            isMultiplex: { type: 'boolean', example: true },
            chainName:   { type: 'string',  example: 'PVR' },
            location:    { $ref: '#/components/schemas/Location' },
            amenities:   { type: 'array', items: { type: 'object' } },
            contactPhone:{ type: 'string', example: '+912224969999' },
            contactEmail:{ type: 'string', example: 'pvr.phoenix@pvr.in' },
            cancellationPolicy: { type: 'object' },
          },
        },

        // ─── Screen ─────────────────────────────────────────────
        SeatTemplate: {
          type: 'object',
          properties: {
            row:       { type: 'string',  example: 'A' },
            number:    { type: 'integer', example: 1 },
            label:     { type: 'string',  example: 'A1' },
            type:      { type: 'string',  enum: ['recliner', 'premium', 'gold', 'silver'], example: 'gold' },
            isBlocked: { type: 'boolean', example: false },
            x:         { type: 'integer', example: 0 },
            y:         { type: 'integer', example: 0 },
          },
        },
        Screen: {
          type: 'object',
          properties: {
            _id:         { $ref: '#/components/schemas/MongoId' },
            theatre:     { $ref: '#/components/schemas/MongoId' },
            name:        { type: 'string',  example: 'Screen 1 — IMAX' },
            screenType:  { type: 'string',  enum: ['IMAX', '4DX', 'DOLBY', 'STANDARD', 'DRIVE_IN'], example: 'IMAX' },
            totalSeats:  { type: 'integer', example: 250 },
            pricing: {
              type: 'object',
              properties: {
                recliner: { type: 'integer', example: 60000 },
                premium:  { type: 'integer', example: 45000 },
                gold:     { type: 'integer', example: 35000 },
                silver:   { type: 'integer', example: 25000 },
              },
              description: 'Prices in paise (₹250 = 25000)',
            },
            soundSystem:    { type: 'string', example: 'Dolby Atmos' },
            projectionType: { type: 'string', example: 'IMAX Laser' },
          },
        },
        CreateScreenRequest: {
          type: 'object',
          required: ['name', 'screenType', 'seatLayout', 'pricing'],
          properties: {
            name:        { type: 'string', example: 'Screen 1 — IMAX' },
            screenType:  { type: 'string', enum: ['IMAX', '4DX', 'DOLBY', 'STANDARD', 'DRIVE_IN'] },
            seatLayout:  { type: 'array', items: { $ref: '#/components/schemas/SeatTemplate' } },
            pricing: {
              type: 'object',
              properties: {
                recliner: { type: 'integer' },
                premium:  { type: 'integer' },
                gold:     { type: 'integer' },
                silver:   { type: 'integer' },
              },
            },
            soundSystem:    { type: 'string' },
            projectionType: { type: 'string' },
          },
        },
        SeatLayoutResponse: {
          type: 'object',
          properties: {
            screen: {
              type: 'object',
              properties: {
                name:       { type: 'string', example: 'Screen 1' },
                type:       { type: 'string', example: 'IMAX' },
                pricing:    { type: 'object' },
              },
            },
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row:   { type: 'string', example: 'A' },
                  seats: { type: 'array', items: { $ref: '#/components/schemas/SeatTemplate' } },
                },
              },
            },
          },
        },

        // ─── Showtime ────────────────────────────────────────────
        Showtime: {
          type: 'object',
          properties: {
            _id:            { $ref: '#/components/schemas/MongoId' },
            movie:          { $ref: '#/components/schemas/MongoId' },
            theatre:        { $ref: '#/components/schemas/MongoId' },
            screen:         { $ref: '#/components/schemas/MongoId' },
            startTime:      { type: 'string', format: 'date-time', example: '2024-12-25T14:30:00.000Z' },
            endTime:        { type: 'string', format: 'date-time', example: '2024-12-25T17:19:00.000Z' },
            date:           { type: 'string', example: '2024-12-25' },
            language:       { type: 'string', example: 'English' },
            format:         { type: 'string', enum: ['2D', '3D', 'IMAX', '4DX', 'DOLBY'], example: 'IMAX' },
            subtitles:      { type: 'string', example: 'None' },
            availableSeats: { type: 'integer', example: 187 },
            totalSeats:     { type: 'integer', example: 250 },
            pricing: {
              type: 'object',
              properties: {
                recliner: { type: 'integer', example: 70000 },
                premium:  { type: 'integer', example: 50000 },
                gold:     { type: 'integer', example: 40000 },
                silver:   { type: 'integer', example: 30000 },
              },
            },
            status:    { type: 'string', enum: ['scheduled', 'cancelled', 'housefull'], example: 'scheduled' },
            isPremiere:{ type: 'boolean', example: false },
          },
        },
        CreateShowtimeRequest: {
          type: 'object',
          required: ['movie', 'theatre', 'screen', 'startTime', 'language'],
          properties: {
            movie:     { $ref: '#/components/schemas/MongoId' },
            theatre:   { $ref: '#/components/schemas/MongoId' },
            screen:    { $ref: '#/components/schemas/MongoId' },
            startTime: { type: 'string', format: 'date-time', example: '2024-12-25T14:30:00.000Z' },
            language:  { type: 'string', example: 'English' },
            format:    { type: 'string', enum: ['2D', '3D', 'IMAX', '4DX', 'DOLBY'], example: 'IMAX' },
            subtitles: { type: 'string', example: 'None' },
            pricing: {
              type: 'object',
              description: 'Override screen pricing for this show (optional)',
              properties: {
                recliner: { type: 'integer' },
                premium:  { type: 'integer' },
                gold:     { type: 'integer' },
                silver:   { type: 'integer' },
              },
            },
            isPremiere: { type: 'boolean' },
            note:       { type: 'string', example: 'Bring valid ID for premiere entry' },
          },
        },
        ShowtimesGroupedResponse: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              theatre: { $ref: '#/components/schemas/Theatre' },
              shows: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    _id:            { $ref: '#/components/schemas/MongoId' },
                    screen:         { $ref: '#/components/schemas/Screen' },
                    startTime:      { type: 'string', format: 'date-time' },
                    language:       { type: 'string' },
                    format:         { type: 'string' },
                    availableSeats: { type: 'integer' },
                    pricing:        { type: 'object' },
                    status:         { type: 'string' },
                  },
                },
              },
            },
          },
        },

        // ─── Seat ────────────────────────────────────────────────
        Seat: {
          type: 'object',
          properties: {
            _id:    { $ref: '#/components/schemas/MongoId' },
            row:    { type: 'string',  example: 'D' },
            number: { type: 'integer', example: 7 },
            label:  { type: 'string',  example: 'D7' },
            type:   { type: 'string',  enum: ['recliner', 'premium', 'gold', 'silver'], example: 'gold' },
            price:  { type: 'integer', example: 40000, description: 'Price in paise' },
            status: { type: 'string',  enum: ['available', 'locked', 'booked', 'blocked'], example: 'available' },
          },
        },
        SeatMapResponse: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row:   { type: 'string', example: 'D' },
                  seats: { type: 'array', items: { $ref: '#/components/schemas/Seat' } },
                },
              },
            },
          },
        },
        LockSeatsRequest: {
          type: 'object',
          required: ['seatIds'],
          properties: {
            seatIds: {
              type: 'array',
              items: { $ref: '#/components/schemas/MongoId' },
              minItems: 1,
              maxItems: 8,
              example: ['64f1c2e3a1b2c3d4e5f60001', '64f1c2e3a1b2c3d4e5f60002'],
            },
          },
        },
        LockSeatsResponse: {
          type: 'object',
          properties: {
            lockValue:   { type: 'string',  example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
            lockedUntil: { type: 'string',  format: 'date-time' },
            seats: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:    { $ref: '#/components/schemas/MongoId' },
                  label: { type: 'string',  example: 'D7' },
                  type:  { type: 'string',  example: 'gold' },
                  price: { type: 'integer', example: 40000 },
                },
              },
            },
            total: { type: 'integer', example: 80000, description: 'Total in paise' },
          },
        },

        // ─── Booking ─────────────────────────────────────────────
        Booking: {
          type: 'object',
          properties: {
            _id:          { $ref: '#/components/schemas/MongoId' },
            bookingRef:   { type: 'string',  example: 'SS-20241225-X7K2' },
            movie:        { $ref: '#/components/schemas/Movie' },
            theatre:      { $ref: '#/components/schemas/Theatre' },
            showtime:     { $ref: '#/components/schemas/Showtime' },
            seatSnapshot: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string',  example: 'D7' },
                  type:  { type: 'string',  example: 'gold' },
                  price: { type: 'integer', example: 40000 },
                },
              },
            },
            subtotal:       { type: 'integer', example: 80000 },
            convenienceFee: { type: 'integer', example: 1600 },
            taxes:          { type: 'integer', example: 14688 },
            totalAmount:    { type: 'integer', example: 96288 },
            currency:       { type: 'string',  example: 'INR' },
            status:         { type: 'string',  enum: ['pending', 'confirmed', 'cancelled', 'refunded'] },
            paymentStatus:  { type: 'string',  enum: ['pending', 'succeeded', 'failed', 'refunded'] },
            loyaltyEarned:  { type: 'integer', example: 9 },
            meta: {
              type: 'object',
              properties: {
                movieTitle:  { type: 'string', example: 'Interstellar 2' },
                theatreName: { type: 'string', example: 'PVR Phoenix Lower Parel' },
                showDate:    { type: 'string', example: '2024-12-25' },
                showTime:    { type: 'string', example: '02:30 PM' },
                screenName:  { type: 'string', example: 'Screen 1 — IMAX' },
                language:    { type: 'string', example: 'English' },
                format:      { type: 'string', example: 'IMAX' },
              },
            },
            confirmedAt: { type: 'string', format: 'date-time' },
          },
        },
        InitiateBookingRequest: {
          type: 'object',
          required: ['showtimeId', 'seatIds'],
          properties: {
            showtimeId: { $ref: '#/components/schemas/MongoId' },
            seatIds: {
              type: 'array',
              items: { $ref: '#/components/schemas/MongoId' },
              example: ['64f1c2e3a1b2c3d4e5f60001', '64f1c2e3a1b2c3d4e5f60002'],
            },
            couponCode: { type: 'string', example: 'FIRST100' },
          },
        },
        InitiateBookingResponse: {
          type: 'object',
          properties: {
            booking:      { $ref: '#/components/schemas/Booking' },
            clientSecret: {
              type: 'string',
              example: 'pi_3OZ1234AbCd5678_secret_XYZ',
              description: 'Stripe PaymentIntent client secret — pass to stripe.confirmPayment() on frontend',
            },
          },
        },

        // ─── Review ──────────────────────────────────────────────
        Review: {
          type: 'object',
          properties: {
            _id:       { $ref: '#/components/schemas/MongoId' },
            user: {
              type: 'object',
              properties: {
                name:   { type: 'string',  example: 'Priya Sharma' },
                avatar: { type: 'string' },
              },
            },
            rating:    { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            title:     { type: 'string',  example: 'Stunning visuals, gripping story' },
            body:      { type: 'string',  example: 'A worthy sequel. The IMAX sequences were breathtaking.' },
            isSpoiler: { type: 'boolean', example: false },
            likes:     { type: 'integer', example: 42 },
            createdAt: { type: 'string',  format: 'date-time' },
          },
        },
        CreateReviewRequest: {
          type: 'object',
          required: ['bookingId', 'rating'],
          properties: {
            bookingId:  { $ref: '#/components/schemas/MongoId' },
            rating:     { type: 'integer', minimum: 1, maximum: 5, example: 4 },
            title:      { type: 'string',  example: 'Stunning visuals' },
            body:       { type: 'string',  example: 'A worthy sequel.' },
            isSpoiler:  { type: 'boolean', example: false },
          },
        },
      },

      // ─── Reusable responses ───────────────────────────────────
      responses: {
        Unauthorized: {
          description: 'Missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, statusCode: 401, message: 'Unauthorized', errors: [] },
            },
          },
        },
        Forbidden: {
          description: 'Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, statusCode: 403, message: 'Forbidden', errors: [] },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: { success: false, statusCode: 404, message: 'Not found', errors: [] },
            },
          },
        },
        Conflict: {
          description: 'Conflict — duplicate or unavailable resource',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },

      // ─── Reusable parameters ─────────────────────────────────
      parameters: {
        PageParam: {
          in: 'query', name: 'page', schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Page number',
        },
        LimitParam: {
          in: 'query', name: 'limit', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          description: 'Items per page',
        },
        MongoIdPath: {
          in: 'path', name: 'id', required: true, schema: { $ref: '#/components/schemas/MongoId' },
          description: 'MongoDB document ID',
        },
      },
    },

    security: [],  // Default: no auth. Individual routes specify security as needed.
    tags: [
      { name: 'Auth',       description: 'Registration, login, token management, profile' },
      { name: 'Movies',     description: 'Movie catalogue, search, availability' },
      { name: 'Theatres',   description: 'Theatre management, geo search, screen listing' },
      { name: 'Screens',    description: 'Screen & seat layout management' },
      { name: 'Showtimes',  description: 'Show scheduling and browsing' },
      { name: 'Seats',      description: 'Real-time seat map, distributed locking' },
      { name: 'Bookings',   description: 'Booking lifecycle and ticket retrieval' },
      { name: 'Reviews',    description: 'Verified movie reviews and ratings' },
      { name: 'Payments',   description: 'Stripe webhook handler' },
      { name: 'System',     description: 'Health check' },
    ],
  },

  // Point jsdoc scanner at all route files
  apis: [
    path.join(__dirname, '../modules/*/*.routes.js'),
    path.join(__dirname, '../modules/payments/payment.webhook.js'),
    path.join(__dirname, '../routes.js'),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  const uiOptions = {
    customSiteTitle: '🎬 SeatSecure API Docs',
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::after { content: '🎬 SeatSecure API v2'; color: #e94560; font-size: 1.2rem; font-weight: bold; }
      .swagger-ui .info .title { color: #1a1a2e; }
      .swagger-ui .btn.authorize { background-color: #e94560; border-color: #e94560; }
      .swagger-ui .opblock.opblock-get    .opblock-summary-method { background: #2e86de; }
      .swagger-ui .opblock.opblock-post   .opblock-summary-method { background: #27ae60; }
      .swagger-ui .opblock.opblock-put    .opblock-summary-method { background: #e67e22; }
      .swagger-ui .opblock.opblock-patch  .opblock-summary-method { background: #8e44ad; }
      .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #c0392b; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      docExpansion: 'none',
      defaultModelsExpandDepth: 2,
    },
  };

  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, uiOptions));

  // Serve raw spec as JSON (useful for Postman/Insomnia import)
  app.get('/api/v1/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};
