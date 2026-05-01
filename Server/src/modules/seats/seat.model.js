import mongoose from 'mongoose';
import { SEAT_STATUS, SEAT_TYPES } from '../../utils/constants.js';

/**
 * One Seat document per seat per showtime.
 * Created in bulk when a showtime is published, from Screen.seatLayout.
 */
const seatSchema = new mongoose.Schema(
  {
    showtime:  { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true, index: true },
    screen:    { type: mongoose.Schema.Types.ObjectId, ref: 'Screen',   required: true },
    theatre:   { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre',  required: true },

    row:    { type: String, required: true },   // 'A'
    number: { type: Number, required: true },   // 1
    label:  { type: String, required: true },   // 'A1'
    type:   { type: String, enum: Object.values(SEAT_TYPES), default: SEAT_TYPES.SILVER },

    price:  { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: Object.values(SEAT_STATUS),
      default: SEAT_STATUS.AVAILABLE,
      index: true,
    },

    // Locking
    lockedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lockedUntil: Date,

    // Booking
    bookedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    booking:     { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  },
  { timestamps: true, versionKey: false }
);

seatSchema.index({ showtime: 1, status: 1 });
seatSchema.index({ showtime: 1, row: 1, number: 1 }, { unique: true });

export default mongoose.model('Seat', seatSchema);
