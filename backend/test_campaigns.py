import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.api.v1.campaigns import get_campaigns
from app.models.crm import User

db = SessionLocal()
try:
    user = db.query(User).first()
    print("Testing get_campaigns...")
    camps = get_campaigns(db=db, current_user=user)
    print("Success. Count:", len(camps))
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
