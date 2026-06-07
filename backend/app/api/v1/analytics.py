from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, List
from sqlalchemy import func

from app.core.database import get_db
from app.models.crm import Lead, Company
from app.api.v1.auth import get_current_user
from app.services.predictor import train_and_predict_lead

router = APIRouter()

# Feature 8: Get lead conversion probability & Expected value prediction
@router.get("/leads/{id}/predict")
def predict_lead_outcome(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    lead = db.query(Lead).filter(Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    prediction = train_and_predict_lead(db, str(id))
    return prediction

# Dashboard KPIs and Analytics Distributions
@router.get("/dashboard")
def get_dashboard_metrics(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    leads = db.query(Lead).all()
    companies = db.query(Company).all()
    
    total_leads = len(leads)
    
    # Active opportunities (Not Won and Not Lost)
    active_opps = [l for l in leads if l.status not in ["Won", "Lost"]]
    active_opps_count = len(active_opps)
    
    # Conversion rate: Won / (Won + Lost)
    won_count = len([l for l in leads if l.status == "Won"])
    lost_count = len([l for l in leads if l.status == "Lost"])
    total_closed = won_count + lost_count
    conversion_rate = round((won_count / total_closed) * 100, 1) if total_closed > 0 else 0.0
    
    # Pipeline Value (sum of estimated value for active opportunities)
    pipeline_value = sum(l.estimated_value for l in active_opps)
    
    # Revenue Forecast based on weighted stages:
    # New (10%), Contacted (20%), Discovery Call (35%), Meeting Scheduled (50%), Proposal Sent (70%), Negotiation (85%), Won (100%)
    stage_weights = {
        "New": 0.10,
        "Contacted": 0.20,
        "Discovery Call": 0.35,
        "Meeting Scheduled": 0.50,
        "Proposal Sent": 0.70,
        "Negotiation": 0.85,
        "Won": 1.00,
        "Lost": 0.00
    }
    
    revenue_forecast = 0.0
    for l in leads:
        weight = stage_weights.get(l.status, 0.0)
        revenue_forecast += l.estimated_value * weight
        
    revenue_forecast = round(revenue_forecast, 2)
    
    # Industry distribution
    industry_counts = {}
    for c in companies:
        ind = c.industry or "Other"
        industry_counts[ind] = industry_counts.get(ind, 0) + 1
        
    industry_dist = [{"name": ind, "value": count} for ind, count in industry_counts.items()]
    
    # Country distribution
    country_counts = {}
    for c in companies:
        cnt = c.country or "Other"
        country_counts[cnt] = country_counts.get(cnt, 0) + 1
        
    country_dist = [{"name": cnt, "value": count} for cnt, count in country_counts.items()]
    
    # Pipeline breakdown by stage for charts
    stage_counts = {stage: 0 for stage in stage_weights.keys()}
    for l in leads:
        if l.status in stage_counts:
            stage_counts[l.status] += 1
            
    stage_dist = [{"stage": stage, "count": count} for stage, count in stage_counts.items()]
    
    return {
        "total_leads": total_leads,
        "active_opportunities": active_opps_count,
        "conversion_rate": conversion_rate,
        "pipeline_value": round(pipeline_value, 2),
        "revenue_forecast": revenue_forecast,
        "industry_distribution": industry_dist,
        "country_distribution": country_dist,
        "stage_distribution": stage_dist
    }
