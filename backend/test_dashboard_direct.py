import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.api.v1.analytics import get_dashboard_metrics
from app.models.crm import User, Lead, Company, Campaign

db = SessionLocal()
try:
    user = db.query(User).first()
    metrics = get_dashboard_metrics(campaign_id=None, db=db, current_user=user)
    print("Success:")
    print(metrics)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
