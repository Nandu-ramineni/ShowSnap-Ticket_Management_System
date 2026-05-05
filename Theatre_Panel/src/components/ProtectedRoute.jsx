import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const Spinner = () => (
    <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
);

/**
 * ProtectedRoute
 *
 * - While the /me hydration is in-flight (isHydrating), show a spinner.
 *   This prevents a flash-redirect to /login on hard refresh when the
 *   user actually has a valid session cookie.
 * - Once hydration settles: authenticated → render children, else → /login.
 */
export default function ProtectedRoute() {
    const { isAuthenticated, isHydrating } = useAuth();

    if (isHydrating) return <Spinner />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    return <Outlet />;
}
