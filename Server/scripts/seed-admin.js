//
// Creates the first admin account from environment variables.
// Run once during deployment setup:
//
//   ADMIN_EMAIL=admin@seatsecure.com \
//   ADMIN_PASSWORD=SuperSecure@123 \
//   ADMIN_NAME="System Admin" \
//   node scripts/seed-admin.js
//
// Why a seed script and NOT a public API endpoint?
//
//   If you expose POST /auth/register with role:'admin', anyone who finds
//   your API before you do can make themselves admin. The seed script runs
//   inside your infrastructure, not over the internet, so it's safe.
//   Some teams use an env-gated one-time endpoint, but the seed script
//   pattern is simpler and has no attack surface.


import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/modules/auth/user.model.js';
import { ROLES, ACCOUNT_STATUS } from '../src/utils/constants.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, MONGODB_URI } = process.env;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_NAME) {
    console.error('Missing ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_NAME env vars');
    process.exit(1);
}

await mongoose.connect(MONGODB_URI);

const existing = await User.findOne({ email: ADMIN_EMAIL });
if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    await mongoose.disconnect();
    process.exit(0);
}

const password = await bcrypt.hash(ADMIN_PASSWORD, 12);
const admin = await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password,
    role: ROLES.ADMIN,
    accountStatus: ACCOUNT_STATUS.ACTIVE,
    isVerified: true,
});

console.log(`Admin created: ${admin.email} (${admin._id})`);
await mongoose.disconnect();

