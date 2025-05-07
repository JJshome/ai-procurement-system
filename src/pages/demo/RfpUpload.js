import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Grid, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemButton,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Step,
  StepLabel,
  Stepper,
  LinearProgress,
  useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  CloudUpload as CloudUploadIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Code as CodeIcon,
  TextSnippet as TextIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';

// Redux 액션과 선택자
import { 
  uploadRfpDocument, 
  selectRfpDocument, 
  selectLoading, 
  selectError,
  selectCurrentStep,
  selectProgress
} from '../../store/slices/rfpAnalysisSlice';

// 드래그 앤 드롭 영역 스타일링
const UploadBox = styled(Paper)(({ theme, isDragActive }) => ({
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  cursor: 'pointer',
  border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.grey[300]}`,
  backgroundColor: isDragActive ? theme.palette.primary.light + '20' : theme.palette.background.paper,
  height: 240,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    backgroundColor: theme.palette.primary.light + '10',
    borderColor: theme.palette.primary.light,
  }
}));

// 파일 아이콘 선택 함수
const getFileIcon = (fileType) => {
  if (fileType.includes('pdf')) return <PdfIcon color="error" />;
  if (fileType.includes('word') || fileType.includes('document')) return <DescriptionIcon color="primary" />;
  if (fileType.includes('text')) return <TextIcon color="success" />;
  if (fileType.includes('json') || fileType.includes('xml')) return <CodeIcon color="secondary" />;
  return <DescriptionIcon color="action" />;
};

// 진행 단계 정의
const steps = [
  'RFP 업로드',
  'AI 분석',
  '요구사항 검토',
  '문서 생성',
  '최종 검토'
];

const RfpUpload = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Redux 상태
  const rfpDocument = useSelector(selectRfpDocument);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
  const currentStep = useSelector(selectCurrentStep);
  const progress = useSelector(selectProgress);
  
  // 로컬 상태
  const [dragActive, setDragActive] = useState(false);
  const [recentDocuments, setRecentDocuments] = useState([
    {
      id: 'doc-1',
      name: '국토교통부_철도인프라개선_RFP.pdf',
      type: 'application/pdf',
      size: 2456310,
      uploadDate: '2023-08-03T12:30:45Z'
    },
    {
      id: 'doc-2',
      name: '환경부_지속가능개발_RFP.docx',
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: 1845632,
      uploadDate: '2023-07-28T09:15:32Z'
    }
  ]);
  
  // 파일 업로드 핸들러
  const handleFileUpload = useCallback((files) => {
    if (!files || files.length === 0) return;
    
    const file = files[0]; // 단일 파일만 처리
    
    // 지원되는 파일 형식 검사
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      alert('지원되지 않는 파일 형식입니다. PDF, DOCX, TXT 파일만 업로드 가능합니다.');
      return;
    }
    
    // 파일 크기 제한 (20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('파일 크기가 너무 큽니다. 최대 20MB까지 업로드 가능합니다.');
      return;
    }
    
    // Redux 액션 디스패치
    dispatch(uploadRfpDocument(file));
  }, [dispatch]);
  
  // 드래그 이벤트 핸들러
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);
  
  // 드롭 이벤트 핸들러
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);
  
  // 파일 입력 필드 클릭 핸들러
  const handleInputChange = useCallback((e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);
  
  // 최근 문서 클릭 핸들러
  const handleRecentDocumentClick = useCallback((document) => {
    // 실제로는 서버에서 파일을 가져와야 하지만, 시뮬레이션을 위해 가짜 파일 객체 생성
    const mockFile = new File([''], document.name, { type: document.type });
    Object.defineProperty(mockFile, 'size', { value: document.size });
    
    dispatch(uploadRfpDocument(mockFile));
  }, [dispatch]);
  
  // 다음 단계로 이동 버튼 클릭 핸들러
  const handleNext = useCallback(() => {
    if (rfpDocument) {
      navigate('/demo/rfp-analysis');
    }
  }, [navigate, rfpDocument]);
  
  // 문서 업로드 성공 시 자동으로 다음 단계로 이동
  useEffect(() => {
    if (rfpDocument && currentStep === 2) {
      // 잠시 대기 후 다음 단계로 이동 (UX 개선을 위해)
      const timer = setTimeout(() => {
        navigate('/demo/rfp-analysis');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [rfpDocument, currentStep, navigate]);
  
  // 파일 크기 포맷팅 함수
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    
    return new Intl.DateTimeFormat('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };
  
  return (
    <Box>
      {/* 제목 및 설명 */}
      <Typography variant="h4" gutterBottom>
        RFP 문서 업로드
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        분석할 공공조달 RFP(Request for Proposal) 문서를 업로드해주세요. PDF, DOCX, TXT 형식의 파일을 지원합니다.
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
        <Grid item xs={12} md={8}>
          {/* 파일 업로드 영역 */}
          <Box component="form" noValidate>
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.docx,.doc,.txt"
              style={{ display: 'none' }}
              onChange={handleInputChange}
            />
            <label htmlFor="file-upload" style={{ width: '100%' }}>
              <UploadBox
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                isDragActive={dragActive}
              >
                {loading ? (
                  <>
                    <LinearProgress sx={{ width: '50%', mb: 2 }} />
                    <Typography variant="h6" color="primary" gutterBottom>
                      업로드 중...
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      잠시만 기다려주세요.
                    </Typography>
                  </>
                ) : (
                  <>
                    <CloudUploadIcon color="primary" sx={{ fontSize: 60, mb: 2 }} />
                    <Typography variant="h6" color="primary" gutterBottom>
                      파일을 여기에 끌어다 놓거나
                    </Typography>
                    <Button
                      component="span"
                      variant="contained"
                      color="primary"
                      sx={{ mt: 2 }}
                    >
                      파일 찾아보기
                    </Button>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      지원 파일 형식: PDF, DOCX, TXT (최대 20MB)
                    </Typography>
                  </>
                )}
              </UploadBox>
            </label>
            
            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                오류: {error}
              </Typography>
            )}
          </Box>
          
          {/* 지원 파일 형식 정보 */}
          <Paper sx={{ mt: 3, p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              지원 파일 형식:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PdfIcon color="error" sx={{ mr: 1 }} />
                  <Typography>PDF 문서</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography>DOCX 문서</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextIcon color="success" sx={{ mr: 1 }} />
                  <Typography>TXT 파일</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          {/* 최근 문서 */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              최근 문서
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <List sx={{ width: '100%' }}>
              {recentDocuments.map((document) => (
                <ListItem 
                  key={document.id}
                  disablePadding
                  sx={{ 
                    mb: 1,
                    backgroundColor: theme.palette.background.paper,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                    }
                  }}
                >
                  <ListItemButton onClick={() => handleRecentDocumentClick(document)}>
                    <ListItemIcon>
                      {getFileIcon(document.type)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={document.name}
                      secondary={`${formatFileSize(document.size)}`}
                      primaryTypographyProps={{ 
                        noWrap: true,
                        style: { maxWidth: '100%' }
                      }}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" aria-label="time">
                        <AccessTimeIcon fontSize="small" color="action" />
                      </IconButton>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {formatDate(document.uploadDate)}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
          
          {/* 작업 가이드 */}
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              작업 가이드
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="body2" paragraph>
              1. RFP 문서를 업로드하세요.
            </Typography>
            <Typography variant="body2" paragraph>
              2. AI가 자동으로 문서를 분석하고 주요 요구사항을 추출합니다.
            </Typography>
            <Typography variant="body2" paragraph>
              3. 추출된 요구사항을 검토하고 필요시 수정하세요.
            </Typography>
            <Typography variant="body2" paragraph>
              4. 맞춤형 입찰 제안서를 자동으로 생성합니다.
            </Typography>
            <Typography variant="body2">
              5. 최종 검토 후 문서를 다운로드하세요.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* 하단 버튼 */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          color="inherit"
          sx={{ mr: 2 }}
          onClick={() => navigate('/')}
        >
          취소
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleNext}
          disabled={loading || !rfpDocument}
        >
          다음
        </Button>
      </Box>
    </Box>
  );
};

export default RfpUpload;