from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import Column, Integer, DateTime, Boolean, String, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from pydantic import BaseModel, Field

Base = declarative_base()

class BaseDBModel(Base):
    """
    모든 데이터베이스 모델의 기본이 되는 추상 클래스
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    is_deleted = Column(Boolean, default=False)
    
    def to_dict(self) -> Dict[str, Any]:
        """
        모델 인스턴스를 딕셔너리로 변환
        """
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class BaseSchema(BaseModel):
    """
    모든 Pydantic 스키마의 기본이 되는 클래스
    """
    id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: Optional[bool] = True
    is_deleted: Optional[bool] = False
    
    class Config:
        orm_mode = True
        arbitrary_types_allowed = True
