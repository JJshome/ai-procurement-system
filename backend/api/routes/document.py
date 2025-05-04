"""
문서 관련 라우터 - 문서 생성, 조회, 수정, 삭제 등의 API 엔드포인트
"""

import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Optional

from fastapi import APIRouter, Body, Depends, File, HTTPException, Path, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import desc
from pymongo.database import Database

from db.session import get_db, get_mongo_db, BlockchainStorage
from models.user import User
from models.document import (
    Document, DocumentSection, DocumentTemplate, DocumentType,
    DocumentCreate, DocumentUpdate, DocumentGenerationRequest
)
from core.security import get_current_active_user
from ai_analysis.document_generator import get_document_generator
from config.settings import UPLOAD_DIR, ALLOWED_UPLOAD_EXTENSIONS

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/generate", response_model=Dict[str, Any])
async def generate_document(
    request: DocumentGenerationRequest,
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    AI를 이용한 문서 자동 생성
    
    - 문서 유형, 제목 및 기타 파라미터 필요
    - 입찰 ID가 제공된 경우 입찰 데이터 활용
    """
    logger.info(f"문서 생성 요청: {request.title} (유형: {request.document_type.value})")
    
    # 입찰 데이터 조회 (있는 경우)
    tender_data = None
    if request.tender_id:
        # MongoDB에서 입찰 데이터 조회
        tender_collection = mongo_db.tenders
        tender = tender_collection.find_one({"_id": request.tender_id})
        
        if not tender:
            # SQL 데이터베이스에서 조회
            tender = db.query(Tender).filter(Tender.id == request.tender_id).first()
            
            if not tender:
                logger.warning(f"입찰 ID {request.tender_id}에 대한 데이터를 찾을 수 없습니다.")
            else:
                tender_data = tender.to_dict()
        else:
            tender_data = tender
    
    # 문서 생성기 초기화
    generator_type = "hybrid"  # 기본값: 하이브리드 모드
    
    if request.content_requirements and "generator_type" in request.content_requirements:
        generator_type = request.content_requirements.get("generator_type")
    
    document_generator = get_document_generator(generator_type)
    
    try:
        # 문서 생성
        start_time = datetime.utcnow()
        generated_document = document_generator.generate_document(request, tender_data)
        generation_time = (datetime.utcnow() - start_time).total_seconds()
        
        logger.info(f"문서 생성 완료: {request.title} (시간: {generation_time:.2f}초)")
        
        # 생성된 문서 저장
        # MongoDB에 저장
        document_collection = mongo_db.documents
        
        mongo_doc = {
            "title": request.title,
            "description": f"AI 생성 문서: {request.document_type.value}",
            "document_type": request.document_type.value,
            "creator_id": current_user.id,
            "is_ai_generated": True,
            "generation_parameters": {
                "generator_type": generator_type,
                "style_parameters": request.style_parameters,
                "max_tokens": request.max_tokens
            },
            "tender_id": request.tender_id,
            "content": "\n\n".join([s["content"] for s in generated_document["sections"]]),
            "sections": generated_document["sections"],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "metadata": generated_document.get("metadata", {})
        }
        
        result = document_collection.insert_one(mongo_doc)
        document_id = result.inserted_id
        
        # SQL DB에도 참조 저장
        db_document = Document(
            title=request.title,
            description=f"AI 생성 문서: {request.document_type.value}",
            document_type=request.document_type.value,
            creator_id=current_user.id,
            is_ai_generated=True,
            generation_parameters={"mongodb_id": str(document_id)},
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        # 블록체인에 문서 해시 저장
        try:
            from core.security import BlockchainSecurity
            document_content = mongo_doc["content"]
            document_hash = BlockchainSecurity.hash_document(document_content)
            
            # 블록체인에 저장
            blockchain_hash = BlockchainStorage.store_document_hash(
                db_document.id, 
                document_hash,
                {
                    "document_type": request.document_type.value,
                    "creator_id": current_user.id,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
            
            # 해시 업데이트
            db_document.blockchain_hash = blockchain_hash
            db.commit()
            
            # MongoDB 문서도 업데이트
            document_collection.update_one(
                {"_id": document_id},
                {"$set": {"blockchain_hash": blockchain_hash}}
            )
            
            logger.info(f"문서 해시가 블록체인에 저장되었습니다: {blockchain_hash}")
        
        except Exception as e:
            logger.error(f"블록체인 저장 중 오류 발생: {str(e)}")
        
        # 응답 반환
        return {
            "message": "문서가 성공적으로 생성되었습니다.",
            "document_id": str(document_id),
            "sql_document_id": db_document.id,
            "title": request.title,
            "document_type": request.document_type.value,
            "generation_time": generation_time,
            "sections_count": len(generated_document["sections"]),
            "content_length": len(mongo_doc["content"]),
            "document": generated_document
        }
    
    except Exception as e:
        logger.error(f"문서 생성 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"문서 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("", response_model=List[Dict[str, Any]])
async def get_documents(
    skip: int = Query(0, description="건너뛸 문서 수"),
    limit: int = Query(100, description="반환할 최대 문서 수"),
    document_type: Optional[str] = Query(None, description="문서 유형 필터"),
    is_ai_generated: Optional[bool] = Query(None, description="AI 생성 문서만 필터링"),
    search_query: Optional[str] = Query(None, description="문서 제목 및 내용 검색"),
    tender_id: Optional[int] = Query(None, description="특정 입찰에 대한 문서만 필터링"),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
    current_user: User = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    문서 목록 조회
    
    - 필터링 및 페이징 지원
    - 검색 기능 지원
    """
    # 기본 쿼리 설정
    query = db.query(Document).filter(Document.is_deleted == False)
    
    # 필터 적용
    if document_type:
        query = query.filter(Document.document_type == document_type)
    
    if is_ai_generated is not None:
        query = query.filter(Document.is_ai_generated == is_ai_generated)
    
    if tender_id:
        # 여기서는 간단한 로직만 구현 (실제로는 더 복잡할 수 있음)
        query = query.filter(Document.metadata.contains({"tender_id": tender_id}))
    
    if search_query:
        # 제목 검색 (SQL)
        query = query.filter(Document.title.ilike(f"%{search_query}%"))
    
    # 정렬 및 페이징
    query = query.order_by(desc(Document.created_at))
    sql_documents = query.offset(skip).limit(limit).all()
    
    # 결과 목록
    documents = []
    
    for doc in sql_documents:
        document_data = {
            "id": doc.id,
            "title": doc.title,
            "description": doc.description,
            "document_type": doc.document_type,
            "creator_id": doc.creator_id,
            "created_at": doc.created_at,
            "updated_at": doc.updated_at,
            "is_ai_generated": doc.is_ai_generated,
            "blockchain_hash": doc.blockchain_hash
        }
        
        # MongoDB에 더 자세한 정보가 있는지 확인
        if doc.is_ai_generated and doc.generation_parameters and "mongodb_id" in doc.generation_parameters:
            mongo_id = doc.generation_parameters["mongodb_id"]
            mongo_doc = mongo_db.documents.find_one({"_id": mongo_id})
            
            if mongo_doc:
                # 추가 정보 포함
                document_data.update({
                    "mongo_id": str(mongo_id),
                    "sections_count": len(mongo_doc.get("sections", [])),
                    "content_preview": mongo_doc.get("content", "")[:200] + ("..." if len(mongo_doc.get("content", "")) > 200 else ""),
                    "metadata": mongo_doc.get("metadata", {})
                })
        
        documents.append(document_data)
    
    logger.info(f"문서 목록 조회: {len(documents)}개 결과")
    return documents


@router.get("/{document_id}", response_model=Dict[str, Any])
async def get_document(
    document_id: int = Path(..., description="문서 ID"),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    특정 문서 조회
    
    - 문서 ID로 문서 조회
    - 문서가 MongoDB에 저장된 경우 상세 정보 포함
    """
    # SQL DB에서 문서 조회
    document = db.query(Document).filter(Document.id == document_id, Document.is_deleted == False).first()
    
    if not document:
        logger.warning(f"문서 ID {document_id}을 찾을 수 없습니다.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="문서를 찾을 수 없습니다."
        )
    
    # 기본 문서 데이터
    document_data = {
        "id": document.id,
        "title": document.title,
        "description": document.description,
        "document_type": document.document_type,
        "creator_id": document.creator_id,
        "created_at": document.created_at,
        "updated_at": document.updated_at,
        "is_ai_generated": document.is_ai_generated,
        "file_path": document.file_path,
        "file_size": document.file_size,
        "file_format": document.file_format,
        "blockchain_hash": document.blockchain_hash
    }
    
    # MongoDB에 더 자세한 정보가 있는지 확인
    if document.is_ai_generated and document.generation_parameters and "mongodb_id" in document.generation_parameters:
        mongo_id = document.generation_parameters["mongodb_id"]
        mongo_doc = mongo_db.documents.find_one({"_id": mongo_id})
        
        if mongo_doc:
            # MongoDB 데이터 추가
            document_data.update({
                "mongo_id": str(mongo_id),
                "content": mongo_doc.get("content", ""),
                "sections": mongo_doc.get("sections", []),
                "metadata": mongo_doc.get("metadata", {}),
                "generation_parameters": mongo_doc.get("generation_parameters", {})
            })
    
    # 블록체인 검증 (해시가 있는 경우)
    if document.blockchain_hash:
        try:
            # 문서 내용 (MongoDB에서 가져온 경우)
            if "content" in document_data:
                from core.security import BlockchainSecurity
                document_content = document_data["content"]
                document_hash = BlockchainSecurity.hash_document(document_content)
                
                # 블록체인 검증
                is_valid = BlockchainStorage.verify_document_hash(document.id, document_hash)
                
                document_data["blockchain_verification"] = {
                    "verified": is_valid,
                    "hash": document_hash,
                    "blockchain_hash": document.blockchain_hash
                }
        
        except Exception as e:
            logger.error(f"블록체인 검증 중 오류 발생: {str(e)}")
            document_data["blockchain_verification"] = {
                "verified": False,
                "error": str(e)
            }
    
    logger.info(f"문서 조회: ID {document_id}")
    return document_data


@router.post("", response_model=Dict[str, Any])
async def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    새 문서 생성 (수동)
    
    - 제목, 문서 유형 등 기본 정보 필요
    """
    # 새 문서 생성
    db_document = Document(
        title=document.title,
        description=document.description,
        document_type=document.document_type.value,
        file_path=document.file_path,
        file_size=document.file_size,
        file_format=document.file_format,
        content=document.content,
        tags=document.tags,
        is_template=document.is_template,
        is_ai_generated=document.is_ai_generated,
        generation_parameters=document.generation_parameters,
        version=document.version,
        previous_version_id=document.previous_version_id,
        creator_id=current_user.id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    logger.info(f"문서 생성: ID {db_document.id}, 제목: {document.title}")
    
    return {
        "message": "문서가 성공적으로 생성되었습니다.",
        "document_id": db_document.id,
        "title": db_document.title
    }


@router.put("/{document_id}", response_model=Dict[str, Any])
async def update_document(
    document_id: int = Path(..., description="문서 ID"),
    document: DocumentUpdate = Body(...),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    문서 수정
    
    - 제목, 내용 등 수정 가능
    - 버전 관리 지원
    """
    # 문서 조회
    db_document = db.query(Document).filter(Document.id == document_id, Document.is_deleted == False).first()
    
    if not db_document:
        logger.warning(f"문서 ID {document_id}을 찾을 수 없습니다.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="문서를 찾을 수 없습니다."
        )
    
    # 권한 확인
    if db_document.creator_id != current_user.id and not current_user.is_superuser:
        logger.warning(f"문서 수정 권한 없음: 사용자 ID {current_user.id}, 문서 ID {document_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 문서를 수정할 권한이 없습니다."
        )
    
    # 필드 업데이트
    if document.title is not None:
        db_document.title = document.title
    
    if document.description is not None:
        db_document.description = document.description
    
    if document.document_type is not None:
        db_document.document_type = document.document_type.value
    
    if document.file_path is not None:
        db_document.file_path = document.file_path
    
    if document.file_size is not None:
        db_document.file_size = document.file_size
    
    if document.file_format is not None:
        db_document.file_format = document.file_format
    
    if document.content is not None:
        db_document.content = document.content
    
    if document.tags is not None:
        db_document.tags = document.tags
    
    if document.is_template is not None:
        db_document.is_template = document.is_template
    
    db_document.updated_at = datetime.utcnow()
    
    # 버전 관리
    if document.version is not None and document.version > db_document.version:
        db_document.previous_version_id = db_document.id
        db_document.version = document.version
    
    db.commit()
    
    # MongoDB 문서도 있으면 업데이트
    if db_document.is_ai_generated and db_document.generation_parameters and "mongodb_id" in db_document.generation_parameters:
        mongo_id = db_document.generation_parameters["mongodb_id"]
        
        update_data = {"updated_at": datetime.utcnow()}
        
        if document.title is not None:
            update_data["title"] = document.title
        
        if document.description is not None:
            update_data["description"] = document.description
        
        if document.content is not None:
            update_data["content"] = document.content
        
        mongo_db.documents.update_one({"_id": mongo_id}, {"$set": update_data})
    
    logger.info(f"문서 수정: ID {document_id}")
    
    return {
        "message": "문서가 성공적으로 수정되었습니다.",
        "document_id": db_document.id
    }


@router.delete("/{document_id}", response_model=Dict[str, Any])
async def delete_document(
    document_id: int = Path(..., description="문서 ID"),
    permanent: bool = Query(False, description="영구 삭제 여부"),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    문서 삭제
    
    - 소프트 삭제 (기본값) 또는 영구 삭제
    - 권한 확인
    """
    # 문서 조회
    db_document = db.query(Document).filter(Document.id == document_id).first()
    
    if not db_document:
        logger.warning(f"문서 ID {document_id}을 찾을 수 없습니다.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="문서를 찾을 수 없습니다."
        )
    
    # 권한 확인
    if db_document.creator_id != current_user.id and not current_user.is_superuser:
        logger.warning(f"문서 삭제 권한 없음: 사용자 ID {current_user.id}, 문서 ID {document_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="이 문서를 삭제할 권한이 없습니다."
        )
    
    # 파일이 있는 경우 파일 삭제 (영구 삭제 시에만)
    if permanent and db_document.file_path and os.path.exists(db_document.file_path):
        try:
            os.remove(db_document.file_path)
            logger.info(f"문서 파일 삭제: {db_document.file_path}")
        except Exception as e:
            logger.error(f"파일 삭제 중 오류 발생: {str(e)}")
    
    # MongoDB 문서 삭제 (영구 삭제 시에만)
    if permanent and db_document.is_ai_generated and db_document.generation_parameters and "mongodb_id" in db_document.generation_parameters:
        mongo_id = db_document.generation_parameters["mongodb_id"]
        
        try:
            mongo_db.documents.delete_one({"_id": mongo_id})
            logger.info(f"MongoDB 문서 삭제: {mongo_id}")
        except Exception as e:
            logger.error(f"MongoDB 문서 삭제 중 오류 발생: {str(e)}")
    
    # SQL DB 문서 삭제 또는 플래그 설정
    if permanent:
        db.delete(db_document)
        logger.info(f"문서 영구 삭제: ID {document_id}")
    else:
        db_document.is_deleted = True
        db_document.updated_at = datetime.utcnow()
        logger.info(f"문서 소프트 삭제: ID {document_id}")
    
    db.commit()
    
    return {
        "message": f"문서가 {'영구적으로 ' if permanent else ''}삭제되었습니다.",
        "document_id": document_id
    }


@router.post("/upload", response_model=Dict[str, Any])
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Query(None, description="문서 제목 (없으면 파일명 사용)"),
    document_type: Optional[str] = Query(None, description="문서 유형"),
    description: Optional[str] = Query(None, description="문서 설명"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    문서 파일 업로드
    
    - 파일 업로드 후 문서 생성
    - 허용된 파일 형식만 업로드 가능
    """
    # 파일 확장자 확인
    filename = file.filename
    extension = os.path.splitext(filename)[1].lower()
    
    if extension not in ALLOWED_UPLOAD_EXTENSIONS:
        logger.warning(f"업로드 실패: 허용되지 않은 파일 형식 ({extension})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"허용되지 않은 파일 형식입니다. 허용된 형식: {', '.join(ALLOWED_UPLOAD_EXTENSIONS)}"
        )
    
    # 업로드 디렉터리 확인 및 생성
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    user_upload_dir = os.path.join(UPLOAD_DIR, f"user_{current_user.id}")
    os.makedirs(user_upload_dir, exist_ok=True)
    
    # 중복 방지를 위한 고유 파일명 생성
    unique_filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{filename}"
    file_path = os.path.join(user_upload_dir, unique_filename)
    
    # 파일 저장
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
        
        file_size = len(contents)
        logger.info(f"파일 업로드 성공: {file_path} (크기: {file_size}바이트)")
    
    except Exception as e:
        logger.error(f"파일 저장 중 오류 발생: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="파일 저장 중 오류가 발생했습니다."
        )
    
    # 문서 생성
    doc_title = title or os.path.splitext(filename)[0]
    doc_type = document_type or "OTHER"
    
    # 파일 형식에 따른 문서 유형 추정
    if not document_type:
        if extension in [".pdf", ".doc", ".docx"]:
            doc_type = "PROPOSAL"
        elif extension in [".xls", ".xlsx", ".csv"]:
            doc_type = "COST_ESTIMATE"
    
    db_document = Document(
        title=doc_title,
        description=description or f"업로드된 파일: {filename}",
        document_type=doc_type,
        file_path=file_path,
        file_size=file_size,
        file_format=extension[1:],  # 앞의 점(.) 제외
        creator_id=current_user.id,
        is_ai_generated=False,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    logger.info(f"문서 생성: ID {db_document.id}, 제목: {doc_title}")
    
    # 블록체인에 해시 저장 (추후 검증용)
    try:
        from core.security import BlockchainSecurity
        with open(file_path, "rb") as f:
            file_content = f.read()
        
        document_hash = BlockchainSecurity.hash_document(str(file_content))
        
        # 블록체인에 저장
        blockchain_hash = BlockchainStorage.store_document_hash(
            db_document.id, 
            document_hash,
            {
                "document_type": doc_type,
                "creator_id": current_user.id,
                "filename": filename,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
        
        # 해시 업데이트
        db_document.blockchain_hash = blockchain_hash
        db.commit()
        
        logger.info(f"문서 해시가 블록체인에 저장되었습니다: {blockchain_hash}")
    
    except Exception as e:
        logger.error(f"블록체인 저장 중 오류 발생: {str(e)}")
    
    return {
        "message": "파일 업로드 및 문서 생성이 완료되었습니다.",
        "document_id": db_document.id,
        "title": db_document.title,
        "file_name": unique_filename,
        "file_size": file_size,
        "file_format": extension[1:]
    }


@router.get("/download/{document_id}", response_class=FileResponse)
async def download_document(
    document_id: int = Path(..., description="문서 ID"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> FileResponse:
    """
    문서 파일 다운로드
    
    - 업로드된 문서 파일만 다운로드 가능
    """
    # 문서 조회
    document = db.query(Document).filter(Document.id == document_id, Document.is_deleted == False).first()
    
    if not document:
        logger.warning(f"문서 ID {document_id}을 찾을 수 없습니다.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="문서를 찾을 수 없습니다."
        )
    
    # 파일 경로 확인
    if not document.file_path or not os.path.exists(document.file_path):
        logger.warning(f"문서 ID {document_id}의 파일을 찾을 수 없습니다.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="문서 파일을 찾을 수 없습니다."
        )
    
    logger.info(f"문서 다운로드: ID {document_id}")
    
    # 파일 다운로드 응답
    filename = os.path.basename(document.file_path)
    return FileResponse(
        path=document.file_path,
        filename=filename,
        media_type="application/octet-stream"
    )


@router.get("/templates", response_model=List[Dict[str, Any]])
async def get_document_templates(
    document_type: Optional[str] = Query(None, description="문서 유형별 필터링"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> List[Dict[str, Any]]:
    """
    문서 템플릿 목록 조회
    
    - 문서 유형별 필터링 지원
    """
    # 쿼리 설정
    query = db.query(DocumentTemplate)
    
    # 필터 적용
    if document_type:
        query = query.filter(DocumentTemplate.template_type == document_type)
    
    templates = query.all()
    
    # 결과 목록
    result = []
    
    for template in templates:
        result.append({
            "id": template.id,
            "name": template.name,
            "description": template.description,
            "template_type": template.template_type,
            "content_structure": template.content_structure,
            "required_fields": template.required_fields,
            "usage_count": template.usage_count,
            "creator_id": template.creator_id
        })
    
    logger.info(f"템플릿 목록 조회: {len(result)}개 결과")
    return result


@router.post("/templates", response_model=Dict[str, Any])
async def create_document_template(
    name: str = Body(...),
    description: str = Body(None),
    template_type: str = Body(...),
    content_structure: Dict[str, Any] = Body(...),
    required_fields: Optional[Dict[str, Any]] = Body(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
) -> Dict[str, Any]:
    """
    문서 템플릿 생성
    
    - 템플릿 이름, 유형, 구조 필요
    """
    # 템플릿 중복 확인
    existing_template = db.query(DocumentTemplate).filter(
        DocumentTemplate.name == name,
        DocumentTemplate.template_type == template_type
    ).first()
    
    if existing_template:
        logger.warning(f"템플릿 생성 실패: 템플릿 이름 중복 ({name})")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="같은 이름과 유형의 템플릿이 이미 존재합니다."
        )
    
    # 템플릿 생성
    db_template = DocumentTemplate(
        name=name,
        description=description,
        template_type=template_type,
        content_structure=content_structure,
        required_fields=required_fields,
        usage_count=0,
        creator_id=current_user.id
    )
    
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    logger.info(f"템플릿 생성: ID {db_template.id}, 이름: {name}")
    
    return {
        "message": "템플릿이 성공적으로 생성되었습니다.",
        "template_id": db_template.id,
        "name": db_template.name
    }
