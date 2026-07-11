import os
import sys
from sqlalchemy import create_engine, text

# Add the backend directory to the path so we can import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.core.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

def run():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE leads ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;"))
            print("Successfully added campaign_id to leads.")
        except Exception as e:
            print(f"Error modifying leads table: {e}")

        try:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL;"))
            print("Successfully added campaign_id to contacts.")
        except Exception as e:
            print(f"Error modifying contacts table (campaign_id): {e}")

        try:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN area VARCHAR(255);"))
            print("Successfully added area to contacts.")
        except Exception as e:
            print(f"Error modifying contacts table (area): {e}")

        try:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN address TEXT;"))
            print("Successfully added address to contacts.")
        except Exception as e:
            print(f"Error modifying contacts table (address): {e}")

        try:
            conn.execute(text("ALTER TABLE contacts ADD COLUMN lead_source VARCHAR(255);"))
            print("Successfully added lead_source to contacts.")
        except Exception as e:
            print(f"Error modifying contacts table (lead_source): {e}")

if __name__ == "__main__":
    run()
