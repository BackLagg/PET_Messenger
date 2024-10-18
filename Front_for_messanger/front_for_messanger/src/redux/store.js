import { configureStore } from '@reduxjs/toolkit';
import friendsReducer from './friendsSlice';

export const store = configureStore({
  reducer: {
    friends: friendsReducer,
  },
});

export default store;