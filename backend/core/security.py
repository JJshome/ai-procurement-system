"""
보안 모듈 - 인증, 권한 관리, 암호화 기능을 구현합니다.
"""

import os
import jwt
import time
import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Union, Any

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config.settings import (
    JWT_SECRET_KEY, JWT_ALGORITHM, JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
    JWT_REFRESH_TOKEN_EXPIRE_DAYS, SECURITY_CONFIG
)
from models.user import User, TokenPayload
from db.session import get_db

logger = logging.getLogger(__name__)

# OAuth2 설정
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# 비밀번호 해싱 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class SecurityUtils:
    """보안 유틸리티 클래스"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """일반 텍스트 비밀번호와 해시된 비밀번호 비교"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """비밀번호 해싱"""
        return pwd_context.hash(password)
    
    @staticmethod
    def validate_password(password: str) -> bool:
        """비밀번호 복잡성 검증"""
        if len(password) < SECURITY_CONFIG["password_min_length"]:
            return False
        
        has_upper = any(c.isupper() for c in password) if SECURITY_CONFIG["password_require_uppercase"] else True
        has_lower = any(c.islower() for c in password) if SECURITY_CONFIG["password_require_lowercase"] else True
        has_digit = any(c.isdigit() for c in password) if SECURITY_CONFIG["password_require_number"] else True
        has_special = any(not c.isalnum() for c in password) if SECURITY_CONFIG["password_require_special_char"] else True
        
        return has_upper and has_lower and has_digit and has_special
    
    @staticmethod
    def create_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None, 
                      scopes: Optional[list] = None, payload: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """JWT 토큰 생성"""
        token_payload = {}
        
        # 기본 페이로드
        if isinstance(payload, dict):
            token_payload.update(payload)
        
        # 만료 시간 설정
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # 페이로드 업데이트
        token_payload.update({
            "sub": str(subject),
            "exp": expire,
            "iat": datetime.utcnow(),
            "nbf": datetime.utcnow()
        })
        
        # 스코프(권한) 추가
        if scopes:
            token_payload["scopes"] = scopes
        
        # 토큰 생성
        encoded_jwt = jwt.encode(token_payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return encoded_jwt
    
    @staticmethod
    def create_access_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None, 
                            scopes: Optional[list] = None, payload: Optional[Dict[str, Any]] = None) -> str:
        """액세스 토큰 생성"""
        if expires_delta is None:
            expires_delta = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        return SecurityUtils.create_token(subject, expires_delta, scopes, payload)
    
    @staticmethod
    def create_refresh_token(subject: Union[str, int], expires_delta: Optional[timedelta] = None,
                             payload: Optional[Dict[str, Any]] = None) -> str:
        """리프레시 토큰 생성"""
        if expires_delta is None:
            expires_delta = timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        
        # 리프레시 토큰에는 특수 표시
        refresh_payload = payload or {}
        refresh_payload["token_type"] = "refresh"
        
        return SecurityUtils.create_token(subject, expires_delta, None, refresh_payload)
    
    @staticmethod
    def decode_token(token: str) -> Dict[str, Any]:
        """토큰 디코딩"""
        try:
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
            return payload
        except JWTError as e:
            logger.error(f"토큰 디코딩 오류: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="유효하지 않은 토큰입니다",
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    @staticmethod
    def generate_random_secure_string(length: int = 32) -> str:
        """안전한 랜덤 문자열 생성"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_data(data: str) -> str:
        """데이터 해싱 (비밀번호 외 데이터 해싱용)"""
        return pwd_context.hash(data)


