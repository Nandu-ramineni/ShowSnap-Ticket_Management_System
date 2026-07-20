// Regression test for the "theatre_id missing on screen creation" bug family.
//
// This bug has shipped three times under different disguises (see commits
// 03c0f37, d905ec5, 74b3a72) — the last of which claimed a fix in its message
// but the diff touched unrelated code. This test exercises the full path a
// real theatre owner takes, end to end, against a real (in-memory) MongoDB,
// so a regression here fails a test instead of surfacing in production.
//
// External services (Cloudinary, email, Redis) are mocked — this test only
// cares about the Mongo-backed onboarding -> Theatre -> Screen chain. It never
// touches the real MONGO_URI in .env (which points at a live Atlas cluster,
// not local infra) — MongoMemoryServer provides a throwaway instance and the
// env var is overridden before anything else is imported.

import { jest } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod;
let app;
let User;
let ROLES;
let ACCOUNT_STATUS;

beforeAll(async () => {
    mongod = await MongoMemoryServer.create();

    process.env.MONGO_URI = mongod.getUri();
    process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-real-envs-0000000000';
    process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-do-not-use-0000000000';
    process.env.JWT_ISSUER = 'seatsecure-test';
    process.env.JWT_AUDIENCE = 'seatsecure-test-users';
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_dummy';
    process.env.CLOUDINARY_CLOUD_NAME = 'test';
    process.env.CLOUDINARY_API_KEY = 'test';
    process.env.CLOUDINARY_API_SECRET = 'test';
    process.env.NODE_ENV = 'test';

    // Mock external services — this test verifies the onboarding/Theatre/Screen
    // chain, not Cloudinary uploads, real emails, or a real Redis instance.
    jest.unstable_mockModule('../src/config/cloudinary.js', () => ({
        uploadBuffer: jest.fn().mockResolvedValue({
            secure_url: 'https://example.test/fake-doc.pdf',
            public_id: 'fake_public_id',
        }),
        deleteResource: jest.fn().mockResolvedValue(true),
    }));

    jest.unstable_mockModule('../src/utils/nodeMailer.js', () => ({
        sendOTPEmail: jest.fn().mockResolvedValue(true),
        sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
        sendOwnerApproved: jest.fn().mockResolvedValue(true),
        sendOwnerRejection: jest.fn().mockResolvedValue(true),
    }));

    jest.unstable_mockModule('../src/config/redis.js', () => ({
        getRedisClient: jest.fn(() => ({ quit: jest.fn().mockResolvedValue(undefined) })),
        acquireLock: jest.fn().mockResolvedValue(true),
        releaseLock: jest.fn().mockResolvedValue(true),
        setCache: jest.fn().mockResolvedValue(undefined),
        getCache: jest.fn().mockResolvedValue(null),
        deleteCache: jest.fn().mockResolvedValue(undefined),
    }));

    ({ default: app } = await import('../src/app.js'));
    ({ default: User } = await import('../src/modules/auth/user.model.js'));
    ({ ROLES, ACCOUNT_STATUS } = await import('../src/utils/constants.js'));

    await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
});

const signAdminToken = (admin) =>
    jwt.sign(
        { sub: admin._id.toString(), email: admin.email, role: 'admin' },
        process.env.JWT_SECRET,
        { algorithm: 'HS256', issuer: process.env.JWT_ISSUER, audience: process.env.JWT_AUDIENCE, expiresIn: '1h' },
    );

