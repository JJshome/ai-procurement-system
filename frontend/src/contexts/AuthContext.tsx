import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import jwt_decode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import { api } from '../store/api';

// 사용자 정보 인터페이스
interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  isActive: boolean;
  isSuperuser: boolean;
  roles: string[];
}

// 토큰 관련 인터페이스
interface TokenData {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresAt: string;
}

// JWT 페이로드 인터페이스
interface JwtPayload {
  sub: number;
  user_id: number;
  username: string;
  email: string;
  roles: string[];
  is_superuser: boolean;
  exp: number;
}

// 인증 컨텍스트 인터페이스
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  getAccessToken: () => string | null;
}

// 컨텍스트 생성
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 인증 프로바이더 컴포넌트
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // 로컬 스토리지에서 토큰 가져오기
  const getAccessToken = (): string | null => {
    return localStorage.getItem('accessToken');
  };

  // 토큰에서 사용자 정보 추출
  const getUserFromToken = (token: string): User | null => {
    try {
      const decodedToken = jwt_decode<JwtPayload>(token);
      
      return {
        id: decodedToken.user_id,
        username: decodedToken.username,
        email: decodedToken.email,
        isActive: true,
        isSuperuser: decodedToken.is_superuser,
        roles: decodedToken.roles || []
      };
    } catch (error) {
      console.error('토큰 디코딩 오류:', error);
      return null;
    }
  };

  // 인증 상태 확인
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      
      if (token) {
        try {
          // 토큰 만료 확인
          const decodedToken = jwt_decode<JwtPayload>(token);
          const currentTime = Date.now() / 1000;
          
          if (decodedToken.exp < currentTime) {
            // 토큰이 만료된 경우 리프레시 시도
            const refreshed = await refreshToken();
            if (!refreshed) {
              // 리프레시 실패 시 로그아웃
              logout();
            }
          } else {
            // 유효한 토큰이면 사용자 정보 설정
            setUser(getUserFromToken(token));
          }
        } catch (error) {
          console.error('인증 초기화 오류:', error);
          logout();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // 로그인 함수
  const login = async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    try {
      // API 호출 (예시)
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      
      // 실제 구현 시에는 API 서비스 사용
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('로그인 실패');
      }
      
      const data: TokenData = await response.json();
      
      // 토큰 저장
      localStorage.setItem('accessToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      localStorage.setItem('tokenExpires', data.expiresAt);
      
      // 사용자 정보 설정
      const userData = getUserFromToken(data.accessToken);
      setUser(userData);
      
      // 대시보드로 이동
      navigate('/dashboard');
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    // 로컬 스토리지 토큰 삭제
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpires');
    
    // 사용자 정보 초기화
    setUser(null);
    
    // 로그인 페이지로 이동
    navigate('/login');
  };

  // 토큰 갱신 함수
  const refreshToken = async (): Promise<boolean> => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    if (!refreshTokenValue) {
      return false;
    }
    
    try {
      // API 호출 (예시)
      const response = await fetch('/api/v1/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshTokenValue })
      });
      
      if (!response.ok) {
        throw new Error('토큰 갱신 실패');
      }
      
      const data: TokenData = await response.json();
      
      // 토큰 저장
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('tokenExpires', data.expiresAt);
      
      // 사용자 정보 업데이트
      const userData = getUserFromToken(data.accessToken);
      setUser(userData);
      
      return true;
    } catch (error) {
      console.error('토큰 갱신 오류:', error);
      return false;
    }
  };

  // 컨텍스트 값
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    getAccessToken
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 인증 컨텍스트 사용을 위한 훅
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
