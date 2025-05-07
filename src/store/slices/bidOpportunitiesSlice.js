import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// 초기 상태 정의
const initialState = {
  opportunities: [],
  filters: {
    category: '',
    budget: [0, 1000000000], // 10억원
    deadline: null, // null은 마감일 필터 없음
    status: 'all', // 'all', 'active', 'upcoming', 'closed'
    keyword: '',
  },
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
  },
  recommendedOpportunities: [],
  loading: false,
  error: null,
};

// 비동기 액션 생성자
export const fetchBidOpportunities = createAsyncThunk(
  'bidOpportunities/fetchOpportunities',
  async (params, { getState, rejectWithValue }) => {
    try {
      const { filters, pagination } = getState().bidOpportunities;
      
      // 실제 API 연동 시 axios.get으로 변경
      // const response = await axios.get('/api/opportunities', {
      //   params: {
      //     ...filters,
      //     page: pagination.page,
      //     limit: pagination.limit,
      //     ...params,
      //   }
      // });
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // 시뮬레이션된 응답
      const generateMockOpportunities = (count) => {
        const categories = ['IT 서비스', '인프라 구축', '소프트웨어 개발', '컨설팅', '교육 훈련', '보안 시스템'];
        const statuses = ['active', 'upcoming', 'closed'];
        const agencies = ['국방부', '교육부', '환경부', '과학기술정보통신부', '국토교통부', '보건복지부'];
        
        return Array.from({ length: count }, (_, i) => {
          const id = `bid-${Date.now()}-${i}`;
          const category = categories[Math.floor(Math.random() * categories.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const agency = agencies[Math.floor(Math.random() * agencies.length)];
          
          // 현재 날짜로부터 -30일에서 +60일 사이의 무작위 날짜 생성
          const randomDays = Math.floor(Math.random() * 90) - 30;
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + randomDays);
          
          const budget = Math.floor(Math.random() * 900000000) + 100000000; // 1억 ~ 10억
          
          return {
            id,
            title: `${agency} ${category} 프로젝트 입찰 공고`,
            agency,
            category,
            description: `본 프로젝트는 ${agency}의 ${category} 시스템을 개선하기 위한 것으로, 최신 기술을 활용한 혁신적인 솔루션을 요구합니다.`,
            status,
            publishedDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
            deadline: deadline.toISOString(),
            budget,
            location: '서울특별시',
            requirements: [
              '유사 프로젝트 수행 경험',
              '전문 인력 보유',
              '관련 기술 역량 증명',
            ],
            successProbability: Math.floor(Math.random() * 70) + 30, // 30% ~ 100%
            viewCount: Math.floor(Math.random() * 500) + 50,
            isFavorite: Math.random() > 0.8, // 20% 확률로 즐겨찾기
          };
        });
      };
      
      // 필터 적용
      let mockOpportunities = generateMockOpportunities(50);
      
      if (filters.category) {
        mockOpportunities = mockOpportunities.filter(opp => opp.category === filters.category);
      }
      
      if (filters.budget[0] > 0 || filters.budget[1] < 1000000000) {
        mockOpportunities = mockOpportunities.filter(
          opp => opp.budget >= filters.budget[0] && opp.budget <= filters.budget[1]
        );
      }
      
      if (filters.deadline) {
        const deadlineDate = new Date(filters.deadline);
        mockOpportunities = mockOpportunities.filter(
          opp => new Date(opp.deadline) <= deadlineDate
        );
      }
      
      if (filters.status !== 'all') {
        mockOpportunities = mockOpportunities.filter(opp => opp.status === filters.status);
      }
      
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        mockOpportunities = mockOpportunities.filter(
          opp => opp.title.toLowerCase().includes(keyword) || 
                 opp.description.toLowerCase().includes(keyword) ||
                 opp.agency.toLowerCase().includes(keyword)
        );
      }
      
      // 페이지네이션 적용
      const start = (pagination.page - 1) * pagination.limit;
      const end = start + pagination.limit;
      const paginatedOpportunities = mockOpportunities.slice(start, end);
      
      return {
        opportunities: paginatedOpportunities,
        total: mockOpportunities.length,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRecommendedOpportunities = createAsyncThunk(
  'bidOpportunities/fetchRecommended',
  async (_, { rejectWithValue }) => {
    try {
      // 실제 API 연동 시 axios.get으로 변경
      // const response = await axios.get('/api/opportunities/recommended');
      
      // 시뮬레이션을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 시뮬레이션된 응답
      return [
        {
          id: 'bid-rec-1',
          title: '국토교통부 철도 인프라 개선 프로젝트',
          agency: '국토교통부',
          category: '인프라 구축',
          description: '전국 철도 시스템을 현대화하고 안전성을 높이기 위한 프로젝트로, AI 기반 모니터링 시스템을 포함합니다.',
          status: 'active',
          publishedDate: '2023-08-10T00:00:00Z',
          deadline: '2023-09-15T23:59:59Z',
          budget: 850000000,
          successProbability: 78,
          matchScore: 92,
          matchReasons: ['회사의 AI 기술력 적합', '과거 유사 프로젝트 성공 경험', '기술 요구사항 충족'],
        },
        {
          id: 'bid-rec-2',
          title: '보건복지부 의료정보시스템 고도화',
          agency: '보건복지부',
          category: '소프트웨어 개발',
          description: '국가 의료정보 시스템의 효율성과 보안성을 향상시키는 프로젝트로, 블록체인 기술을 활용한 데이터 보호 기능을 포함합니다.',
          status: 'active',
          publishedDate: '2023-08-08T00:00:00Z',
          deadline: '2023-10-10T23:59:59Z',
          budget: 720000000,
          successProbability: 65,
          matchScore: 87,
          matchReasons: ['회사의 블록체인 기술 강점', '의료 데이터 관리 경험', '보안 기술 적합성'],
        },
        {
          id: 'bid-rec-3',
          title: '환경부 재활용 인프라 구축 사업',
          agency: '환경부',
          category: 'IT 서비스',
          description: '전국 재활용 시설의 효율성을 높이기 위한 스마트 관리 시스템 구축 프로젝트입니다.',
          status: 'upcoming',
          publishedDate: '2023-08-15T00:00:00Z',
          deadline: '2023-11-05T23:59:59Z',
          budget: 550000000,
          successProbability: 59,
          matchScore: 81,
          matchReasons: ['환경 프로젝트 경험', '스마트 시스템 개발 역량', '정부기관 협업 이력'],
        },
      ];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 슬라이스 생성
const bidOpportunitiesSlice = createSlice({
  name: 'bidOpportunities',
  initialState,
  reducers: {
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
      // 필터가 변경되면 페이지를 1로 리셋
      state.pagination.page = 1;
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.page = 1;
    },
    setPage: (state, action) => {
      state.pagination.page = action.payload;
    },
    setLimit: (state, action) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1;
    },
    toggleFavorite: (state, action) => {
      const opportunityId = action.payload;
      const opportunity = state.opportunities.find(opp => opp.id === opportunityId);
      if (opportunity) {
        opportunity.isFavorite = !opportunity.isFavorite;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchBidOpportunities 액션 처리
      .addCase(fetchBidOpportunities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBidOpportunities.fulfilled, (state, action) => {
        state.loading = false;
        state.opportunities = action.payload.opportunities;
        state.pagination.total = action.payload.total;
      })
      .addCase(fetchBidOpportunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '입찰 기회를 불러오는 중 오류가 발생했습니다';
      })
      
      // fetchRecommendedOpportunities 액션 처리
      .addCase(fetchRecommendedOpportunities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecommendedOpportunities.fulfilled, (state, action) => {
        state.loading = false;
        state.recommendedOpportunities = action.payload;
      })
      .addCase(fetchRecommendedOpportunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || '추천 입찰 기회를 불러오는 중 오류가 발생했습니다';
      });
  },
});

// 액션 생성자 내보내기
export const {
  updateFilters,
  resetFilters,
  setPage,
  setLimit,
  toggleFavorite,
} = bidOpportunitiesSlice.actions;

// 선택자 함수 내보내기
export const selectOpportunities = (state) => state.bidOpportunities.opportunities;
export const selectFilters = (state) => state.bidOpportunities.filters;
export const selectPagination = (state) => state.bidOpportunities.pagination;
export const selectRecommendedOpportunities = (state) => state.bidOpportunities.recommendedOpportunities;
export const selectBidOpportunitiesLoading = (state) => state.bidOpportunities.loading;
export const selectBidOpportunitiesError = (state) => state.bidOpportunities.error;

// 리듀서 내보내기
export default bidOpportunitiesSlice.reducer;