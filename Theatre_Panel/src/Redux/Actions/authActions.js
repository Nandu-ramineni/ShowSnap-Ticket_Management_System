import Cookies from 'js-cookie';
import api from '@/lib/axiosInstance';
import * as ActionTypes from '../Constants/authConstants';

// ─── Cookie options ───────────────────────────────────────────────────────────
const cookieOptions = (days) => ({
    expires: days,
    secure: window.location.protocol === 'https:',
    sameSite: 'Strict',
});

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * POST /auth/login
 * On success  : stores tokens in cookies + user in localStorage, dispatches SUCCESS
 * On failure  : dispatches FAILURE with the server error message
 */
export const login = (email, password) => async (dispatch) => {
    try {
        dispatch({ type: ActionTypes.AUTH_LOGIN_REQUEST });

        const { data } = await api.post('/theatre-owner/login', { email, password });

        // Backend returns: { data: { owner, accessToken, refreshToken } }
        const { accessToken, refreshToken, owner } = data.data;

        // ── Persist tokens in cookies ────────────────────────────────────
        Cookies.set('accessToken', accessToken, cookieOptions(1));    // 1 day
        Cookies.set('refreshToken', refreshToken, cookieOptions(7));  // 7 days

        // ── Persist owner for hydration across page refreshes ────────────
        // SECURITY: Only store public, non-sensitive owner fields.
        localStorage.setItem('authUser', JSON.stringify(owner));
        // --Check that owner onboarding status pending or completed.
        if (owner.onboardingStatus === 'pending_onboarding') {
            dispatch({
                type: ActionTypes.OWNER_ONBOARDING_REQUEST,
            })
            return { success: true, isPendingOnboarding: true };
        } else if (owner.onboardingStatus === 'completed_onboarding') {
            dispatch({
                type: ActionTypes.OWNER_ONBOARDING_SUCCESS,
            });
            return { success: true, isPendingOnboarding: false };
        }
        dispatch({
            type: ActionTypes.AUTH_LOGIN_SUCCESS,
            payload: owner,
        });

        return { success: true };

    } catch (error) {
        const status  = error.response?.status;
        const message = error.response?.data?.message || 'Login failed. Please check your credentials and try again.';

        // ── 403 PENDING — account is under review ────────────────────────
        // Backend throws ApiError.forbidden() for PENDING/REJECTED/inactive.
        // We detect the "under review" case so the UI can redirect cleanly.
        if (status === 403 && error.response?.data?.pending) {
            dispatch({
                type: ActionTypes.AUTH_LOGIN_FAILURE,
                payload: message,
            });

            return {
                success: false,
                isPending: true,
                error: message,
                owner: error.response.data.owner,
            };
        }

        // Check for rejected account
        if (status === 403 && error.response?.data?.rejected) {
            dispatch({
                type: ActionTypes.AUTH_LOGIN_FAILURE,
                payload: message,
            });

            return {
                success: false,
                isRejected: true,
                error: message,
                owner: error.response.data.owner, // Include rejectionReason in the response
            };
        }

        dispatch({
            type: ActionTypes.AUTH_LOGIN_FAILURE,
            payload: message,
        });

        return { success: false, isPending: false, error: message };
    }
};

