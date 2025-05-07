import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Grid,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

// Redux 액션과 선택자
import { login, selectUserLoading, selectUserError } from '../store/slices/userSlice';

// 스타일드 컴포넌트
const LoginContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
}));

const LoginCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  maxWidth: 450,
  width: '100%',
  margin: 'auto',
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.12)',
}));

const Logo = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(4),
}));

const LogoImage = styled('img')({
  width: 200,
  height: 'auto',
});

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux 상태
  const loading = useSelector(selectUserLoading);
  const error = useSelector(selectUserError);
  
  // 로컬 상태
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // 폼 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'rememberMe' ? checked : value
    });
  };
  
  // 비밀번호 표시/숨김 토글
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // 로그인 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap();
      
      // 로그인 성공 후 대시보드로 이동
      navigate('/');
    } catch (err) {
      // 오류 처리는 리덕스에서 자동으로 수행
      console.error('Login failed:', err);
    }
  };
  
  // 데모 계정 로그인
  const handleDemoLogin = () => {
    dispatch(login({
      email: 'demo@example.com',
      password: 'password123'
    }));
  };
  
  return (
    <LoginContainer>
      <LoginCard sx={{ maxWidth: isMobile ? '90%' : 450 }}>
        <Logo>
          <LogoImage src="/assets/aips-banner.svg" alt="AI 공공조달 입찰 최적화 시스템" />
        </Logo>
        
        <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: 600 }}>
          로그인
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom align="center">
          계정 정보를 입력하여 시스템에 접속하세요
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="이메일 주소"
            name="email"
            autoComplete="email"
            autoFocus
            value={formData.email}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <Grid container sx={{ mt: 2 }}>
            <Grid item xs>
              <FormControlLabel
                control={
                  <Checkbox
                    name="rememberMe"
                    color="primary"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                  />
                }
                label="로그인 상태 유지"
              />
            </Grid>
            <Grid item>
              <Link to="/forgot-password" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  비밀번호 찾기
                </Typography>
              </Link>
            </Grid>
          </Grid>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              fontWeight: 600,
              background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
              '&:hover': {
                background: `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
              }
            }}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </Button>
          
          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              또는
            </Typography>
          </Divider>
          
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={handleDemoLogin}
            sx={{ mb: 2, py: 1.5, borderRadius: 2 }}
            disabled={loading}
          >
            데모 계정으로 시작하기
          </Button>
          
          <Grid container justifyContent="center" sx={{ mt: 2 }}>
            <Grid item>
              <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                계정이 없으신가요?
              </Typography>
            </Grid>
            <Grid item>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary" fontWeight={500}>
                  회원가입
                </Typography>
              </Link>
            </Grid>
          </Grid>
        </Box>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;