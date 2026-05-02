import mongoose from 'mongoose';

// ─── RefreshToken model ───────────────────────────────────────────────────────
//
// Why a DB-backed model instead of a stateless JWT?
//
//  Stateless JWTs can't be revoked. Once issued, they're valid until expiry.
//  Storing refresh tokens in the DB lets us:
//    • Implement logout (delete the token)
//    • Implement "sign out all devices" (deleteMany by userId)
//    • Detect token reuse (stolen token replay attack)
//    • Revoke all sessions on password change
//    • See which devices are logged in (userAgent + ip)
//
// We store a SHA-256 HASH of the token, never the raw value.
// If the DB is breached, hashed tokens can't be replayed.
// The raw token is returned once to the client and never persisted.

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true, // fast lookups for logoutAll and setActiveStatus
    },

    // SHA-256 hash of the raw token. Unique so findOne({ tokenHash }) is O(1).
    tokenHash: {
      type:     String,
      required: true,
      unique:   true,
    },

    // Token family groups all tokens issued in one login session.
    // If a token from this family is reused (already has usedAt set),
    // we delete ALL tokens in the family — the whole session is compromised.
    family: {
      type:  String,
      index: true,
    },

    // Set when this token is rotated (exchanged for a new pair).
    // NOT deleted immediately so reuse detection can fire if the
    // old token is presented again before the next cleanup.
    usedAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type:     Date,
      required: true,
      index:    true, // TTL-adjacent; used in expiry check in service
    },

    // Audit / device management
    ip:        { type: String },
    userAgent: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ─── TTL index ────────────────────────────────────────────────────────────────
// MongoDB automatically deletes documents after expiresAt.
// This handles cleanup of expired tokens without a cron job.
// The service still checks expiresAt manually because TTL deletion
// can lag up to 60 seconds behind the actual expiry time.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Also clean up rotated (used) tokens after 24 hours.
// They need to stay briefly for reuse detection, but not forever.
refreshTokenSchema.index(
  { usedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24, sparse: true }
);

export default mongoose.model('RefreshToken', refreshTokenSchema);