export const clientRegister = (payload) => async (dispatch) => {
    try {
        dispatch({ type: ActionTypes.CLIENT_REGISTER_REQUEST });

        const formData = new FormData();

        formData.append('name', payload.name);
        formData.append('email', payload.email);
        formData.append('theatreName', payload.theatreName);
        formData.append('isMultiplex', payload.isMultiplex);
        formData.append('password', payload.password);

        payload.documents.forEach((doc) => {
            formData.append('documents', doc.file); // FIX 1: was 'files', multer expects 'documents'
            formData.append('docTypes', doc.docType);
        });

        const { data } = await api.post(
            '/theatre-owner/register',
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        dispatch({
            type: ActionTypes.CLIENT_REGISTER_SUCCESS,
            payload: data.data.owner,
        });

        return { success: true, owner: data.data.owner };

    } catch (error) {
        const message =
            error.response?.data?.message ||
            'Registration failed. Please try again.';

        dispatch({
            type: ActionTypes.CLIENT_REGISTER_FAILURE,
            payload: message,
        });

        return { success: false, error: message }; // FIX 2: added `error` key so Signup.jsx's !result?.error check works
    }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
/**
 * Clears cookies, localStorage, and resets Redux state.
 * Optionally call the server-side logout endpoint if one exists.
 */
export const logout = () => (dispatch) => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    localStorage.removeItem('authClient');
    dispatch({ type: ActionTypes.AUTH_LOGOUT });
};

// ─── Hydrate session on page refresh ─────────────────────────────────────────
/**
 * Called once in App.jsx on mount.
 * Restores Redux auth state from the access-token cookie + localStorage user,
 * so the user stays logged in across hard refreshes without an extra API round-trip.
 */
export const hydrateAuth = () => (dispatch) => {
    dispatch({ type: ActionTypes.AUTH_HYDRATE_REQUEST });

    const token = Cookies.get('accessToken');
    const raw = localStorage.getItem('authUser');

    if (token && raw) {
        try {
            const user = JSON.parse(raw);
            dispatch({ type: ActionTypes.AUTH_HYDRATE_SUCCESS, payload: user });
        } catch {
            // Corrupt localStorage — force a clean state
            Cookies.remove('accessToken');
            Cookies.remove('refreshToken');
            localStorage.removeItem('authUser');
            dispatch({ type: ActionTypes.AUTH_HYDRATE_FAILURE });
        }
    } else {
        dispatch({ type: ActionTypes.AUTH_HYDRATE_FAILURE });
    }
};

// ─── Clear error banner ───────────────────────────────────────────────────────
export const clearAuthError = () => ({ type: ActionTypes.AUTH_CLEAR_ERROR });

// ─── Theatre Owner Onboarding ─────────────────────────────────────────────────
/**
 * POST /theatre-owner/onboarding
 * Saves theatre owner onboarding data (theatre info, location, amenities, cancellation policy)
 * On success: dispatches ONBOARDING_SUCCESS, updates authUser in localStorage
 * On failure: dispatches ONBOARDING_FAILURE with error message
 */
export const saveTheatreOnboarding = (formData) => async (dispatch) => {
    try {
        dispatch({ type: ActionTypes.OWNER_ONBOARDING_REQUEST });

        const { data } = await api.patch('/theatre-owner/onboarding', formData);

        const { owner, onboardingComplete } = data.data;

        // ── Update localStorage with latest owner data ────────────────────────
        localStorage.setItem('authUser', JSON.stringify(owner));

        dispatch({
            type: ActionTypes.OWNER_ONBOARDING_SUCCESS,
            payload: owner,
        });

        return { success: true, owner, onboardingComplete };

    } catch (error) {
        const message =
            error.response?.data?.message ||
            'Onboarding failed. Please try again.';

        dispatch({
            type: ActionTypes.OWNER_ONBOARDING_FAILURE,
            payload: message,
        });

        throw new Error(message);
    }
};

// ─── Password Reset: Step 1 - Request OTP ─────────────────────────────────────

export const requestPasswordReset = (email) => async (dispatch) => {
    try {
        dispatch({ type: ActionTypes.AUTH_LOGIN_REQUEST });

        const { data } = await api.post('/theatre-owner/forgot-password', { email });

        dispatch({ type: ActionTypes.AUTH_CLEAR_ERROR });
        return { success: true, message: data.data.message };

    } catch (error) {
        const message =
            error.response?.data?.message ||
            'Failed to send OTP. Please try again.';

        dispatch({
            type: ActionTypes.AUTH_LOGIN_FAILURE,
            payload: message,
        });

        throw new Error(message);
    }
};

// ─── Password Reset: Step 2 - Verify OTP & Get Token ──────────────────────────

export const verifyOTPAndGenerateToken = (email, otp) => async (dispatch) => {
    try {
        dispatch({ type: ActionTypes.AUTH_LOGIN_REQUEST });

        const { data } = await api.post('/theatre-owner/verify-otp', { email, otp });

        dispatch({ type: ActionTypes.AUTH_CLEAR_ERROR });
        return { success: true, message: data.data.message };

    } catch (error) {
        const message =
            error.response?.data?.message ||
            'Invalid OTP. Please try again.';

        dispatch({
            type: ActionTypes.AUTH_LOGIN_FAILURE,
            payload: message,
        });

        throw new Error(message);
    }
};

// ─── Password Reset: Step 3 - Reset Password ──────────────────────────────────

export const resetPassword = (email, resetToken, newPassword) => async (dispatch) => {
    try {
        dispatch({ type: ActionTypes.AUTH_LOGIN_REQUEST });

        const { data } = await api.post('/theatre-owner/reset-password', {
            email,
            resetToken,
            newPassword,
        });

        // Clear auth state as user needs to login again
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        localStorage.removeItem('authUser');

        dispatch({
            type: ActionTypes.AUTH_LOGOUT,
        });

        return { success: true, message: data.data.message };

    } catch (error) {
        const message =
            error.response?.data?.message ||
            'Failed to reset password. Please try again.';

        dispatch({
            type: ActionTypes.AUTH_LOGIN_FAILURE,
            payload: message,
        });

        throw new Error(message);
    }
};