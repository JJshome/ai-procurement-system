import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';

// Store 및 테마
import { store } from './store';
import theme from './theme';

// 레이아웃
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// 인증 및 권한 관련
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './contexts/AuthContext';

// 페이지 컴포넌트
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import DocumentListPage from './pages/documents/DocumentListPage';
import DocumentDetailPage from './pages/documents/DocumentDetailPage';
import DocumentCreatePage from './pages/documents/DocumentCreatePage';
import TenderListPage from './pages/tenders/TenderListPage';
import TenderDetailPage from './pages/tenders/TenderDetailPage';
import TenderCreatePage from './pages/tenders/TenderCreatePage';
import AnalysisPage from './pages/analysis/AnalysisPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              {/* 인증 레이아웃 라우트 */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* 메인 레이아웃 라우트 (인증 필요) */}
              <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                
                {/* 문서 관련 라우트 */}
                <Route path="/documents" element={<DocumentListPage />} />
                <Route path="/documents/:id" element={<DocumentDetailPage />} />
                <Route path="/documents/create" element={<DocumentCreatePage />} />
                
                {/* 입찰 관련 라우트 */}
                <Route path="/tenders" element={<TenderListPage />} />
                <Route path="/tenders/:id" element={<TenderDetailPage />} />
                <Route path="/tenders/create" element={<TenderCreatePage />} />
                
                {/* 분석 라우트 */}
                <Route path="/analysis" element={<AnalysisPage />} />
                
                {/* 프로필 라우트 */}
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* 404 페이지 */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
