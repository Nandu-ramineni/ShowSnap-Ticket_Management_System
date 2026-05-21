export const selectAllScreens = (state) => state.screens.screens;
export const selectScreensLoading = (state) => state.screens.loading;
export const selectScreensError = (state) => state.screens.error;
export const selectSelectedScreen = (state) => state.screens.selectedScreen;
export const selectScreenFormData = (state) => state.screens.formData;
export const selectIsFormOpen = (state) => state.screens.isFormOpen;

export const selectScreenCount = (state) => state.screens.screens.length;
export const selectActiveScreens = (state) =>
  state.screens.screens.filter((s) => s.isActive === true);
