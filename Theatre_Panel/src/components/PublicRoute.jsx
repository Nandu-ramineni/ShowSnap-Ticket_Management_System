/**
 * PublicRoute.jsx
 *
 * Wraps pages that should NOT be accessible once authenticated
 * (login, signup, forgot-password …).
 *
 * Render logic:
 *  isHydrating === true  → show full-screen spinner (same guard as ProtectedRoute)
 *  isAuthenticated       → redirect to /dashboard
 *  else                  → render children (the public page)
 */

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsHydrating } from '@/Redux/Selectors/authSelectors';

const FullScreenSpinner = () => (
    <div
        role="status"
        aria-label="Loading…"
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            background: '#0c0f1a',
        }}
    >
        <svg
            width="36" height="36"
            viewBox="0 0 24 24" fill="none"
            stroke="url(#grad2)" strokeWidth="2.5"
            style={{ animation: 'spin 0.8s linear infinite' }}
            aria-hidden="true"
        >
            <defs>
                <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#e84393" />
                    <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
            </defs>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
);

const PublicRoute = ({ children }) => {
    const isHydrating     = useSelector(selectIsHydrating);
    const isAuthenticated = useSelector(selectIsAuthenticated);

    if (isHydrating)     return <FullScreenSpinner />;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;
    return children;
};

export default PublicRoute;