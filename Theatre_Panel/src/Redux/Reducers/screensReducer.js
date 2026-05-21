import * as types from '../Constants/screensConstants.js';

const initialState = {
  screens: [],
  selectedScreen: null,
  loading: false,
  error: null,
  formData: {
    name: '',
    screenType: 'STANDARD',
    soundSystem: '',
    projectionType: '',
    pricing: { silver: 0, gold: 0, premium: 0, recliner: 0 },
    seatLayout: [],
  },
  isFormOpen: false,
};

export const screensReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SCREENS_FETCH_START:
      return { ...state, loading: true, error: null };
    case types.SCREENS_FETCH_SUCCESS:
      return { ...state, screens: action.payload, loading: false, error: null };
    case types.SCREENS_FETCH_ERROR:
      return { ...state, loading: false, error: action.payload };

    case types.SCREEN_CREATE_START:
    case types.SCREEN_UPDATE_START:
    case types.SCREEN_DELETE_START:
      return { ...state, loading: true, error: null };

    case types.SCREEN_CREATE_SUCCESS:
      return {
        ...state,
        screens: [...state.screens, action.payload],
        loading: false,
        isFormOpen: false,
        formData: initialState.formData,
        selectedScreen: null,
      };

    case types.SCREEN_UPDATE_SUCCESS:
      return {
        ...state,
        screens: state.screens.map((s) => (s._id === action.payload._id ? action.payload : s)),
        loading: false,
        isFormOpen: false,
        formData: initialState.formData,
        selectedScreen: null,
      };

    case types.SCREEN_DELETE_SUCCESS:
      return {
        ...state,
        screens: state.screens.filter((s) => s._id !== action.payload),
        loading: false,
        selectedScreen: null,
      };

    case types.SCREEN_CREATE_ERROR:
    case types.SCREEN_UPDATE_ERROR:
    case types.SCREEN_DELETE_ERROR:
      return { ...state, loading: false, error: action.payload };

    case types.SET_SELECTED_SCREEN:
      return {
        ...state,
        selectedScreen: action.payload,
        formData: action.payload
          ? {
              ...action.payload,
              pricing: action.payload.pricing || initialState.formData.pricing,
            }
          : initialState.formData,
        isFormOpen: !!action.payload,
      };

    case types.TOGGLE_FORM_MODAL:
      return {
        ...state,
        isFormOpen: action.payload,
        formData: !action.payload ? initialState.formData : state.formData,
        selectedScreen: !action.payload ? null : state.selectedScreen,
      };

    case types.SCREEN_FORM_RESET:
      return {
        ...state,
        formData: initialState.formData,
        selectedScreen: null,
        isFormOpen: false,
      };

    case types.CLEAR_SCREEN_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};
