import { createSlice } from "@reduxjs/toolkit";

export const userSlice = createSlice({
  name: "user",
  initialState: {
    token: localStorage.getItem("token") || "",
    user: {},
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logOut: (state) => {
      state.token = "";
      state.user = {};
    },
  },
});

export const { setToken, setUser, logOut } = userSlice.actions;
export default userSlice.reducer;
