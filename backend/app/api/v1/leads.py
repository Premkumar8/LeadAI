from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.crm import Lead, Activity
from app.schemas.crm import LeadCreate, LeadResponse, LeadUpdate
from app.api.v1.auth import get_current_user
from app.services.follow_up import check_follow_up_needed

router = APIRouter()

@router.get("/", response_model=List[LeadResponse])
def get_leads(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Lead).all()

@router.post("/", response_model=LeadResponse)
def create_lead(lead_in: LeadCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    lead = Lead(**lead_in.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    
    # Log creation activity
    activity = Activity(
        lead_id=lead.id,
        activity_type="StageChange",
        description="Lead created and initialized to Stage: New"
    )
    db.add(activity)
    db.commit()
    
    # Reload lead to populate relations
    return db.query(Lead).filter(Lead.id == lead.id).first()

@router.get("/{id}", response_model=LeadResponse)
def get_lead(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

@router.put("/{id}", response_model=LeadResponse)
def update_lead(id: UUID, lead_in: LeadUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    old_status = lead.status
    for k, v in lead_in.model_dump(exclude_unset=True).items():
        setattr(lead, k, v)
        
    db.commit()
    
    # If stage status changed, log activity
    if lead_in.status and lead_in.status != old_status:
        activity = Activity(
            lead_id=lead.id,
            activity_type="StageChange",
            description=f"Stage transitioned from {old_status} to {lead.status}"
        )
        db.add(activity)
        db.commit()
        
    db.refresh(lead)
    return lead

@router.delete("/{id}")
def delete_lead(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    db.delete(lead)
    db.commit()
    return {"message": "Lead deleted successfully"}

# Feature 9: Smart Follow-Up Suggestion endpoint
@router.get("/{id}/follow-up")
def get_lead_follow_up_recommendation(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return check_follow_up_needed(db, str(id))
