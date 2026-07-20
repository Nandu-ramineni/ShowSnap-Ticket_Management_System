import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    landmark: String,
    // No `default: 'Point'` on purpose — coordinates are optional (neither this
    // endpoint nor the theatre-owner onboarding flow collects lat/lng today).
    // With a default, Mongoose still builds { type: 'Point', coordinates: [] }
    // even when this whole field is never touched, and MongoDB's 2dsphere index
    // rejects that as an invalid GeoJSON Point at insert time — this used to
    // crash creation for every theatre with no coordinates, both here and via
    // the onboarding flow (see theatre.service.js#createTheatreForOwner).
    coordinates: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number], default: undefined },    // [lng, lat]
    },
  },
  { _id: false }
);

const amenitySchema = new mongoose.Schema(
  {
    name: String,  // 'Parking', 'Food Court', 'Wheelchair Access', 'M-Ticket'
    available: { type: Boolean, default: true },
  },
  { _id: false }
);

const theatreSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, lowercase: true },
    isMultiplex: { type: Boolean, default: false },
    chainName: String,   // 'PVR', 'INOX', 'Cinépolis', null for standalone
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TheatreOwner',
      required: true,
    },

    location: { type: locationSchema, required: true },
    amenities: [amenitySchema],

    // Aggregated from screens
    totalScreens: { type: Number, default: 0 },

    contactPhone: String,
    contactEmail: String,
    website: String,

    imageUrl: String,
    images: [String],

    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },  // verified by admin

    // Cancellation policy
    cancellationPolicy: {
      allowed: { type: Boolean, default: true },
      cutoffHours: { type: Number, default: 2 },    // hours before show
      refundPercentage: { type: Number, default: 100 },
    },

    appRating: { type: Number, min: 0, max: 5, default: 0 },
    totalRatings: { type: Number, default: 0 },
  },
  { timestamps: true, versionKey: false }
);

theatreSchema.index({ 'location.city': 1, isActive: 1 });
theatreSchema.index({ 'location.coordinates': '2dsphere' });
theatreSchema.index({ name: 'text', chainName: 'text' });

export default mongoose.model('Theatre', theatreSchema);
