from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models.crm import Lead, Activity, Email, Meeting
from app.services.ai_service import generate_outreach_email

def check_follow_up_needed(db: Session, lead_id: str) -> Dict[str, Any]:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return {"needed": False, "reason": "Lead not found"}

    # Exclude won/lost leads
    if lead.status in ["Won", "Lost"]:
        return {"needed": False, "reason": f"Lead is already in state {lead.status}"}

    # Find the latest interaction date
    dates = [lead.created_at.replace(tzinfo=timezone.utc)]
    
    # Check last activity
    last_act = db.query(Activity).filter(Activity.lead_id == lead_id).order_by(Activity.activity_date.desc()).first()
    if last_act:
        dates.append(last_act.activity_date.replace(tzinfo=timezone.utc))
        
    # Check last email
    last_email = db.query(Email).filter(Email.lead_id == lead_id).order_by(Email.sent_at.desc()).first()
    if last_email:
        dates.append(last_email.sent_at.replace(tzinfo=timezone.utc))
        
    # Check last meeting
    last_meeting = db.query(Meeting).filter(Meeting.lead_id == lead_id).order_by(Meeting.meeting_date.desc()).first()
    if last_meeting:
        dates.append(last_meeting.meeting_date.replace(tzinfo=timezone.utc))
        
    latest_interaction = max(dates)
    days_since = (datetime.now(timezone.utc) - latest_interaction).days
    
    # Heuristics for suggestions
    needed = False
    timing = "Not needed yet"
    action = "No action required"
    suggested_email_type = "cold"
    
    if lead.status == "New" and days_since >= 2:
        needed = True
        timing = "Immediately"
        action = "Initiate cold outreach email"
        suggested_email_type = "cold"
    elif lead.status == "Contacted" and days_since >= 4:
        needed = True
        timing = "Immediately"
        action = "Send follow-up sequence email"
        suggested_email_type = "follow_up"
    elif lead.status == "Meeting Scheduled" and days_since >= 1:
        # Check if meeting has passed
        if last_meeting and last_meeting.meeting_date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            needed = True
            timing = "Immediately"
            action = "Send meeting summary and next-steps request"
            suggested_email_type = "meeting_request"
    elif lead.status == "Proposal Sent" and days_since >= 3:
        needed = True
        timing = "Immediately"
        action = "Send proposal follow-up to address questions"
        suggested_email_type = "proposal_follow_up"
    elif days_since >= 7:
        needed = True
        timing = "Immediately"
        action = "Re-engage lead via email check-in"
        suggested_email_type = "follow_up"
        
    # Generate email body
    suggested_email = ""
    if needed:
        company_info = {
            "company_name": lead.company.company_name,
            "description": lead.company.ai_summary or "",
            "industry": lead.company.industry or "",
            "tech_stack": lead.company.website or ""
        }
        # Get first contact job title
        contact_role = "Lead Decision Maker"
        if lead.company.contacts:
            contact_role = lead.company.contacts[0].job_title or "Lead Decision Maker"
            
        suggested_email = generate_outreach_email(
            company_info=company_info,
            contact_role=contact_role,
            services_offered="AI integrations and SaaS consulting",
            email_type=suggested_email_type
        )
        
    return {
        "needed": needed,
        "days_since_last_contact": days_since,
        "timing": timing,
        "action": action,
        "suggested_email": suggested_email
    }
