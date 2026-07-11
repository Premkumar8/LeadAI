import urllib.request
import urllib.parse
import json

# Let's try to login or get a token. Wait, we don't know the user's password.
# However, we can generate a token directly using the backend's security module.
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security import create_access_token
from app.core.database import SessionLocal
from app.models.crm import User

db = SessionLocal()
try:
    user = db.query(User).first()
    if not user:
        print("No users found.")
        sys.exit(1)
        
    token = create_access_token(subject=str(user.id))
    url = "http://localhost:8000/api/v1/analytics/dashboard"
    
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        response = urllib.request.urlopen(req)
        print("Status code:", response.getcode())
        print("Body:", response.read().decode())
    except urllib.error.HTTPError as e:
        print("Status code:", e.code)
        print("Body:", e.read().decode())
    except Exception as e:
        print("Error:", str(e))
finally:
    db.close()
