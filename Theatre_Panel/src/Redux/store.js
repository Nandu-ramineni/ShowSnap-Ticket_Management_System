/**
 * Redux/store.js
 *
 * Uses Redux Toolkit's configureStore which:
 *   ✔ Bundles redux-thunk automatically — no need for the separate package
 *   ✔ Enables Redux DevTools in development out of the box
 *   ✔ Adds the serializability middleware to catch accidental non-serializable
 *     values (Dates, Promises, class instances) in state or actions
 *   ✔ Deprecates the old createStore / applyMiddleware / compose ceremony
 *
 * No other files need to change — the store shape (state.auth) is identical.
 */

import { configureStore } from '@reduxjs/toolkit';
import authReducer        from './Reducers/authReducer';

const store = configureStore({
    reducer: {
        auth: authReducer,
    },
    // devTools is automatically enabled in development and disabled in production
    // by configureStore — no manual compose() dance needed.
    devTools: import.meta.env.DEV,
});

export default store;