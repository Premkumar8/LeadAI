import asyncio
from sqlalchemy import text
from app.core.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN remarks VARCHAR(255)"))
            conn.commit()
            print("Successfully added 'remarks' column to 'contacts' table.")
        except Exception as e:
            print(f"Error (column might already exist): {e}")

if __name__ == "__main__":
    migrate()
