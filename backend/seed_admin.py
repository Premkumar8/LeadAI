from urllib.parse import urlparse, parse_qsl, urlencode, urlunparse
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.security import get_password_hash
from app.models.crm import User

# Connect to the live Supabase database
url_to_use = "postgres://postgres.zqvzzgrqfeixcuveghme:VuHx491yu8Tcee8c@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
url_to_use = url_to_use.replace("postgres://", "postgresql://")
parsed = urlparse(url_to_use)
qs = parse_qsl(parsed.query)
filtered_qs = [(k, v) for k, v in qs if k not in ("supa", "pooler")]
new_query = urlencode(filtered_qs)
new_url = urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment))

print("Connecting to live database...")
engine = create_engine(new_url)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    print("Checking if eagle@innovation.com exists...")
    user = db.query(User).filter(User.email == "eagle@innovation.com").first()
    if user:
        print("User already exists! Updating password...")
        user.password_hash = get_password_hash("eagle2026")
    else:
        print("User does not exist. Creating...")
        user = User(
            email="eagle@innovation.com",
            password_hash=get_password_hash("eagle2026"),
            name="Admin Eagle",
            role="admin"
        )
        db.add(user)
    
    db.commit()
    print("SUCCESS: You can now log in with eagle@innovation.com / eagle2026")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
