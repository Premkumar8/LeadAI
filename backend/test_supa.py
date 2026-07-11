import os
from sqlalchemy import create_engine, text

URL = "postgresql://postgres.zqvzzgrqfeixcuveghme:VuHx491yu8Tcee8c@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"

try:
    print("Testing connection...")
    engine = create_engine(URL, pool_pre_ping=True)
    with engine.connect() as conn:
        res = conn.execute(text("SELECT 1"))
        print("SUCCESS:", res.scalar())
        
        print("Testing CREATE EXTENSION vector...")
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        conn.commit()
        print("Vector created")
except Exception as e:
    print("ERROR:", str(e))
