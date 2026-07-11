import uuid
from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.crm import User, Campaign
from app.schemas.crm import CampaignCreate, CampaignUpdate, CampaignResponse

router = APIRouter()

@router.get("/", response_model=List[CampaignResponse])
def get_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    return db.query(Campaign).options(joinedload(Campaign.contacts)).all()


@router.post("/", response_model=CampaignResponse)
def create_campaign(
    *,
    db: Session = Depends(get_db),
    campaign_in: CampaignCreate,
    current_user: User = Depends(get_current_user)
) -> Any:
    campaign = Campaign(**campaign_in.dict())
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.put("/{id}", response_model=CampaignResponse)
def update_campaign(
    *,
    db: Session = Depends(get_db),
    id: uuid.UUID,
    campaign_in: CampaignUpdate,
    current_user: User = Depends(get_current_user)
) -> Any:
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    update_data = campaign_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)
        
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.delete("/{id}")
def delete_campaign(
    *,
    db: Session = Depends(get_db),
    id: uuid.UUID,
    current_user: User = Depends(get_current_user)
) -> Any:
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}
