import mongoose from 'mongoose';
import { ACCOUNT_STATUS, ONBOARDING_STATUS } from '../../utils/constants.js';


const SUPPORTED_DOC_TYPES = [
    'gst_certificate',        // GST registration certificate (mandatory for tax)
    'business_registration',  // Company/LLP/Partnership registration
    'trade_license',          // Municipal trade licence
    'pan_card',               // PAN of the entity
    'identity_proof',         // Aadhaar / Passport of authorised signatory
    'address_proof',          // Utility bill / Bank statement for registered address
    'noc',                    // No-Objection Certificate (fire / local body)
    'other',                  // Any additional document
];

const supportingDocumentSchema = new mongoose.Schema(
    {
        docType: {
            type: String,
            required: true,
            enum: SUPPORTED_DOC_TYPES,
        },
        // Cloudinary secure_url
        url: { type: String, required: true },
        // Cloudinary public_id — needed for deletion/replacement
        publicId: { type: String, required: true, select: false },
        // Original filename — shown in admin review panel
        fileName: { type: String, trim: true },
        // File size in bytes — stored for audit
        fileSize: { type: Number },
        uploadedAt: { type: Date, default: Date.now },
    },
    { _id: true }   // keep _id so individual docs can be addressed by ID
);

// ─── Theatre info sub-schema ──────────────────────────────────────────────────

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

// ─── Location sub-schema ──────────────────────────────────────────────────────

const locationSchema = new mongoose.Schema(
    {
        streetAddress: { type: String, trim: true, maxlength: 200 },
        city: { type: String, trim: true, maxlength: 100 },
        state: { type: String, trim: true, maxlength: 100 },
        pincode: { type: String, trim: true, match: /^\d{4,10}$/ },
    },
    { _id: false }
);

// ─── Amenities sub-schema ─────────────────────────────────────────────────────

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

// ─── Cancellation policy sub-schema ──────────────────────────────────────────

const cancellationPolicySchema = new mongoose.Schema(
    {
        allowCancellations: { type: Boolean, default: false },
        // Hours before showtime within which cancellation is allowed
        cutoffHours: {
            type: Number,
            default: 2,
            min: [0, 'Cutoff must be >= 0'],
            max: [720, 'Cutoff cannot exceed 720 hours'],
        },
        // Percentage of ticket price refunded on cancellation (0–100)
        refundPercentage: {
            type: Number,
            default: 0,
            min: [0, 'Refund percentage must be >= 0'],
            max: [100, 'Refund percentage cannot exceed 100'],
        },
    },
    { _id: false }
);

const resetPasswordSchema = new mongoose.Schema({
    passwordResetToken: {
        type: String,
        select: false
    },
    passwordResetTokenExpires: {
        type: Date,
        select: false
    },
    passwordResetOTP: {
        type: String,
        select: false
    },
    passwordResetOTPExpires: {
        type: Date,
        select: false
    }
}, { _id: false })

const tractionSchema = new mongoose.Schema({
    lastLogin: {
        type: Date
    },
    loginCounts: {
        type: Number,
        default: 0
    },
    ipAddresses: {
        type: [String]
    },
    lastLocation: {
        city: String,
        region: String,
        country: String
    },
    activeLogins: {
        type: Number,
        default: 0
    }
}, { _id: false })

// ─── Main schema ──────────────────────────────────────────────────────────────

