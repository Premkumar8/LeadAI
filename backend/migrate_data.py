import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse

# Models
from app.models.crm import User, Company, Campaign, Project, Contact, Lead, Activity, Meeting, Email, Task

LOCAL_URL = os.getenv("LOCAL_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/avanta")

LIVE_URL_RAW = os.getenv("POSTGRES_URL", os.getenv("DATABASE_URL", ""))
if LIVE_URL_RAW:
    LIVE_URL_RAW = LIVE_URL_RAW.replace("postgres://", "postgresql://")
    parsed = urlparse(LIVE_URL_RAW)
    qs = parse_qsl(parsed.query)
    filtered_qs = [(k, v) for k, v in qs if k not in ("supa", "pooler")]
    LIVE_URL = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, urlencode(filtered_qs), parsed.fragment))
else:
    LIVE_URL = ""

print("Connecting to Local DB...")
engine_local = create_engine(LOCAL_URL)
SessionLocalLocal = sessionmaker(bind=engine_local)
db_local = SessionLocalLocal()

print("Connecting to Live DB...")
engine_live = create_engine(LIVE_URL)
SessionLocalLive = sessionmaker(bind=engine_live)
db_live = SessionLocalLive()

tables_to_migrate = [
    User, Company, Campaign, Project, Contact, Lead, Activity, Meeting, Email, Task
]

try:
    for model in tables_to_migrate:
        print(f"Migrating {model.__tablename__}...")
        records = db_local.query(model).all()
        for record in records:
            # Check if exists to prevent duplicates
            exists = db_live.query(model).filter(model.id == record.id).first()
            if not exists:
                db_live.merge(record)
        db_live.commit()
        print(f" -> Migrated {len(records)} records for {model.__tablename__}")
        
    print("MIGRATION COMPLETE!")
except Exception as e:
    print(f"Error: {e}")
    db_live.rollback()
finally:
    db_local.close()
    db_live.close()
