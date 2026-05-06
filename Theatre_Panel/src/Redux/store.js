/**
 * Redux/store.js
 *
 * configureStore (Redux Toolkit):
 *  ✔ Bundles redux-thunk automatically
 *  ✔ Enables Redux DevTools in development
 *  ✔ Adds serializability checks
 */

import { configureStore } from '@reduxjs/toolkit';
import { authReducer } from './Reducers/authReducer';

const store = configureStore({
    reducer: {
        auth: authReducer,
    },
    devTools: import.meta.env.DEV,
});

export default store;