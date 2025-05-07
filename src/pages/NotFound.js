import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Typography, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Home as HomeIcon } from '@mui/icons-material';

// 스타일드 컴포넌트
const NotFoundContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '80vh',
  textAlign: 'center',
  padding: theme.spacing(3),
}));

const ErrorCode = styled(Typography)(({ theme }) => ({
  fontSize: '10rem',
  fontWeight: 900,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    fontSize: '6rem',
  },
}));

const NotFound = () => {
  const theme = useTheme();

  return (
    <Container>
      <NotFoundContainer>
        <ErrorCode variant="h1">404</ErrorCode>
        
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
          페이지를 찾을 수 없습니다
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
          요청하신 페이지가 존재하지 않거나, 이동되었거나, 일시적으로 사용할 수 없는 상태입니다.
        </Typography>
        
        <Button
          component={RouterLink}
          to="/"
          variant="contained"
          color="primary"
          startIcon={<HomeIcon />}
          size="large"
          sx={{
            borderRadius: 2,
            py: 1.5,
            px: 3,
            fontWeight: 600,
            background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            '&:hover': {
              background: `linear-gradient(to right, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            }
          }}
        >
          홈으로 돌아가기
        </Button>
      </NotFoundContainer>
    </Container>
  );
};

export default NotFound;