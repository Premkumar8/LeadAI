import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.crm import Contact, Company, Campaign, Lead
from app.schemas.crm import (
    ContactCreate, ContactResponse, ContactUpdate,
    ContactBulkImport, ContactBulkImportResult,
)
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ContactResponse])
def get_contacts(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Contact).all()

@router.post("/", response_model=ContactResponse)
def create_contact(contact_in: ContactCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if not contact_in.company_id:
        default_company = db.query(Company).filter(Company.company_name == "Customer Base").first()
        if not default_company:
            default_company = Company(company_name="Customer Base")
            db.add(default_company)
            db.commit()
            db.refresh(default_company)
        contact_in.company_id = default_company.id

    contact = Contact(**contact_in.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _phone_key(phone: str | None) -> str:
    digits = re.sub(r"[^0-9]", "", phone or "")
    return digits[-10:] if len(digits) >= 10 else digits


def _get_default_company(db: Session) -> Company:
    company = db.query(Company).filter(Company.company_name == "Customer Base").first()
    if not company:
        company = Company(company_name="Customer Base")
        db.add(company)
        db.flush()
    return company


@router.post("/bulk", response_model=ContactBulkImportResult)
def bulk_import_contacts(payload: ContactBulkImport, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if payload.campaign_id and not db.query(Campaign).filter(Campaign.id == payload.campaign_id).first():
        raise HTTPException(status_code=404, detail="Campaign not found")

    company = _get_default_company(db)
    existing_phones = {
        _phone_key(p) for (p,) in db.query(Contact.phone).filter(Contact.phone.isnot(None)).all()
    }
    existing_phones.discard("")

    created: List[Contact] = []
    skipped = []
    seen_in_file: dict[str, int] = {}

    for idx, row in enumerate(payload.contacts, start=1):
        name = (row.full_name or "").strip()
        if not name:
            skipped.append({"row": idx, "full_name": "", "reason": "Missing name"})
            continue

        key = _phone_key(row.phone)
        if key and len(key) >= 10:
            if key in existing_phones:
                skipped.append({"row": idx, "full_name": name, "reason": "Phone already exists"})
                continue
            if key in seen_in_file:
                skipped.append({"row": idx, "full_name": name, "reason": f"Duplicate of row {seen_in_file[key]} in file"})
                continue
            seen_in_file[key] = idx

        email = (row.email or "").strip() or None
        if email and not EMAIL_RE.match(email):
            email = None

        contact = Contact(
            full_name=name,
            phone=(row.phone or "").strip() or None,
            email=email,
            area=(row.area or "").strip() or None,
            address=(row.address or "").strip() or None,
            lead_source=(row.lead_source or "").strip() or "Excel Import",
            remarks=(row.remarks or "").strip()[:255] or None,
            campaign_id=payload.campaign_id,
            company_id=company.id,
            status="Waiting",
            gold_grams=0.0,
            job_title="Retail Buyer",
        )
        db.add(contact)
        # Mirror the manual entry flow: every new customer also gets a lead for the dashboard
        db.add(Lead(company_id=company.id, status="New", source=contact.lead_source, campaign_id=payload.campaign_id))
        created.append(contact)

    db.commit()
    for c in created:
        db.refresh(c)
    return {"created": created, "skipped": skipped}


@router.get("/{id}", response_model=ContactResponse)
def get_contact(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    contact = db.query(Contact).filter(Contact.id == id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact

@router.put("/{id}", response_model=ContactResponse)
def update_contact(id: UUID, contact_in: ContactUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    contact = db.query(Contact).filter(Contact.id == id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    for k, v in contact_in.model_dump(exclude_unset=True).items():
        setattr(contact, k, v)
        
    db.commit()
    db.refresh(contact)
    return contact

@router.delete("/{id}")
def delete_contact(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    contact = db.query(Contact).filter(Contact.id == id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
        
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted successfully"}
