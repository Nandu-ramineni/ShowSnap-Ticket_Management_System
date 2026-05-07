import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import Login from './components/Auth/Login';
import Dashboard from './Pages/Dashboard/Dashboard';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import { hydrateAuth } from './Redux/Actions/authActions';

function App() {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(hydrateAuth());
    }, [dispatch]);

    return (
        <BrowserRouter>
            <Routes>

                {/* ── Root redirect ────────────────────────────────────────── */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />

                {/* ── Public pages (redirect to /dashboard when logged in) ─── */}
                <Route
                    path="/login"
                    element={
                        <PublicRoute>
                            <Login />
                        </PublicRoute>
                    }
                />
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

                {/* ── Catch-all ─────────────────────────────────────────────── */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />

            </Routes>
        </BrowserRouter>
    );
}

// ─── Placeholder ──────────────────────────────────────────────────────────────
// Swap each one out with the real page component when it's ready.
// e.g. replace <Placeholder title="Bookings & Transactions" />
//          with <Bookings />  and add the import at the top.
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