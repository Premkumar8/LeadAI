from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.crm import Activity
from app.schemas.crm import ActivityCreate, ActivityResponse
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/lead/{lead_id}", response_model=List[ActivityResponse])
def get_activities_for_lead(lead_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Activity).filter(Activity.lead_id == lead_id).order_by(Activity.activity_date.desc()).all()

@router.post("/", response_model=ActivityResponse)
def create_activity(activity_in: ActivityCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    activity = Activity(**activity_in.model_dump())
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
