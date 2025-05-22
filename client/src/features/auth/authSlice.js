import { createSlice } from '@reduxjs/toolkit';

const userInfo = localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null;

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: userInfo,
    },
    reducers: {
        loginSuccess: (state, action) => {
            state.user = action.payload;
            localStorage.setItem('userInfo', JSON.stringify(action.payload));
        },
        logout: (state) => {
            state.user = null;
            localStorage.removeItem('userInfo');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
        },
    },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;