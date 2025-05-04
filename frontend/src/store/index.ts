import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

// Slice reducers
import authReducer from './slices/authSlice';
import documentsReducer from './slices/documentsSlice';
import tendersReducer from './slices/tendersSlice';
import analysisReducer from './slices/analysisSlice';
import uiReducer from './slices/uiSlice';

// API 서비스
import { api } from './api';

// 스토어 설정
export const store = configureStore({
  reducer: {
    auth: authReducer,
    documents: documentsReducer,
    tenders: tendersReducer,
    analysis: analysisReducer,
    ui: uiReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
});

// RTK Query 설정
setupListeners(store.dispatch);

// 타입 정의
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
