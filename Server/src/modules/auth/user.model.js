import mongoose from 'mongoose';
import { ROLES, ACCOUNT_STATUS } from '../../utils/constants.js';

const savedAddressSchema = new mongoose.Schema(
  {
    label:   { type: String, trim: true, maxlength: 50 },
    city:    { type: String, trim: true, maxlength: 100 },
    pincode: { type: String, trim: true, match: /^\d{4,10}$/ },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true, maxlength: 100 },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone:    { type: String, trim: true, unique: true, sparse: true },
    password: { type: String, required: true, select: false },
    role:     { type: String, enum: Object.values(ROLES), default: ROLES.USER },

    // ─── Account state ───────────────────────────────────────────────────────
    //
    // Two separate fields — they do different jobs and must not be merged:
    //
    //  accountStatus  — the approval lifecycle for theatre_owner registrations.
    //                   'pending'  : newly registered owner, awaiting admin review.
    //                   'active'   : approved (or any regular user after registration).
    //                   'rejected' : admin rejected the application.
    //
    //  isActive       — a hard on/off toggle any admin can flip at any time,
    //                   regardless of accountStatus. Used to suspend accounts
    //                   for abuse, fraud, etc. A suspended-but-approved owner
    //                   is: accountStatus:'active', isActive:false.
    //
    // login() checks BOTH: accountStatus must be 'active' AND isActive must be true.

    accountStatus: {
      type:    String,
      enum:    Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
    },
    rejectionReason: { type: String, trim: true, maxlength: 500, select: false },

    isActive:   { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    avatar:        String,
    preferredCity: { type: String, trim: true, maxlength: 100 },

    savedAddresses: {
      type:    [savedAddressSchema],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message:   'Cannot save more than 10 addresses',
      },
    },

    loyaltyPoints: { type: Number, default: 0, min: 0 },

    ownedTheatre: { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre' },

    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpires:   { type: Date,   select: false },
  },
  { timestamps: true, versionKey: false }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────

userSchema.index({ resetPasswordTokenHash: 1 }, { sparse: true });

// Admins query pending theatre owners often — make it fast.
userSchema.index({ accountStatus: 1, role: 1 });

// ─── Guards ───────────────────────────────────────────────────────────────────

userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    const looksHashed = this.password.length >= 60 && this.password.startsWith('$2');
    if (!looksHashed) return next(new Error('Password must be hashed before saving'));
  }
  next();
});

// ─── Methods ──────────────────────────────────────────────────────────────────

userSchema.methods.toPublicJSON = function () {
  return {
    id:            this._id,
    name:          this.name,
    email:         this.email,
    phone:         this.phone,
    role:          this.role,
    avatar:        this.avatar,
    preferredCity: this.preferredCity,
    loyaltyPoints: this.loyaltyPoints,
    isVerified:    this.isVerified,
    accountStatus: this.accountStatus,
  };
};

export default mongoose.model('User', userSchema);