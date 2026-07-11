import sys
import os
import uuid

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.crm import Campaign, Contact

db = SessionLocal()
try:
    campaign = db.query(Campaign).first()
    if not campaign:
        print("No campaign found.")
        sys.exit(1)
        
    print(f"Found campaign: {campaign.name}")
    
    # Check if sample contact already exists
    contact = db.query(Contact).filter(Contact.full_name == "Sample Customer").first()
    if not contact:
        contact = Contact(
            full_name="Sample Customer",
            email="sample@example.com",
            phone="+91 9876543210",
            area="RS Puram",
            lead_source="Instagram",
            campaign_id=campaign.id
        )
        db.add(contact)
        db.commit()
        db.refresh(contact)
        print("Successfully added Sample Customer and linked to Campaign.")
    else:
        print("Sample Customer already exists.")
        
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
