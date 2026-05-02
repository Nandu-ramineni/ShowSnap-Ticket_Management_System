import * as authConstants from '../Constants/auth.constants'
import axios from 'axios'

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1'

// Login Action
export const Client_Login = (credentials: { email: string; password: string }) => async (dispatch: any) => {
    try {
        dispatch({ type: authConstants.Theatre_OWNER_LOGIN_REQUEST })

        const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials)

        dispatch({
            type: authConstants.Theatre_OWNER_LOGIN_SUCCESS,
            payload: response.data
        })

        return response.data
    } catch (error: any) {
        dispatch({
            type: authConstants.Theatre_OWNER_LOGIN_FAIL,
            payload: error.response?.data?.message || 'Login failed'
        })
        throw error
    }
}

// Register Action
export const register = (userData: {
    name: string
    email: string
    password: string
    confirmPassword: string
}) => async (dispatch: any) => {
    try {
        dispatch({ type: authConstants.Theatre_OWNER_REGISTER_REQUEST })

        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData)

        dispatch({
            type: authConstants.Theatre_OWNER_REGISTER_SUCCESS,
            payload: response.data
        })

        return response.data
    } catch (error: any) {
        dispatch({
            type: authConstants.Theatre_OWNER_REGISTER_FAIL,
            payload: error.response?.data?.message || 'Registration failed'
        })
        throw error
    }
}

// Logout Action
export const logout = () => (dispatch: any) => {
    dispatch({ type: authConstants.Theatre_OWNER_LOGOUT })
}


