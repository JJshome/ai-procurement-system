"""
AI 예측 모듈 - 입찰 성공 확률 예측, 경쟁 분석 등의 AI 기반 예측 기능을 구현합니다.
"""

import os
import logging
import json
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error
import tensorflow as tf
from transformers import TFAutoModelForSequenceClassification, AutoTokenizer

from config.settings import MODEL_CONFIG

logger = logging.getLogger(__name__)

class BasePredictorModel:
    """기본 예측 모델 클래스"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.model_path = model_path
        self.is_trained = False
        self.features = []
        self.target = None
        
    def preprocess_data(self, data: Dict[str, Any]) -> np.ndarray:
        """데이터 전처리"""
        raise NotImplementedError("자식 클래스에서 구현해야 합니다")
    
    def train(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """모델 훈련"""
        raise NotImplementedError("자식 클래스에서 구현해야 합니다")
    
    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """예측 수행"""
        raise NotImplementedError("자식 클래스에서 구현해야 합니다")
    
    def evaluate(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """모델 평가"""
        raise NotImplementedError("자식 클래스에서 구현해야 합니다")
    
    def save_model(self, path: Optional[str] = None) -> str:
        """모델 저장"""
        raise NotImplementedError("자식 클래스에서 구현해야 합니다")
    
    def load_model(self, path: Optional[str] = None) -> None:
        """모델 로드"""
        raise NotImplementedError("자식 클래스에서 구현해야 합니다")


class TenderSuccessPredictionModel(BasePredictorModel):
    """입찰 성공 확률 예측 모델"""
    
    def __init__(self, model_path: Optional[str] = None):
        super().__init__(model_path)
        self.features = [
            'estimated_value', 'competition_level', 'organization_history_score',
            'technical_compliance_score', 'price_competitiveness_score',
            'past_performance_score', 'document_quality_score', 'relationship_score'
        ]
        self.target = 'success'
        self.threshold = float(MODEL_CONFIG['prediction']['threshold'])
        
        if model_path:
            self.load_model(model_path)
        else:
            # 모델 초기화
            self.model = Pipeline([
                ('scaler', StandardScaler()),
                ('classifier', RandomForestClassifier(
                    n_estimators=100, 
                    max_depth=10,
                    min_samples_split=5,
                    random_state=42
                ))
            ])
    
    def preprocess_data(self, data: Dict[str, Any]) -> np.ndarray:
        """입찰 데이터 전처리"""
        # 필요한 특성 확인 및 추출
        processed_data = {}
        
        # 필수 특성 존재 확인
        for feature in self.features:
            if feature in data:
                processed_data[feature] = data[feature]
            else:
                # 없는 특성은 0으로 채움 (실제로는 더 정교한 데이터 보정 필요)
                processed_data[feature] = 0
                logger.warning(f"입찰 성공 예측 모델: 필수 특성 '{feature}'가 데이터에 없습니다. 0으로 대체합니다.")
        
        # 데이터프레임으로 변환
        df = pd.DataFrame([processed_data])
        return df[self.features].values
    
    def train(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """모델 훈련"""
        logger.info("입찰 성공 예측 모델 훈련 시작...")
        
        # 훈련 및 테스트 데이터 분할
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # 모델 훈련
        self.model.fit(X_train, y_train)
        
        # 모델 평가
        evaluation = self.evaluate(X_test, y_test)
        
        self.is_trained = True
        logger.info(f"입찰 성공 예측 모델 훈련 완료: 정확도 {evaluation['accuracy']:.4f}")
        
        return evaluation
    
    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """입찰 성공 확률 예측"""
        if not self.is_trained and not self.model_path:
            raise ValueError("모델이 훈련되지 않았습니다. train() 메서드를 먼저 호출하거나 훈련된 모델을 로드하세요.")
        
        # 데이터 전처리
        X = self.preprocess_data(data)
        
        # 예측 확률 계산
        probabilities = self.model.predict_proba(X)[0]
        success_probability = float(probabilities[1])  # 성공 클래스의 확률
        
        # 예측 결과 해석
        predicted_success = success_probability >= self.threshold
        confidence_level = abs(success_probability - 0.5) * 2  # 0.5에서 멀수록 높은 신뢰도
        
        # 주요 영향 요소 분석 (간단한 구현, 실제로는 SHAP 등의 방법을 사용)
        feature_importance = None
        if hasattr(self.model['classifier'], 'feature_importances_'):
            importance = self.model['classifier'].feature_importances_
            feature_importance = dict(zip(self.features, importance.tolist()))
        
        return {
            'success_probability': success_probability,
            'predicted_success': bool(predicted_success),
            'confidence_level': float(confidence_level),
            'threshold': float(self.threshold),
            'feature_importance': feature_importance,
            'prediction_time': pd.Timestamp.now().isoformat()
        }
    
    def evaluate(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """모델 평가"""
        # 예측
        y_pred = self.model.predict(X)
        y_prob = self.model.predict_proba(X)[:, 1]
        
        # 성능 지표 계산
        accuracy = accuracy_score(y, y_pred)
        precision = precision_score(y, y_pred, zero_division=0)
        recall = recall_score(y, y_pred, zero_division=0)
        f1 = f1_score(y, y_pred, zero_division=0)
        
        return {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'sample_count': len(y)
        }
    
    def save_model(self, path: Optional[str] = None) -> str:
        """모델 저장"""
        import joblib
        
        save_path = path or self.model_path or os.path.join(
            MODEL_CONFIG['prediction']['path'], 'tender_success_model.joblib'
        )
        
        # 디렉터리 확인 및 생성
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # 모델 저장
        joblib.dump(self.model, save_path)
        logger.info(f"입찰 성공 예측 모델 저장 완료: {save_path}")
        
        self.model_path = save_path
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """모델 로드"""
        import joblib
        
        load_path = path or self.model_path or os.path.join(
            MODEL_CONFIG['prediction']['path'], 'tender_success_model.joblib'
        )
        
        if not os.path.exists(load_path):
            raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {load_path}")
        
        # 모델 로드
        self.model = joblib.load(load_path)
        self.is_trained = True
        logger.info(f"입찰 성공 예측 모델 로드 완료: {load_path}")


class CompetitorAnalysisModel(BasePredictorModel):
    """경쟁사 분석 모델"""
    
    def __init__(self, model_path: Optional[str] = None):
        super().__init__(model_path)
        self.features = [
            'past_wins_count', 'past_loses_count', 'avg_bid_amount',
            'technical_score', 'financial_stability', 'resource_capability',
            'relationship_with_buyer', 'innovation_level', 'delivery_track_record'
        ]
        self.target = 'expected_bid_amount'
        
        if model_path:
            self.load_model(model_path)
        else:
            # 모델 초기화
            self.model = Pipeline([
                ('scaler', StandardScaler()),
                ('regressor', GradientBoostingRegressor(
                    n_estimators=100,
                    max_depth=5,
                    learning_rate=0.1,
                    random_state=42
                ))
            ])
    
    def preprocess_data(self, data: Dict[str, Any]) -> np.ndarray:
        """경쟁사 데이터 전처리"""
        # 필요한 특성 확인 및 추출
        processed_data = {}
        
        # 필수 특성 존재 확인
        for feature in self.features:
            if feature in data:
                processed_data[feature] = data[feature]
            else:
                # 없는 특성은 0으로 채움 (실제로는 더 정교한 데이터 보정 필요)
                processed_data[feature] = 0
                logger.warning(f"경쟁사 분석 모델: 필수 특성 '{feature}'가 데이터에 없습니다. 0으로 대체합니다.")
        
        # 데이터프레임으로 변환
        df = pd.DataFrame([processed_data])
        return df[self.features].values
    
    def train(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """모델 훈련"""
        logger.info("경쟁사 분석 모델 훈련 시작...")
        
        # 훈련 및 테스트 데이터 분할
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # 모델 훈련
        self.model.fit(X_train, y_train)
        
        # 모델 평가
        evaluation = self.evaluate(X_test, y_test)
        
        self.is_trained = True
        logger.info(f"경쟁사 분석 모델 훈련 완료: RMSE {evaluation['rmse']:.4f}")
        
        return evaluation
    
    def predict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """경쟁사 분석 및 예상 입찰액 예측"""
        if not self.is_trained and not self.model_path:
            raise ValueError("모델이 훈련되지 않았습니다. train() 메서드를 먼저 호출하거나 훈련된 모델을 로드하세요.")
        
        # 데이터 전처리
        X = self.preprocess_data(data)
        
        # 예측
        expected_bid_amount = float(self.model.predict(X)[0])
        
        # 주요 영향 요소 분석
        feature_importance = None
        if hasattr(self.model['regressor'], 'feature_importances_'):
            importance = self.model['regressor'].feature_importances_
            feature_importance = dict(zip(self.features, importance.tolist()))
        
        # 강점/약점 분석 (간단한 구현)
        strengths = []
        weaknesses = []
        
        if feature_importance:
            # 특성 중요도 기준으로 상위 3개와 하위 3개 특성 확인
            sorted_features = sorted(
                feature_importance.items(), 
                key=lambda x: x[1], 
                reverse=True
            )
            
            # 상위 3개를 강점으로
            for feature, importance in sorted_features[:3]:
                if importance > 0.05:  # 중요도가 일정 이상일 때만
                    strengths.append({
                        'feature': feature,
                        'importance': float(importance),
                        'value': float(data.get(feature, 0))
                    })
            
            # 하위 3개를 약점으로
            for feature, importance in sorted_features[-3:]:
                if importance > 0.01:  # 중요도가 일정 이상일 때만
                    weaknesses.append({
                        'feature': feature,
                        'importance': float(importance),
                        'value': float(data.get(feature, 0))
                    })
        
        return {
            'competitor_name': data.get('name', 'Unknown Competitor'),
            'expected_bid_amount': expected_bid_amount,
            'bid_range': {
                'min': expected_bid_amount * 0.9,  # 10% 하한
                'max': expected_bid_amount * 1.1   # 10% 상한
            },
            'strengths': strengths,
            'weaknesses': weaknesses,
            'feature_importance': feature_importance,
            'prediction_time': pd.Timestamp.now().isoformat()
        }
    
    def evaluate(self, X: np.ndarray, y: np.ndarray) -> Dict[str, Any]:
        """모델 평가"""
        # 예측
        y_pred = self.model.predict(X)
        
        # 성능 지표 계산
        rmse = np.sqrt(mean_squared_error(y, y_pred))
        mape = np.mean(np.abs((y - y_pred) / y)) * 100
        
        return {
            'rmse': float(rmse),
            'mape': float(mape),
            'sample_count': len(y)
        }
    
    def save_model(self, path: Optional[str] = None) -> str:
        """모델 저장"""
        import joblib
        
        save_path = path or self.model_path or os.path.join(
            MODEL_CONFIG['prediction']['path'], 'competitor_analysis_model.joblib'
        )
        
        # 디렉터리 확인 및 생성
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        
        # 모델 저장
        joblib.dump(self.model, save_path)
        logger.info(f"경쟁사 분석 모델 저장 완료: {save_path}")
        
        self.model_path = save_path
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """모델 로드"""
        import joblib
        
        load_path = path or self.model_path or os.path.join(
            MODEL_CONFIG['prediction']['path'], 'competitor_analysis_model.joblib'
        )
        
        if not os.path.exists(load_path):
            raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {load_path}")
        
        # 모델 로드
        self.model = joblib.load(load_path)
        self.is_trained = True
        logger.info(f"경쟁사 분석 모델 로드 완료: {load_path}")


class DocumentQualityAnalysisModel:
    """문서 품질 분석 모델 (Transformer 기반)"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.tokenizer = None
        self.model_path = model_path
        self.is_trained = False
        self.labels = ['poor', 'fair', 'good', 'excellent']
        
        if model_path:
            self.load_model(model_path)
    
    def initialize_model(self, pretrained_model: str = "bert-base-multilingual-cased"):
        """모델 초기화"""
        logger.info(f"문서 품질 분석 모델 초기화 (Pretrained: {pretrained_model})...")
        
        # 토크나이저 로드
        self.tokenizer = AutoTokenizer.from_pretrained(pretrained_model)
        
        # 모델 로드
        self.model = TFAutoModelForSequenceClassification.from_pretrained(
            pretrained_model, 
            num_labels=len(self.labels)
        )
    
    def preprocess_text(self, text: str, max_length: int = 512) -> Dict[str, tf.Tensor]:
        """텍스트 전처리"""
        # 토크나이저 없으면 에러
        if self.tokenizer is None:
            raise ValueError("토크나이저가 초기화되지 않았습니다.")
        
        # 토큰화
        encoded = self.tokenizer(
            text,
            truncation=True,
            padding="max_length",
            max_length=max_length,
            return_tensors="tf"
        )
        
        return encoded
    
    def train(self, texts: List[str], labels: List[int], epochs: int = 3) -> Dict[str, Any]:
        """모델 훈련"""
        if self.model is None:
            self.initialize_model()
        
        logger.info("문서 품질 분석 모델 훈련 시작...")
        
        # 데이터 전처리
        encoded_texts = [self.preprocess_text(text) for text in texts]
        
        # 데이터셋 생성
        train_dataset = tf.data.Dataset.from_tensor_slices((
            dict(
                input_ids=tf.stack([x["input_ids"][0] for x in encoded_texts]),
                attention_mask=tf.stack([x["attention_mask"][0] for x in encoded_texts])
            ),
            labels
        )).batch(16)
        
        # 모델 컴파일
        self.model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=5e-5),
            loss=tf.keras.losses.SparseCategoricalCrossentropy(from_logits=True),
            metrics=['accuracy']
        )
        
        # 모델 훈련
        history = self.model.fit(
            train_dataset,
            epochs=epochs
        )
        
        self.is_trained = True
        
        # 훈련 결과
        return {
            'accuracy': float(history.history['accuracy'][-1]),
            'loss': float(history.history['loss'][-1]),
            'epochs': epochs
        }
    
    def predict(self, text: str) -> Dict[str, Any]:
        """문서 품질 분석"""
        if not self.is_trained and not self.model_path:
            raise ValueError("모델이 훈련되지 않았습니다. train() 메서드를 먼저 호출하거나 훈련된 모델을 로드하세요.")
        
        # 데이터 전처리
        encoded = self.preprocess_text(text)
        
        # 예측
        outputs = self.model(encoded)
        logits = outputs.logits.numpy()[0]
        probabilities = tf.nn.softmax(logits).numpy()
        
        # 결과 해석
        predicted_label_id = np.argmax(probabilities)
        predicted_label = self.labels[predicted_label_id]
        
        # 각 레이블별 확률
        label_probabilities = {
            label: float(prob) for label, prob in zip(self.labels, probabilities)
        }
        
        # 개선 제안 (간단한 규칙 기반)
        improvement_suggestions = []
        
        if predicted_label_id < 3:  # 최고 등급 아닐 경우 제안 생성
            # 이 부분에서는 실제로는 더 정교한 분석과 피드백이 필요
            if probabilities[0] > 0.2 or probabilities[1] > 0.3:  # poor나 fair일 확률이 높으면
                improvement_suggestions.append("문서의 전반적인 구조와 명확성을 개선하세요.")
                improvement_suggestions.append("핵심 정보를 더 강조하고 불필요한 내용을 줄이세요.")
            
            if probabilities[2] > 0.4:  # good일 확률이 높으면
                improvement_suggestions.append("전문 용어와 표현을 더 정확하게 사용하세요.")
                improvement_suggestions.append("경쟁 우위 요소를 더 명확하게 강조하세요.")
        
        return {
            'quality_score': float((predicted_label_id + 1) / len(self.labels)),  # 정규화된 점수 (0.25~1.0)
            'quality_label': predicted_label,
            'confidence': float(probabilities[predicted_label_id]),
            'label_probabilities': label_probabilities,
            'improvement_suggestions': improvement_suggestions,
            'analysis_time': pd.Timestamp.now().isoformat()
        }
    
    def save_model(self, path: Optional[str] = None) -> str:
        """모델 저장"""
        save_path = path or self.model_path or os.path.join(
            MODEL_CONFIG['prediction']['path'], 'document_quality_model'
        )
        
        # 디렉터리 확인 및 생성
        os.makedirs(save_path, exist_ok=True)
        
        # 모델 및 토크나이저 저장
        self.model.save_pretrained(save_path)
        self.tokenizer.save_pretrained(save_path)
        
        # 레이블 정보 저장
        with open(os.path.join(save_path, 'labels.json'), 'w') as f:
            json.dump(self.labels, f)
        
        logger.info(f"문서 품질 분석 모델 저장 완료: {save_path}")
        
        self.model_path = save_path
        return save_path
    
    def load_model(self, path: Optional[str] = None) -> None:
        """모델 로드"""
        load_path = path or self.model_path or os.path.join(
            MODEL_CONFIG['prediction']['path'], 'document_quality_model'
        )
        
        if not os.path.exists(load_path):
            raise FileNotFoundError(f"모델 파일을 찾을 수 없습니다: {load_path}")
        
        # 모델 및 토크나이저 로드
        self.model = TFAutoModelForSequenceClassification.from_pretrained(load_path)
        self.tokenizer = AutoTokenizer.from_pretrained(load_path)
        
        # 레이블 정보 로드
        labels_path = os.path.join(load_path, 'labels.json')
        if os.path.exists(labels_path):
            with open(labels_path, 'r') as f:
                self.labels = json.load(f)
        
        self.is_trained = True
        logger.info(f"문서 품질 분석 모델 로드 완료: {load_path}")
