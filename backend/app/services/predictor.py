from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from app.models.crm import Lead, Company, Activity

def train_and_predict_lead(db: Session, lead_id: str) -> Dict[str, Any]:
    # Fetch target lead
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return {"probability": 0.5, "expected_value": 0.0, "closing_date": (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d"), "reason": "Lead not found."}
        
    # Get all historical completed leads (Won or Lost) to train
    historical_leads = db.query(Lead).filter(Lead.status.in_(["Won", "Lost"])).all()
    
    # Calculate age and activity counts for target lead
    target_age = (datetime.now(timezone.utc) - lead.created_at.replace(tzinfo=timezone.utc)).days
    target_age = max(target_age, 1)
    
    target_activities = len(lead.activities)
    target_meetings = len(lead.meetings)
    target_emails = len(lead.emails)
    
    # Default outputs based on weights (heuristic model)
    source_weights = {"Outbound": 0.1, "Inbound": 0.25, "Referral": 0.35, "Website": 0.2}
    priority_weights = {"High": 0.2, "Medium": 0.1, "Low": 0.0}
    
    base_prob = 0.15
    base_prob += source_weights.get(lead.source, 0.15)
    base_prob += priority_weights.get(lead.priority, 0.1)
    
    # Activity modifier
    activity_mod = min(target_activities * 0.05, 0.25)
    base_prob += activity_mod
    
    # Cap between 5% and 95%
    prob = min(max(base_prob, 0.05), 0.95)
    
    # Calculate expected close days
    close_days = 30
    if lead.priority == "High":
        close_days = 14
    elif lead.priority == "Low":
        close_days = 60
        
    expected_closing = datetime.now(timezone.utc) + timedelta(days=close_days)
    
    # If we have enough historical data, let's train a real scikit-learn model!
    if len(historical_leads) >= 10:
        try:
            from sklearn.ensemble import RandomForestClassifier
            
            data = []
            for h in historical_leads:
                age = (h.created_at - datetime.now(timezone.utc)).days  # Duration in days if completed (or close date)
                # Let's count activities
                act_count = len(h.activities)
                meet_count = len(h.meetings)
                email_count = len(h.emails)
                
                # Target: Won = 1, Lost = 0
                target = 1 if h.status == "Won" else 0
                
                # Source mapping
                src_val = 0
                if h.source == "Inbound": src_val = 1
                elif h.source == "Referral": src_val = 2
                elif h.source == "Website": src_val = 3
                
                # Priority mapping
                pri_val = 0
                if h.priority == "Medium": pri_val = 1
                elif h.priority == "High": pri_val = 2
                
                data.append([
                    h.estimated_value,
                    src_val,
                    pri_val,
                    act_count,
                    meet_count,
                    email_count,
                    target
                ])
                
            df = pd.DataFrame(data, columns=['est_value', 'source', 'priority', 'activities', 'meetings', 'emails', 'won'])
            
            X = df.drop(columns=['won'])
            y = df['won']
            
            clf = RandomForestClassifier(n_estimators=10, random_state=42)
            clf.fit(X, y)
            
            # Predict target lead
            t_src = 0
            if lead.source == "Inbound": t_src = 1
            elif lead.source == "Referral": t_src = 2
            elif lead.source == "Website": t_src = 3
            
            t_pri = 0
            if lead.priority == "Medium": t_pri = 1
            elif lead.priority == "High": t_pri = 2
            
            target_features = np.array([[
                lead.estimated_value,
                t_src,
                t_pri,
                target_activities,
                target_meetings,
                target_emails
            ]])
            
            prob_sklearn = clf.predict_proba(target_features)[0][1]
            prob = float(prob_sklearn)
            
            # Estimate close days based on Won leads historical averages
            won_durations = []
            for w in historical_leads:
                if w.status == "Won":
                    # Get date of last won change or activity
                    last_act = db.query(Activity).filter(Activity.lead_id == w.id).order_by(Activity.activity_date.desc()).first()
                    if last_act:
                        duration = (last_act.activity_date.replace(tzinfo=timezone.utc) - w.created_at.replace(tzinfo=timezone.utc)).days
                        won_durations.append(max(duration, 1))
            if won_durations:
                avg_won_days = int(np.mean(won_durations))
                expected_closing = datetime.now(timezone.utc) + timedelta(days=avg_won_days)
                
        except Exception as ex:
            print(f"Scikit-Learn prediction error, falling back to heuristics: {ex}")
            
    expected_value = prob * lead.estimated_value
    
    # Reason explanation
    reason = (
        f"Based on {lead.source} source with a priority of {lead.priority}. "
        f"The lead has accumulated {target_activities} activities, {target_meetings} meetings, and {target_emails} emails. "
        f"Historical CRM conversion weights suggest a {int(prob * 100)}% chance of winning."
    )
    
    return {
        "probability": round(prob, 2),
        "expected_value": round(expected_value, 2),
        "closing_date": expected_closing.strftime("%Y-%m-%d"),
        "reason": reason
    }
