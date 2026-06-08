from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.models.crm import Project, Company
from app.schemas.crm import ProjectCreate, ProjectResponse, ProjectUpdate
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Project).order_by(Project.name).all()

@router.post("/", response_model=ProjectResponse)
def create_project(project_in: ProjectCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = Project(**project_in.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.get("/{id}", response_model=ProjectResponse)
def get_project(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.put("/{id}", response_model=ProjectResponse)
def update_project(id: UUID, project_in: ProjectUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    for k, v in project_in.model_dump(exclude_unset=True).items():
        setattr(project, k, v)
        
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{id}")
def delete_project(id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}

@router.post("/{project_id}/companies/{company_id}", response_model=ProjectResponse)
def link_project_company(project_id: UUID, company_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if company not in project.companies:
        project.companies.append(company)
        db.commit()
        db.refresh(project)
    return project

@router.delete("/{project_id}/companies/{company_id}", response_model=ProjectResponse)
def unlink_project_company(project_id: UUID, company_id: UUID, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    if company in project.companies:
        project.companies.remove(company)
        db.commit()
        db.refresh(project)
    return project
