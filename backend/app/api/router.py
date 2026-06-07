from fastapi import APIRouter
from app.api.v1 import auth, companies, contacts, leads, activities, meetings, emails, tasks, ai, analytics, transactions

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(companies.router, prefix="/companies", tags=["companies"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(leads.router, prefix="/leads", tags=["leads"])
api_router.include_router(activities.router, prefix="/activities", tags=["activities"])
api_router.include_router(meetings.router, prefix="/meetings", tags=["meetings"])
api_router.include_router(emails.router, prefix="/emails", tags=["emails"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(ai.router, prefix="/ai", tags=["ai"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])

