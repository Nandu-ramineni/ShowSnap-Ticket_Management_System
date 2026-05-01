import mongoose from 'mongoose';
import { GENRES, LANGUAGES } from '../../utils/constants.js';

const movieSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, trim: true, maxlength: 200 },
    slug:         { type: String, unique: true, lowercase: true },
    description:  { type: String, trim: true, maxlength: 3000 },
    duration:     { type: Number, required: true, min: 1 },  // minutes
    releaseDate:  { type: Date, required: true },
    language:     { type: String, enum: LANGUAGES, required: true },
    languages:    [{ type: String, enum: LANGUAGES }],       // all available dubs
    genres:       [{ type: String, enum: GENRES }],
    certification: { type: String, enum: ['U', 'UA', 'A', 'S'], default: 'UA' },

    cast: [
      {
        name:      { type: String, required: true },
        role:      { type: String },                          // 'Director','Lead','Supporting'
        imageUrl:  String,
      },
    ],

    // Media
    posterUrl:    String,
    bannerUrl:    String,
    trailerUrl:   String,
    photos:       [String],

    // Ratings
    imdbRating:   { type: Number, min: 0, max: 10 },
    appRating:    { type: Number, min: 0, max: 5, default: 0 },
    totalRatings: { type: Number, default: 0 },

    // Distribution
    studio:        String,
    distributor:   String,
    format:        [{ type: String, enum: ['2D', '3D', 'IMAX', '4DX', 'DOLBY'] }],

    isActive:      { type: Boolean, default: true },
    isComingSoon:  { type: Boolean, default: false },
    isFeatured:    { type: Boolean, default: false },

    // SEO / search
    tags:          [String],
  },
  { timestamps: true, versionKey: false }
);

movieSchema.index({ title: 'text', description: 'text', tags: 'text' });
movieSchema.index({ releaseDate: -1, isActive: 1 });
movieSchema.index({ genres: 1 });
movieSchema.index({ language: 1 });

export default mongoose.model('Movie', movieSchema);
