import os
from typing import Optional
from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Swamy Jewellery"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "SUPER_SECRET_TOKEN_KEY_CHANGE_IN_PRODUCTION_SWAMY JEWELLERY_12345"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "avanta"
    POSTGRES_PORT: str = "5432"
    
    POSTGRES_URL: Optional[str] = None
    DATABASE_URL: Optional[str] = None

    @computed_field
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        url_to_use = self.POSTGRES_URL or self.DATABASE_URL
        if url_to_use:
            url_to_use = url_to_use.replace("postgres://", "postgresql://")
            
            from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
            parsed = urlparse(url_to_use)
            qs = parse_qsl(parsed.query)
            # Remove any parameter that psycopg2 doesn't like
            filtered_qs = [(k, v) for k, v in qs if k not in ("supa", "pooler")]
            new_query = urlencode(filtered_qs)
            
            # Reconstruct URL
            new_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))
            return new_url
            
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
    # AI & Integration Keys
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
