from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Dict, Any, List, Optional
from sqlalchemy import func

from app.core.database import get_db
from app.models.crm import Lead, Company, Campaign, Contact
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
def get_dashboard_metrics(campaign_id: Optional[UUID] = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    leads_query = db.query(Lead)
    if campaign_id:
        leads_query = leads_query.filter(Lead.campaign_id == campaign_id)
    leads = leads_query.all()
    
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
    
    # Area distribution based on contacts (customers)
    contacts_query = db.query(Contact)
    if campaign_id:
        contacts_query = contacts_query.filter(Contact.campaign_id == campaign_id)
    contacts = contacts_query.all()

    area_counts = {}
    remarks_counts = {}
    for c in contacts:
        area = c.area or "Other"
        area_counts[area] = area_counts.get(area, 0) + 1
        
        remark = c.remarks or "No Remark"
        remarks_counts[remark] = remarks_counts.get(remark, 0) + 1
        
    area_dist = [{"name": area, "value": count} for area, count in area_counts.items()]
    remarks_dist = [{"name": remark, "value": count} for remark, count in remarks_counts.items() if count > 0]
    
    # Pipeline breakdown by stage for charts
    stage_counts = {stage: 0 for stage in stage_weights.keys()}
    for l in leads:
        if l.status in stage_counts:
            stage_counts[l.status] += 1
            
    stage_dist = [{"stage": stage, "count": count} for stage, count in stage_counts.items()]

    # Campaign Details
    campaigns = db.query(Campaign).all()
    total_campaigns = len(campaigns)
    active_campaigns = len([c for c in campaigns if c.status == "Active"])
    total_campaign_leads = sum(c.leads_generated for c in campaigns)

    # Execution stats
    total_customers = len(contacts)
    total_contacted = len([c for c in contacts if c.status in ["Contacted", "Completed"]])
    total_waiting = len([c for c in contacts if c.status == "Waiting"])

    # Customer source distribution (Waiting, Contacted, Completed) based on contacts
    source_stats = {}
    for c in contacts:
        src = c.lead_source or "Other"
        if src not in source_stats:
            source_stats[src] = {"source": src, "Waiting": 0, "Contacted": 0, "Completed": 0}
        
        if c.status == "Waiting":
            source_stats[src]["Waiting"] += 1
        elif c.status == "Contacted":
            source_stats[src]["Contacted"] += 1
        elif c.status == "Completed":
            source_stats[src]["Completed"] += 1

    source_dist = list(source_stats.values())
    # Time-series data for Overview chart (last 20 days)
    from datetime import datetime, timedelta
    now = datetime.utcnow()
    twenty_days_ago = now - timedelta(days=20)
    
    timeline = []
    for i in range(20):
        d = (twenty_days_ago + timedelta(days=i)).strftime("%Y-%m-%d")
        timeline.append({"date": d, "leads": 0, "campaigns": 0})
        
    timeline_dict = {item["date"]: item for item in timeline}
    
    for l in leads:
        if l.created_at and l.created_at >= twenty_days_ago:
            d_str = l.created_at.strftime("%Y-%m-%d")
            if d_str in timeline_dict:
                timeline_dict[d_str]["leads"] += 1
                
    for c in campaigns:
        if c.created_at and c.created_at >= twenty_days_ago:
            d_str = c.created_at.strftime("%Y-%m-%d")
            if d_str in timeline_dict:
                timeline_dict[d_str]["campaigns"] += 1
                
    overview_timeline = list(timeline_dict.values())

    return {
        "total_leads": total_leads,
        "active_opportunities": active_opps_count,
        "conversion_rate": conversion_rate,
        "pipeline_value": round(pipeline_value, 2),
        "revenue_forecast": revenue_forecast,
        "industry_distribution": industry_dist,
        "area_distribution": area_dist,
        "remarks_distribution": remarks_dist,
        "stage_distribution": stage_dist,
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "total_campaign_leads": total_campaign_leads,
        "source_distribution": source_dist,
        "total_customers": total_customers,
        "total_contacted": total_contacted,
        "total_waiting": total_waiting,
        "overview_timeline": overview_timeline
    }
