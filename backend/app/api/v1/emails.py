from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import get_db
from app.models.crm import Email, Company, Lead, Activity
from app.schemas.crm import EmailCreate, EmailResponse
from app.api.v1.auth import get_current_user
from app.services.ai_service import generate_outreach_email, generate_linkedin_outreach

router = APIRouter()

class OutreachRequest(BaseModel):
    company_id: UUID
    contact_role: str
    services_offered: str
    channel: str  # "email" or "linkedin"
    type: str     # for email: "cold", "follow_up", "meeting_request", "proposal_follow_up"
                  # for linkedin: "connection", "first_message", "follow_up"

@router.get("/", response_model=List[EmailResponse])
def get_emails(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Email).order_by(Email.sent_at.desc()).all()

@router.post("/", response_model=EmailResponse)
def log_sent_email(email_in: EmailCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    email = Email(**email_in.model_dump())
    db.add(email)
    db.commit()
    db.refresh(email)
    
    # Log sent activity
    activity = Activity(
        lead_id=email.lead_id,
        activity_type="Outreach",
        description=f"Outreach email logged: {email.email_subject}"
    )
    db.add(activity)
    db.commit()
    
    return email

# Feature 3 & 4: AI Outreach Content Generator (Email & LinkedIn)
@router.post("/outreach/generate")
def generate_outreach_content(req: OutreachRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == req.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    company_info = {
        "company_name": company.company_name,
        "description": company.ai_summary or "",
        "industry": company.industry or "",
        "tech_stack": company.website or "",
        "pain_points": company.ai_summary or ""
    }
    
    if req.channel == "email":
        content = generate_outreach_email(
            company_info=company_info,
            contact_role=req.contact_role,
            services_offered=req.services_offered,
            email_type=req.type
        )
        # Separate Subject and Body if present
        subject = "Outreach Partner Request"
        body = content
        if "Subject:" in content:
            parts = content.split("\n\n", 1)
            subject = parts[0].replace("Subject:", "").strip()
            if len(parts) > 1:
                body = parts[1].strip()
        return {"channel": "email", "subject": subject, "body": body}
        
    elif req.channel == "linkedin":
        body = generate_linkedin_outreach(
            company_info=company_info,
            contact_role=req.contact_role,
            services_offered=req.services_offered,
            seq_stage=req.type
        )
        return {"channel": "linkedin", "subject": None, "body": body}
        
    else:
        raise HTTPException(status_code=400, detail="Invalid channel parameter. Must be 'email' or 'linkedin'.")
