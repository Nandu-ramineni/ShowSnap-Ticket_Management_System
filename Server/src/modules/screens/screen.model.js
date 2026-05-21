import mongoose from 'mongoose';
import { SCREEN_TYPES, SEAT_TYPES } from '../../utils/constants.js';

/**
 * Seat layout template stored on the screen.
 * Each seat in the layout is a "template" — actual Seat documents
 * are created per showtime from this layout.
 */
const seatTemplateSchema = new mongoose.Schema(
  {
    row:       { type: String, required: true },   // 'A', 'B', 'C' ...
    number:    { type: Number, required: true },   // 1, 2, 3 ...
    label:     { type: String, required: true },   // 'A1', 'A2' ...
    type:      { type: String, enum: Object.values(SEAT_TYPES), default: SEAT_TYPES.SILVER },
    isBlocked: { type: Boolean, default: false },  // permanently blocked (aisle, broken)
    // Position for seat map rendering
    x: Number,
    y: Number,
  },
  { _id: false }
);

const screenSchema = new mongoose.Schema(
  {
    theatre:     { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true, index: true },
    name:        { type: String, required: true, trim: true },  // 'Screen 1', 'Audi 3', 'IMAX Hall'
    screenType:  { type: String, enum: Object.values(SCREEN_TYPES), default: SCREEN_TYPES.STANDARD },

    // Seat layout
    seatLayout:    [seatTemplateSchema],
    totalSeats:    { type: Number, default: 0 },

    // Pricing per seat type (base price; showtimes can override)
    pricing: {
      recliner: { type: Number, default: 0 },
      premium:  { type: Number, default: 0 },
      gold:     { type: Number, default: 0 },
      silver:   { type: Number, default: 0 },
    },

    // Screen specs
    soundSystem:     { type: String },   // 'Dolby Atmos', 'DTS:X'
    projectionType:  { type: String },   // '4K Laser', 'IMAX Xenon'

    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// Auto-update totalSeats & theatre.totalScreens
screenSchema.pre('save', function (next) {
  if (this.isModified('seatLayout')) {
    // Validate seat layout integrity
    const labels = new Set();
    const rowMap = {};

    for (const seat of this.seatLayout) {
      // Check for duplicates
      if (labels.has(seat.label)) {
        throw new Error(`Duplicate seat label: ${seat.label}`);
      }
      labels.add(seat.label);

      // Validate row format (A-Z)
      if (!/^[A-Z]$/.test(seat.row)) {
        throw new Error(`Invalid row format: ${seat.row}. Rows must be A-Z.`);
      }

      // Track seats per row
      if (!rowMap[seat.row]) rowMap[seat.row] = [];
      rowMap[seat.row].push(seat.number);
    }

    // Validate seat numbering per row is sequential
    for (const [row, numbers] of Object.entries(rowMap)) {
      const sorted = numbers.sort((a, b) => a - b);
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i] !== i + 1) {
          throw new Error(`Row ${row}: seat numbers must be sequential starting from 1`);
        }
      }
    }

    // Update total seats count (exclude blocked seats)
    this.totalSeats = this.seatLayout.filter((s) => !s.isBlocked).length;
  }
  next();
});

export default mongoose.model('Screen', screenSchema);
