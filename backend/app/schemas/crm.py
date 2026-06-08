from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

# --- AUTH SCHEMAS ---
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: Optional[str] = None
    role: Optional[str] = "member"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: EmailStr
    company_name: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[str] = None


# --- CONTACT SCHEMAS ---
class ContactBase(BaseModel):
    full_name: str
    job_title: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    linkedin_profile: Optional[str] = None

class ContactCreate(ContactBase):
    company_id: UUID

class ContactUpdate(BaseModel):
    full_name: Optional[str] = None
    job_title: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    linkedin_profile: Optional[str] = None

class ContactResponse(ContactBase):
    id: UUID
    company_id: UUID

    class Config:
        from_attributes = True


# --- COMPANY SCHEMAS ---
class CompanyBase(BaseModel):
    company_name: str
    website: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    employee_count: Optional[int] = 0
    linkedin_url: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    employee_count: Optional[int] = None
    linkedin_url: Optional[str] = None
    lead_score: Optional[int] = None
    ai_summary: Optional[str] = None


# --- PROJECT MINI SCHEMA ---
class ProjectResponseMini(BaseModel):
    id: UUID
    name: str
    description: Optional[str] = None
    cost: float
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyResponse(CompanyBase):
    id: UUID
    lead_score: int
    ai_summary: Optional[str] = None
    created_at: datetime
    contacts: List[ContactResponse] = []
    projects: List[ProjectResponseMini] = []

    class Config:
        from_attributes = True


# --- ACTIVITY SCHEMAS ---
class ActivityBase(BaseModel):
    activity_type: str
    description: Optional[str] = None

class ActivityCreate(ActivityBase):
    lead_id: UUID

class ActivityResponse(ActivityBase):
    id: UUID
    lead_id: UUID
    activity_date: datetime

    class Config:
        from_attributes = True


# --- MEETING SCHEMAS ---
class MeetingBase(BaseModel):
    meeting_date: datetime
    notes: Optional[str] = None

class MeetingCreate(MeetingBase):
    lead_id: UUID
    transcript: Optional[str] = None

class MeetingUpdate(BaseModel):
    meeting_date: Optional[datetime] = None
    notes: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None

class MeetingResponse(MeetingBase):
    id: UUID
    lead_id: UUID
    transcript: Optional[str] = None
    summary: Optional[str] = None

    class Config:
        from_attributes = True


# --- EMAIL SCHEMAS ---
class EmailBase(BaseModel):
    email_subject: str
    email_body: str

class EmailCreate(EmailBase):
    lead_id: UUID

class EmailResponse(EmailBase):
    id: UUID
    lead_id: UUID
    sent_at: datetime
    response_received: bool

    class Config:
        from_attributes = True


# --- TASK SCHEMAS ---
class TaskBase(BaseModel):
    title: str
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    lead_id: UUID

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = None

class TaskResponse(TaskBase):
    id: UUID
    lead_id: UUID
    status: str

    class Config:
        from_attributes = True


# --- LEAD SCHEMAS ---
class LeadBase(BaseModel):
    status: str = "New"
    priority: str = "Medium"
    estimated_value: float = 0.0
    source: Optional[str] = None

class LeadCreate(LeadBase):
    company_id: UUID
    assigned_user_id: Optional[UUID] = None

class LeadUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    estimated_value: Optional[float] = None
    source: Optional[str] = None
    assigned_user_id: Optional[UUID] = None

class LeadResponse(LeadBase):
    id: UUID
    company_id: UUID
    assigned_user_id: Optional[UUID] = None
    created_at: datetime
    company: CompanyResponse
    assigned_user: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# --- AI INSIGHT SCHEMAS ---
class AIInsightResponse(BaseModel):
    id: UUID
    company_id: UUID
    ai_recommendation: Optional[str] = None
    ai_score: int
    generated_at: datetime

    class Config:
        from_attributes = True


# --- ASSISTANT SCHEMAS ---
class AssistantMessage(BaseModel):
    role: str  # user, assistant
    content: str

class AssistantChatRequest(BaseModel):
    messages: List[AssistantMessage]

class AssistantChatResponse(BaseModel):
    response: str


# --- TRANSACTION SCHEMAS ---
class TransactionBase(BaseModel):
    amount: float
    type: str  # Credit, Debit
    status: str = "Paid"  # Paid, Unpaid
    due_date: Optional[datetime] = None
    description: Optional[str] = None

class TransactionCreate(TransactionBase):
    company_id: UUID

class TransactionUpdate(BaseModel):
    amount: Optional[float] = None
    type: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None
    company_id: Optional[UUID] = None

class TransactionResponse(TransactionBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    company: CompanyBase

    class Config:
        from_attributes = True


# --- FULL PROJECT SCHEMAS ---
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    cost: float = 0.0
    status: str = "Planning"
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    status: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class ProjectResponse(ProjectBase):
    id: UUID
    created_at: datetime
    companies: List[CompanyResponse] = []

    class Config:
        from_attributes = True

