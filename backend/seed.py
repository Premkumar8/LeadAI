import uuid
from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.crm import User, Company, Contact, Lead, Activity, Meeting, Email, Task, AI_Insight, Transaction

def seed_db():
    # 0. Ensure tables exist before seeding
    print("Initializing database schemas...")
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            conn.commit()
    except Exception as e:
        print(f"pgvector check warning: {e}")
        
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    
    # 1. Clean existing records to prevent unique constraints issues
    print("Clearing existing records...")
    db.query(AI_Insight).delete()
    db.query(Transaction).delete()
    db.query(Task).delete()
    db.query(Email).delete()
    db.query(Meeting).delete()
    db.query(Activity).delete()
    db.query(Contact).delete()
    db.query(Lead).delete()
    db.query(Company).delete()
    db.query(User).delete()
    db.commit()
    
    print("Inserting seed records...")
    
    # 2. Create User
    admin = User(
        name="John Doe",
        email="admin@avanta.ai",
        password_hash=get_password_hash("password123"),
        company_name="Avanta Solutions",
        role="admin"
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    
    # 3. Create Companies
    companies_data = [
        {"name": "NovaSoft Technologies", "web": "novasoft.io", "industry": "DevTools", "country": "USA", "employees": 120, "score": 85, "summary": "NovaSoft builds scale developer testing modules and wants to integrate automated CI workflows."},
        {"name": "Acme AI Analytics", "web": "acme-analytics.ai", "industry": "AI & Analytics", "country": "Germany", "employees": 45, "score": 92, "summary": "Acme is scaling their machine learning pipeline and looking for partner agencies to augment their cloud infrastructure."},
        {"name": "Milano Consulting Group", "web": "milanoconsulting.it", "industry": "IT Consulting", "country": "Italy", "employees": 150, "score": 78, "summary": "Milano Consulting manages enterprise migrations in Southern Europe. High budget and interest in software agency contract staffing."},
        {"name": "Kyoto Data Systems", "web": "kyotodata.jp", "industry": "Data Systems", "country": "Japan", "employees": 310, "score": 65, "summary": "Legacy data centers transitioning to serverless architectures. Slow sales cycle, but massive enterprise potential."},
        {"name": "Vespa Retail Solutions", "web": "vesparetail.it", "industry": "Retail & E-commerce", "country": "Italy", "employees": 60, "score": 88, "summary": "E-commerce provider looking to implement customized LLM recommender agents to increase cart sizes."},
        {"name": "Delta Logistics", "web": "deltalogistics.com", "industry": "Logistics", "country": "USA", "employees": 400, "score": 55, "summary": "Delta logistics wants a standard CRM custom portal, but is heavily legacy-dependent."},
        {"name": "AppForge Studio", "web": "appforge.dev", "industry": "Mobile Apps", "country": "Germany", "employees": 15, "score": 40, "summary": "Small boutique agency looking for custom analytics dashboards."},
        {"name": "Parma Prosciutti IT", "web": "parmaprosciutti.it", "industry": "Food & Agriculture", "country": "Italy", "employees": 250, "score": 75, "summary": "Agricultural producer needing warehouse scaling software. Large physical footprint, expanding digital presence."},
        {"name": "HyperScale Cloud", "web": "hyperscalecloud.io", "industry": "Cloud SaaS", "country": "USA", "employees": 85, "score": 95, "summary": "Fast-growing venture-backed SaaS provider looking for external dev support to build their database engine integrations."}
    ]
    
    companies = []
    for cd in companies_data:
        company = Company(
            company_name=cd["name"],
            website=cd["web"],
            industry=cd["industry"],
            country=cd["country"],
            employee_count=cd["employees"],
            lead_score=cd["score"],
            ai_summary=cd["summary"]
        )
        db.add(company)
        companies.append(company)
        
    db.commit()
    
    # Refresh to grab IDs
    for c in companies:
        db.refresh(c)
        
    # 4. Create Contacts
    contacts_data = [
        {"company": companies[0], "name": "Sarah Connor", "title": "VP of Engineering", "email": "sarah@novasoft.io", "phone": "+1-555-0199"},
        {"company": companies[1], "name": "Hans Müller", "title": "Head of AI Research", "email": "hans@acme-analytics.ai", "phone": "+49-89-123456"},
        {"company": companies[2], "name": "Giovanni Rossi", "title": "Chief Technology Officer", "email": "g.rossi@milanoconsulting.it", "phone": "+39-02-987654"},
        {"company": companies[3], "name": "Kenji Sato", "title": "Infrastructure Director", "email": "sato@kyotodata.jp", "phone": "+81-3-5555-1234"},
        {"company": companies[4], "name": "Francesca Vespa", "title": "E-Commerce Manager", "email": "francesca@vesparetail.it", "phone": "+39-051-555666"},
        {"company": companies[8], "name": "Alex Mercer", "title": "Co-Founder", "email": "alex@hyperscalecloud.io", "phone": "+1-415-999-8888"}
    ]
    
    for cond in contacts_data:
        contact = Contact(
            company_id=cond["company"].id,
            full_name=cond["name"],
            job_title=cond["title"],
            email=cond["email"],
            phone=cond["phone"]
        )
        db.add(contact)
    db.commit()
    
    # 5. Create Leads (Won/Lost/Active combinations to train Scikit-Learn opportunity prediction)
    # We need 10 completed leads total (either Won or Lost) to satisfy predictor trigger threshold (>= 10)
    leads_setup = [
        # Active Leads for Dashboard and Pipeline
        {"company": companies[0], "status": "New", "priority": "High", "value": 45000.0, "source": "Website"},
        {"company": companies[1], "status": "Proposal Sent", "priority": "High", "value": 75000.0, "source": "Referral"},
        {"company": companies[2], "status": "Meeting Scheduled", "priority": "Medium", "value": 120000.0, "source": "Outbound"},
        {"company": companies[4], "status": "Discovery Call", "priority": "High", "value": 35000.0, "source": "Website"},
        {"company": companies[8], "status": "Negotiation", "priority": "High", "value": 90000.0, "source": "Inbound"},
        
        # Historical Completed Leads (Won/Lost) to train the Classifier model
        {"company": companies[3], "status": "Lost", "priority": "Low", "value": 150000.0, "source": "Outbound"},
        {"company": companies[5], "status": "Lost", "priority": "Medium", "value": 50000.0, "source": "Outbound"},
        {"company": companies[6], "status": "Lost", "priority": "Low", "value": 12000.0, "source": "Website"},
        {"company": companies[7], "status": "Won", "priority": "Medium", "value": 65000.0, "source": "Referral"},
        {"company": companies[0], "status": "Won", "priority": "High", "value": 30000.0, "source": "Website"},
        {"company": companies[1], "status": "Won", "priority": "High", "value": 50000.0, "source": "Inbound"},
        {"company": companies[2], "status": "Won", "priority": "High", "value": 95000.0, "source": "Referral"},
        {"company": companies[4], "status": "Won", "priority": "Medium", "value": 25000.0, "source": "Website"},
        {"company": companies[8], "status": "Won", "priority": "High", "value": 80000.0, "source": "Inbound"},
        {"company": companies[3], "status": "Won", "priority": "High", "value": 110000.0, "source": "Referral"},
    ]
    
    leads = []
    for ls in leads_setup:
        lead = Lead(
            company_id=ls["company"].id,
            status=ls["status"],
            priority=ls["priority"],
            estimated_value=ls["value"],
            source=ls["source"],
            assigned_user_id=admin.id
        )
        db.add(lead)
        leads.append(lead)
        
    db.commit()
    
    for l in leads:
        db.refresh(l)
        
    # 6. Add activities, meetings, tasks, and emails to leads
    # Active lead: Milano Consulting (leads[2])
    milano_lead = leads[2]
    
    activity1 = Activity(
        lead_id=milano_lead.id,
        activity_type="Outreach",
        description="Cold email outbound outreach sent to VP of Sales regarding their scaling operations."
    )
    activity2 = Activity(
        lead_id=milano_lead.id,
        activity_type="Call",
        description="Discovery call completed. Key pain points identified: migrating their core client integrations to Next.js dashboard hooks."
    )
    db.add(activity1)
    db.add(activity2)
    
    meeting = Meeting(
        lead_id=milano_lead.id,
        meeting_date=datetime.now() - timedelta(days=2),
        notes="Discussed integration timelines. Giovanni seemed very eager to proceed. Asked for draft proposal of phase 1 scopes.",
        transcript="Giovanni: Thanks for jumping on the call. We need a team of 3 developers to migrate our dashboards. We want to start next month.\nSales: That sounds perfect. We can allocate a tech lead and two senior frontends. Our pricing is standard 15k a month.\nGiovanni: Send over a proposal. We'll review it next week.",
        summary="Discussed custom Next.js frontend development. Giovanni requested a formal project proposal detailing timeline and team allocation."
    )
    db.add(meeting)
    
    email = Email(
        lead_id=milano_lead.id,
        email_subject="Proposal draft - Avanta & Milano Consulting",
        email_body="Hi Giovanni, here is the initial dashboard migration scope we discussed. Let me know your thoughts.",
        response_received=True
    )
    db.add(email)
    
    task1 = Task(
        lead_id=milano_lead.id,
        title="Draft custom project proposal PDF and send to Giovanni",
        due_date=datetime.now() + timedelta(days=2),
        status="Pending"
    )
    task2 = Task(
        lead_id=milano_lead.id,
        title="Initial intro call scheduled",
        due_date=datetime.now() - timedelta(days=2),
        status="Completed"
    )
    db.add(task1)
    db.add(task2)
    
    # Add AI Insights for NovaSoft (leads[0])
    ai_insight = AI_Insight(
        company_id=companies[0].id,
        ai_recommendation="NovaSoft operates in DevTools and has a high employee count. They are currently hiring node/react engineers. High recommendation to offer custom UI components building services.",
        ai_score=85
    )
    db.add(ai_insight)
    
    # 7. Seed representative financial transactions (Credits & Debits)
    transactions_setup = [
        # Paid Credits (Revenue inflow)
        {"company": companies[0], "amount": 45000.0, "type": "Credit", "status": "Paid", "due_days": -10, "desc": "Phase 1 - CI/CD Integration Setup Payment"},
        {"company": companies[2], "amount": 120000.0, "type": "Credit", "status": "Paid", "due_days": -5, "desc": "Milano Consulting Q2 Retainer Invoice"},
        {"company": companies[8], "amount": 80000.0, "type": "Credit", "status": "Paid", "due_days": -12, "desc": "HyperScale Cloud Engine Consultation Fee"},
        
        # Unpaid Credits (Receivables / Invoices outstanding - triggers overdue warnings)
        {"company": companies[1], "amount": 75000.0, "type": "Credit", "status": "Unpaid", "due_days": 5, "desc": "Acme AI Analytics - Next.js Custom Dashboard Integration"},
        {"company": companies[4], "amount": 35000.0, "type": "Credit", "status": "Unpaid", "due_days": -3, "desc": "Vespa Retail Solutions - LLM Recommender Setup (OVERDUE)"},
        
        # Paid Debits (Outflows / Expenses paid)
        {"company": companies[8], "amount": 12500.0, "type": "Debit", "status": "Paid", "due_days": -15, "desc": "AWS Cloud GPU Compute Instance Licenses"},
        {"company": companies[0], "amount": 3200.0, "type": "Debit", "status": "Paid", "due_days": -7, "desc": "Local Contractor Mobile Testing Sign-off"},
        
        # Unpaid Debits (Outflows / Bills pending)
        {"company": companies[1], "amount": 1500.0, "type": "Debit", "status": "Unpaid", "due_days": 10, "desc": "Acme Database Syncer Hub Subscription Fee"}
    ]
    
    for ts in transactions_setup:
        due = datetime.now(timezone.utc) + timedelta(days=ts["due_days"])
        transaction = Transaction(
            company_id=ts["company"].id,
            amount=ts["amount"],
            type=ts["type"],
            status=ts["status"],
            due_date=due,
            description=ts["desc"]
        )
        db.add(transaction)
        
    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_db()
