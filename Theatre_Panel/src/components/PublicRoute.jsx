/**
 * PublicRoute.jsx (Production Grade)
 *
 * Prevents authenticated users from accessing public pages
 * like login/register/forgot-password.
 *
 * Flow:
 *  - Hydrating → spinner
 *  - Authenticated → redirect to dashboard
 *  - Else → render public routes via Outlet
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    selectIsAuthenticated,
    selectIsHydrating,
} from '@/Redux/Selectors/authSelectors';

// ─────────────────────────────────────────────
// Spinner (should ideally move to /components/common)
// ─────────────────────────────────────────────
const FullScreenSpinner = () => (
    <div
        role="status"
        aria-label="Loading"
        className="min-h-screen flex items-center justify-center bg-background"
    >
        <div className="h-10 w-10 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
);

// ─────────────────────────────────────────────
// Public Route Guard
// ─────────────────────────────────────────────
const PublicRoute = () => {
    const isHydrating = useSelector(selectIsHydrating);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    // still checking auth state
    if (isHydrating) {
        return <FullScreenSpinner />;
    }

    // already logged in → block public routes
    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    // allow public routes
    return <Outlet />;
};

export default PublicRoute;