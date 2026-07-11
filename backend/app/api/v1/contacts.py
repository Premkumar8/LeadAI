from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.crm import Contact, Company
from app.schemas.crm import ContactCreate, ContactResponse, ContactUpdate
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
