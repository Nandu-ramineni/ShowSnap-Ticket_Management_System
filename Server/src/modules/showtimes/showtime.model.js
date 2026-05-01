import mongoose from 'mongoose';
import { SHOW_STATUS, LANGUAGES } from '../../utils/constants.js';

const pricingOverrideSchema = new mongoose.Schema(
  {
    recliner: Number,
    premium:  Number,
    gold:     Number,
    silver:   Number,
  },
  { _id: false }
);

const showtimeSchema = new mongoose.Schema(
  {
    movie:   { type: mongoose.Schema.Types.ObjectId, ref: 'Movie',   required: true, index: true },
    theatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true, index: true },
    screen:  { type: mongoose.Schema.Types.ObjectId, ref: 'Screen',  required: true },

    startTime:  { type: Date, required: true, index: true },
    endTime:    { type: Date, required: true },        // startTime + movie.duration
    date:       { type: String, required: true },      // 'YYYY-MM-DD' — for fast date-based queries

    language:   { type: String, enum: LANGUAGES, required: true },
    format:     { type: String, enum: ['2D', '3D', 'IMAX', '4DX', 'DOLBY'], default: '2D' },
    subtitles:  { type: String, enum: LANGUAGES.concat(['None']), default: 'None' },

    // Effective pricing for this show (overrides screen defaults if set)
    pricing:    pricingOverrideSchema,

    availableSeats: { type: Number, default: 0 },
    totalSeats:     { type: Number, default: 0 },
    bookedSeats:    { type: Number, default: 0 },
    lockedSeats:    { type: Number, default: 0 },

    status:    { type: String, enum: Object.values(SHOW_STATUS), default: SHOW_STATUS.SCHEDULED },

    // Special flags
    isSpecialScreening: { type: Boolean, default: false },
    isPremiere:         { type: Boolean, default: false },

    // Convenience note shown at booking (e.g. "Bring ID for premiere")
    note: String,
  },
  { timestamps: true, versionKey: false }
);

showtimeSchema.index({ movie: 1, date: 1, status: 1 });
showtimeSchema.index({ theatre: 1, date: 1 });
showtimeSchema.index({ startTime: 1 });

// Prevent double-booking the same screen at overlapping times
showtimeSchema.index({ screen: 1, startTime: 1 }, { unique: true });

export default mongoose.model('Showtime', showtimeSchema);