describe('theatre owner: register -> approve -> onboard -> create screen', () => {
    let ownerId;
    let ownerToken;

    test('registers and awaits approval', async () => {
        const res = await request(app)
            .post('/api/v1/theatre-owner/register')
            .field('email', 'owner@regression-test.com')
            .field('password', 'Owner@123')
            .field('name', 'Test Owner')
            .field('theatreName', 'Regression Test Theatre')
            .field('docTypes', 'gst_certificate')
            .attach('documents', Buffer.from('fake supporting document'), 'doc1.pdf');

        expect(res.status).toBe(201);
        expect(res.body.data.owner.accountStatus).toBe('pending');
        ownerId = res.body.data.owner.id;
    });

    test('admin approves the account', async () => {
        const admin = await User.create({
            name: 'Test Admin',
            email: 'admin@regression-test.com',
            password: await bcrypt.hash('Admin@123', 12),
            role: ROLES.ADMIN,
            accountStatus: ACCOUNT_STATUS.ACTIVE,
            isVerified: true,
        });

        const res = await request(app)
            .patch(`/api/v1/admin/approvals/${ownerId}/approve`)
            .set('Authorization', `Bearer ${signAdminToken(admin)}`);

        expect(res.status).toBe(200);
        expect(res.body.data.owner.accountStatus).toBe('active');
    });

    test('logs in with ownedTheatre still unset', async () => {
        const res = await request(app)
            .post('/api/v1/theatre-owner/login')
            .send({ email: 'owner@regression-test.com', password: 'Owner@123' });

        expect(res.status).toBe(200);
        expect(res.body.data.owner.ownedTheatre).toBeFalsy();
        ownerToken = res.body.data.accessToken;
    });

    test('partial onboarding save leaves onboarding in_progress, ownedTheatre still null', async () => {
        const res = await request(app)
            .patch('/api/v1/theatre-owner/onboarding')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({ theatreInfo: { theatreName: 'Regression Test Theatre', contactPhone: '+919999999999' } });

        expect(res.status).toBe(200);
        expect(res.body.data.owner.onboardingStatus).toBe('in_progress');
        expect(res.body.data.owner.ownedTheatre).toBeFalsy();
    });

    test('creating a screen before onboarding completes is rejected (400), not a theatreId crash', async () => {
        const res = await request(app)
            .post('/api/v1/theatres/000000000000000000000001/screens')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Screen 1',
                screenType: 'STANDARD',
                seatLayout: [{ row: 'A', number: 1, label: 'A1', type: 'silver', isBlocked: false }],
            });

        expect(res.status).toBe(400);
    });

    test('completing onboarding creates a Theatre and links ownedTheatre — the actual regression', async () => {
        const res = await request(app)
            .patch('/api/v1/theatre-owner/onboarding')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                theatreInfo: { contactEmail: 'contact@regression-test.com' },
                location: {
                    streetAddress: '1 Main St',
                    city: 'Testville',
                    state: 'TestState',
                    pincode: '123456',
                },
            });

        expect(res.status).toBe(200);
        expect(res.body.data.onboardingComplete).toBe(true);
        expect(res.body.data.owner.onboardingStatus).toBe('completed');
        expect(res.body.data.owner.ownedTheatre).toBeTruthy();
    });

    test('screen creation now succeeds against the auto-provisioned theatre', async () => {
        const profileRes = await request(app)
            .get('/api/v1/theatre-owner/profile')
            .set('Authorization', `Bearer ${ownerToken}`);
        const ownedTheatreId = profileRes.body.data.owner.ownedTheatre;
        expect(ownedTheatreId).toBeTruthy();

        const res = await request(app)
            .post(`/api/v1/theatres/${ownedTheatreId}/screens`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Screen 1',
                screenType: 'STANDARD',
                seatLayout: [{ row: 'A', number: 1, label: 'A1', type: 'silver', isBlocked: false }],
            });

        expect(res.status).toBe(201);
        expect(res.body.data.screen.theatre).toBe(ownedTheatreId);
    });

    test('the flat POST /screens create bypass no longer exists', async () => {
        const res = await request(app)
            .post('/api/v1/screens')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                name: 'Screen X',
                screenType: 'STANDARD',
                seatLayout: [{ row: 'A', number: 1, label: 'A1', type: 'silver', isBlocked: false }],
            });

        expect(res.status).toBe(404);
    });
});
