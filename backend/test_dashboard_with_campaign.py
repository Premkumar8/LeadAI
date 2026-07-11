import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.api.v1.analytics import get_dashboard_metrics
from app.models.crm import User, Campaign

db = SessionLocal()
try:
    user = db.query(User).first()
    campaign = db.query(Campaign).first()
    print("Testing with campaign_id:", campaign.id)
    metrics = get_dashboard_metrics(campaign_id=campaign.id, db=db, current_user=user)
    print("Success:")
    print(metrics)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
