import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    print("Altering contacts table to add status column...")
    db.execute(text("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Waiting';"))
    db.execute(text("UPDATE contacts SET status = 'Waiting' WHERE status IS NULL;"))
    db.commit()
    print("Done.")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
