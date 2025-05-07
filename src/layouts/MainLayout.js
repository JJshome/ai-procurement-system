import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  InputBase,
  useMediaQuery,
} from '@mui/material';

// 아이콘
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SearchIcon from '@mui/icons-material/Search';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import GroupsIcon from '@mui/icons-material/Groups';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PersonIcon from '@mui/icons-material/Person';
import HelpIcon from '@mui/icons-material/Help';

// 리덕스 액션과 셀렉터
import { selectUser, logout } from '../store/slices/userSlice';

// 상수
const drawerWidth = 240;

// 스타일 컴포넌트
const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const AppBarStyled = styled(AppBar, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    backgroundColor: theme.palette.primary.main,
    backgroundImage: 'linear-gradient(to right, #3B82F6, #2563EB)',
    ...(open && {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: `${drawerWidth}px`,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  }),
);

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const SearchBox = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
  },
}));

// 메인 레이아웃 컴포넌트
const MainLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(!isMobile);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  
  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotificationMenuOpen = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setNotificationAnchorEl(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    navigate('/login');
  };
  
  const handleProfileClick = () => {
    handleMenuClose();
    navigate('/settings');
  };
  
  const menuItems = [
    { text: '대시보드', icon: <DashboardIcon />, path: '/' },
    { text: '입찰 기회 탐색', icon: <SearchIcon />, path: '/bid-opportunities' },
    { text: '문서 생성기', icon: <DescriptionIcon />, path: '/document-generator' },
    { text: '전략 분석', icon: <TrendingUpIcon />, path: '/strategy-analysis' },
    { text: '경쟁사 분석', icon: <CompareArrowsIcon />, path: '/competitor-analysis' },
    { text: '협업 도구', icon: <GroupsIcon />, path: '/collaboration' },
  ];
  
  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ display: { xs: 'none', sm: 'block' } }}>
            AI 공공조달 입찰 최적화 시스템
          </Typography>
          
          <SearchBox>
            <SearchIconWrapper>
              <SearchIcon />
            </SearchIconWrapper>
            <StyledInputBase
              placeholder="검색..."
              inputProps={{ 'aria-label': 'search' }}
            />
          </SearchBox>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex' }}>
            <IconButton
              size="large"
              aria-label="show 4 new notifications"
              color="inherit"
              onClick={handleNotificationMenuOpen}
            >
              <Badge badgeContent={4} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar
                sx={{ width: 32, height: 32, bgcolor: theme.palette.secondary.main }}
                alt={user?.name || 'User'}
                src={user?.avatar}
              >
                {user?.name ? user.name.charAt(0) : 'U'}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBarStyled>
      
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={handleDrawerClose}
      >
        <DrawerHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', px: 2 }}>
            <Typography variant="h6" color="primary" sx={{ flexGrow: 1 }}>
              AIPS
            </Typography>
            <IconButton onClick={handleDrawerClose}>
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </DrawerHeader>
        
        <Divider />
        
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: '0 20px 20px 0',
                  mb: 0.5,
                  mx: 1,
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    '&:hover': {
                      bgcolor: 'primary.light',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'primary.main',
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        <Divider />
        
        <List>
          <ListItem disablePadding>
            <ListItemButton
              selected={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
              sx={{
                borderRadius: '0 20px 20px 0',
                mb: 0.5,
                mx: 1,
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: location.pathname === '/settings' ? 'primary.main' : 'text.secondary',
                }}
              >
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="설정" />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      
      <Main open={open}>
        <DrawerHeader />
        <Outlet />
      </Main>
      
      {/* 프로필 메뉴 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 2,
          sx: { minWidth: 180 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">{user?.email}</Typography>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>프로필</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => window.open('/help', '_blank')}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>도움말</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <ExitToAppIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>로그아웃</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* 알림 메뉴 */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 2,
          sx: { minWidth: 300, maxWidth: 320 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
            알림
          </Typography>
        </MenuItem>
        <Divider />
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              국방부 사이버보안 강화 입찰 추천
            </Typography>
            <Typography variant="caption" color="text.secondary">
              1시간 전
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              교육부 디지털 교육 플랫폼 제안서 생성 완료
            </Typography>
            <Typography variant="caption" color="text.secondary">
              3시간 전
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              환경부 재활용 시스템 입찰 마감 3일 전
            </Typography>
            <Typography variant="caption" color="text.secondary">
              어제
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              신규 입찰 기회 15건 발견
            </Typography>
            <Typography variant="caption" color="text.secondary">
              2일 전
            </Typography>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem sx={{ justifyContent: 'center' }}>
          <Typography variant="body2" color="primary">
            모든 알림 보기
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default MainLayout;