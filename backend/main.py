import os
import logging
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.staticfiles import StaticFiles

# 내부 모듈 임포트
from config.settings import (
    API_TITLE, API_DESCRIPTION, API_VERSION, API_V1_STR,
    CORS_ORIGIN_WHITELIST, LOGGING_CONFIG
)
from api.routes import (
    auth_router, user_router, data_collection_router, 
    ai_analysis_router, document_router, tender_router,
    blockchain_router, monitoring_router
)
from core.security import get_current_active_user

# 로깅 설정
logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger(__name__)

# FastAPI 애플리케이션 생성
app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGIN_WHITELIST,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 정적 파일 제공
app.mount("/static", StaticFiles(directory="static"), name="static")

# 라우터 등록
app.include_router(auth_router, prefix=f"{API_V1_STR}/auth", tags=["인증"])
app.include_router(user_router, prefix=f"{API_V1_STR}/users", tags=["사용자 관리"])
app.include_router(
    data_collection_router, 
    prefix=f"{API_V1_STR}/data", 
    tags=["데이터 수집"],
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    ai_analysis_router, 
    prefix=f"{API_V1_STR}/analysis", 
    tags=["AI 분석"],
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    document_router, 
    prefix=f"{API_V1_STR}/documents", 
    tags=["문서 관리"],
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    tender_router, 
    prefix=f"{API_V1_STR}/tenders", 
    tags=["입찰 관리"],
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    blockchain_router, 
    prefix=f"{API_V1_STR}/blockchain", 
    tags=["블록체인"],
    dependencies=[Depends(get_current_active_user)]
)
app.include_router(
    monitoring_router, 
    prefix=f"{API_V1_STR}/monitoring", 
    tags=["모니터링"],
    dependencies=[Depends(get_current_active_user)]
)

@app.get("/", tags=["루트"])
async def root():
    """
    루트 엔드포인트 - 시스템 상태 확인
    """
    return {
        "message": "AI 기반 공공조달 입찰 최적화 시스템 API가 실행 중입니다.",
        "version": API_VERSION,
        "status": "online",
    }


@app.get("/health", tags=["상태 체크"])
async def health_check():
    """
    시스템 상태 확인 엔드포인트
    """
    return {
        "status": "healthy",
        "services": {
            "database": "connected",
            "ai_models": "loaded",
            "blockchain": "connected"
        }
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8000"))
    
    logger.info(f"Starting AI Procurement System API on {host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
