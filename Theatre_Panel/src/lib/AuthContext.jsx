import { createContext, useContext, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    loginUser,
    signupUser,
    logoutUser,
    clearAuthError,
    hydrateSession,
} from '@/Redux/Actions/authActions';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const dispatch = useDispatch();
    const { user, isAuthenticated, isLoading, isHydrating, error, signupSuccess } =
        useSelector((state) => state.auth);

    // ── Hydrate session on mount ─────────────────────────────────────────────
    // The browser automatically sends HttpOnly cookies with credentials:'include'.
    // /me validates them and returns the user — no localStorage needed.
    useEffect(() => {
        dispatch(hydrateSession());
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login      = useCallback((creds)    => dispatch(loginUser(creds)),    [dispatch]);
    const signup     = useCallback((data)     => dispatch(signupUser(data)),     [dispatch]);
    const logout     = useCallback(()         => dispatch(logoutUser()),         [dispatch]);
    const clearError = useCallback(()         => dispatch(clearAuthError()),     [dispatch]);

    return (
        <AuthContext.Provider value={{
            user,
            isAuthenticated,
            isLoading,
            isHydrating,
            error,
            signupSuccess,
            login,
            signup,
            logout,
            clearError,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};

export default AuthContext;
