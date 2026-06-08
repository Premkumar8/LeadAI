from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.crm import User, Company, Contact, Lead, Activity, Meeting, Email, Task, AI_Insight, Transaction, Project

def clear_all_data():
    print("Connecting to database...")
    db = SessionLocal()
    try:
        print("Clearing all records from database tables...")
        
        # Delete dependent tables first due to foreign keys
        deleted_insights = db.query(AI_Insight).delete()
        deleted_projects = db.query(Project).delete()
        deleted_txs = db.query(Transaction).delete()
        deleted_tasks = db.query(Task).delete()
        deleted_emails = db.query(Email).delete()
        deleted_meetings = db.query(Meeting).delete()
        deleted_activities = db.query(Activity).delete()
        deleted_contacts = db.query(Contact).delete()
        deleted_leads = db.query(Lead).delete()
        deleted_companies = db.query(Company).delete()
        deleted_users = db.query(User).delete()
        
        db.commit()
        print("Database cleared successfully.")
        
        print("Creating default admin account (admin@avanta.ai / password123)...")
        admin = User(
            name="John Doe",
            email="admin@avanta.ai",
            password_hash=get_password_hash("password123"),
            company_name="Avanta Solutions",
            role="admin"
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Error clearing database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_all_data()
