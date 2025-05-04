from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, validator

from .base import BaseDBModel, BaseSchema

class TenderStatus(str, Enum):
    """입찰 상태 열거형"""
    DRAFT = "draft"  # 초안
    SUBMITTED = "submitted"  # 제출됨
    UNDER_REVIEW = "under_review"  # 검토 중
    ACCEPTED = "accepted"  # 수락됨
    REJECTED = "rejected"  # 거부됨
    COMPLETED = "completed"  # 완료됨
    CANCELLED = "cancelled"  # 취소됨

class TenderType(str, Enum):
    """입찰 유형 열거형"""
    OPEN = "open"  # 공개 입찰
    RESTRICTED = "restricted"  # 제한 입찰
    NEGOTIATED = "negotiated"  # 협상에 의한 입찰
    COMPETITIVE_DIALOGUE = "competitive_dialogue"  # 경쟁적 대화
    FRAMEWORK_AGREEMENT = "framework_agreement"  # 기본 계약
    ELECTRONIC_AUCTION = "electronic_auction"  # 전자 경매

class Tender(BaseDBModel):
    """입찰 데이터베이스 모델"""
    __tablename__ = "tenders"
    
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    tender_type = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False, default=TenderStatus.DRAFT.value)
    
    # 관련 날짜
    publication_date = Column(DateTime, nullable=True)
    submission_deadline = Column(DateTime, nullable=False)
    evaluation_start_date = Column(DateTime, nullable=True)
    evaluation_end_date = Column(DateTime, nullable=True)
    award_date = Column(DateTime, nullable=True)
    
    # 금액 정보
    estimated_value = Column(Float, nullable=True)
    awarded_value = Column(Float, nullable=True)
    currency = Column(String(10), default="KRW")
    
    # 연관 정보
    procurement_reference = Column(String(100), nullable=True, index=True)
    organization_id = Column(Integer, nullable=True)
    
    # 메타데이터 및 AI 분석 정보
    metadata = Column(JSON, nullable=True)  # 추가 메타데이터
    success_probability = Column(Float, nullable=True)  # AI 예측 성공 확률
    ai_recommendations = Column(JSON, nullable=True)  # AI 추천 사항
    blockchain_hash = Column(String(200), nullable=True)  # 블록체인 해시
    
    # 외래키 관계
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 관계 설정
    owner = relationship("User", back_populates="tenders")
    documents = relationship("TenderDocument", back_populates="tender")
    requirements = relationship("TenderRequirement", back_populates="tender")
    competitors = relationship("TenderCompetitor", back_populates="tender")
    
    def __repr__(self):
        return f"<Tender {self.id}: {self.title}>"

class TenderDocument(BaseDBModel):
    """입찰 문서 데이터베이스 모델"""
    __tablename__ = "tender_documents"
    
    title = Column(String(200), nullable=False)
    document_type = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)
    is_ai_generated = Column(Boolean, default=False)
    generation_parameters = Column(JSON, nullable=True)
    version = Column(Integer, default=1)
    
    # 외래키 관계
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    # 관계 설정
    tender = relationship("Tender", back_populates="documents")
    
    def __repr__(self):
        return f"<TenderDocument {self.id}: {self.title}>"

class TenderRequirement(BaseDBModel):
    """입찰 요구사항 데이터베이스 모델"""
    __tablename__ = "tender_requirements"
    
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    requirement_type = Column(String(50), nullable=False)
    is_mandatory = Column(Boolean, default=True)
    weight = Column(Float, default=1.0)  # 가중치
    compliance_level = Column(Float, nullable=True)  # 준수 수준 (AI 분석)
    
    # 외래키 관계
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    
    # 관계 설정
    tender = relationship("Tender", back_populates="requirements")
    
    def __repr__(self):
        return f"<TenderRequirement {self.id}: {self.title}>"

class TenderCompetitor(BaseDBModel):
    """입찰 경쟁사 데이터베이스 모델"""
    __tablename__ = "tender_competitors"
    
    name = Column(String(200), nullable=False)
    estimated_bid = Column(Float, nullable=True)
    strength = Column(Float, nullable=True)  # 1-10 척도 (AI 분석)
    weakness = Column(Float, nullable=True)  # 1-10 척도 (AI 분석)
    previous_wins = Column(Integer, default=0)
    notes = Column(Text, nullable=True)
    
    # 외래키 관계
    tender_id = Column(Integer, ForeignKey("tenders.id"), nullable=False)
    
    # 관계 설정
    tender = relationship("Tender", back_populates="competitors")
    
    def __repr__(self):
        return f"<TenderCompetitor {self.id}: {self.name}>"

