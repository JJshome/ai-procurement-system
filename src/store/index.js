import { configureStore } from '@reduxjs/toolkit';
import rfpAnalysisReducer from './slices/rfpAnalysisSlice';
import documentGeneratorReducer from './slices/documentGeneratorSlice';
import userReducer from './slices/userSlice';
import bidOpportunitiesReducer from './slices/bidOpportunitiesSlice';

export const store = configureStore({
  reducer: {
    rfpAnalysis: rfpAnalysisReducer,
    documentGenerator: documentGeneratorReducer,
    user: userReducer,
    bidOpportunities: bidOpportunitiesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;