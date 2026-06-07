from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.crm import Company, AI_Insight, Contact
from app.schemas.crm import CompanyCreate, CompanyResponse, CompanyUpdate, AIInsightResponse
from app.api.v1.auth import get_current_user
from app.services.crawler import crawl_and_analyze_website
from app.services.ai_service import calculate_lead_score

router = APIRouter()

@router.get("/", response_model=List[CompanyResponse])
def get_companies(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Company).order_by(Company.company_name).all()

@router.post("/", response_model=CompanyResponse)
def create_company(company_in: CompanyCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = Company(**company_in.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company

@router.get("/{id}", response_model=CompanyResponse)
def get_company(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.put("/{id}", response_model=CompanyResponse)
def update_company(id: UUID, company_in: CompanyUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    for k, v in company_in.model_dump(exclude_unset=True).items():
        setattr(company, k, v)
        
    db.commit()
    db.refresh(company)
    return company

@router.delete("/{id}")
def delete_company(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    db.delete(company)
    db.commit()
    return {"message": "Company deleted successfully"}

# Feature 1 & 2: Website intelligence crawl & scoring
@router.post("/{id}/crawl", response_model=AIInsightResponse)
async def trigger_website_intelligence(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    company = db.query(Company).filter(Company.id == id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if not company.website:
        raise HTTPException(status_code=400, detail="Company website URL is required to crawl")
        
    # Crawl website
    crawled_data = await crawl_and_analyze_website(company.website)
    
    # AI lead scoring
    score, explanation = calculate_lead_score(crawled_data)
    
    # Update Company Profile
    company.ai_summary = crawled_data.get("executive_summary", crawled_data.get("description"))
    company.lead_score = score
    if crawled_data.get("employee_count"):
        company.employee_count = crawled_data.get("employee_count")
    if crawled_data.get("industry"):
        company.industry = crawled_data.get("industry")
        
    # Write AI Insight Record
    insight = AI_Insight(
        company_id=company.id,
        ai_recommendation=explanation,
        ai_score=score
    )
    db.add(insight)
    db.commit()
    db.refresh(insight)
    
    return insight
