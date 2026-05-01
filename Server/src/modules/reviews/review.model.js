import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    movie:   { type: mongoose.Schema.Types.ObjectId, ref: 'Movie',   required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },  // must have watched it

    rating:   { type: Number, required: true, min: 1, max: 5 },
    title:    { type: String, trim: true, maxlength: 150 },
    body:     { type: String, trim: true, maxlength: 2000 },
    isSpoiler:{ type: Boolean, default: false },

    likes:    { type: Number, default: 0 },
    isVisible:{ type: Boolean, default: true },
  },
  { timestamps: true, versionKey: false }
);

// One review per user per movie
reviewSchema.index({ user: 1, movie: 1 }, { unique: true });
reviewSchema.index({ movie: 1, isVisible: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
