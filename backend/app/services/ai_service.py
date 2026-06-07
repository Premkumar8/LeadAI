import os
import json
from typing import Dict, Any, Tuple, List
from app.core.config import settings

def get_openai_client():
    if not settings.GEMINI_API_KEY:
        return None
    from openai import OpenAI
    return OpenAI(
        api_key=settings.GEMINI_API_KEY,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )

# 1. AI Lead Scoring
def calculate_lead_score(company_info: Dict[str, Any]) -> Tuple[int, str]:
    client = get_openai_client()
    
    # Base calculation heuristic in case API key is missing
    score = 50
    emp_count = int(company_info.get("employee_count", 0) or 0)
    if emp_count > 100:
        score += 15
    elif emp_count > 20:
        score += 10
        
    industry = (company_info.get("industry", "") or "").lower()
    if any(keyword in industry for keyword in ["software", "ai", "data", "tech", "cloud"]):
        score += 20
        
    website = company_info.get("website", "")
    if website:
        score += 10
        
    score = min(max(score, 10), 99) # Keep within 10-99
    
    default_explanation = (
        f"This company received a score of {score}/100. They operate in the '{company_info.get('industry', 'Unknown')}' space "
        f"and have an estimated {emp_count} employees. This aligns well with standard enterprise target parameters, "
        f"although further discovery is recommended to identify direct budget authority."
    )
    
    if not client:
        return score, default_explanation

    try:
        prompt = (
            f"Analyze the following firmographic details of a potential lead company:\n"
            f"Company Name: {company_info.get('company_name')}\n"
            f"Industry: {company_info.get('industry')}\n"
            f"Employee Count: {company_info.get('employee_count')}\n"
            f"Website: {company_info.get('website')}\n"
            f"Tech Stack: {company_info.get('tech_stack')}\n"
            f"Pain Points: {company_info.get('pain_points')}\n\n"
            f"Generate a Lead Score between 0 and 100 representing their likelihood to purchase software engineering, AI, "
            f"or cloud infrastructure consultancy services.\n"
            f"Format your response in strict JSON format with fields:\n"
            f"- score (integer)\n"
            f"- explanation (detailed reasoning highlighting size fit, tech maturity, and pain point alignment)\n"
            f"Return ONLY valid JSON."
        )
        
        chat_completion = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        result = json.loads(chat_completion.choices[0].message.content)
        return int(result.get("score", score)), result.get("explanation", default_explanation)
    except Exception as e:
        print(f"Error calculating AI lead score: {e}")
        return score, default_explanation

# 2. AI Email Generator
def generate_outreach_email(company_info: Dict[str, Any], contact_role: str, services_offered: str, email_type: str) -> str:
    client = get_openai_client()
    
    # Fallback email structure
    company_name = company_info.get("company_name", "your company")
    services = services_offered if services_offered else "AI automation and cloud scale consulting"
    
    fallback_templates = {
        "cold": f"Subject: Scaling {company_name}'s developer velocity with {services}\n\nHi there,\n\nI noticed {company_name} is growing rapidly and using technologies like {company_info.get('tech_stack', 'modern cloud stacks')}.\n\nAt Avanta, we help firms automate integrations and unlock new efficiencies using {services}.\n\nDo you have 10 minutes for a brief introductory call next Tuesday?\n\nBest,\nSales Team",
        "follow_up": f"Subject: Re: Scaling {company_name}'s developer velocity\n\nHi there,\n\nI wanted to follow up on my previous message. I know you're busy managing your role as {contact_role}.\n\nWe recently helped a similar firm reduce infrastructure bottlenecks by 40%. I think we could do something similar for {company_name}.\n\nLet me know if you have a moment this week.\n\nBest,\nSales Team",
        "meeting_request": f"Subject: Meeting Request: Avanta & {company_name}\n\nHi there,\n\nI'd love to schedule a brief meeting to discuss how we can assist {company_name} with your current challenges, specifically {company_info.get('pain_points', 'pipeline scale')}.\n\nHere is my calendar link, or let me know what times work for you.\n\nBest,\nSales Team",
        "proposal_follow_up": f"Subject: Proposal Details - Avanta & {company_name}\n\nHi there,\n\nI wanted to follow up on the proposal we sent over. I'm happy to address any questions you or the team might have regarding our timeline, scope, or pricing.\n\nLooking forward to working together.\n\nBest,\nSales Team"
    }
    
    template = fallback_templates.get(email_type, fallback_templates["cold"])
    if not client:
        return template

    try:
        prompt = (
            f"Write a highly personalized professional outbound email of type '{email_type}' for a lead contact.\n"
            f"Target Company Details:\n"
            f"Name: {company_name}\n"
            f"Description: {company_info.get('description')}\n"
            f"Tech Stack: {company_info.get('tech_stack')}\n"
            f"Pain Points: {company_info.get('pain_points')}\n"
            f"Contact Job Title / Role: {contact_role}\n"
            f"Our Services Offered: {services}\n\n"
            f"Generate a clear subject line and body. Keep the tone professional, concise, and conversion-oriented."
        )
        
        chat_completion = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating email: {e}")
        return template

