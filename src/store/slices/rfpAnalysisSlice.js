import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 초기 상태 정의
const initialState = {
  rfpDocument: null,
  analysisResult: null,
  extractedRequirements: [],
  loading: false,
  error: null,
  currentStep: 1, // 1: 업로드, 2: 분석, 3: 요구사항 검토, 4: 문서 생성, 5: 최종 검토
  progress: 0,
};

// 비동기 액션 생성자
export const uploadRfpDocument = createAsyncThunk(
  'rfpAnalysis/uploadRfpDocument',
  async (fileData, { rejectWithValue }) => {
    try {
      // 실제 API 연동 시 axios.post로 변경
      // const response = await axios.post('/api/rfp/upload', fileData);
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 시뮬레이션된 응답
      return {
        id: 'doc-' + Date.now(),
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        uploadDate: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const analyzeRfpDocument = createAsyncThunk(
  'rfpAnalysis/analyzeRfpDocument',
  async (documentId, { rejectWithValue }) => {
    try {
      // 실제 API 연동 시 axios.post로 변경
      // const response = await axios.post(`/api/rfp/analyze/${documentId}`);
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // 시뮬레이션된 응답
      return {
        documentId,
        analysisDate: new Date().toISOString(),
        summary: '본 RFP는 정부의 공공조달 시스템 현대화 프로젝트로, 인공지능과 블록체인 기술을 활용한 시스템 구축을 요구하고 있습니다.',
        keyPoints: [
          '인공지능 기반 자동 문서 분석 및 생성',
          '블록체인 기술을 활용한 데이터 무결성 보장',
          '실시간 협업 기능 및 다국어 지원',
          '사용자 친화적인 인터페이스 요구',
          '높은 수준의 보안 요구사항',
        ],
        requirements: [
          { id: 'req-1', category: '기능적', priority: '높음', description: '인공지능 기반 RFP 자동 분석 기능' },
          { id: 'req-2', category: '기능적', priority: '높음', description: '맞춤형 입찰 문서 자동 생성 기능' },
          { id: 'req-3', category: '기능적', priority: '중간', description: '블록체인 기반 데이터 관리 시스템' },
          { id: 'req-4', category: '기능적', priority: '중간', description: '실시간 협업 플랫폼 기능' },
          { id: 'req-5', category: '기능적', priority: '낮음', description: '다국어 지원 및 현지화 기능' },
          { id: 'req-6', category: '비기능적', priority: '높음', description: '고수준의 보안 요구사항 충족' },
          { id: 'req-7', category: '비기능적', priority: '중간', description: '사용자 친화적인 인터페이스' },
          { id: 'req-8', category: '비기능적', priority: '중간', description: '확장성을 고려한 시스템 설계' },
          { id: 'req-9', category: '비기능적', priority: '낮음', description: '다양한 디바이스 지원' },
        ],
        deadline: '2023-12-15',
        estimatedBudget: '₩500,000,000 - ₩700,000,000',
        client: '한국 정부 조달청',
        competitorAnalysis: '국내 IT 대기업 및 AI 특화 기업들의 참여 예상',
        successProbability: 65,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 슬라이스 생성
const rfpAnalysisSlice = createSlice({
  name: 'rfpAnalysis',
  initialState,
  reducers: {
    resetAnalysis: (state) => {
      return initialState;
    },
    updateRequirement: (state, action) => {
      const { id, changes } = action.payload;
      const index = state.extractedRequirements.findIndex(req => req.id === id);
      if (index !== -1) {
        state.extractedRequirements[index] = {
          ...state.extractedRequirements[index],
          ...changes
        };
      }
    },
    addRequirement: (state, action) => {
      state.extractedRequirements.push({
        id: 'req-' + (state.extractedRequirements.length + 1),
        ...action.payload
      });
    },
    removeRequirement: (state, action) => {
      state.extractedRequirements = state.extractedRequirements.filter(
        req => req.id !== action.payload
      );
    },
    setCurrentStep: (state, action) => {
      state.currentStep = action.payload;
      // 진행률 계산 (20% 단위)
      state.progress = (action.payload - 1) * 20;
    },
  },
  extraReducers: (builder) => {
    builder
      // uploadRfpDocument 액션 처리
      .addCase(uploadRfpDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadRfpDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.rfpDocument = action.payload;
        state.currentStep = 2; // 분석 단계로 이동
        state.progress = 20; // 20% 진행
      })
      .addCase(uploadRfpDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '문서 업로드 중 오류가 발생했습니다';
      })
      
      // analyzeRfpDocument 액션 처리
      .addCase(analyzeRfpDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeRfpDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.analysisResult = action.payload;
        state.extractedRequirements = action.payload.requirements;
        state.currentStep = 3; // 요구사항 검토 단계로 이동
        state.progress = 40; // 40% 진행
      })
      .addCase(analyzeRfpDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '분석 중 오류가 발생했습니다';
      });
  },
});

// 액션 생성자 내보내기
export const {
  resetAnalysis,
  updateRequirement,
  addRequirement,
  removeRequirement,
  setCurrentStep,
} = rfpAnalysisSlice.actions;

// 선택자 함수 내보내기
export const selectRfpDocument = (state) => state.rfpAnalysis.rfpDocument;
export const selectAnalysisResult = (state) => state.rfpAnalysis.analysisResult;
export const selectExtractedRequirements = (state) => state.rfpAnalysis.extractedRequirements;
export const selectLoading = (state) => state.rfpAnalysis.loading;
export const selectError = (state) => state.rfpAnalysis.error;
export const selectCurrentStep = (state) => state.rfpAnalysis.currentStep;
export const selectProgress = (state) => state.rfpAnalysis.progress;

// 리듀서 내보내기
export default rfpAnalysisSlice.reducer;