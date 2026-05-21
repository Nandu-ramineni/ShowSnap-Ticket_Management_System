import api from '@/lib/axiosInstance.js';
import { toast } from 'sonner';
import * as types from '../Constants/screensConstants.js';

export const fetchScreens = (theatreId) => async (dispatch) => {
  try {
    dispatch({ type: types.SCREENS_FETCH_START });
    const response = await api.get(`/theatres/${theatreId}/screens`);
    const screens = response.data.data.screens || response.data.data || [];
    dispatch({
      type: types.SCREENS_FETCH_SUCCESS,
      payload: Array.isArray(screens) ? screens : [],
    });
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Failed to load screens';
    dispatch({
      type: types.SCREENS_FETCH_ERROR,
      payload: errorMsg,
    });
    toast.error(errorMsg);
  }
};

export const createScreen = (theatreId, formData) => async (dispatch) => {
  try {
    dispatch({ type: types.SCREEN_CREATE_START });
    const response = await api.post(`/theatres/${theatreId}/screens`, formData);
    const screen = response.data.data.screen;
    dispatch({
      type: types.SCREEN_CREATE_SUCCESS,
      payload: screen,
    });
    toast.success('Screen created successfully!');
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to create screen';
    dispatch({
      type: types.SCREEN_CREATE_ERROR,
      payload: errorMsg,
    });
    toast.error(errorMsg);
    throw error;
  }
};

export const updateScreen = (screenId, formData) => async (dispatch) => {
  try {
    dispatch({ type: types.SCREEN_UPDATE_START });
    const response = await api.put(`/screens/${screenId}`, formData);
    const screen = response.data.data.screen;
    dispatch({
      type: types.SCREEN_UPDATE_SUCCESS,
      payload: screen,
    });
    toast.success('Screen updated successfully!');
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to update screen';
    dispatch({
      type: types.SCREEN_UPDATE_ERROR,
      payload: errorMsg,
    });
    toast.error(errorMsg);
    throw error;
  }
};

export const deleteScreen = (screenId) => async (dispatch) => {
  try {
    dispatch({ type: types.SCREEN_DELETE_START });
    await api.delete(`/screens/${screenId}`);
    dispatch({
      type: types.SCREEN_DELETE_SUCCESS,
      payload: screenId,
    });
    toast.success('Screen deleted successfully!');
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message || 'Failed to delete screen';
    dispatch({
      type: types.SCREEN_DELETE_ERROR,
      payload: errorMsg,
    });
    toast.error(errorMsg);
    throw error;
  }
};

export const setSelectedScreen = (screen) => ({
  type: types.SET_SELECTED_SCREEN,
  payload: screen,
});

export const toggleFormModal = (isOpen) => ({
  type: types.TOGGLE_FORM_MODAL,
  payload: isOpen,
});

export const resetScreenForm = () => ({
  type: types.SCREEN_FORM_RESET,
});

export const clearScreenError = () => ({
  type: types.CLEAR_SCREEN_ERROR,
});
