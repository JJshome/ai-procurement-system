# 인공지능 기반 공공조달 입찰 최적화 시스템 (AI-Powered Procurement System)

<div align="center">
  <img src="public/assets/aips-banner.svg" alt="AI-Powered Procurement System" width="800px">
  
  <p align="center">
    <b>혁신적인 AI 기술로 공공조달 프로세스를 최적화하는 지능형 플랫폼</b>
  </p>
  
  <p align="center">
    <a href="#주요-기능">주요 기능</a> •
    <a href="#시스템-아키텍처">시스템 아키텍처</a> •
    <a href="#기술-스택">기술 스택</a> •
    <a href="#설치-방법">설치 방법</a> •
    <a href="#데모-흐름">데모 흐름</a>
  </p>
  
  <p align="center">
    <img src="https://img.shields.io/badge/version-0.2.0-blue" alt="Version 0.2.0">
    <img src="https://img.shields.io/badge/license-MIT-green" alt="License MIT">
    <img src="https://img.shields.io/badge/platform-web-lightgrey" alt="Platform Web">
  </p>
</div>

## 📋 프로젝트 개요

이 시스템은 인공지능(AI) 기술을 활용하여 공공조달 입찰 프로세스를 최적화하고 자동화하는 혁신적인 플랫폼입니다. 다양한 데이터 소스에서 정보를 수집하고 분석하여 입찰 전략 수립과 성공적인 문서 작성을 지원합니다. 블록체인 기술을 통해 데이터의 무결성을 보장하고, 사용자 친화적인 인터페이스로 복잡한 입찰 과정을 단순화합니다. 본 시스템은 (주)유케어트론의 출원된 특허에 기반하고 있습니다. **(해당 내용은 모두 가상적임을 이해하기 바랍니다)**

<div align="center">
  <img src="public/assets/dashboard-preview.svg" alt="Dashboard Preview" width="80%">
</div>

## ✨ 주요 기능

### 🔍 데이터 수집 및 분석
- SAM.gov와 같은 다양한 공공조달 플랫폼에서 실시간 데이터 수집
- 빅데이터 분석을 통한 시장 동향 및 경쟁 정보 파악
- 과거 입찰 데이터를 통한 성공 패턴 식별

### 🤖 AI 기반 문서 자동화
- NLP 기술을 활용한 RFP(Request for Proposal) 문서 자동 분석
- 맞춤형 입찰 제안서 자동 생성
- 다국어 지원 및 현지화 기능

### 📊 예측 분석 및 의사결정 지원
- 머신러닝 모델을 활용한 낙찰 확률 예측
- 최적 입찰가 추천 및 경쟁 전략 제안
- 시각화 도구를 통한 직관적인 데이터 해석

### 🔗 블록체인 기술 적용
- 입찰 과정의 투명성 및 무결성 보장
- 스마트 계약을 통한 자동화된 프로세스
- 안전한 데이터 관리 및 접근 제어

### 👥 협업 도구
- 실시간 문서 공동 편집 기능
- 팀 간 효율적인 커뮤니케이션 지원
- AI 챗봇을 통한 24/7 지원 서비스

## 🏗️ 시스템 아키텍처

이 시스템은 다음과 같은 주요 모듈로 구성되어 있습니다:

<div align="center">
  <img src="public/assets/architecture.svg" alt="System Architecture" width="80%">
</div>

1. **데이터 수집 모듈** - 다양한 소스에서 데이터를 수집하고 전처리합니다.
2. **AI 분석 모듈** - 수집된 데이터를 분석하고 예측 모델을 구축합니다.
3. **자동화 및 최적화 솔루션** - 입찰 문서 생성 및 프로세스 최적화를 수행합니다.
4. **사용자 인터페이스** - 직관적인 대시보드와 시각화 도구를 제공합니다.
5. **블록체인 레이어** - 데이터의 무결성과 투명성을 보장합니다.
6. **보안 모듈** - 데이터 암호화 및 접근 제어를 관리합니다.

## 🛠️ 기술 스택

### 프론트엔드
- React.js
- Redux
- Material-UI
- D3.js (데이터 시각화)

### 백엔드
- Node.js
- Express
- GraphQL
- MongoDB (메타데이터 저장)
- Redis (캐싱)

### AI 및 머신러닝
- TensorFlow/PyTorch
- OpenAI API
- BERT (자연어 처리)
- XGBoost (예측 모델링)

### 블록체인
- Hyperledger Fabric
- 스마트 계약 (Solidity)

### 클라우드 및 배포
- Docker
- Kubernetes
- AWS/Azure

## 🚀 설치 방법

