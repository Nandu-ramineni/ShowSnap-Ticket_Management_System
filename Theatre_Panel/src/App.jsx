import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Toaster as Sonner } from 'sonner';

import { hydrateAuth } from '@/Redux/Actions/authActions';

import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import PrivacyPolicy from './components/Auth/PrivacyAgreementPolicy';
import PendingApproval from './components/Auth/Pendingapproval';

import Dashboard from './Pages/Dashboard/Dashboard';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

function App() {
    const dispatch = useDispatch();

    // ── Hydrate session on every page load / hard refresh ──────────────────
    // Must fire before any route guard checks isAuthenticated,
    // so ProtectedRoute / PublicRoute wait for isHydrating === false.
    useEffect(() => {
        dispatch(hydrateAuth());
    }, [dispatch]);

    return (
        <BrowserRouter>
            <Routes>

                {/* ── Public routes (redirect to /dashboard if already logged in) ── */}
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Signup />} />
                </Route>

                {/* ── Semi-public: accessible to everyone (no auth check needed) ── */}
                <Route path="/privacy-agreement-policy" element={<PrivacyPolicy />} />

                {/*
                    /pending is reachable:
                    - Immediately after signup (no session yet)
                    - After a 403 login attempt for a PENDING account
                    We guard it inside the component itself (redirect to /login
                    if no owner data in state or Redux).
                */}
                <Route path="/pending" element={<PendingApproval />} />

                {/* ── Protected routes (redirect to /login if not authenticated) ── */}
                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/theatre" element={<Placeholder title="Theatre Profile" />} />
                    <Route path="/screens" element={<Placeholder title="Screen Manager" />} />
                    <Route path="/shows" element={<Placeholder title="Show Scheduler" />} />
                    <Route path="/seatmap" element={<Placeholder title="Live Seat Map" />} />
                    <Route path="/layout-editor" element={<Placeholder title="Seat Layout Editor" />} />
                    <Route path="/bookings" element={<Placeholder title="Bookings & Transactions" />} />
                    <Route path="/reports" element={<Placeholder title="Revenue Reports" />} />
                    <Route path="/reviews" element={<Placeholder title="Reviews & Ratings" />} />
                    <Route path="/notifications" element={<Placeholder title="Notifications" />} />
                    <Route path="/team" element={<Placeholder title="Team Management" />} />
                    <Route path="/settings" element={<Placeholder title="Settings" />} />
                </Route>

                {/* ── Root redirect ── */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* ── Catch-all ── */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Routes>

            <Sonner theme="dark" position="top-right" />
        </BrowserRouter>
    );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
const Placeholder = ({ title }) => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '60vh', flexDirection: 'column', gap: '12px',
        color: 'rgba(240,242,255,0.4)', fontFamily: 'system-ui, sans-serif',
    }}>
        <span style={{ fontSize: '40px' }}>🚧</span>
        <p style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{title}</p>
        <p style={{ fontSize: '13px', margin: 0 }}>Page coming soon</p>
    </div>
);

export default App;
