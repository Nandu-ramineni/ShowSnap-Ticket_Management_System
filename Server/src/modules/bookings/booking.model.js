import mongoose from 'mongoose';
import { BOOKING_STATUS, PAYMENT_STATUS } from '../../utils/constants.js';

const bookingSchema = new mongoose.Schema(
  {
    bookingRef: { type: String, unique: true },  // Human-readable: SS-20240101-ABCD

    user:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',     required: true, index: true },
    movie:     { type: mongoose.Schema.Types.ObjectId, ref: 'Movie',    required: true },
    theatre:   { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre',  required: true },
    screen:    { type: mongoose.Schema.Types.ObjectId, ref: 'Screen',   required: true },
    showtime:  { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true, index: true },
    seats:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }],

    // Snapshot of seat labels at booking time (avoids populate for tickets)
    seatSnapshot: [
      {
        label:  String,
        type:   String,
        price:  Number,
      },
    ],

    subtotal:      { type: Number, required: true },
    convenienceFee: { type: Number, default: 0 },
    taxes:         { type: Number, default: 0 },
    totalAmount:   { type: Number, required: true },
    currency:      { type: String, default: 'INR' },

    // Applied coupon / loyalty
    couponCode:     String,
    discountAmount: { type: Number, default: 0 },
    loyaltyUsed:    { type: Number, default: 0 },
    loyaltyEarned:  { type: Number, default: 0 },

    status:        { type: String, enum: Object.values(BOOKING_STATUS), default: BOOKING_STATUS.PENDING, index: true },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },

    stripePaymentIntentId: { type: String, sparse: true, index: true },
    stripeClientSecret:    String,

    refundId:       String,
    refundedAmount: Number,

    confirmedAt:   Date,
    cancelledAt:   Date,

    // QR code data (generated on confirmation)
    qrCode: String,

    // Metadata snapshot for record-keeping
    meta: {
      movieTitle:    String,
      theatreName:   String,
      showDate:      String,
      showTime:      String,
      screenName:    String,
      language:      String,
      format:        String,
    },
  },
  { timestamps: true, versionKey: false }
);

// Generate human-readable booking ref pre-save
bookingSchema.pre('save', function (next) {
  if (this.isNew && !this.bookingRef) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.bookingRef = `SS-${date}-${rand}`;
  }
  next();
});

export default mongoose.model('Booking', bookingSchema);
