export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser     = (state) => state.auth.user;
export const selectAuthLoading     = (state) => state.auth.isLoading;
export const selectIsHydrating     = (state) => state.auth.isHydrating;
export const selectAuthError       = (state) => state.auth.error;
export const selectSignupSuccess   = (state) => state.auth.signupSuccess;
