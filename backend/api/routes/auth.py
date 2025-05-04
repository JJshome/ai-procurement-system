"""
인증 관련 라우터 - 로그인, 회원가입, 토큰 갱신 등의 API 엔드포인트
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Any

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from db.session import get_db
from models.user import User, UserCreate, UserLogin, Token
from core.security import (
    SecurityUtils, get_current_user, get_current_active_user,
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES, JWT_REFRESH_TOKEN_EXPIRE_DAYS
)
from config.settings import SECURITY_CONFIG

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    사용자 로그인 및 JWT 토큰 발급
    
    - 사용자 이름과 비밀번호로 로그인
    - 액세스 토큰과 리프레시 토큰 발급
    """
    # 사용자 조회
    user = db.query(User).filter(User.username == form_data.username).first()
    
    # 로그인 실패 확인
    if not user:
        logger.warning(f"로그인 실패: 사용자를 찾을 수 없음 ({form_data.username})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 사용자 이름 또는 비밀번호",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 계정 잠금 확인
    if user.locked_until and datetime.utcnow() < user.locked_until:
        logger.warning(f"로그인 실패: 계정 잠금 ({form_data.username})")
        
        # 남은 잠금 시간 계산 (분 단위)
        remaining_minutes = int((user.locked_until - datetime.utcnow()).total_seconds() / 60)
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"계정이 잠겨 있습니다. {remaining_minutes}분 후에 다시 시도하세요."
        )
    
    # 비밀번호 확인
    if not SecurityUtils.verify_password(form_data.password, user.hashed_password):
        # 로그인 실패 횟수 증가
        user.login_attempts += 1
        
        # 최대 실패 횟수 초과 시 계정 잠금
        if user.login_attempts >= SECURITY_CONFIG["max_login_attempts"]:
            user.locked_until = datetime.utcnow() + timedelta(minutes=SECURITY_CONFIG["lockout_time_minutes"])
            logger.warning(f"계정 잠금: 로그인 {user.login_attempts}회 실패 ({form_data.username})")
        
        db.commit()
        
        logger.warning(f"로그인 실패: 잘못된 비밀번호 ({form_data.username})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="잘못된 사용자 이름 또는 비밀번호",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # 로그인 성공 처리
    # 로그인 실패 횟수 초기화
    user.login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.utcnow()
    db.commit()
    
    # 토큰 생성
    access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    
    # 사용자 권한 조회
    user_roles = [role.name for role in user.roles] if hasattr(user, 'roles') and user.roles else []
    
    # 페이로드 구성
    payload = {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "roles": user_roles,
        "is_superuser": user.is_superuser
    }
    
    # 토큰 생성
    access_token = SecurityUtils.create_access_token(
        subject=user.id,
        expires_delta=access_token_expires,
        payload=payload
    )
    
    refresh_token = SecurityUtils.create_refresh_token(
        subject=user.id,
        expires_delta=refresh_token_expires,
        payload={"user_id": user.id}
    )
    
    logger.info(f"로그인 성공: {user.username} (ID: {user.id})")
    
    # 응답 반환
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_at": datetime.utcnow() + access_token_expires
    }


@router.post("/register", response_model=Dict[str, Any])
async def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    새 사용자 등록
    
    - 사용자 이름, 이메일, 비밀번호 필요
    - 중복 사용자 이름 및 이메일 확인
    """
    # 사용자 이름 중복 확인
    existing_user = db.query(User).filter(User.username == user_in.username).first()
    if existing_user:
        logger.warning(f"회원 가입 실패: 사용자 이름 중복 ({user_in.username})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 사용자 이름입니다."
        )
    
    # 이메일 중복 확인
    existing_email = db.query(User).filter(User.email == user_in.email).first()
    if existing_email:
        logger.warning(f"회원 가입 실패: 이메일 중복 ({user_in.email})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 이메일입니다."
        )
    
    # 비밀번호 복잡성 검증
    if not SecurityUtils.validate_password(user_in.password):
        logger.warning(f"회원 가입 실패: 비밀번호 복잡성 부족 ({user_in.username})")
        
        # 비밀번호 요구사항 메시지 구성
        requirements = []
        if SECURITY_CONFIG["password_min_length"] > 0:
            requirements.append(f"최소 {SECURITY_CONFIG['password_min_length']}자 이상")
        if SECURITY_CONFIG["password_require_uppercase"]:
            requirements.append("대문자 포함")
        if SECURITY_CONFIG["password_require_lowercase"]:
            requirements.append("소문자 포함")
        if SECURITY_CONFIG["password_require_number"]:
            requirements.append("숫자 포함")
        if SECURITY_CONFIG["password_require_special_char"]:
            requirements.append("특수문자 포함")
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"비밀번호 요구사항을 만족하지 않습니다: {', '.join(requirements)}"
        )
    
    # 새 사용자 생성
    hashed_password = SecurityUtils.get_password_hash(user_in.password)
    
    db_user = User(
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        is_active=True,
        is_superuser=user_in.is_superuser,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    logger.info(f"회원 가입 성공: {db_user.username} (ID: {db_user.id})")
    
    return {
        "message": "회원 가입이 완료되었습니다.",
        "user_id": db_user.id,
        "username": db_user.username
    }


@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    refresh_token: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    리프레시 토큰으로 새로운 액세스 토큰 발급
    
    - 유효한 리프레시 토큰 필요
    """
    try:
        # 토큰 디코딩
        payload = SecurityUtils.decode_token(refresh_token)
        
        # 토큰 타입 확인
        if payload.get("token_type") != "refresh":
            logger.warning("토큰 갱신 실패: 유효하지 않은 토큰 타입")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="유효하지 않은 리프레시 토큰입니다."
            )
        
        # 사용자 ID 추출
        user_id = payload.get("sub")
        if not user_id:
            logger.warning("토큰 갱신 실패: 사용자 ID를 찾을 수 없음")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="유효하지 않은 리프레시 토큰입니다."
            )
        
        # 사용자 조회
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user or not user.is_active:
            logger.warning(f"토큰 갱신 실패: 사용자를 찾을 수 없거나 비활성화됨 (ID: {user_id})")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="유효하지 않은 리프레시 토큰입니다."
            )
        
        # 새 액세스 토큰 생성
        access_token_expires = timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        
        # 사용자 권한 조회
        user_roles = [role.name for role in user.roles] if hasattr(user, 'roles') and user.roles else []
        
        # 페이로드 구성
        token_payload = {
            "user_id": user.id,
            "username": user.username,
            "email": user.email,
            "roles": user_roles,
            "is_superuser": user.is_superuser
        }
        
        # 새 액세스 토큰 생성
        access_token = SecurityUtils.create_access_token(
            subject=user.id,
            expires_delta=access_token_expires,
            payload=token_payload
        )
        
        logger.info(f"토큰 갱신 성공: 사용자 ID {user.id}")
        
        # 응답 반환
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_at": datetime.utcnow() + access_token_expires
        }
    
    except Exception as e:
        logger.error(f"토큰 갱신 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="유효하지 않은 리프레시 토큰입니다."
        )


