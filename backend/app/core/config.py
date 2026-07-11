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
            # psycopg2 crashes on Vercel's Supabase query params like "supa=base-pooler.x"
            import re
            url_to_use = re.sub(r'([?&])supa=[^&]*', r'\1', url_to_use)
            url_to_use = url_to_use.rstrip('?&')
            return url_to_use
            
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
