"""
데이터베이스 세션 관리 모듈 - 데이터베이스 연결 및 세션 관리
"""

import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pymongo import MongoClient
from pymongo.database import Database

from config.settings import DATABASE_CONFIG

logger = logging.getLogger(__name__)

# PostgreSQL 데이터베이스 설정
SQLALCHEMY_DATABASE_URL = f"{DATABASE_CONFIG['default']['ENGINE']}://{DATABASE_CONFIG['default']['USER']}:{DATABASE_CONFIG['default']['PASSWORD']}@{DATABASE_CONFIG['default']['HOST']}:{DATABASE_CONFIG['default']['PORT']}/{DATABASE_CONFIG['default']['NAME']}"

# SQLAlchemy 엔진 및 세션 설정
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # 연결 확인을 위한 핑
    pool_size=10,        # 연결 풀 크기
    max_overflow=20,     # 최대 추가 연결 수
    pool_recycle=3600,   # 연결 재사용 시간(초)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# MongoDB 설정
mongo_client = MongoClient(DATABASE_CONFIG['mongodb']['URI'])
mongo_db = mongo_client[DATABASE_CONFIG['mongodb']['DB_NAME']]


def get_db() -> Generator[Session, None, None]:
    """SQLAlchemy 세션을 생성하고 요청 처리 후 닫는 의존성 함수"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_mongo_db() -> Database:
    """MongoDB 객체를 반환하는 의존성 함수"""
    try:
        # MongoDB 연결 확인
        mongo_client.admin.command('ping')
        return mongo_db
    except Exception as e:
        logger.error(f"MongoDB 연결 오류: {str(e)}")
        raise


class DatabaseManager:
    """데이터베이스 관리 클래스"""
    
    @staticmethod
    def init_db() -> None:
        """데이터베이스 초기화"""
        # 필요한 경우 여기에 스키마 생성 등의 코드 추가
        from models.base import Base
        Base.metadata.create_all(bind=engine)
        logger.info("PostgreSQL 데이터베이스 테이블 생성 완료")
    
    @staticmethod
    def close_connections() -> None:
        """모든 데이터베이스 연결 종료"""
        engine.dispose()
        mongo_client.close()
        logger.info("모든 데이터베이스 연결 종료")
    
    @staticmethod
    def create_mongo_indexes() -> None:
        """MongoDB 인덱스 생성"""
        try:
            # 예제: 입찰 컬렉션에 인덱스 생성
            mongo_db.tenders.create_index("title")
            mongo_db.tenders.create_index("status")
            mongo_db.tenders.create_index("submission_deadline")
            
            # 예제: 문서 컬렉션에 인덱스 생성
            mongo_db.documents.create_index("title")
            mongo_db.documents.create_index("document_type")
            mongo_db.documents.create_index("creator_id")
            
            # 예제: 분석 결과 컬렉션에 인덱스 생성
            mongo_db.analysis_results.create_index("tender_id")
            mongo_db.analysis_results.create_index("created_at")
            
            logger.info("MongoDB 인덱스 생성 완료")
        
        except Exception as e:
            logger.error(f"MongoDB 인덱스 생성 오류: {str(e)}")
    
    @staticmethod
    def get_connection_status() -> dict:
        """데이터베이스 연결 상태 확인"""
        status = {
            "postgresql": False,
            "mongodb": False
        }
        
        # PostgreSQL 연결 확인
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            status["postgresql"] = True
        except Exception as e:
            logger.error(f"PostgreSQL 연결 확인 오류: {str(e)}")
        
        # MongoDB 연결 확인
        try:
            mongo_client.admin.command('ping')
            status["mongodb"] = True
        except Exception as e:
            logger.error(f"MongoDB 연결 확인 오류: {str(e)}")
        
        return status


# MongoDB 컬렉션 헬퍼 함수
def get_collection(collection_name: str):
    """MongoDB 컬렉션 객체 반환"""
    return mongo_db[collection_name]


# 블록체인 데이터베이스 스토리지 (추상화된 인터페이스)
class BlockchainStorage:
    """블록체인 데이터 스토리지 클래스"""
    
    @staticmethod
    def store_document_hash(document_id: int, document_hash: str, metadata: dict = None) -> str:
        """문서 해시를 블록체인에 저장하고 트랜잭션 ID 반환"""
        # 실제 구현에서는 Web3 또는 적절한 블록체인 라이브러리를 사용해야 함
        # 예시 구현임
        
        # MongoDB에 임시 저장 (실제로는 블록체인에 저장해야 함)
        blockchain_collection = get_collection("blockchain_transactions")
        
        transaction_data = {
            "document_id": document_id,
            "document_hash": document_hash,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {},
            "transaction_type": "document_hash"
        }
        
        result = blockchain_collection.insert_one(transaction_data)
        transaction_id = str(result.inserted_id)
        
        logger.info(f"문서 해시 저장 (문서 ID: {document_id}, 트랜잭션 ID: {transaction_id})")
        
        return transaction_id
    
    @staticmethod
    def verify_document_hash(document_id: int, document_hash: str) -> bool:
        """저장된 문서 해시 검증"""
        # 실제 구현에서는 블록체인에서 해시를 조회하고 검증해야 함
        # 예시 구현임
        
        blockchain_collection = get_collection("blockchain_transactions")
        
        # 가장 최근의 해시 기록 조회
        transaction = blockchain_collection.find_one(
            {"document_id": document_id, "transaction_type": "document_hash"},
            sort=[("timestamp", -1)]
        )
        
        if not transaction:
            logger.warning(f"문서 ID {document_id}에 대한 블록체인 트랜잭션을 찾을 수 없습니다.")
            return False
        
        stored_hash = transaction.get("document_hash")
        
        # 해시 비교
        is_valid = stored_hash == document_hash
        
        if not is_valid:
            logger.warning(f"문서 ID {document_id}의 해시가 일치하지 않습니다.")
        
        return is_valid
