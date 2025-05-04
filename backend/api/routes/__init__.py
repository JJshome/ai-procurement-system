"""
API 라우터 모듈 - 모든 API 엔드포인트를 통합
"""

from fastapi import APIRouter

from .auth import router as auth_router
from .document import router as document_router
# 다른 라우터 추가 (추후 구현 예정)
# from .user import router as user_router
# from .tender import router as tender_router
# from .ai_analysis import router as ai_analysis_router
# from .blockchain import router as blockchain_router
# from .monitoring import router as monitoring_router

# 라우터 변수 export
__all__ = [
    "auth_router",
    "document_router",
    # "user_router",
    # "tender_router",
    # "ai_analysis_router",
    # "blockchain_router",
    # "monitoring_router",
]
