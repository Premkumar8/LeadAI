from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.crm import Task, Activity
from app.schemas.crm import TaskCreate, TaskResponse, TaskUpdate
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
def get_tasks(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Task).all()

@router.post("/", response_model=TaskResponse)
def create_task(task_in: TaskCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    task = Task(**task_in.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("/{id}", response_model=TaskResponse)
def get_task(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.put("/{id}", response_model=TaskResponse)
def update_task(id: UUID, task_in: TaskUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    old_status = task.status
    for k, v in task_in.model_dump(exclude_unset=True).items():
        setattr(task, k, v)
        
    db.commit()
    
    # Log complete events
    if task_in.status == "Completed" and old_status != "Completed":
        if task.lead_id:
            activity = Activity(
                lead_id=task.lead_id,
                activity_type="TaskDone",
                description=f"Action Checklist Completed: {task.title}"
            )
            db.add(activity)
            db.commit()
        
    db.refresh(task)
    return task

@router.delete("/{id}")
def delete_task(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}
