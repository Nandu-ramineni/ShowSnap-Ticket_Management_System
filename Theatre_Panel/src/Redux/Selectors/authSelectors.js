// Memoised selectors — use these everywhere instead of raw state.auth.X
// so refactoring the state shape only requires changes here, not in every component.

export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectCurrentUser     = (state) => state.auth.user;
export const selectAuthLoading     = (state) => state.auth.isLoading;
export const selectIsHydrating     = (state) => state.auth.isHydrating;
export const selectAuthError       = (state) => state.auth.error;
export const selectSignupSuccess   = (state) => state.auth.signupSuccess;