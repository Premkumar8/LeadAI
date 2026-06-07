from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List
from datetime import datetime, timezone, timedelta

from app.core.database import get_db
from app.models.crm import Meeting, Task, Activity
from app.schemas.crm import MeetingCreate, MeetingResponse, MeetingUpdate
from app.api.v1.auth import get_current_user
from app.services.ai_service import summarize_meeting_transcript

router = APIRouter()

@router.get("/", response_model=List[MeetingResponse])
def get_meetings(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Meeting).order_by(Meeting.meeting_date.desc()).all()

@router.post("/", response_model=MeetingResponse)
def create_meeting(meeting_in: MeetingCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    meeting = Meeting(**meeting_in.model_dump())
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    
    # Log meeting schedule activity
    activity = Activity(
        lead_id=meeting.lead_id,
        activity_type="Meeting",
        description=f"Meeting scheduled for {meeting.meeting_date.strftime('%Y-%m-%d %H:%M')}"
    )
    db.add(activity)
    db.commit()
    
    return meeting

@router.get("/{id}", response_model=MeetingResponse)
def get_meeting(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    meeting = db.query(Meeting).filter(Meeting.id == id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

@router.put("/{id}", response_model=MeetingResponse)
def update_meeting(id: UUID, meeting_in: MeetingUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    meeting = db.query(Meeting).filter(Meeting.id == id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    for k, v in meeting_in.model_dump(exclude_unset=True).items():
        setattr(meeting, k, v)
        
    db.commit()
    db.refresh(meeting)
    return meeting

@router.delete("/{id}")
def delete_meeting(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    meeting = db.query(Meeting).filter(Meeting.id == id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}

# Feature 6: Summarize transcript & automatically create tasks
@router.post("/{id}/summarize", response_model=MeetingResponse)
def trigger_meeting_summarization(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    meeting = db.query(Meeting).filter(Meeting.id == id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
        
    if not meeting.transcript:
        raise HTTPException(status_code=400, detail="Meeting transcript is empty. Please upload/update transcript text first.")
        
    # Analyze transcript
    analysis = summarize_meeting_transcript(meeting.transcript)
    
    meeting.summary = analysis.get("summary")
    meeting.notes = f"AI Summary:\n{analysis.get('summary')}"
    
    # Automatically generate Tasks based on action items
    created_tasks_count = 0
    action_items = analysis.get("action_items", [])
    for item in action_items:
        task = Task(
            lead_id=meeting.lead_id,
            title=item,
            due_date=datetime.now(timezone.utc) + timedelta(days=3), # default due in 3 days
            status="Pending"
        )
        db.add(task)
        created_tasks_count += 1
        
    # Log CRM Activity
    activity = Activity(
        lead_id=meeting.lead_id,
        activity_type="Note",
        description=f"Meeting analyzed. Summary generated and {created_tasks_count} tasks automatically appended to lead checklist."
    )
    db.add(activity)
    
    db.commit()
    db.refresh(meeting)
    return meeting