# Pydantic 스키마 모델
class TenderBase(BaseModel):
    title: str
    description: Optional[str] = None
    tender_type: TenderType
    submission_deadline: datetime
    estimated_value: Optional[float] = None
    currency: Optional[str] = "KRW"
    procurement_reference: Optional[str] = None
    organization_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class TenderCreate(TenderBase):
    pass

class TenderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    tender_type: Optional[TenderType] = None
    status: Optional[TenderStatus] = None
    submission_deadline: Optional[datetime] = None
    publication_date: Optional[datetime] = None
    evaluation_start_date: Optional[datetime] = None
    evaluation_end_date: Optional[datetime] = None
    award_date: Optional[datetime] = None
    estimated_value: Optional[float] = None
    awarded_value: Optional[float] = None
    currency: Optional[str] = None
    procurement_reference: Optional[str] = None
    organization_id: Optional[int] = None
    metadata: Optional[Dict[str, Any]] = None

class TenderAIUpdate(BaseModel):
    success_probability: Optional[float] = None
    ai_recommendations: Optional[Dict[str, Any]] = None

class TenderInDBBase(TenderBase, BaseSchema):
    id: Optional[int] = None
    status: TenderStatus = TenderStatus.DRAFT
    publication_date: Optional[datetime] = None
    evaluation_start_date: Optional[datetime] = None
    evaluation_end_date: Optional[datetime] = None
    award_date: Optional[datetime] = None
    awarded_value: Optional[float] = None
    owner_id: int
    success_probability: Optional[float] = None
    ai_recommendations: Optional[Dict[str, Any]] = None
    blockchain_hash: Optional[str] = None

class Tender(TenderInDBBase):
    documents: List[Any] = []
    requirements: List[Any] = []
    competitors: List[Any] = []

class TenderDocumentBase(BaseModel):
    title: str
    document_type: str
    file_path: Optional[str] = None
    content: Optional[str] = None
    is_ai_generated: Optional[bool] = False
    generation_parameters: Optional[Dict[str, Any]] = None
    version: Optional[int] = 1

class TenderDocumentCreate(TenderDocumentBase):
    tender_id: int

class TenderDocumentUpdate(BaseModel):
    title: Optional[str] = None
    document_type: Optional[str] = None
    file_path: Optional[str] = None
    content: Optional[str] = None
    is_ai_generated: Optional[bool] = None
    generation_parameters: Optional[Dict[str, Any]] = None
    version: Optional[int] = None

class TenderDocumentInDBBase(TenderDocumentBase, BaseSchema):
    id: Optional[int] = None
    tender_id: int
    document_id: Optional[int] = None

class TenderDocument(TenderDocumentInDBBase):
    pass

class TenderRequirementBase(BaseModel):
    title: str
    description: Optional[str] = None
    requirement_type: str
    is_mandatory: Optional[bool] = True
    weight: Optional[float] = 1.0
    compliance_level: Optional[float] = None

class TenderRequirementCreate(TenderRequirementBase):
    tender_id: int

class TenderRequirementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirement_type: Optional[str] = None
    is_mandatory: Optional[bool] = None
    weight: Optional[float] = None
    compliance_level: Optional[float] = None

class TenderRequirementInDBBase(TenderRequirementBase, BaseSchema):
    id: Optional[int] = None
    tender_id: int

class TenderRequirement(TenderRequirementInDBBase):
    pass

class TenderCompetitorBase(BaseModel):
    name: str
    estimated_bid: Optional[float] = None
    strength: Optional[float] = None
    weakness: Optional[float] = None
    previous_wins: Optional[int] = 0
    notes: Optional[str] = None

class TenderCompetitorCreate(TenderCompetitorBase):
    tender_id: int

class TenderCompetitorUpdate(BaseModel):
    name: Optional[str] = None
    estimated_bid: Optional[float] = None
    strength: Optional[float] = None
    weakness: Optional[float] = None
    previous_wins: Optional[int] = None
    notes: Optional[str] = None

class TenderCompetitorInDBBase(TenderCompetitorBase, BaseSchema):
    id: Optional[int] = None
    tender_id: int

class TenderCompetitor(TenderCompetitorInDBBase):
    pass