@router.post("/logout", response_model=Dict[str, Any])
async def logout(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    사용자 로그아웃
    
    - 클라이언트에서 토큰을 삭제해야 함
    - 서버에서는 특별한 처리 없음 (JWT 특성상)
    """
    logger.info(f"로그아웃: 사용자 ID {current_user.id}")
    
    return {
        "message": "로그아웃이 완료되었습니다."
    }


@router.get("/me", response_model=Dict[str, Any])
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    현재 인증된 사용자 정보 조회
    
    - 액세스 토큰 필요
    """
    # 사용자 권한 조회
    user_roles = [role.name for role in current_user.roles] if hasattr(current_user, 'roles') and current_user.roles else []
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_active": current_user.is_active,
        "is_superuser": current_user.is_superuser,
        "last_login": current_user.last_login,
        "roles": user_roles
    }


@router.post("/change-password", response_model=Dict[str, Any])
async def change_password(
    current_password: str = Body(...),
    new_password: str = Body(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    비밀번호 변경
    
    - 현재 비밀번호와 새 비밀번호 필요
    - 현재 비밀번호 확인 후 변경
    """
    # 현재 비밀번호 확인
    if not SecurityUtils.verify_password(current_password, current_user.hashed_password):
        logger.warning(f"비밀번호 변경 실패: 현재 비밀번호 불일치 (사용자 ID: {current_user.id})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="현재 비밀번호가 올바르지 않습니다."
        )
    
    # 새 비밀번호 복잡성 검증
    if not SecurityUtils.validate_password(new_password):
        logger.warning(f"비밀번호 변경 실패: 새 비밀번호 복잡성 부족 (사용자 ID: {current_user.id})")
        
        # 비밀번호 요구사항 메시지 구성
        requirements = []
        if SECURITY_CONFIG["password_min_length"] > 0:
            requirements.append(f"최소 {SECURITY_CONFIG['password_min_length']}자 이상")
        if SECURITY_CONFIG["password_require_uppercase"]:
            requirements.append("대문자 포함")
        if SECURITY_CONFIG["password_require_lowercase"]:
            requirements.append("소문자 포함")
        if SECURITY_CONFIG["password_require_number"]:
            requirements.append("숫자 포함")
        if SECURITY_CONFIG["password_require_special_char"]:
            requirements.append("특수문자 포함")
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"비밀번호 요구사항을 만족하지 않습니다: {', '.join(requirements)}"
        )
    
    # 현재 비밀번호와 새 비밀번호가 같은지 확인
    if current_password == new_password:
        logger.warning(f"비밀번호 변경 실패: 현재 비밀번호와 새 비밀번호가 동일함 (사용자 ID: {current_user.id})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="새 비밀번호는 현재 비밀번호와 달라야 합니다."
        )
    
    # 새 비밀번호 해싱 및 저장
    hashed_password = SecurityUtils.get_password_hash(new_password)
    
    current_user.hashed_password = hashed_password
    current_user.updated_at = datetime.utcnow()
    
    db.commit()
    
    logger.info(f"비밀번호 변경 성공: 사용자 ID {current_user.id}")
    
    return {
        "message": "비밀번호가 성공적으로 변경되었습니다."
    }