# 3. LinkedIn Outreach Generator
def generate_linkedin_outreach(company_info: Dict[str, Any], contact_role: str, services_offered: str, seq_stage: str) -> str:
    client = get_openai_client()
    
    company_name = company_info.get("company_name", "your company")
    services = services_offered if services_offered else "custom cloud integrations"
    
    fallback_templates = {
        "connection": f"Hi, noticed your work in {company_info.get('industry', 'tech')}. I'd love to connect and follow {company_name}'s journey. Cheers!",
        "first_message": f"Hi! Thanks for connecting. I specialize in helping companies in the {company_info.get('industry', 'tech')} space implement {services}. I noticed {company_name} is using {company_info.get('tech_stack', 'modern tech')}. Would love to share a brief use-case study with you.",
        "follow_up": f"Hi, just following up. We recently published a guide on resolving {company_info.get('pain_points', 'infrastructure bottlenecks')}. Let me know if you'd be open to a quick chat about it!"
    }
    
    template = fallback_templates.get(seq_stage, fallback_templates["connection"])
    if not client:
        return template

    try:
        prompt = (
            f"Write a personalized LinkedIn outreach message of stage '{seq_stage}'.\n"
            f"Target Company Name: {company_name}\n"
            f"Target Company Description: {company_info.get('description')}\n"
            f"Contact Role: {contact_role}\n"
            f"Our Services Offered: {services}\n"
            f"LinkedIn Message Stage: {seq_stage} (connection request, first message, or follow-up sequence).\n\n"
            f"Make it short, engaging, social-selling focused, and compliant with LinkedIn character guidelines (especially connection requests which must be under 300 characters)."
        )
        
        chat_completion = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating LinkedIn message: {e}")
        return template

# 4. Meeting Summarizer
def summarize_meeting_transcript(transcript: str) -> Dict[str, Any]:
    client = get_openai_client()
    
    default_summary = {
        "summary": "This is a summary of the uploaded meeting notes. The client discussed general project requirements and timeline options.",
        "action_items": [
            "Follow up with client pricing structure",
            "Prepare initial architectural draft diagram",
            "Schedule next discovery sync for next week"
        ]
    }
    
    if not client:
        return default_summary

    try:
        prompt = (
            f"Analyze the following meeting notes or transcript:\n\n"
            f"{transcript}\n\n"
            f"Extract a detailed summary and actionable follow-up items.\n"
            f"Format your response as a strict JSON object with fields:\n"
            f"- summary (paragraph summarizing discussion points, milestones, and client feedback)\n"
            f"- action_items (array of string items representing todo tasks)\n"
            f"Return ONLY valid JSON."
        )
        
        chat_completion = client.chat.completions.create(
            model="gemini-2.5-flash",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        return json.loads(chat_completion.choices[0].message.content)
    except Exception as e:
        print(f"Error summarizing meeting: {e}")
        return default_summary

# 5. Proposal PDF Generator (ReportLab)
def generate_proposal_pdf(client_name: str, services: str, pricing: str, timeline: str, output_path: str) -> None:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    
    # Setup document
    doc = SimpleDocTemplate(output_path, pagesize=letter, rightMargin=54, leftMargin=54, topMargin=54, bottomMargin=54)
    story = []
    
    styles = getSampleStyleSheet()
    
    # Custom Styles for Premium Look
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#4F46E5'), # Indigo Accent
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#1E293B'), # Slate 800
        spaceBefore=15,
        spaceAfter=10
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155'), # Slate 700
        spaceAfter=8
    )

    # Document Header
    story.append(Paragraph("PROJECT SERVICE PROPOSAL", title_style))
    story.append(Paragraph("Prepared by Avanta SaaS CRM", body_style))
    story.append(Spacer(1, 20))
    
    # Client Segment
    story.append(Paragraph("Client Target Details", h2_style))
    story.append(Paragraph(f"<b>Client Name:</b> {client_name}", body_style))
    story.append(Paragraph(f"<b>Proposal Date:</b> {datetime_to_str()}", body_style))
    story.append(Spacer(1, 10))
    
    # Services Segment
    story.append(Paragraph("1. Scope of Services", h2_style))
    services_clean = services.replace("\n", "<br/>")
    story.append(Paragraph(services_clean, body_style))
    story.append(Spacer(1, 10))
    
    # Timeline Segment
    story.append(Paragraph("2. Timeline & Milestones", h2_style))
    timeline_clean = timeline.replace("\n", "<br/>")
    story.append(Paragraph(timeline_clean, body_style))
    story.append(Spacer(1, 10))
    
    # Pricing Segment Table
    story.append(Paragraph("3. Pricing & Terms", h2_style))
    
    data = [
        ['Service Detail', 'Cost & Schedule'],
        ['Core Deliverables (Phase 1)', pricing],
        ['Monthly Platform/Support Retainer', 'Included (First 3 Months)']
    ]
    
    t = Table(data, colWidths=[300, 200])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1E293B')),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('PADDING', (0, 0), (-1, -1), 10),
    ]))
    
    story.append(t)
    story.append(Spacer(1, 30))
    
    # Signature block
    story.append(Paragraph("Authorized Approval Sign-Off", h2_style))
    sig_data = [
        ['Client Signature', 'Avanta Agent Signature'],
        ['\n\n_________________________\nDate: ', '\n\n_________________________\nDate: ']
    ]
    sig_table = Table(sig_data, colWidths=[250, 250])
    sig_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
    ]))
    story.append(sig_table)
    
    doc.build(story)

def datetime_to_str():
    from datetime import datetime
    return datetime.now().strftime("%Y-%m-%d")
