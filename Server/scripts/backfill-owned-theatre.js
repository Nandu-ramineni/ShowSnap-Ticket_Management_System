//
// One-time backfill for owners who completed onboarding before the Theatre
// auto-provisioning fix existed (see theatreOwner.service.js#saveOnboarding).
// Those owners have onboardingStatus: 'completed' but ownedTheatre: null —
// the fix only prevents *new* occurrences, it doesn't repair existing data.
//
// Idempotent: safe to run multiple times. Skips any owner who already has
// ownedTheatre set, and skips (with a warning) any owner missing the fields
// required to build a valid Theatre (shouldn't happen if isOnboardingComplete()
// was true, but the check is here as a safety net rather than a crash).
//
//   node scripts/backfill-owned-theatre.js
//

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import TheatreOwner from '../src/modules/auth/theatreOwner.model.js';
import Theatre from '../src/modules/theatres/theatre.model.js';
import { createTheatreForOwner } from '../src/modules/theatres/theatre.service.js';
import { ONBOARDING_STATUS } from '../src/utils/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { MONGO_URI } = process.env;
if (!MONGO_URI) {
    console.error('Missing MONGO_URI env var');
    process.exit(1);
}

await mongoose.connect(MONGO_URI);

const stuck = await TheatreOwner.find({
    onboardingStatus: ONBOARDING_STATUS.COMPLETED,
    $or: [{ ownedTheatre: null }, { ownedTheatre: { $exists: false } }],
});

console.log(`Found ${stuck.length} owner(s) completed onboarding with no linked Theatre.`);

let fixed = 0;
let skipped = 0;

for (const owner of stuck) {
    if (!owner.theatreInfo?.theatreName || !owner.location?.streetAddress ||
        !owner.location?.city || !owner.location?.state || !owner.location?.pincode) {
        console.warn(`SKIP ${owner.email} (${owner._id}) — missing required profile fields, cannot build a valid Theatre.`);
        skipped++;
        continue;
    }

    // Guard against an orphaned Theatre from a prior partial run of this script.
    const existingTheatre = await Theatre.findOne({ owner: owner._id });
    if (existingTheatre) {
        owner.ownedTheatre = existingTheatre._id;
        await owner.save();
        console.log(`RELINK ${owner.email} (${owner._id}) -> existing Theatre ${existingTheatre._id}`);
        fixed++;
        continue;
    }

    try {
        const theatre = await createTheatreForOwner(owner);
        owner.ownedTheatre = theatre._id;
        await owner.save();
        console.log(`OK ${owner.email} (${owner._id}) -> Theatre ${theatre._id}`);
        fixed++;
    } catch (err) {
        console.error(`FAILED ${owner.email} (${owner._id}):`, err.message);
        skipped++;
    }
}

console.log(`\nDone. Fixed: ${fixed}. Skipped: ${skipped}. Total examined: ${stuck.length}.`);
await mongoose.disconnect();
