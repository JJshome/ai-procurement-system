from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field, validator

from .base import BaseDBModel, BaseSchema

class DocumentType(str, Enum):
    """문서 유형 열거형"""
    PROPOSAL = "proposal"  # 제안서
    TECHNICAL_SPEC = "technical_spec"  # 기술 명세서
    COST_ESTIMATE = "cost_estimate"  # 비용 견적서
    CONTRACT = "contract"  # 계약서
    REFERENCE = "reference"  # 참조 문서
    TEMPLATE = "template"  # 템플릿
    OTHER = "other"  # 기타

class Document(BaseDBModel):
    """문서 데이터베이스 모델"""
    __tablename__ = "documents"
    
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    document_type = Column(String(50), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size = Column(Integer, nullable=True)  # 바이트 단위
    file_format = Column(String(20), nullable=True)
    content = Column(Text, nullable=True)
    
    # 메타데이터
    tags = Column(JSON, nullable=True)
    is_template = Column(Boolean, default=False)
    is_ai_generated = Column(Boolean, default=False)
    generation_parameters = Column(JSON, nullable=True)
    
    # 버전 관리
    version = Column(Integer, default=1)
    previous_version_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    
    # AI 분석 정보
    ai_analysis = Column(JSON, nullable=True)
    
    # 블록체인 정보
    blockchain_hash = Column(String(200), nullable=True)
    
    # 외래키 관계
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # 관계 설정
    creator = relationship("User", back_populates="documents")
    previous_version = relationship("Document", remote_side=[id])
    sections = relationship("DocumentSection", back_populates="document")
    
    def __repr__(self):
        return f"<Document {self.id}: {self.title}>"

class DocumentSection(BaseDBModel):
    """문서 섹션 데이터베이스 모델"""
    __tablename__ = "document_sections"
    
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=True)
    order = Column(Integer, nullable=False)
    is_ai_generated = Column(Boolean, default=False)
    generation_parameters = Column(JSON, nullable=True)
    ai_suggestions = Column(JSON, nullable=True)
    
    # 외래키 관계
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=False)
    
    # 관계 설정
    document = relationship("Document", back_populates="sections")
    
    def __repr__(self):
        return f"<DocumentSection {self.id}: {self.title}>"

class DocumentTemplate(BaseDBModel):
    """문서 템플릿 데이터베이스 모델"""
    __tablename__ = "document_templates"
    
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    template_type = Column(String(50), nullable=False)
    content_structure = Column(JSON, nullable=False)  # 템플릿 구조
    required_fields = Column(JSON, nullable=True)  # 필수 필드
    usage_count = Column(Integer, default=0)
    
    # 외래키 관계
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    def __repr__(self):
        return f"<DocumentTemplate {self.id}: {self.name}>"

# Pydantic 스키마 모델
class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    document_type: DocumentType
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_format: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_template: Optional[bool] = False
    is_ai_generated: Optional[bool] = False
    generation_parameters: Optional[Dict[str, Any]] = None
    version: Optional[int] = 1
    previous_version_id: Optional[int] = None

class DocumentCreate(DocumentBase):
    creator_id: int

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    document_type: Optional[DocumentType] = None
    file_path: Optional[str] = None
    file_size: Optional[int] = None
    file_format: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_template: Optional[bool] = None
    is_ai_generated: Optional[bool] = None
    generation_parameters: Optional[Dict[str, Any]] = None
    version: Optional[int] = None
    previous_version_id: Optional[int] = None
    ai_analysis: Optional[Dict[str, Any]] = None
    blockchain_hash: Optional[str] = None

class DocumentAIUpdate(BaseModel):
    ai_analysis: Optional[Dict[str, Any]] = None
    blockchain_hash: Optional[str] = None

class DocumentInDBBase(DocumentBase, BaseSchema):
    id: Optional[int] = None
    creator_id: int
    ai_analysis: Optional[Dict[str, Any]] = None
    blockchain_hash: Optional[str] = None

class Document(DocumentInDBBase):
    sections: List[Any] = []

class DocumentSectionBase(BaseModel):
    title: str
    content: Optional[str] = None
    order: int
    is_ai_generated: Optional[bool] = False
    generation_parameters: Optional[Dict[str, Any]] = None
    ai_suggestions: Optional[Dict[str, Any]] = None

class DocumentSectionCreate(DocumentSectionBase):
    document_id: int

class DocumentSectionUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    order: Optional[int] = None
    is_ai_generated: Optional[bool] = None
    generation_parameters: Optional[Dict[str, Any]] = None
    ai_suggestions: Optional[Dict[str, Any]] = None

class DocumentSectionInDBBase(DocumentSectionBase, BaseSchema):
    id: Optional[int] = None
    document_id: int

class DocumentSection(DocumentSectionInDBBase):
    pass

class DocumentTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_type: str
    content_structure: Dict[str, Any]
    required_fields: Optional[Dict[str, Any]] = None
    usage_count: Optional[int] = 0

class DocumentTemplateCreate(DocumentTemplateBase):
    creator_id: int

class DocumentTemplateUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_type: Optional[str] = None
    content_structure: Optional[Dict[str, Any]] = None
    required_fields: Optional[Dict[str, Any]] = None
    usage_count: Optional[int] = None

class DocumentTemplateInDBBase(DocumentTemplateBase, BaseSchema):
    id: Optional[int] = None
    creator_id: int

class DocumentTemplate(DocumentTemplateInDBBase):
    pass

class DocumentGenerationRequest(BaseModel):
    """AI 문서 생성 요청 스키마"""
    title: str
    document_type: DocumentType
    template_id: Optional[int] = None
    tender_id: Optional[int] = None
    content_requirements: Optional[Dict[str, Any]] = None
    style_parameters: Optional[Dict[str, Any]] = None
    target_length: Optional[int] = None
    max_tokens: Optional[int] = 4000
    include_sections: Optional[List[str]] = None
    exclude_sections: Optional[List[str]] = None
    
    @validator('target_length')
    def target_length_positive(cls, v):
        if v is not None and v <= 0:
            raise ValueError('대상 길이는 양수여야 합니다')
        return v
