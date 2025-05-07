import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 로컬 스토리지에서 저장된 토큰 불러오기
const getStoredToken = () => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.error('localStorage is not available:', error);
    return null;
  }
};

// 초기 상태 정의
const initialState = {
  user: null,
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  loading: false,
  error: null,
};

// 비동기 액션 생성자
export const login = createAsyncThunk(
  'user/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // 실제 API 연동 시 axios.post로 변경
      // const response = await axios.post('/api/auth/login', credentials);
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 시뮬레이션된 응답
      const mockUser = {
        id: 'user-1',
        email: credentials.email,
        name: '홍길동',
        role: 'admin',
        company: '스마트 테크놀로지 솔루션즈',
        avatar: '/assets/avatars/user-1.jpg',
      };
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      // 토큰 저장
      try {
        localStorage.setItem('authToken', mockToken);
      } catch (error) {
        console.error('localStorage is not available:', error);
      }
      
      return {
        user: mockUser,
        token: mockToken,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const register = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      // 실제 API 연동 시 axios.post로 변경
      // const response = await axios.post('/api/auth/register', userData);
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 시뮬레이션된 응답
      const mockUser = {
        id: 'user-' + Date.now(),
        email: userData.email,
        name: userData.name,
        role: 'user',
        company: userData.company,
        avatar: '/assets/avatars/default.jpg',
      };
      
      const mockToken = 'mock-jwt-token-' + Date.now();
      
      // 토큰 저장
      try {
        localStorage.setItem('authToken', mockToken);
      } catch (error) {
        console.error('localStorage is not available:', error);
      }
      
      return {
        user: mockUser,
        token: mockToken,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().user;
      
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // 실제 API 연동 시 axios.get으로 변경
      // const response = await axios.get('/api/user/profile', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 시뮬레이션된 응답
      return {
        id: 'user-1',
        email: 'hong.gildong@smarttech.com',
        name: '홍길동',
        role: 'admin',
        company: '스마트 테크놀로지 솔루션즈',
        avatar: '/assets/avatars/user-1.jpg',
        department: '기술개발부',
        position: 'AI 팀장',
        phone: '010-1234-5678',
        lastLogin: '2023-08-15T09:45:12Z',
        joinDate: '2021-03-10T00:00:00Z',
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const logout = createAsyncThunk(
  'user/logout',
  async (_, { rejectWithValue }) => {
    try {
      // 실제 API 연동 시 axios.post로 변경
      // await axios.post('/api/auth/logout');
      
      // 토큰 제거
      try {
        localStorage.removeItem('authToken');
      } catch (error) {
        console.error('localStorage is not available:', error);
      }
      
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 슬라이스 생성
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserProfile: (state, action) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // login 액션 처리
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '로그인 중 오류가 발생했습니다.';
      })
      
      // register 액션 처리
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '회원가입 중 오류가 발생했습니다.';
      })
      
      // fetchUserProfile 액션 처리
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '사용자 정보를 불러오는 중 오류가 발생했습니다.';
        
        // 인증 오류인 경우 로그아웃 처리
        if (action.payload?.includes('token') || action.payload?.includes('Authentication')) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
          
          try {
            localStorage.removeItem('authToken');
          } catch (error) {
            console.error('localStorage is not available:', error);
          }
        }
      })
      
      // logout 액션 처리
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '로그아웃 중 오류가 발생했습니다.';
        // 오류가 발생해도 로그아웃은 진행
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

// 액션 생성자 내보내기
export const { clearError, updateUserProfile } = userSlice.actions;

// 선택자 함수 내보내기
export const selectUser = (state) => state.user.user;
export const selectToken = (state) => state.user.token;
export const selectIsAuthenticated = (state) => state.user.isAuthenticated;
export const selectUserLoading = (state) => state.user.loading;
export const selectUserError = (state) => state.user.error;

// 리듀서 내보내기
export default userSlice.reducer;