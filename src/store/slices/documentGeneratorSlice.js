import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 초기 상태 정의
const initialState = {
  requirements: [],
  companyProfile: null,
  generatedDocument: null,
  documentTemplates: [],
  selectedTemplateId: null,
  customizations: {
    companyStrengths: [],
    highlightedAchievements: [],
    technicalApproach: '',
    budget: null,
    timeline: null,
  },
  loading: false,
  error: null,
  generationProgress: 0,
};

// 비동기 액션 생성자
export const fetchDocumentTemplates = createAsyncThunk(
  'documentGenerator/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      // 실제 API 연동 시 axios.get으로 변경
      // const response = await axios.get('/api/templates');
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 시뮬레이션된 응답
      return [
        {
          id: 'template-1',
          name: '표준 제안서 템플릿',
          description: '대부분의 공공조달 RFP에 적합한 표준 형식의 제안서 템플릿',
          tags: ['기본', '공공조달', '표준'],
          sections: ['회사 소개', '제안 개요', '기술 접근법', '프로젝트 일정', '비용 제안', '부록'],
          previewUrl: '/assets/templates/standard-preview.jpg',
        },
        {
          id: 'template-2',
          name: 'IT 솔루션 특화 템플릿',
          description: 'IT 및 소프트웨어 개발 프로젝트에 최적화된 제안서 템플릿',
          tags: ['IT', '소프트웨어', '기술'],
          sections: ['회사 소개', '기술 역량', '솔루션 아키텍처', '개발 방법론', '구현 계획', '유지보수 방안', '비용 제안'],
          previewUrl: '/assets/templates/it-preview.jpg',
        },
        {
          id: 'template-3',
          name: 'AI 및 머신러닝 프로젝트 템플릿',
          description: '인공지능 및 머신러닝 프로젝트에 특화된 제안서 템플릿',
          tags: ['AI', '머신러닝', '데이터'],
          sections: ['회사 소개', 'AI 역량', '데이터 처리 방법론', '모델 개발 접근법', '학습 및 검증 계획', '구현 로드맵', '비용 제안'],
          previewUrl: '/assets/templates/ai-preview.jpg',
        },
        {
          id: 'template-4',
          name: '인프라 구축 프로젝트 템플릿',
          description: '인프라 구축 및 유지보수 프로젝트에 적합한 제안서 템플릿',
          tags: ['인프라', '구축', '유지보수'],
          sections: ['회사 소개', '인프라 구축 경험', '제안 아키텍처', '구축 방법론', '유지보수 계획', '보안 대책', '비용 제안'],
          previewUrl: '/assets/templates/infrastructure-preview.jpg',
        }
      ];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchCompanyProfile = createAsyncThunk(
  'documentGenerator/fetchCompanyProfile',
  async (_, { rejectWithValue }) => {
    try {
      // 실제 API 연동 시 axios.get으로 변경
      // const response = await axios.get('/api/company/profile');
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 시뮬레이션된 응답
      return {
        name: '스마트 테크놀로지 솔루션즈',
        establishedYear: 2015,
        employeeCount: 120,
        headquarters: '서울특별시 강남구',
        description: '인공지능 및 블록체인 기술을 활용한 혁신적인 솔루션을 제공하는 기업입니다.',
        expertise: ['인공지능', '블록체인', '데이터 분석', '클라우드 컴퓨팅', '공공조달 시스템'],
        pastProjects: [
          {
            id: 'proj-1',
            name: '국방부 보안 시스템 고도화',
            client: '국방부',
            year: 2022,
            description: '인공지능 기반 사이버 보안 시스템 구축',
            outcome: '침입 탐지율 85% 향상, 대응 시간 75% 단축',
          },
          {
            id: 'proj-2',
            name: '서울시 스마트 시티 플랫폼',
            client: '서울특별시',
            year: 2021,
            description: '도시 데이터 통합 및 분석 플랫폼 개발',
            outcome: '도시 관리 효율성 50% 향상, 시민 만족도 68% 증가',
          },
          {
            id: 'proj-3',
            name: '국세청 블록체인 세금 시스템',
            client: '국세청',
            year: 2020,
            description: '블록체인 기반 세금 납부 및 추적 시스템',
            outcome: '세금 누락률 35% 감소, 처리 시간 62% 단축',
          }
        ],
        certifications: [
          'ISO 27001', 'ISO 9001', 'GS인증 1등급', '정보보호 관리체계 인증(ISMS)'
        ],
        strengths: [
          '공공 부문 프로젝트 경험 다수 보유',
          '국내 최고 수준의 AI 및 블록체인 기술력',
          '철저한 보안 관리 시스템',
          '체계적인 프로젝트 관리 방법론',
          '다양한 분야의 전문가 보유'
        ]
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const generateDocument = createAsyncThunk(
  'documentGenerator/generateDocument',
  async (params, { rejectWithValue, dispatch }) => {
    try {
      // 실제 API 연동 시 axios.post로 변경
      // const response = await axios.post('/api/document/generate', params);
      
      // 시뮬레이션을 위한 진행 상황 업데이트
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300));
        dispatch(updateGenerationProgress(i));
      }
      
      // 시뮬레이션된 응답
      return {
        id: 'doc-' + Date.now(),
        title: params.title || '제안서',
        createdAt: new Date().toISOString(),
        format: 'pdf',
        size: Math.floor(Math.random() * 5) + 2, // 2-7MB 사이의 랜덤 크기
        templateId: params.templateId,
        sections: [
          {
            title: '회사 소개',
            content: `저희 스마트 테크놀로지 솔루션즈는 2015년 설립된 이래로 인공지능과 블록체인 기술을 중심으로 혁신적인 솔루션을 제공해왔습니다. 
            서울특별시 강남구에 본사를 둔 당사는 현재 120명의 전문 인력을 보유하고 있으며, 국내 최고 수준의 기술력으로 다양한 공공 프로젝트를 성공적으로 수행한 경험이 있습니다.`
          },
          {
            title: '제안 개요',
            content: `본 제안서는 귀 기관의 요구사항을 충족시키기 위한 인공지능 기반 공공조달 입찰 최적화 시스템 구축 방안을 제시합니다. 
            저희는 최신 AI 기술과 블록체인을 활용하여 데이터 무결성을 보장하고, 실시간 협업이 가능한 사용자 친화적 시스템을 구축할 것을 제안합니다.`
          },
          {
            title: '기술 접근법',
            content: `저희는 다음과 같은 기술적 접근법을 통해 시스템을 구축하고자 합니다:
            1. NLP 기술을 활용한 RFP 자동 분석 시스템
            2. AI 기반 맞춤형 입찰 문서 자동 생성 기능
            3. Hyperledger Fabric 기반 블록체인 데이터 관리
            4. 웹 기반 실시간 협업 플랫폼
            5. 사용자 경험을 최우선으로 한 인터페이스 설계`
          },
          {
            title: '프로젝트 일정',
            content: `본 프로젝트는 총 12개월에 걸쳐 다음과 같이 진행될 예정입니다:
            - 1-2개월: 요구사항 분석 및 설계
            - 3-7개월: 핵심 기능 개발
            - 8-9개월: 통합 및 테스트
            - 10-11개월: 파일럿 운영 및 개선
            - 12개월: 시스템 안정화 및 최종 인도`
          },
          {
            title: '비용 제안',
            content: `본 프로젝트의 총 예상 비용은 650,000,000원이며, 다음과 같이 구성됩니다:
            - 인건비: 450,000,000원
            - 하드웨어 및 소프트웨어: 100,000,000원
            - 운영 및 유지보수: 70,000,000원
            - 교육 및 기타: 30,000,000원`
          },
        ],
        downloadUrl: '#',
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 슬라이스 생성
const documentGeneratorSlice = createSlice({
  name: 'documentGenerator',
  initialState,
  reducers: {
    setRequirements: (state, action) => {
      state.requirements = action.payload;
    },
    selectTemplate: (state, action) => {
      state.selectedTemplateId = action.payload;
    },
    updateCustomizations: (state, action) => {
      state.customizations = {
        ...state.customizations,
        ...action.payload,
      };
    },
    updateGenerationProgress: (state, action) => {
      state.generationProgress = action.payload;
    },
    resetDocumentGenerator: (state) => {
      return {
        ...initialState,
        companyProfile: state.companyProfile,
        documentTemplates: state.documentTemplates,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchDocumentTemplates 액션 처리
      .addCase(fetchDocumentTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.documentTemplates = action.payload;
      })
      .addCase(fetchDocumentTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '템플릿을 불러오는 중 오류가 발생했습니다';
      })
      
      // fetchCompanyProfile 액션 처리
      .addCase(fetchCompanyProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.companyProfile = action.payload;
        // 회사 강점을 자동으로 customizations에 추가
        state.customizations.companyStrengths = action.payload.strengths;
      })
      .addCase(fetchCompanyProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '회사 정보를 불러오는 중 오류가 발생했습니다';
      })
      
      // generateDocument 액션 처리
      .addCase(generateDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.generationProgress = 0;
      })
      .addCase(generateDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedDocument = action.payload;
        state.generationProgress = 100;
      })
      .addCase(generateDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '문서 생성 중 오류가 발생했습니다';
        state.generationProgress = 0;
      });
  },
});

// 액션 생성자 내보내기
export const {
  setRequirements,
  selectTemplate,
  updateCustomizations,
  updateGenerationProgress,
  resetDocumentGenerator,
} = documentGeneratorSlice.actions;

// 선택자 함수 내보내기
export const selectRequirements = (state) => state.documentGenerator.requirements;
export const selectCompanyProfile = (state) => state.documentGenerator.companyProfile;
export const selectGeneratedDocument = (state) => state.documentGenerator.generatedDocument;
export const selectDocumentTemplates = (state) => state.documentGenerator.documentTemplates;
export const selectSelectedTemplateId = (state) => state.documentGenerator.selectedTemplateId;
export const selectCustomizations = (state) => state.documentGenerator.customizations;
export const selectDocGeneratorLoading = (state) => state.documentGenerator.loading;
export const selectDocGeneratorError = (state) => state.documentGenerator.error;
export const selectGenerationProgress = (state) => state.documentGenerator.generationProgress;

// 리듀서 내보내기
export default documentGeneratorSlice.reducer;