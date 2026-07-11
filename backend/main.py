import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import Base, engine
from app.api.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup if they do not exist
    try:
        # Wait slightly or create tables directly
        # Let's write the pgvector extension statement before creating tables
        # since SQLAlchemy Vector columns require the pgvector extension loaded!
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
    except Exception as e:
        print(f"Warning: Could not create pgvector extension directly. Make sure pgvector is enabled. Error: {e}")
        
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized successfully.")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan,
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add production frontend URLs here in production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Keep open for easy deployment; restrict in sensitive production environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}

@app.get("/api/v1/init-db")
def init_db_endpoint():
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
    except Exception as e:
        pass
    
    try:
        Base.metadata.create_all(bind=engine)
        return {"status": "success", "message": "Database tables created successfully."}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Swamy Jewellery SaaS CRM API",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
