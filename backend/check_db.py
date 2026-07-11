import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.crm import Lead, Company, Campaign, Contact

db = SessionLocal()
try:
    print("Checking Campaigns:")
    for c in db.query(Campaign).all():
        print(f"Campaign: {c.id}, leads_generated: {c.leads_generated}")
        if c.leads_generated is None:
            print("FOUND NONE IN CAMPAIGN LEADS GENERATED")
            c.leads_generated = 0
    
    print("Checking Leads:")
    for l in db.query(Lead).all():
        print(f"Lead: {l.id}, estimated_value: {l.estimated_value}")
        if l.estimated_value is None:
            print("FOUND NONE IN LEAD ESTIMATED VALUE")
            l.estimated_value = 0.0

    db.commit()
    print("Check complete.")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