### 사전 요구사항
- Node.js 16.x 이상
- MongoDB
- Redis
- Docker & Docker Compose

### 로컬 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/JJshome/ai-procurement-system.git
cd ai-procurement-system

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 API 키와 설정 추가

# 개발 서버 실행
npm run dev
```

### Docker를 이용한 배포

```bash
# Docker 이미지 빌드
docker-compose build

# 컨테이너 실행
docker-compose up -d
```

## 📱 데모 흐름

본 시스템의 데모는, 공공조달 입찰에 참여하려는 기업이 RFP(Request for Proposal) 문서를 업로드하고, AI를 활용하여 자동으로 분석하고 입찰 문서를 생성하는 전체 프로세스를 시연합니다.

<div align="center">
  <img src="public/assets/demo-preview.svg" alt="Demo Preview" width="80%">
</div>

### 1. RFP 문서 업로드
   - 사용자가 RFP 문서를 업로드하여 분석 프로세스 시작
   - 다양한 형식(PDF, DOCX, TXT)의 파일 지원
   - 드래그 앤 드롭 인터페이스 제공

### 2. AI 분석 과정
   - 문서 텍스트 추출 → 자연어 처리 분석 → 요구사항 식별 → 메타데이터 추출 → 분류 및 우선순위 지정 → 요약 및 결과 생성
   - 각 단계별 진행 상황을 시각적으로 표시
   - 실시간 분석 결과 미리보기 제공

### 3. 요구사항 검토 및 수정
   - 분석된 요구사항을 사용자가 검토하고 필요시 수정
   - 요구사항의 우선순위와 카테고리 조정 가능
   - 추출되지 않은 요구사항 수동 추가 기능

### 4. 문서 생성
   - AI가 요구사항을 기반으로 맞춤형 입찰 제안서 자동 생성
   - 문서 구성 및 섹션 커스터마이징 기능
   - 회사 정보와 과거 실적 자동 통합

### 5. 최종 검토 및 제출
   - 생성된 문서의 최종 검토 및 체크리스트 확인
   - 요구사항 충족 여부 검증
   - 완성된 문서 제출 및 상태 추적

이 완전한 데모 흐름을 통해 사용자는 인공지능이 공공조달 입찰 과정을 어떻게 최적화하고 효율화할 수 있는지 직접 체험할 수 있습니다.

## 📝 문서 유형

입찰 프로세스에서 지원하는 문서 유형은 다음과 같습니다:

1. **RFP (Request for Proposal)**
   - 입찰 요구사항 및 조건을 상세히 기술한 문서
   - AI가 자동으로 분석하여 주요 요구사항 추출

2. **제안서 (Proposal)**
   - 입찰 요구사항에 대한 상세한 솔루션을 제시하는 문서
   - 회사 정보, 기술 사양, 접근 방법, 가격 제안 등 포함

3. **요구사항 분석 보고서**
   - 추출된 요구사항의 분류 및 우선순위 평가
   - 성공적인 입찰을 위한 전략적 평가 제공

4. **예상 비용 산출서**
   - AI가 해당 프로젝트에 대한 비용 추정 제공
   - 시장 가격과 경쟁사 분석을 통한 경쟁력 있는 가격 제안

5. **프로젝트 실행 계획서**
   - 제안된 솔루션의 구현 방법과 일정 계획
   - 마일스톤, 실행 조직, 위험 관리 전략 구체화

## 🌟 설치 요구사항

- **프론트엔드**: 최신 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- **백엔드**: Node.js 16+, MongoDB 4.4+, Redis 6+
- **API 연동**: OpenAI API 키, SAM.gov API 인증 정보
- **블록체인**: Hyperledger Fabric 2.2+ 네트워크
- **스토리지**: 최소 10GB 디스크 공간

## 🛠️ 새로운 기능 (v0.2.0)

- **완전한 데모 흐름 구현**: 요구사항 검토, 문서 생성, 최종 검토 페이지 추가
- **일관된 UI/UX 개선**: 사용자 경험 메트릭스에 기반한 인터페이스 개선
- **엔터프라이즈 기능 강화**: 다중 사용자 지원 및 협업 기능 개선
- **새로운 AI 모델 적용**: Larege Language Model 기반 분석 및 문서 생성 성능 향상
- **표참조 분석 기능**: 표 기반 정보 추출 및 분석 기능 추가

## 🤗 참여 메인테이너

- 현재 이 프로젝트는 개발 단계에 있으며, 기여하고 싶으신 분들은 아래 이메일로 문의해주세요.
- 이메일: example@example.com
- 라이센스: MIT License
- 버전: 0.2.0 (2023년 8월 업데이트)