import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Chip,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tabs,
  Tab,
  useTheme,
  Rating,
  CircularProgress,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent
} from '@mui/material';
import {
  Check as CheckIcon,
  Description as DescriptionIcon,
  Assignment as AssignmentIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  CloudUpload as CloudUploadIcon,
  ExpandMore as ExpandMoreIcon,
  CloudDownload as DownloadIcon,
  Share as ShareIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  ArrowCircleRight as ArrowCircleRightIcon,
  Send as SendIcon,
  LocalOffer as TagIcon,
  Star as StarIcon
} from '@mui/icons-material';

// Redux 액션과 선택자
import {
  selectExtractedRequirements,
  selectAnalysisResult,
  selectCurrentStep,
  selectProgress,
  setCurrentStep,
  resetAnalysis
} from '../../store/slices/rfpAnalysisSlice';

// 진행 단계 정의
const steps = [
  'RFP 업로드',
  'AI 분석',
  '요구사항 검토',
  '문서 생성',
  '최종 검토'
];

// 탭 패널 컴포넌트
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`review-tabpanel-${index}`}
      aria-labelledby={`review-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const FinalReview = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Redux 상태
  const requirements = useSelector(selectExtractedRequirements);
  const analysisResult = useSelector(selectAnalysisResult);
  const currentStep = useSelector(selectCurrentStep);
  const progress = useSelector(selectProgress);
  
  // 로컬 상태
  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [documentRating, setDocumentRating] = useState(4.5);
  const [comments, setComments] = useState('');
  const [reviewChecklist, setReviewChecklist] = useState({
    compliant: true,
    technical: true,
    completeness: true,
    pricing: true,
    formatting: true
  });
  
  // 제출 시뮬레이션
  useEffect(() => {
    if (submitting) {
      const interval = setInterval(() => {
        setSubmitProgress(prev => {
          const next = prev + 10;
          if (next >= 100) {
            clearInterval(interval);
            setSubmitting(false);
            setSubmitted(true);
            setOpenSnackbar(true);
            return 100;
          }
          return next;
        });
      }, 300);
      
      return () => clearInterval(interval);
    }
  }, [submitting]);
  
  // 분석 결과가 없을 경우 처리
  useEffect(() => {
    if (!analysisResult) {
      navigate('/demo');
    }
  }, [analysisResult, navigate]);
  
  // 탭 변경 핸들러
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // 제출 확인 핸들러
  const handleOpenSubmitDialog = () => {
    setOpenDialog(true);
  };
  
  // 제출 핸들러
  const handleSubmit = () => {
    setOpenDialog(false);
    setSubmitting(true);
  };
  
  // 새 프로젝트 시작 핸들러
  const handleStartNewProject = () => {
    dispatch(resetAnalysis());
    navigate('/demo');
  };
  
  // 제출 날짜 및 마감일 계산
  const calculateDate = (daysFromNow) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // 우선순위 기반 요구사항 수 계산
  const highPriorityCount = requirements.filter(req => req.priority === '높음').length;
  const mediumPriorityCount = requirements.filter(req => req.priority === '중간').length;
  const lowPriorityCount = requirements.filter(req => req.priority === '낮음').length;
  
  // 카테고리 기반 요구사항 수 계산
  const functionalCount = requirements.filter(req => req.category === '기능적').length;
  const nonFunctionalCount = requirements.filter(req => req.category === '비기능적').length;
  
  return (
    <Box>
      {/* 제목 및 설명 */}
      <Typography variant="h4" gutterBottom>
        최종 검토 및 제출
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        생성된 입찰 문서를 최종 검토하고 제출합니다. 모든 내용이 정확한지 확인하고 필요한 경우 피드백을 남겨주세요.
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
      
      {/* 제출 중 표시 */}
      {submitting && (
        <Paper sx={{ p: 4, mb: 4, textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            입찰 문서 제출 중...
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            입찰 문서를 제출하고 있습니다. 잠시만 기다려주세요.
          </Typography>
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={submitProgress} 
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {submitProgress}% 완료
            </Typography>
          </Box>
        </Paper>
      )}
      
      {/* 제출 완료 표시 */}
      {submitted && (
        <Paper sx={{ p: 4, mb: 4, bgcolor: theme.palette.success.light + '20', border: `1px solid ${theme.palette.success.light}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h5" color="success.main">
              입찰 문서가 성공적으로 제출되었습니다!
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            참조 번호: BID-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
          </Typography>
          <Typography variant="body1" paragraph>
            제출 일시: {new Date().toLocaleString('ko-KR')}
          </Typography>
          <Typography variant="body1" paragraph>
            다음 단계: 검토 및 승인 프로세스가 시작되었습니다. 진행 상황은 이메일로 알려드립니다.
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AssignmentIcon />}
              onClick={handleStartNewProject}
            >
              새 프로젝트 시작
            </Button>
          </Box>
        </Paper>
      )}
      
      {!submitting && !submitted && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* 검토 탭 */}
            <Paper sx={{ width: '100%', mb: 3 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange}
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label="문서 개요" icon={<DescriptionIcon />} iconPosition="start" />
                  <Tab label="요구사항 검증" icon={<AssignmentTurnedInIcon />} iconPosition="start" />
                  <Tab label="체크리스트" icon={<CheckIcon />} iconPosition="start" />
                </Tabs>
              </Box>
              
              {/* 문서 개요 탭 */}
              <TabPanel value={activeTab} index={0}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    인공지능 기반 공공조달 입찰 최적화 시스템 구축 제안서
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    작성일: {new Date().toLocaleDateString('ko-KR')}
                  </Typography>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    포함된 섹션
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="요약문 (Executive Summary)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="회사 소개 (Company Profile)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="프로젝트 이해 (Project Understanding)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="솔루션 접근법 (Solution Approach)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="기술 사양 (Technical Specifications)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="구현 계획 (Implementation Plan)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText primary="비용 제안 (Cost Proposal)" />
                    </ListItem>
                  </List>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      문서 정보
                    </Typography>
                    <Box>
                      <IconButton color="primary" size="small" sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="primary" size="small">
                        <DownloadIcon />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>문서 크기:</strong> 2.4 MB
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>페이지 수:</strong> 42 페이지
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>마지막 수정일:</strong> {new Date().toLocaleDateString('ko-KR')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2">
                        <strong>생성 방법:</strong> AI 자동 생성
                      </Typography>
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      태그
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label="인공지능" color="primary" variant="outlined" size="small" />
                      <Chip label="블록체인" color="primary" variant="outlined" size="small" />
                      <Chip label="공공조달" color="primary" variant="outlined" size="small" />
                      <Chip label="자동화" color="primary" variant="outlined" size="small" />
                      <Chip label="입찰" color="primary" variant="outlined" size="small" />
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                      문서 평가
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        전반적인 평가:
                      </Typography>
                      <Rating value={documentRating} precision={0.5} readOnly />
                      <Typography variant="body2" sx={{ ml: 1 }}>
                        ({documentRating}/5)
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      AI 입찰 최적화 시스템의 요구사항을 완벽히 충족하는 완성도 높은 제안서입니다.
                    </Typography>
                  </Box>
                </Box>
              </TabPanel>
              
              {/* 요구사항 검증 탭 */}
              <TabPanel value={activeTab} index={1}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    요구사항 검증 결과
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    입찰 문서가 추출된 요구사항을 적절히 반영하는지 검증합니다.
                  </Typography>
                  
                  <Box sx={{ mb: 3 }}>
                    <Alert severity="success" sx={{ mb: 2 }}>
                      <AlertTitle>검증 완료 - 성공</AlertTitle>
                      모든 요구사항이 문서에 적절히 반영되었습니다.
                    </Alert>
                    
                    <Box sx={{ p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1, mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>요구사항 통계</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>총 요구사항 수:</strong> {requirements.length}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>반영된 요구사항 수:</strong> {requirements.length}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>우선순위 분포:</strong> 높음({highPriorityCount}), 중간({mediumPriorityCount}), 낮음({lowPriorityCount})
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body2">
                            <strong>카테고리 분포:</strong> 기능적({functionalCount}), 비기능적({nonFunctionalCount})
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  </Box>
                  
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                    요구사항 검증 상세
                  </Typography>
                  
                  <Accordion defaultExpanded>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">높은 우선순위 요구사항 ({highPriorityCount})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {requirements
                          .filter(req => req.priority === '높음')
                          .map((req, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckCircleIcon color="success" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={req.description} 
                                secondary={`카테고리: ${req.category}`} 
                              />
                            </ListItem>
                          ))
                        }
                      </List>
                    </AccordionDetails>
                  </Accordion>
                  
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">중간 우선순위 요구사항 ({mediumPriorityCount})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {requirements
                          .filter(req => req.priority === '중간')
                          .map((req, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckCircleIcon color="success" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={req.description} 
                                secondary={`카테고리: ${req.category}`} 
                              />
                            </ListItem>
                          ))
                        }
                      </List>
                    </AccordionDetails>
                  </Accordion>
                  
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="subtitle1">낮은 우선순위 요구사항 ({lowPriorityCount})</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List dense>
                        {requirements
                          .filter(req => req.priority === '낮음')
                          .map((req, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <CheckCircleIcon color="success" />
                              </ListItemIcon>
                              <ListItemText 
                                primary={req.description} 
                                secondary={`카테고리: ${req.category}`} 
                              />
                            </ListItem>
                          ))
                        }
                      </List>
                    </AccordionDetails>
                  </Accordion>
                </Box>
              </TabPanel>
              
              {/* 체크리스트 탭 */}
              <TabPanel value={activeTab} index={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    제출 전 최종 체크리스트
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    입찰 문서를 제출하기 전에 다음 항목들을 확인하세요.
                  </Typography>
                  
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked={reviewChecklist.compliant} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="요구사항 준수 확인" 
                        secondary="입찰 요구사항 및 규정을 모두 준수하였는지 확인하세요." 
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked={reviewChecklist.technical} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="기술적 정확성 확인" 
                        secondary="제안된 기술 사양과 접근방법이 정확하고 적절한지 확인하세요." 
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked={reviewChecklist.completeness} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="완전성 확인" 
                        secondary="필요한 모든 섭션과 문서가 포함되어 있는지 확인하세요." 
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked={reviewChecklist.pricing} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="가격 및 비용 확인" 
                        secondary="가격 책정이 정확하고 경쟁력이 있는지 확인하세요." 
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                    <ListItem>
                      <ListItemIcon>
                        <Checkbox checked={reviewChecklist.formatting} />
                      </ListItemIcon>
                      <ListItemText 
                        primary="포맷팅 및 판형 확인" 
                        secondary="문서의 포맷팅, 팁자법, 문법이 적절한지 확인하세요." 
                      />
                    </ListItem>
                  </List>
                </Box>
              </TabPanel>
            </Paper>
            
            {/* 피드백 섹션 */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                제출 전 추가 의견
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                입찰 문서에 대한 추가 의견이나 코멘트가 있으면 입력해주세요.
              </Typography>
              
              <TextField
                fullWidth
                multiline
                rows={4}
                variant="outlined"
                placeholder="추가 의견을 입력하세요..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="body2" color="text.secondary">
                위 의견은 문서에 포함되지 않으며, 내부 참고용으로만 사용됩니다.
              </Typography>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            {/* 제출 정보 패널 */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                제출 정보
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>발주 기관:</strong> {analysisResult?.client || '한국 정부 조달청'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>입찰 마감일:</strong> {calculateDate(10)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>예상 예산:</strong> {analysisResult?.estimatedBudget || '₉500,000,000 - ₉700,000,000'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2">
                    <strong>성공 확률:</strong> {analysisResult?.successProbability || 65}%
                  </Typography>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.grey[50], borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  입찰 프로세스 일정
                </Typography>
                <Timeline position="right" sx={{ my: 0, p: 0 }}>
                  <TimelineItem>
                    <TimelineOppositeContent sx={{ m: 'auto 0', flex: 0.2 }} color="text.secondary">
                      {new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot color="primary" />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="body2" component="span">
                        제안서 제출
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineOppositeContent sx={{ m: 'auto 0', flex: 0.2 }} color="text.secondary">
                      {calculateDate(3).slice(-5)}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="body2" component="span">
                        1차 검토
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineOppositeContent sx={{ m: 'auto 0', flex: 0.2 }} color="text.secondary">
                      {calculateDate(7).slice(-5)}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot />
                      <TimelineConnector />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="body2" component="span">
                        최종 평가
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                  <TimelineItem>
                    <TimelineOppositeContent sx={{ m: 'auto 0', flex: 0.2 }} color="text.secondary">
                      {calculateDate(14).slice(-5)}
                    </TimelineOppositeContent>
                    <TimelineSeparator>
                      <TimelineDot />
                    </TimelineSeparator>
                    <TimelineContent sx={{ py: '12px', px: 2 }}>
                      <Typography variant="body2" component="span">
                        결과 발표
                      </Typography>
                    </TimelineContent>
                  </TimelineItem>
                </Timeline>
              </Box>
            </Paper>
            
            {/* 작업 가이드 */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                작업 가이드
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" paragraph>
                1. 최종 검토 탭에서 문서의 내용을 검토하세요.
              </Typography>
              <Typography variant="body2" paragraph>
                2. 체크리스트를 확인하여 누락된 사항이 없는지 확인하세요.
              </Typography>
              <Typography variant="body2" paragraph>
                3. 필요한 경우 문서를 수정하거나 추가 의견을 남기세요.
              </Typography>
              <Typography variant="body2">
                4. '제출' 버튼을 클릭하여 입찰 문서를 제출하세요.
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* 하단 버튼 */}
      {!submitting && !submitted && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate('/demo/document-generation')}
            sx={{ mr: 2 }}
          >
            이전
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenSubmitDialog}
            startIcon={<SendIcon />}
          >
            제출
          </Button>
        </Box>
      )}
      
      {/* 제출 확인 다이얼로그 */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>입찰 문서 제출</DialogTitle>
        <DialogContent>
          <DialogContentText>
            입찰 문서를 제출하시겠습니까? 제출 후에는 수정이 불가능합니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            취소
          </Button>
          <Button onClick={handleSubmit} color="primary" autoFocus>
            제출
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 제출 완료 스낵바 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message="입찰 문서가 성공적으로 제출되었습니다"
      />
    </Box>
  );
};

export default FinalReview;