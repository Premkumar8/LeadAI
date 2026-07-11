import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models.crm import User

client = TestClient(app)

# We need to authenticate. Let's override the dependency or just get a token.
# Alternatively, we can just call the analytics function directly.
from app.api.v1.analytics import get_dashboard_metrics

db = SessionLocal()
try:
    # Just call it directly to see if it throws an exception
    # get_current_user is mockable, we'll just pass None or a dummy user if it expects one.
    user = db.query(User).first()
    print("Calling get_dashboard_metrics...")
    metrics = get_dashboard_metrics(campaign_id=None, db=db, current_user=user)
    print("Success:")
    print(metrics)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
