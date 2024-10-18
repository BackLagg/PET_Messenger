import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Асинхронные действия для получения друзей и запросов в друзья
export const fetchFriends = createAsyncThunk('friends/fetchFriends', async () => {
  const response = await axios.get('http://localhost:8080/show_my_friends', {
    withCredentials: true,
  });
  return response.data;
});

export const fetchFriendRequests = createAsyncThunk('friends/fetchFriendRequests', async () => {
  const response = await axios.get('http://localhost:8080/my_friend_requests', {
    withCredentials: true,
  });
  return response.data;
});

const friendsSlice = createSlice({
  name: 'friends',
  initialState: {
    friendsList: [],
    myRequests: [],
    requestsToMe: [],
    status: 'idle',
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.friendsList = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchFriends.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.myRequests = action.payload.my_request;
        state.requestsToMe = action.payload.request_to_me;
        state.status = 'succeeded';
      });
  },
});

export default friendsSlice.reducer;
