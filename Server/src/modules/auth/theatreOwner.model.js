import mongoose from 'mongoose';
import { ACCOUNT_STATUS } from '../../utils/constants.js';

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const theatreInfoSchema = new mongoose.Schema(
    {
        theatreName: { type: String, required: true, trim: true, maxlength: 150 },
        website: { type: String, trim: true, match: /^https?:\/\/.+/ },
        contactPhone: { type: String, trim: true },
        contactEmail: {
            type: String,
            trim: true,
            lowercase: true,
            match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
    },
    { _id: false }
);

const locationSchema = new mongoose.Schema(
    {
        streetAddress: { type: String, required: true, trim: true, maxlength: 200 },
        city: { type: String, required: true, trim: true, maxlength: 100 },
        state: { type: String, required: true, trim: true, maxlength: 100 },
        pincode: { type: String, required: true, trim: true, match: /^\d{4,10}$/ },
    },
    { _id: false }
);

const amenitiesSchema = new mongoose.Schema(
    {
        parking: { type: Boolean, default: false },
        foodCourt: { type: Boolean, default: false },
        wheelchairAccess: { type: Boolean, default: false },
        mTicket: { type: Boolean, default: false },
        threeD: { type: Boolean, default: false },
        dolbySound: { type: Boolean, default: false },
        fourDX: { type: Boolean, default: false },
        reclinerSeats: { type: Boolean, default: false },
        atm: { type: Boolean, default: false },
        playing: { type: Boolean, default: false },
        lounge: { type: Boolean, default: false },
    },
    { _id: false }
);

const cancellationPolicySchema = new mongoose.Schema(
    {
        allowCancellations: { type: Boolean, default: false },
        cutoffHours: {
            type: Number,
            default: 2,
            min: [0, 'Cutoff must be >= 0'],
            max: [720, 'Cutoff cannot exceed 720 hours'],
        },
        refundPercentage: {
            type: Number,
            default: 0,
            min: [0, 'Refund percentage must be >= 0'],
            max: [100, 'Refund percentage cannot exceed 100'],
        },
    },
    { _id: false }
);

// ─── Main schema ──────────────────────────────────────────────────────────────

const theatreOwnerSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: { type: String, required: true, select: false },

        isMultiplex: { type: Boolean, default: false },

        theatreInfo: { type: theatreInfoSchema, required: true },
        location: { type: locationSchema, required: true },
        amenities: { type: amenitiesSchema, default: () => ({}) },
        cancellationPolicy: { type: cancellationPolicySchema, default: () => ({}) },

        accountStatus: {
            type: String,
            enum: Object.values(ACCOUNT_STATUS),
            default: ACCOUNT_STATUS.PENDING,
        },
        rejectionReason: { type: String, trim: true, maxlength: 500, select: false },
        isActive: { type: Boolean, default: true },

        ownedTheatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' },

        resetPasswordTokenHash: { type: String, select: false },
        resetPasswordExpires: { type: Date, select: false },
    },
    { timestamps: true, versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

theatreOwnerSchema.index({ accountStatus: 1 });
theatreOwnerSchema.index({ resetPasswordTokenHash: 1 }, { sparse: true });

// ─── Guards ───────────────────────────────────────────────────────────────────

theatreOwnerSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        const looksHashed = this.password.length >= 60 && this.password.startsWith('$2');
        if (!looksHashed) return next(new Error('Password must be hashed before saving'));
    }
    next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────

theatreOwnerSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        email: this.email,
        isMultiplex: this.isMultiplex,
        theatreInfo: this.theatreInfo,
        location: this.location,
        amenities: this.amenities,
        cancellationPolicy: this.cancellationPolicy,
        accountStatus: this.accountStatus,
        isActive: this.isActive,
        ownedTheatre: this.ownedTheatre,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

export default mongoose.model('TheatreOwner', theatreOwnerSchema);