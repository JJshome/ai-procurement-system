import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  useTheme,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Search as SearchIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Event as EventIcon,
  NotificationsActive as NotificationsActiveIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

// 차트 컴포넌트
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Redux 액션과 선택자
import { fetchRecommendedOpportunities, selectRecommendedOpportunities } from '../store/slices/bidOpportunitiesSlice';
import { selectUser } from '../store/slices/userSlice';

// 차트 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux 상태
  const user = useSelector(selectUser);
  const recommendedOpportunities = useSelector(selectRecommendedOpportunities);
  
  // 로컬 상태
  const [stats, setStats] = useState({
    newOpportunities: 428,
    activeProposals: 36,
    completedBids: 82,
    successRate: 68,
  });
  
  // 컴포넌트 마운트 시 추천 입찰 기회 로드
  useEffect(() => {
    dispatch(fetchRecommendedOpportunities());
  }, [dispatch]);
  
  // 차트 데이터
  const lineChartData = {
    labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월'],
    datasets: [
      {
        label: '입찰 참여',
        data: [30, 42, 55, 40, 65, 75, 85],
        borderColor: theme.palette.primary.main,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: '낙찰 성공',
        data: [10, 15, 20, 35, 40, 50, 55],
        borderColor: theme.palette.success.main,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };
  
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  const barChartData = {
    labels: ['국방부', '교육부', '환경부', '과기정통부', '국토교통부'],
    datasets: [
      {
        label: '입찰 참여 수',
        data: [28, 35, 42, 25, 30],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
        ],
        borderRadius: 4,
      },
    ],
  };
  
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };
  
  const doughnutChartData = {
    labels: ['IT 서비스', '인프라 구축', '소프트웨어 개발', '컨설팅', '기타'],
    datasets: [
      {
        data: [40, 25, 20, 10, 5],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.grey[400],
        ],
        borderWidth: 0,
      },
    ],
  };
  
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          font: {
            size: 10,
          },
        },
      },
    },
    cutout: '70%',
  };
  
  // 입찰 기회 카드 렌더링
  const renderOpportunityCard = (opportunity) => (
    <Card 
      key={opportunity.id}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: theme.shadows[10],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          {opportunity.title}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip
            label={opportunity.agency}
            size="small"
            sx={{ 
              bgcolor: theme.palette.primary.light,
              color: theme.palette.primary.contrastText,
            }}
          />
          <Chip
            label={opportunity.category}
            size="small"
            sx={{ 
              bgcolor: theme.palette.secondary.light,
              color: theme.palette.secondary.contrastText,
            }}
          />
          <Chip
            label={opportunity.status === 'active' ? '진행중' : '예정됨'}
            size="small"
            sx={{ 
              bgcolor: opportunity.status === 'active' 
                ? theme.palette.success.light 
                : theme.palette.warning.light,
              color: opportunity.status === 'active'
                ? theme.palette.success.contrastText
                : theme.palette.warning.contrastText,
            }}
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
          {opportunity.description.substring(0, 120)}...
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            일치율
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress 
                variant="determinate" 
                value={opportunity.matchScore} 
                sx={{ 
                  height: 8, 
                  borderRadius: 5,
                  backgroundColor: theme.palette.grey[200],
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: opportunity.matchScore > 90
                      ? theme.palette.success.main
                      : opportunity.matchScore > 80
                        ? theme.palette.primary.main
                        : theme.palette.warning.main,
                  }
                }}
              />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">
                {`${opportunity.matchScore}%`}
              </Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EventIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
          <Typography variant="body2">
            마감일: {new Date(opportunity.deadline).toLocaleDateString('ko-KR')}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AssessmentIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
          <Typography variant="body2">
            성공 확률: {opportunity.successProbability}%
          </Typography>
        </Box>
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button 
          size="small" 
          color="primary"
          variant="outlined"
          endIcon={<ArrowForwardIcon />}
          onClick={() => navigate(`/bid-opportunities/${opportunity.id}`)}
          sx={{ borderRadius: 20 }}
        >
          상세 보기
        </Button>
      </CardActions>
    </Card>
  );
  
  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          안녕하세요, {user?.name || '사용자'}님! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary">
          오늘의 입찰 현황 및 추천 입찰 기회를 확인하세요.
        </Typography>
      </Box>
      
      {/* 통계 카드 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
              color: 'white',
              boxShadow: theme.shadows[3],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  mr: 2,
                }}
              >
                <SearchIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  신규 입찰 기회
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.newOpportunities}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              전월 대비 12% 증가
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
              color: 'white',
              boxShadow: theme.shadows[3],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  mr: 2,
                }}
              >
                <AssignmentIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  진행 중인 입찰
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.activeProposals}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              현재 진행 중인 입찰 건수
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`,
              color: 'white',
              boxShadow: theme.shadows[3],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  mr: 2,
                }}
              >
                <TimelineIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  완료된 입찰
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.completedBids}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              전월 대비 8% 증가
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${theme.palette.error.light}, ${theme.palette.error.main})`,
              color: 'white',
              boxShadow: theme.shadows[3],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  mr: 2,
                }}
              >
                <TrendingUpIcon sx={{ fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  성공률
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {stats.successRate}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              전월 대비 15% 향상
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 차트 및 그래프 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              월별 입찰 현황
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300 }}>
              <Line data={lineChartData} options={lineChartOptions} />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              분야별 입찰 비율
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 기관별 입찰 참여 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              기관별 입찰 참여
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 250 }}>
              <Bar data={barChartData} options={barChartOptions} />
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 추천 입찰 기회 및 알림 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight="medium">
                AI 추천 입찰 기회
              </Typography>
              <Button 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/bid-opportunities')}
              >
                모두 보기
              </Button>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              {recommendedOpportunities.length > 0 ? (
                recommendedOpportunities.map((opportunity) => (
                  <Grid item xs={12} md={6} lg={4} key={opportunity.id}>
                    {renderOpportunityCard(opportunity)}
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography align="center" color="text.secondary" sx={{ py: 5 }}>
                    추천 입찰 기회를 불러오는 중입니다...
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" fontWeight="medium">
                알림
              </Typography>
              <Button 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/notifications')}
              >
                모두 보기
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <List>
              <ListItem sx={{ px: 0, pb: 2 }}>
                <ListItemIcon>
                  <NotificationsActiveIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="국방부 사이버보안 강화 입찰 추천"
                  secondary="1시간 전"
                />
              </ListItem>
              
              <ListItem sx={{ px: 0, pb: 2 }}>
                <ListItemIcon>
                  <NotificationsActiveIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="교육부 디지털 교육 플랫폼 제안서 생성 완료"
                  secondary="3시간 전"
                />
              </ListItem>
              
              <ListItem sx={{ px: 0, pb: 2 }}>
                <ListItemIcon>
                  <NotificationsActiveIcon color="warning" />
                </ListItemIcon>
                <ListItemText
                  primary="환경부 재활용 시스템 입찰 마감 3일 전"
                  secondary="어제"
                />
              </ListItem>
              
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon>
                  <NotificationsActiveIcon color="info" />
                </ListItemIcon>
                <ListItemText
                  primary="신규 입찰 기회 15건 발견"
                  secondary="2일 전"
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;