"""
AI 문서 생성 모듈 - 입찰 문서 자동 생성 및 최적화 기능을 구현합니다.
"""

import os
import logging
import json
import time
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime

# NLP 및 텍스트 처리
import numpy as np
import pandas as pd
import nltk
import spacy
from transformers import pipeline, GPT2LMHeadModel, GPT2Tokenizer

# 내부 모듈
from config.settings import MODEL_CONFIG, NLP_CONFIG
from models.document import DocumentType, DocumentGenerationRequest

logger = logging.getLogger(__name__)

class BaseDocumentGenerator:
    """기본 문서 생성기 클래스"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.is_initialized = False
    
    def initialize(self) -> None:
        """모델 초기화"""
        raise NotImplementedError("자식 클래스에서 구현해야 합니다")
    
    def generate_document(self, request: DocumentGenerationRequest) -> Dict[str, Any]:
        """문서 생성"""
        raise NotImplementedError("자식 클래스에서 구현해야 합니다")


class TransformerDocumentGenerator(BaseDocumentGenerator):
    """Transformer 기반 문서 생성기"""
    
    def __init__(self, model_name: str = "gpt2"):
        super().__init__()
        self.model_name = model_name
        self.max_length = 1024
        self.document_templates = {}
        self._load_templates()
    
    def _load_templates(self) -> None:
        """문서 템플릿 로드"""
        try:
            template_dir = os.path.join(MODEL_CONFIG['transformer']['path'], 'templates')
            if not os.path.exists(template_dir):
                logger.warning(f"템플릿 디렉터리를 찾을 수 없습니다: {template_dir}")
                return
            
            # 템플릿 디렉터리에서 모든 JSON 파일 로드
            for filename in os.listdir(template_dir):
                if filename.endswith('.json'):
                    with open(os.path.join(template_dir, filename), 'r', encoding='utf-8') as f:
                        template = json.load(f)
                        template_type = template.get('document_type')
                        if template_type:
                            self.document_templates[template_type] = template
                            logger.info(f"템플릿 로드: {template_type}")
        
        except Exception as e:
            logger.error(f"템플릿 로드 중 오류 발생: {str(e)}")
    
    def initialize(self) -> None:
        """모델 초기화"""
        logger.info(f"Transformer 문서 생성기 초기화 (모델: {self.model_name})...")
        
        try:
            self.tokenizer = GPT2Tokenizer.from_pretrained(self.model_name)
            self.model = GPT2LMHeadModel.from_pretrained(self.model_name)
            self.is_initialized = True
            logger.info("Transformer 문서 생성기 초기화 완료")
        
        except Exception as e:
            logger.error(f"Transformer 문서 생성기 초기화 실패: {str(e)}")
            raise
    
    def _get_template_for_document_type(self, document_type: DocumentType) -> Dict[str, Any]:
        """문서 유형에 맞는 템플릿 조회"""
        template = self.document_templates.get(document_type.value)
        
        if not template:
            logger.warning(f"'{document_type.value}' 유형에 대한 템플릿이 없습니다. 기본 템플릿을 사용합니다.")
            # 기본 템플릿 구성
            template = {
                "document_type": document_type.value,
                "structure": [
                    {"name": "개요", "required": True, "description": "문서의 주요 내용과 목적 개요"},
                    {"name": "배경", "required": False, "description": "프로젝트 배경 및 관련 정보"},
                    {"name": "제안 내용", "required": True, "description": "핵심 제안 내용과 세부 사항"},
                    {"name": "기술적 접근", "required": True, "description": "기술적 접근 방법 및 방법론"},
                    {"name": "일정 및 결과물", "required": True, "description": "프로젝트 일정 및 주요 결과물"},
                    {"name": "비용", "required": False, "description": "예상 비용 및 예산 요약"},
                    {"name": "결론", "required": True, "description": "제안의 주요 장점 및 결론"}
                ],
                "style_guide": {
                    "tone": "professional",
                    "formality": "high",
                    "technical_level": "medium"
                }
            }
        
        return template
    
    def _prepare_context(self, request: DocumentGenerationRequest, tender_data: Optional[Dict[str, Any]] = None) -> str:
        """문서 생성을 위한 컨텍스트 준비"""
        context = [
            f"제목: {request.title}",
            f"문서 유형: {request.document_type.value}",
        ]
        
        if tender_data:
            context.extend([
                f"입찰 정보: {tender_data.get('title', '제목 없음')}",
                f"발주 기관: {tender_data.get('organization_name', '정보 없음')}",
                f"예산: {tender_data.get('estimated_value', '정보 없음')} {tender_data.get('currency', 'KRW')}"
            ])
            
            if tender_data.get('description'):
                context.append(f"입찰 설명: {tender_data['description']}")
        
        # 콘텐츠 요구사항이 있으면 추가
        if request.content_requirements:
            context.append("콘텐츠 요구사항:")
            for key, value in request.content_requirements.items():
                context.append(f"- {key}: {value}")
        
        return "\n".join(context)
    
    def _generate_text_for_section(self, section_name: str, section_desc: str, context: str, 
                                  style_params: Dict[str, Any], max_tokens: int = 500) -> str:
        """특정 섹션에 대한 텍스트 생성"""
        if not self.is_initialized:
            self.initialize()
        
        # 프롬프트 구성
        prompt = f"{context}\n\n{section_name} 섹션 내용 ({section_desc}):\n"
        
        # 스타일 지정
        tone = style_params.get('tone', 'professional')
        formality = style_params.get('formality', 'high')
        technical_level = style_params.get('technical_level', 'medium')
        
        prompt += f"[톤: {tone}, 형식성: {formality}, 기술 수준: {technical_level}]\n\n"
        
        # 텍스트 생성
        try:
            inputs = self.tokenizer(prompt, return_tensors="pt")
            outputs = self.model.generate(
                inputs.input_ids,
                max_length=min(self.max_length, len(inputs.input_ids[0]) + max_tokens),
                num_return_sequences=1,
                temperature=0.7,
                top_p=0.9,
                no_repeat_ngram_size=3
            )
            
            generated_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 프롬프트 부분 제거하고 생성된 내용만 반환
            result = generated_text[len(prompt):].strip()
            return result
        
        except Exception as e:
            logger.error(f"텍스트 생성 중 오류 발생: {str(e)}")
            return f"[텍스트 생성 오류: {str(e)}]"
    
    def generate_document(self, request: DocumentGenerationRequest, tender_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """문서 생성"""
        logger.info(f"문서 생성 시작: {request.title} (유형: {request.document_type.value})")
        
        if not self.is_initialized:
            self.initialize()
        
        # 템플릿 가져오기
        template = self._get_template_for_document_type(request.document_type)
        
        # 콘텍스트 준비
        context = self._prepare_context(request, tender_data)
        
        # 스타일 설정
        style_params = request.style_parameters or template.get('style_guide', {})
        
        # 문서 구조 정의
        structure = template.get('structure', [])
        
        # 포함 및 제외할 섹션 필터링
        if request.include_sections:
            structure = [s for s in structure if s['name'] in request.include_sections]
        if request.exclude_sections:
            structure = [s for s in structure if s['name'] not in request.exclude_sections]
        
        # 각 섹션에 대한 콘텐츠 생성
        generated_document = {
            "title": request.title,
            "document_type": request.document_type.value,
            "generated_at": datetime.now().isoformat(),
            "parameters": {
                "style": style_params,
                "max_tokens": request.max_tokens
            },
            "sections": []
        }
        
        # 섹션별 콘텐츠 생성
        for idx, section in enumerate(structure):
            section_name = section['name']
            section_desc = section.get('description', '')
            is_required = section.get('required', False)
            
            logger.info(f"섹션 생성 중: {section_name} (필수: {is_required})")
            
            # 섹션별 토큰 할당 (총 토큰을 각 섹션에 비례 배분)
            section_tokens = min(
                int(request.max_tokens / len(structure)),
                2000  # 섹션당 최대 토큰 수
            )
            
            start_time = time.time()
            
            # 섹션 내용 생성
            content = self._generate_text_for_section(
                section_name, 
                section_desc, 
                context, 
                style_params,
                section_tokens
            )
            
            # 섹션 정보 저장
            generated_document['sections'].append({
                "name": section_name,
                "order": idx + 1,
                "content": content,
                "required": is_required,
                "description": section_desc,
                "is_ai_generated": True,
                "generation_time": round(time.time() - start_time, 2)
            })
        
        # 추가 메타데이터
        content_length = sum(len(s['content']) for s in generated_document['sections'])
        
        generated_document['metadata'] = {
            "total_sections": len(generated_document['sections']),
            "content_length": content_length,
            "content_words": len(' '.join([s['content'] for s in generated_document['sections']]).split()),
            "generation_time_total": sum(s['generation_time'] for s in generated_document['sections'])
        }
        
        logger.info(f"문서 생성 완료: {request.title} (섹션 수: {len(generated_document['sections'])})")
        
        return generated_document


class TemplateBasedGenerator(BaseDocumentGenerator):
    """템플릿 기반 문서 생성기 (간단한 템플릿 엔진 사용)"""
    
    def __init__(self):
        super().__init__()
        self.nlp = None
        self.templates_path = os.path.join(MODEL_CONFIG['transformer']['path'], 'templates')
        self.templates = {}
        self.is_initialized = False
    
    def initialize(self) -> None:
        """초기화"""
        try:
            # spaCy 모델 로드
            self.nlp = spacy.load(NLP_CONFIG['spacy_model'])
            
            # 템플릿 로드
            self._load_templates()
            
            self.is_initialized = True
            logger.info("템플릿 기반 문서 생성기 초기화 완료")
        
        except Exception as e:
            logger.error(f"템플릿 기반 문서 생성기 초기화 실패: {str(e)}")
            raise
    
    def _load_templates(self) -> None:
        """템플릿 로드"""
        try:
            if not os.path.exists(self.templates_path):
                logger.warning(f"템플릿 디렉터리를 찾을 수 없습니다: {self.templates_path}")
                return
            
            for filename in os.listdir(self.templates_path):
                if filename.endswith('.json'):
                    with open(os.path.join(self.templates_path, filename), 'r', encoding='utf-8') as f:
                        template = json.load(f)
                        template_id = template.get('id') or os.path.splitext(filename)[0]
                        self.templates[template_id] = template
                        logger.info(f"템플릿 로드: {template_id}")
        
        except Exception as e:
            logger.error(f"템플릿 로드 중 오류 발생: {str(e)}")
    
    def _fill_template(self, template_text: str, data: Dict[str, Any]) -> str:
        """템플릿 텍스트에 데이터 채우기"""
        result = template_text
        
        # 단순 변수 치환 ({{변수명}})
        for key, value in data.items():
            placeholder = f"{{{{{key}}}}}"
            if placeholder in result:
                # 리스트나 딕셔너리는 JSON 문자열로 변환
                if isinstance(value, (list, dict)):
                    value_str = json.dumps(value, ensure_ascii=False)
                else:
                    value_str = str(value)
                
                result = result.replace(placeholder, value_str)
        
        # 조건부 섹션 처리 ({% if 조건 %} 내용 {% endif %})
        # 간단한 구현이므로 중첩된 조건문은 지원하지 않음
        import re
        pattern = r"{%\s*if\s+([^%]+)\s*%}(.*?){%\s*endif\s*%}"
        
        def process_condition(match):
            condition = match.group(1).strip()
            content = match.group(2)
            
            # 단순 변수 존재 확인 조건
            if condition in data and data[condition]:
                return content
            return ""
        
        result = re.sub(pattern, process_condition, result, flags=re.DOTALL)
        
        # 미처리된 플레이스홀더 제거
        result = re.sub(r"{{\s*[^}]+\s*}}", "", result)
        
        return result
    
    def generate_document(self, request: DocumentGenerationRequest, tender_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """문서 생성"""
        if not self.is_initialized:
            self.initialize()
        
        logger.info(f"템플릿 기반 문서 생성 시작: {request.title} (유형: {request.document_type.value})")
        
        # 템플릿 선택
        template_id = None
        if request.template_id:
            template_id = str(request.template_id)
        else:
            # 문서 유형에 맞는 템플릿 찾기
            for tid, template in self.templates.items():
                if template.get('document_type') == request.document_type.value:
                    template_id = tid
                    break
        
        if not template_id or template_id not in self.templates:
            logger.warning(f"적합한 템플릿을 찾을 수 없습니다. 기본 템플릿을 사용합니다.")
            # 기본 템플릿 구성
            template = {
                "id": "default",
                "document_type": request.document_type.value,
                "title": "{{title}}",
                "sections": [
                    {
                        "name": "개요",
                        "content": "본 문서는 {{title}}에 대한 {{document_type}} 문서입니다.\n\n{% if tender_title %}입찰 제목: {{tender_title}}{% endif %}\n\n{% if organization_name %}발주 기관: {{organization_name}}{% endif %}"
                    },
                    {
                        "name": "내용",
                        "content": "{% if content_requirements %}요구사항에 따른 내용이 여기에 들어갑니다.{% endif %}"
                    },
                    {
                        "name": "결론",
                        "content": "이상으로 {{title}}에 대한 내용을 마칩니다."
                    }
                ]
            }
        else:
            template = self.templates[template_id]
        
        # 데이터 준비
        data = {
            "title": request.title,
            "document_type": request.document_type.value,
            "generation_date": datetime.now().strftime("%Y-%m-%d"),
            "generation_time": datetime.now().strftime("%H:%M:%S")
        }
        
        # 입찰 정보 추가
        if tender_data:
            data.update({
                "tender_title": tender_data.get('title', ''),
                "tender_description": tender_data.get('description', ''),
                "organization_name": tender_data.get('organization_name', ''),
                "estimated_value": tender_data.get('estimated_value', ''),
                "currency": tender_data.get('currency', 'KRW'),
                "submission_deadline": tender_data.get('submission_deadline', '')
            })
        
        # 콘텐츠 요구사항 추가
        if request.content_requirements:
            data['content_requirements'] = request.content_requirements
        
        # 문서 생성
        generated_document = {
            "title": self._fill_template(template.get('title', request.title), data),
            "document_type": request.document_type.value,
            "template_id": template.get('id', 'default'),
            "generated_at": datetime.now().isoformat(),
            "sections": []
        }
        
        # 섹션 처리
        for idx, section in enumerate(template.get('sections', [])):
            # 포함/제외 섹션 필터링
            section_name = section.get('name', f'섹션 {idx+1}')
            
            if request.include_sections and section_name not in request.include_sections:
                continue
            if request.exclude_sections and section_name in request.exclude_sections:
                continue
            
            # 섹션 내용 생성
            content = self._fill_template(section.get('content', ''), data)
            
            generated_document['sections'].append({
                "name": section_name,
                "order": idx + 1,
                "content": content,
                "is_ai_generated": False,  # 템플릿 기반이므로 순수 AI 생성은 아님
                "template_based": True
            })
        
        # 추가 메타데이터
        content_length = sum(len(s['content']) for s in generated_document['sections'])
        
        generated_document['metadata'] = {
            "total_sections": len(generated_document['sections']),
            "content_length": content_length,
            "content_words": len(' '.join([s['content'] for s in generated_document['sections']]).split())
        }
        
        logger.info(f"템플릿 기반 문서 생성 완료: {request.title}")
        
        return generated_document


class HybridDocumentGenerator:
    """
    하이브리드 문서 생성기 - 템플릿 기반 + AI 기반
    템플릿으로 기본 구조를 생성하고 AI로 내용을 보강
    """
    
    def __init__(self):
        self.template_generator = TemplateBasedGenerator()
        self.ai_generator = TransformerDocumentGenerator()
        self.is_initialized = False
    
    def initialize(self) -> None:
        """초기화"""
        if not self.is_initialized:
            self.template_generator.initialize()
            self.ai_generator.initialize()
            self.is_initialized = True
            logger.info("하이브리드 문서 생성기 초기화 완료")
    
    def _enhance_section_with_ai(self, section: Dict[str, Any], context: str) -> Dict[str, Any]:
        """AI를 사용하여 섹션 내용 보강"""
        original_content = section['content']
        
        # 내용이 충분히 있는지 확인
        if len(original_content.split()) > 20:
            # 이미 충분한 내용이 있으면 그대로 반환
            return section
        
        # AI로 내용 생성
        ai_prompt = f"{context}\n\n섹션: {section['name']}\n기존 내용: {original_content}\n\n위 내용을 보완하여 더 상세하고 설득력 있게 작성해주세요."
        
        try:
            inputs = self.ai_generator.tokenizer(ai_prompt, return_tensors="pt")
            outputs = self.ai_generator.model.generate(
                inputs.input_ids,
                max_length=min(self.ai_generator.max_length, len(inputs.input_ids[0]) + 500),
                num_return_sequences=1,
                temperature=0.8,
                top_p=0.9
            )
            
            enhanced_text = self.ai_generator.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # 프롬프트 부분 제거
            enhanced_content = enhanced_text[len(ai_prompt):].strip()
            
            # 짧은 결과라면 원본 텍스트를 유지
            if len(enhanced_content.split()) < len(original_content.split()):
                return section
            
            # 보강된 내용 적용
            section['content'] = enhanced_content
            section['is_ai_enhanced'] = True
        
        except Exception as e:
            logger.error(f"AI 보강 중 오류 발생: {str(e)}")
        
        return section
    
    def generate_document(self, request: DocumentGenerationRequest, tender_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """하이브리드 방식으로 문서 생성"""
        if not self.is_initialized:
            self.initialize()
        
        logger.info(f"하이브리드 문서 생성 시작: {request.title}")
        
        # 1. 템플릿으로 기본 구조 생성
        base_document = self.template_generator.generate_document(request, tender_data)
        
        # 컨텍스트 준비
        context = f"제목: {request.title}\n문서 유형: {request.document_type.value}\n"
        if tender_data:
            context += f"입찰 정보: {tender_data.get('title', '')}\n"
            context += f"발주 기관: {tender_data.get('organization_name', '')}\n"
            context += f"설명: {tender_data.get('description', '')}\n"
        
        # 2. AI로 내용 보강
        for i, section in enumerate(base_document['sections']):
            logger.info(f"섹션 보강 중: {section['name']}")
            base_document['sections'][i] = self._enhance_section_with_ai(section, context)
        
        # 메타데이터 업데이트
        base_document['is_hybrid_generated'] = True
        base_document['metadata']['content_length'] = sum(len(s['content']) for s in base_document['sections'])
        base_document['metadata']['content_words'] = len(' '.join([s['content'] for s in base_document['sections']]).split())
        
        logger.info(f"하이브리드 문서 생성 완료: {request.title}")
        
        return base_document


# 팩토리 함수
def get_document_generator(generator_type: str = "hybrid") -> BaseDocumentGenerator:
    """문서 생성기 인스턴스 반환"""
    if generator_type == "transformer":
        return TransformerDocumentGenerator()
    elif generator_type == "template":
        return TemplateBasedGenerator()
    elif generator_type == "hybrid":
        return HybridDocumentGenerator()
    else:
        logger.warning(f"알 수 없는 생성기 유형: {generator_type}, 기본값(하이브리드)을 사용합니다.")
        return HybridDocumentGenerator()
