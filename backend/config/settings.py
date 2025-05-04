import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, List, Optional, Union

# 환경 변수 로드
load_dotenv()

# 기본 경로
BASE_DIR = Path(__file__).resolve().parent.parent

# 보안 설정
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "*").split(",")

# 데이터베이스 설정
DATABASE_CONFIG = {
    "default": {
        "ENGINE": os.getenv("DB_ENGINE", "postgresql"),
        "NAME": os.getenv("DB_NAME", "ai_procurement"),
        "USER": os.getenv("DB_USER", "postgres"),
        "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "5432"),
    },
    "mongodb": {
        "URI": os.getenv("MONGODB_URI", "mongodb://localhost:27017/"),
        "DB_NAME": os.getenv("MONGODB_NAME", "ai_procurement"),
    }
}

# Redis 설정
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = os.getenv("REDIS_PORT", "6379")
REDIS_DB = os.getenv("REDIS_DB", "0")
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", "")

# 블록체인 설정
BLOCKCHAIN_CONFIG = {
    "provider": os.getenv("BLOCKCHAIN_PROVIDER", "http://localhost:8545"),
    "network_id": os.getenv("BLOCKCHAIN_NETWORK_ID", "1"),
    "private_key": os.getenv("BLOCKCHAIN_PRIVATE_KEY", ""),
    "contract_address": os.getenv("BLOCKCHAIN_CONTRACT_ADDRESS", ""),
}

# API 설정
API_V1_STR = "/api/v1"
API_TITLE = "AI 기반 공공조달 입찰 최적화 시스템 API"
API_DESCRIPTION = "공공조달 입찰 프로세스를 최적화하는 AI 시스템 API"
API_VERSION = "1.0.0"

# JWT 설정
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", SECRET_KEY)
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 30
JWT_REFRESH_TOKEN_EXPIRE_DAYS = 7

# CORS 설정
CORS_ORIGIN_WHITELIST = os.getenv(
    "CORS_ORIGIN_WHITELIST", 
    "http://localhost:3000,http://localhost:8000"
).split(",")

# AI 모델 설정
MODEL_CONFIG = {
    "transformer": {
        "path": os.getenv("TRANSFORMER_MODEL_PATH", "models/transformer"),
        "batch_size": int(os.getenv("TRANSFORMER_BATCH_SIZE", "32")),
        "learning_rate": float(os.getenv("TRANSFORMER_LEARNING_RATE", "5e-5")),
    },
    "prediction": {
        "path": os.getenv("PREDICTION_MODEL_PATH", "models/prediction"),
        "threshold": float(os.getenv("PREDICTION_THRESHOLD", "0.7")),
    }
}

# 로깅 설정
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        },
    },
    "handlers": {
        "console": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "standard",
        },
        "file": {
            "level": "INFO",
            "class": "logging.FileHandler",
            "filename": os.path.join(BASE_DIR, "logs/app.log"),
            "formatter": "standard",
        },
    },
    "loggers": {
        "": {
            "handlers": ["console", "file"],
            "level": "INFO",
            "propagate": True,
        },
    },
}

# 캐시 설정
CACHE_CONFIG = {
    "default": {
        "BACKEND": "redis_cache.RedisCache",
        "LOCATION": f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}",
        "OPTIONS": {
            "CLIENT_CLASS": "django_redis.client.DefaultClient",
            "PASSWORD": REDIS_PASSWORD or None,
        }
    }
}

# Kafka 설정
KAFKA_CONFIG = {
    "bootstrap_servers": os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092"),
    "consumer_group": os.getenv("KAFKA_CONSUMER_GROUP", "ai-procurement-group"),
    "topics": {
        "data_collection": os.getenv("KAFKA_TOPIC_DATA_COLLECTION", "data-collection"),
        "model_training": os.getenv("KAFKA_TOPIC_MODEL_TRAINING", "model-training"),
        "document_generation": os.getenv("KAFKA_TOPIC_DOC_GENERATION", "document-generation"),
    }
}

# 파일 업로드 설정
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
ALLOWED_UPLOAD_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt", ".json"]
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10MB

# NLP 설정
NLP_CONFIG = {
    "spacy_model": os.getenv("SPACY_MODEL", "ko_core_news_md"),
    "nltk_data_path": os.getenv("NLTK_DATA_PATH", os.path.join(BASE_DIR, "nltk_data")),
}

# 보안 설정
SECURITY_CONFIG = {
    "password_min_length": int(os.getenv("PASSWORD_MIN_LENGTH", "8")),
    "password_require_uppercase": os.getenv("PASSWORD_REQUIRE_UPPERCASE", "True").lower() == "true",
    "password_require_lowercase": os.getenv("PASSWORD_REQUIRE_LOWERCASE", "True").lower() == "true",
    "password_require_number": os.getenv("PASSWORD_REQUIRE_NUMBER", "True").lower() == "true",
    "password_require_special_char": os.getenv("PASSWORD_REQUIRE_SPECIAL_CHAR", "True").lower() == "true",
    "max_login_attempts": int(os.getenv("MAX_LOGIN_ATTEMPTS", "5")),
    "lockout_time_minutes": int(os.getenv("LOCKOUT_TIME_MINUTES", "30")),
}