# 인증 의존성 함수들
async def get_token_payload(token: str = Depends(oauth2_scheme)) -> TokenPayload:
    """토큰 페이로드 가져오기"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        # 만료 시간 확인
        if "exp" in payload and datetime.fromtimestamp(payload["exp"]) < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="토큰이 만료되었습니다",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # 토큰 타입 확인
        if "token_type" in payload and payload["token_type"] == "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="리프레시 토큰을 액세스 토큰으로 사용할 수 없습니다",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        token_payload = TokenPayload(**payload)
        return token_payload
    
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 정보입니다",
            headers={"WWW-Authenticate": "Bearer"}
        )


async def get_current_user(
    db: Session = Depends(get_db), 
    payload: TokenPayload = Depends(get_token_payload)
) -> User:
    """현재 인증된 사용자 가져오기"""
    if payload.sub is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효하지 않은 인증 정보입니다"
        )
    
    # 사용자 ID로 사용자 조회
    user = db.query(User).filter(User.id == payload.sub).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """현재 활성 사용자 가져오기"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 사용자입니다"
        )
    
    return current_user


async def get_current_superuser(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """현재 관리자 사용자 가져오기"""
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="권한이 부족합니다"
        )
    
    return current_user


# 블록체인 관련 보안 기능
class BlockchainSecurity:
    """블록체인 보안 클래스"""
    
    @staticmethod
    def hash_document(document_content: str) -> str:
        """문서 해싱 (블록체인 저장용)"""
        import hashlib
        
        # SHA-256 해시 생성
        return hashlib.sha256(document_content.encode()).hexdigest()
    
    @staticmethod
    def verify_document_hash(document_content: str, stored_hash: str) -> bool:
        """문서 해시 검증"""
        current_hash = BlockchainSecurity.hash_document(document_content)
        return current_hash == stored_hash
    
    @staticmethod
    def sign_data(data: str, private_key: str) -> str:
        """데이터 서명 (블록체인 트랜잭션용)"""
        # 실제 구현에서는 Web3나 적절한 암호화 라이브러리를 사용해야 함
        # 예시 구현임
        import hmac
        import hashlib
        
        signature = hmac.new(
            private_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return signature


# 데이터 암호화 기능
class DataEncryption:
    """데이터 암호화 클래스"""
    
    @staticmethod
    def encrypt_sensitive_data(data: str, key: Optional[str] = None) -> Dict[str, str]:
        """민감한 데이터 암호화"""
        from cryptography.fernet import Fernet
        
        # 키가 제공되지 않은 경우 새 키 생성
        if key is None:
            key = Fernet.generate_key().decode()
        
        f = Fernet(key.encode() if isinstance(key, str) else key)
        encrypted_data = f.encrypt(data.encode()).decode()
        
        return {
            "encrypted_data": encrypted_data,
            "key": key
        }
    
    @staticmethod
    def decrypt_sensitive_data(encrypted_data: str, key: str) -> str:
        """암호화된 데이터 복호화"""
        from cryptography.fernet import Fernet
        
        f = Fernet(key.encode() if isinstance(key, str) else key)
        decrypted_data = f.decrypt(encrypted_data.encode()).decode()
        
        return decrypted_data


# 요청 로깅 및 모니터링 미들웨어
class SecurityMiddleware:
    """보안 모니터링 미들웨어"""
    
    @staticmethod
    async def log_request(request: Request, call_next):
        """API 요청 로깅"""
        start_time = time.time()
        
        # 요청 정보 로깅
        logger.info(
            f"요청: {request.method} {request.url.path} "
            f"(클라이언트: {request.client.host if request.client else 'unknown'})"
        )
        
        # 다음 미들웨어/라우트 핸들러 호출
        response = await call_next(request)
        
        # 응답 시간 계산
        process_time = time.time() - start_time
        
        # 응답 정보 로깅
        logger.info(
            f"응답: {request.method} {request.url.path} "
            f"상태 코드: {response.status_code} "
            f"처리 시간: {process_time:.4f}초"
        )
        
        return response
    
    @staticmethod
    def detect_suspicious_activity(request: Request, threshold: int = 10) -> bool:
        """의심스러운 활동 탐지 (간단한 구현)"""
        # 이 구현은 예시일 뿐, 실제로는 더 정교한 로직이 필요함
        # 예를 들어, Redis나 메모리 캐시를 사용하여 IP별 요청 횟수 추적 등
        
        client_ip = request.client.host if request.client else "unknown"
        
        # 여기서 IP별 요청 횟수를 추적하는 로직이 들어가야 함
        # 간단한 예시로 항상 False 반환
        return False
