from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import tempfile
import os

from app.core.database import get_db
from app.models.crm import Lead, Company, Activity
from app.schemas.crm import AssistantChatRequest, AssistantChatResponse
from app.api.v1.auth import get_current_user
from app.services.ai_service import generate_proposal_pdf, get_openai_client

router = APIRouter()

class ProposalRequest(BaseModel):
    client_name: str
    services: str
    pricing: str
    timeline: str

# Feature 7: Proposal Generator
@router.post("/proposal")
def trigger_proposal_pdf_generation(req: ProposalRequest, current_user = Depends(get_current_user)):
    try:
        # Create temporary file path
        fd, path = tempfile.mkstemp(suffix=".pdf")
        os.close(fd)
        
        generate_proposal_pdf(
            client_name=req.client_name,
            services=req.services,
            pricing=req.pricing,
            timeline=req.timeline,
            output_path=path
        )
        
        return FileResponse(
            path,
            media_type="application/pdf",
            filename=f"proposal_{req.client_name.lower().replace(' ', '_')}.pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate proposal: {e}")

# Feature 5: AI Sales Assistant Chat (Database context aware)
@router.post("/assistant", response_model=AssistantChatResponse)
def trigger_sales_assistant(req: AssistantChatRequest, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # 1. Fetch CRM Context for LLM prompt inject
    leads = db.query(Lead).all()
    companies = db.query(Company).all()
    
    leads_context = []
    for l in leads:
        leads_context.append({
            "lead_id": str(l.id),
            "company_name": l.company.company_name,
            "status": l.status,
            "priority": l.priority,
            "estimated_value": l.estimated_value,
            "source": l.source,
            "country": l.company.country,
            "industry": l.company.industry
        })
        
    companies_context = []
    for c in companies:
        companies_context.append({
            "company_name": c.company_name,
            "website": c.website,
            "industry": c.industry,
            "lead_score": c.lead_score,
            "summary": c.ai_summary
        })
        
    system_prompt = (
        "You are Avanta CRM AI, a premium virtual sales engineering assistant. "
        "You have direct database read privileges. Below is the active CRM data snippet:\n\n"
        f"COMPANIES LIST:\n{companies_context}\n\n"
        f"LEADS LIST:\n{leads_context}\n\n"
        "Instructions:\n"
        "- Respond helpful, concise and direct.\n"
        "- When asked for analytics or filtering (e.g. 'high value leads in Italy'), scan the list, calculate sums or name the specific companies matching.\n"
        "- If asked to generate follow-up copy, suggest email outreach body tailored to the company summary.\n"
        "- Be friendly and sales-focused."
    )
    
    # Check if OpenAI is enabled
    client = get_openai_client()
    user_query = req.messages[-1].content if req.messages else ""
    
    if not client:
        # Structured mockup helper response for local offline tests
        user_query_lower = user_query.lower()
        if "italy" in user_query_lower:
            high_val_italy = [l for l in leads_context if l["country"] and l["country"].lower() == "italy"]
            names = ", ".join([l["company_name"] for l in high_val_italy]) if high_val_italy else "No leads found in Italy"
            return {"response": f"Scanning database: Found {len(high_val_italy)} leads in Italy. Matches: {names}."}
        elif "convert" in user_query_lower or "likely" in user_query_lower:
            high_leads = sorted([c for c in companies_context], key=lambda x: x["lead_score"], reverse=True)[:2]
            names = " and ".join([f"{c['company_name']} (Score: {c['lead_score']}/100)" for c in high_leads]) if high_leads else "No leads registered yet"
            return {"response": f"Top conversion prospects: {names} based on firmographics and website intelligence."}
        elif "email" in user_query_lower or "follow" in user_query_lower:
            return {"response": "Subject: Partnership proposal review\n\nHi there,\n\nI wanted to follow up and see if we could align on solving your current software scaling challenges.\n\nLet me know if you have 10 minutes next week.\n\nBest,\nAvanta Assistant"}
        else:
            return {"response": f"Hello! I am your Avanta AI assistant. I parsed your question: '{user_query}'. I can analyze lead conversion rates, filter pipelines by country, or generate follow-up materials. Please configure your GEMINI_API_KEY for complete LLM capabilities."}
            
    try:
        messages = [{"role": "system", "content": system_prompt}]
        for msg in req.messages:
            messages.append({"role": msg.role, "content": msg.content})
            
        chat_completion = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=messages,
            temperature=0.5
        )
        
        return {"response": chat_completion.choices[0].message.content}
    except Exception as e:
        return {"response": f"Avanta AI Service encountered an error: {e}"}
