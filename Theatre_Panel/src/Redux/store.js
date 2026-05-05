import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { thunk } from 'redux-thunk';
import authReducer from './Reducers/authReducer';

const rootReducer = combineReducers({
    auth: authReducer,
});

// Enable Redux DevTools in development
const composeEnhancers =
    (typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'development' &&
        window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
    compose;

const store = createStore(
    rootReducer,
    composeEnhancers(applyMiddleware(thunk))
);

export default store;