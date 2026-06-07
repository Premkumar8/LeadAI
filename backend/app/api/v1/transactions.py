from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.crm import Transaction, Company
from app.schemas.crm import TransactionCreate, TransactionResponse, TransactionUpdate
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Transaction).join(Company).order_by(Transaction.created_at.desc()).all()

@router.post("/", response_model=TransactionResponse)
def create_transaction(transaction_in: TransactionCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Validate company exists
    company = db.query(Company).filter(Company.id == transaction_in.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    transaction = Transaction(**transaction_in.model_dump())
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction

@router.get("/{id}", response_model=TransactionResponse)
def get_transaction(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    transaction = db.query(Transaction).filter(Transaction.id == id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction

@router.put("/{id}", response_model=TransactionResponse)
def update_transaction(id: UUID, transaction_in: TransactionUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    transaction = db.query(Transaction).filter(Transaction.id == id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    for k, v in transaction_in.model_dump(exclude_unset=True).items():
        if k == "company_id" and v is not None:
            # Validate company exists
            company = db.query(Company).filter(Company.id == v).first()
            if not company:
                raise HTTPException(status_code=404, detail="Company not found")
        setattr(transaction, k, v)
        
    db.commit()
    db.refresh(transaction)
    return transaction

@router.delete("/{id}")
def delete_transaction(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    transaction = db.query(Transaction).filter(Transaction.id == id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    db.delete(transaction)
    db.commit()
    return {"message": "Transaction deleted successfully"}
