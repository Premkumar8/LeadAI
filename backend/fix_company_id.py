import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    print("Altering contacts table to drop NOT NULL constraint on company_id...")
    db.execute(text("ALTER TABLE contacts ALTER COLUMN company_id DROP NOT NULL;"))
    db.commit()
    print("Done.")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