const theatreOwnerSchema = new mongoose.Schema(
    {
        // ── Step 1: Registration fields (required at signup) ─────────────────────
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        password: { type: String, required: true, select: false },

        // Owner's full name — captured at registration, editable during onboarding
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        // Documents uploaded at registration (Cloudinary references)
        // At least one doc is required at registration (enforced at service layer)
        supportingDocuments: {
            type: [supportingDocumentSchema],
            default: [],
        },

        //Step 2 : Assign Registration ID
        applicationId: {
            type: String,
            unique: true,
            required: true,
            index: true,
        },

        // ── Step 3: Onboarding fields (filled post-approval via /onboarding) ─────
        // None of these are required at the Mongoose level — the service layer
        // checks completeness and flips onboardingStatus to 'completed'.

        isMultiplex: { type: Boolean, default: false },

        // theatreInfo.theatreName is required for onboarding completion
        theatreInfo: { type: theatreInfoSchema, default: () => ({}) },
        location: { type: locationSchema, default: () => ({}) },
        amenities: { type: amenitiesSchema, default: () => ({}) },
        cancellationPolicy: { type: cancellationPolicySchema, default: () => ({}) },

        // ── Account lifecycle ─────────────────────────────────────────────────────
        accountStatus: {
            type: String,
            enum: Object.values(ACCOUNT_STATUS),
            default: ACCOUNT_STATUS.PENDING,
            index: true,
        },
        rejectionReason: { type: String, trim: true, maxlength: 500, select: false },

        // Soft suspend — admin can flip this independently of accountStatus
        isActive: { type: Boolean, default: true },

        // ── Onboarding lifecycle ──────────────────────────────────────────────────
        onboardingStatus: {
            type: String,
            enum: Object.values(ONBOARDING_STATUS),
            default: ONBOARDING_STATUS.PENDING_ONBOARDING,
            index: true,
        },

        // ── Link to Theatre document (created after onboarding completes) ─────────
        ownedTheatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' },

        // password reset flow
        resetPassword: {
            type: resetPasswordSchema,
            default: () => ({}) 
        },

        //traction flow
        traction: {
            type: tractionSchema,
            default: () => ({}) 
        }

    },
    { timestamps: true, versionKey: false }
);

// ─── Compound indexes ─────────────────────────────────────────────────────────

// Admin dashboard: filter by status + sort by createdAt
theatreOwnerSchema.index({ accountStatus: 1, createdAt: 1 });
theatreOwnerSchema.index({ onboardingStatus: 1 });
theatreOwnerSchema.index({ 'resetPassword.passwordResetToken': 1 }, { sparse: true });

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Fields required for onboarding to be considered complete
const ONBOARDING_REQUIRED_FIELDS = {
    // theatreInfo
    'theatreInfo.theatreName': (o) => !!o.theatreInfo?.theatreName,
    'theatreInfo.contactPhone': (o) => !!o.theatreInfo?.contactPhone,
    'theatreInfo.contactEmail': (o) => !!o.theatreInfo?.contactEmail,
    // location
    'location.streetAddress': (o) => !!o.location?.streetAddress,
    'location.city': (o) => !!o.location?.city,
    'location.state': (o) => !!o.location?.state,
    'location.pincode': (o) => !!o.location?.pincode,
};

theatreOwnerSchema.methods.isOnboardingComplete = function () {
    return Object.values(ONBOARDING_REQUIRED_FIELDS).every((check) => check(this));
};


// ─── Pre-save guard ───────────────────────────────────────────────────────────

theatreOwnerSchema.pre('save', function (next) {
    if (this.isModified('password')) {
        const looksHashed = this.password.length >= 60 && this.password.startsWith('$2');
        if (!looksHashed) return next(new Error('Password must be hashed before saving'));
    }
    next();
});

// ─── Public serialisation ─────────────────────────────────────────────────────

theatreOwnerSchema.methods.toPublicJSON = function () {
    return {
        id: this._id,
        email: this.email,
        name: this.name,
        applicationId: this.applicationId,
        // Documents — return metadata only, never publicId
        supportingDocuments: (this.supportingDocuments || []).map((d) => ({
            id: d._id,
            docType: d.docType,
            url: d.url,
            fileName: d.fileName,
            fileSize: d.fileSize,
            uploadedAt: d.uploadedAt,
        })),
        isMultiplex: this.isMultiplex,
        theatreInfo: this.theatreInfo,
        location: this.location,
        amenities: this.amenities,
        cancellationPolicy: this.cancellationPolicy,
        accountStatus: this.accountStatus,
        rejectionReason: this.rejectionReason,
        onboardingStatus: this.onboardingStatus,
        isActive: this.isActive,
        ownedTheatre: this.ownedTheatre,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};

export { SUPPORTED_DOC_TYPES };
export default mongoose.model('TheatreOwner', theatreOwnerSchema);