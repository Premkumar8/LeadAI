import asyncio
from sqlalchemy import text
from app.core.database import SessionLocal

async def run_migration():
    db = SessionLocal()
    try:
        # Alter tasks table
        print("Migrating tasks table...")
        
        # Make lead_id nullable
        db.execute(text("ALTER TABLE tasks ALTER COLUMN lead_id DROP NOT NULL;"))
        
        # Add campaign_id column
        db.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE;"))
        
        # Add contact_id column
        db.execute(text("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE;"))
        
        db.commit()
        print("Migration complete!")
    except Exception as e:
        print(f"Error during migration: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_migration())
