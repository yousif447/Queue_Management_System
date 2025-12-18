import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const apiAsync = createAsyncThunk("auth/login", async () => {
    const res = await axios.get("http:localhost:3001/data");
    return res.data.data;
})

const authSlice = createSlice({
    name: "auth",
    initialState: {id: null, name: null, role: null, token: null, isAuthenticated: false},
    reducers: {
        login: (state, action) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.role = action.payload.role;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.id = null;
            state.name = null;
            state.role = null;
            state.token = null;
            state.isAuthenticated = false;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(apiAsync.fulfilled, (state, action) => {
            state.id = action.payload.id;
            state.name = action.payload.name;
            state.role = action.payload.role;
            state.token = action.payload.token;
            state.isAuthenticated = true;
        });

        builder.addCase(apiAsync.pending, (state) => {
            state.isAuthenticated = false;
        });

        builder.addCase(apiAsync.rejected, (state) => {
            state.id = null;
            state.name = null;
            state.role = null;
            state.token = null;
            state.isAuthenticated = false;
        });
    }
})

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;

