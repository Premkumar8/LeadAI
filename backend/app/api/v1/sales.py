from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.crm import Contact, Sale
from app.schemas.crm import SaleCreate, SaleResponse, SaleWithContact
from app.api.v1.auth import get_current_user

router = APIRouter()


def _apply_tier_title(contact: Contact):
    contact.job_title = "VIP Buyer" if (contact.gold_grams or 0) >= 12.0 else "Retail Buyer"


@router.get("/", response_model=List[SaleResponse])
def get_sales(contact_id: Optional[UUID] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(Sale)
    if contact_id:
        query = query.filter(Sale.contact_id == contact_id)
    return query.order_by(Sale.sale_date.desc()).all()


@router.post("/", response_model=SaleWithContact)
def create_sale(sale_in: SaleCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    contact = db.query(Contact).filter(Contact.id == sale_in.contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Customer not found")

    data = sale_in.model_dump()
    if not data.get("sale_date"):
        data["sale_date"] = datetime.now(timezone.utc)
    sale = Sale(**data, campaign_id=contact.campaign_id)
    db.add(sale)

    # Roll the purchase into the customer's running totals
    contact.gold_grams = round((contact.gold_grams or 0.0) + sale_in.gold_grams, 3)
    if sale_in.jewellery_item:
        contact.jewellery_item = sale_in.jewellery_item
    contact.status = "Completed"
    _apply_tier_title(contact)

    db.commit()
    db.refresh(sale)
    db.refresh(contact)
    return {"sale": sale, "contact": contact}


@router.delete("/{id}", response_model=SaleWithContact)
def delete_sale(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    sale = db.query(Sale).filter(Sale.id == id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    contact = sale.contact
    contact.gold_grams = max(0.0, round((contact.gold_grams or 0.0) - (sale.gold_grams or 0.0), 3))
    _apply_tier_title(contact)

    sale_snapshot = SaleResponse.model_validate(sale)
    db.delete(sale)
    db.commit()

    # Show the most recent remaining purchase as the customer's item
    latest = db.query(Sale).filter(Sale.contact_id == contact.id).order_by(Sale.sale_date.desc()).first()
    if latest and latest.jewellery_item:
        contact.jewellery_item = latest.jewellery_item
        db.commit()
    db.refresh(contact)
    return {"sale": sale_snapshot, "contact": contact}
