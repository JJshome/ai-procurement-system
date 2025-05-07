import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  CircularProgress,
  Step,
  StepLabel,
  Stepper,
  LinearProgress,
  useTheme,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  SyncProblem as SyncProblemIcon,
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
  BusinessCenter as BusinessCenterIcon,
  Person as PersonIcon,
  CalendarToday as CalendarTodayIcon,
  Psychology as PsychologyIcon,
  CompareArrows as CompareArrowsIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import { styled, keyframes } from '@mui/material/styles';

// Redux 액션과 선택자
import {
  analyzeRfpDocument,
  selectRfpDocument,
  selectAnalysisResult,
  selectLoading,
  selectError,
  selectCurrentStep,
  selectProgress,
  setCurrentStep,
} from '../../store/slices/rfpAnalysisSlice';

// 진행 단계 정의
const steps = [
  'RFP 업로드',
  'AI 분석',
  '요구사항 검토',
  '문서 생성',
  '최종 검토'
];

// 애니메이션 정의
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
`;

const scale = keyframes`
  0% {
    transform: scale(0.95);
  }
  70% {
    transform: scale(1);
  }
  100% {
    transform: scale(0.95);
  }
`;

// 스타일드 컴포넌트
const AnalysisCard = styled(Card)(({ theme, active }) => ({
  padding: theme.spacing(2),
  height: '100%',
  position: 'relative',
  transition: 'all 0.3s ease-in-out',
  transform: active ? 'scale(1.02)' : 'scale(1)',
  border: active ? `2px solid ${theme.palette.primary.main}` : 'none',
  boxShadow: active 
    ? `0 4px 20px rgba(59, 130, 246, 0.2)`
    : theme.shadows[1],
  ...(active && {
    animation: `${pulse} 2s infinite`
  })
}));

const AnalysisIconWrapper = styled(Box)(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: active ? theme.palette.primary.main : theme.palette.grey[100],
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s ease-in-out',
  ...(active && {
    animation: `${scale} 3s infinite`
  })
}));

const RfpAnalysis = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux 상태
  const rfpDocument = useSelector(selectRfpDocument);
  const analysisResult = useSelector(selectAnalysisResult);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const currentStep = useSelector(selectCurrentStep);
  const progress = useSelector(selectProgress);
  
  // 로컬 상태
  const [analysisSteps, setAnalysisSteps] = useState([
    { id: 'extract', name: '문서 텍스트 추출', complete: false, active: false },
    { id: 'nlp', name: '자연어 처리 분석', complete: false, active: false },
    { id: 'requirements', name: '요구사항 식별', complete: false, active: false },
    { id: 'metadata', name: '메타데이터 추출', complete: false, active: false },
    { id: 'classification', name: '분류 및 우선순위 지정', complete: false, active: false },
    { id: 'summarize', name: '요약 및 결과 생성', complete: false, active: false }
  ]);
  
  // 분석 시작
  useEffect(() => {
    if (rfpDocument && !analysisResult && !loading) {
      // 분석 시작 후 첫 번째 단계 활성화
      setAnalysisSteps(prev => {
        const updated = [...prev];
        updated[0].active = true;
        return updated;
      });
      
      dispatch(analyzeRfpDocument(rfpDocument.id));
    }
  }, [rfpDocument, analysisResult, loading, dispatch]);
  
  // 분석 단계 시뮬레이션
  useEffect(() => {
    if (loading && !analysisResult) {
      let currentStepIndex = 0;
      
      // 단계별 시뮬레이션 타이머
      const simulateAnalysisSteps = () => {
        if (currentStepIndex < analysisSteps.length) {
          setAnalysisSteps(prev => {
            const updated = [...prev];
            
            // 이전 단계 완료 처리
            if (currentStepIndex > 0) {
              updated[currentStepIndex - 1].active = false;
              updated[currentStepIndex - 1].complete = true;
            }
            
            // 현재 단계 활성화
            updated[currentStepIndex].active = true;
            
            return updated;
          });
          
          currentStepIndex++;
          
          // 다음 단계 타이머 설정 (각 단계마다 다른 시간 설정)
          const nextDelay = 500 + Math.random() * 700;
          setTimeout(simulateAnalysisSteps, nextDelay);
        }
      };
      
      // 첫 단계는 이미 활성화되어 있으므로 다음 단계부터 시작
      currentStepIndex = 1;
      setTimeout(simulateAnalysisSteps, 800);
    }
  }, [loading, analysisResult, analysisSteps]);
  
  // 분석 완료 시 마지막 단계 처리
  useEffect(() => {
    if (analysisResult && !loading) {
      setAnalysisSteps(prev => {
        return prev.map(step => ({
          ...step,
          active: false,
          complete: true
        }));
      });
      
      // 잠시 대기 후 다음 단계로 이동
      const timer = setTimeout(() => {
        navigate('/demo/requirements-review');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [analysisResult, loading, navigate]);
  
  // 분석 취소 처리
  const handleCancel = () => {
    navigate('/demo');
  };
  
  // 수동으로 다음 단계로 이동
  const handleNext = () => {
    if (analysisResult) {
      navigate('/demo/requirements-review');
    }
  };
  
  // 요구사항 우선순위에 따른 색상 반환
  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case '높음':
        return theme.palette.error.main;
      case '중간':
        return theme.palette.warning.main;
      case '낮음':
        return theme.palette.success.main;
      default:
        return theme.palette.text.secondary;
    }
  };
  
  return (
    <Box>
      {/* 제목 및 설명 */}
      <Typography variant="h4" gutterBottom>
        RFP 문서 분석
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        AI가 RFP 문서를 분석하고 핵심 요구사항 및 정보를 추출하고 있습니다.
      </Typography>
      
      {/* 진행 단계 표시 */}
      <Box sx={{ mt: 2, mb: 4 }}>
        <Stepper activeStep={currentStep - 1} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <Box sx={{ width: '100%', mr: 1 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{ 
                height: 8, 
                borderRadius: 5,
                backgroundColor: theme.palette.grey[200],
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  backgroundImage: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                }
              }}
            />
          </Box>
          <Box sx={{ minWidth: 35 }}>
            <Typography variant="body2" color="text.secondary">
              {`${progress}%`}
            </Typography>
          </Box>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        {/* 분석 프로세스 */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              분석 프로세스
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              {analysisSteps.map((step, index) => (
                <Grid item xs={12} sm={6} key={step.id}>
                  <AnalysisCard active={step.active}>
                    <AnalysisIconWrapper active={step.active}>
                      {step.complete ? (
                        <CheckCircleOutlineIcon 
                          sx={{ 
                            fontSize: 30, 
                            color: step.active ? 'white' : theme.palette.success.main 
                          }} 
                        />
                      ) : step.active ? (
                        <AutoAwesomeIcon sx={{ fontSize: 30, color: 'white' }} />
                      ) : (
                        <SyncProblemIcon sx={{ fontSize: 30, color: theme.palette.grey[500] }} />
                      )}
                    </AnalysisIconWrapper>
                    
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      {index + 1}. {step.name}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary">
                      {step.complete 
                        ? '완료' 
                        : step.active 
                          ? '진행 중...' 
                          : '대기 중'}
                    </Typography>
                    
                    {step.active && (
                      <LinearProgress 
                        sx={{ 
                          mt: 2,
                          borderRadius: 5,
                          height: 6,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                          }
                        }} 
                      />
                    )}
                  </AnalysisCard>
                </Grid>
              ))}
            </Grid>
            
            {error && (
              <Box sx={{ mt: 3, p: 2, bgcolor: theme.palette.error.light, borderRadius: 1 }}>
                <Typography variant="subtitle2" color="error">
                  오류가 발생했습니다: {error}
                </Typography>
                <Button 
                  variant="outlined" 
                  color="error" 
                  size="small" 
                  sx={{ mt: 1 }}
                  onClick={() => navigate('/demo')}
                >
                  다시 시도
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* 분석 결과 미리보기 */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              분석 결과 미리보기
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {loading && !analysisResult ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
                <Typography variant="subtitle1">분석 진행 중...</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  AI가 문서를 분석하고 있습니다.<br />잠시만 기다려주세요.
                </Typography>
              </Box>
            ) : analysisResult ? (
              <Box>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    문서 요약
                  </Typography>
                  <Typography variant="body2">
                    {analysisResult.summary}
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    주요 항목
                  </Typography>
                  <List dense>
                    {analysisResult.keyPoints.slice(0, 3).map((point, index) => (
                      <ListItem key={index}>
                        <ListItemIcon>
                          <LightbulbIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={point} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Card sx={{ backgroundColor: theme.palette.grey[50] }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarTodayIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                          <Typography variant="subtitle2">마감일</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          {new Date(analysisResult.deadline).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6}>
                    <Card sx={{ backgroundColor: theme.palette.grey[50] }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AttachMoneyIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                          <Typography variant="subtitle2">예상 예산</Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          {analysisResult.estimatedBudget}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    요구사항 샘플
                  </Typography>
                  <List dense>
                    {analysisResult.requirements.slice(0, 3).map((req, index) => (
                      <ListItem key={req.id}>
                        <ListItemIcon>
                          <AssignmentIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={req.description}
                          secondary={
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip 
                                label={req.category} 
                                size="small" 
                                sx={{ 
                                  bgcolor: theme.palette.primary.light,
                                  color: theme.palette.primary.contrastText,
                                  fontSize: '0.7rem',
                                }} 
                              />
                              <Chip 
                                label={req.priority} 
                                size="small" 
                                sx={{ 
                                  bgcolor: getPriorityColor(req.priority),
                                  color: '#fff',
                                  fontSize: '0.7rem',
                                }} 
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleNext}
                    endIcon={<Analytics />}
                  >
                    전체 결과 보기
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8 }}>
                <AssignmentIcon sx={{ fontSize: 60, color: theme.palette.grey[400], mb: 2 }} />
                <Typography variant="subtitle1" color="text.secondary">
                  분석을 시작하면 결과가 여기에 표시됩니다.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* 하단 버튼 */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="inherit"
          sx={{ mr: 2 }}
          onClick={handleCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          disabled={loading || !analysisResult}
        >
          다음
        </Button>
      </Box>
    </Box>
  );
};

export default RfpAnalysis;