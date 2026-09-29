import sys
import os
import random
import uuid

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.crm import Contact, Company, Campaign, Lead

# 110 Realistic Tamil Nadu Customer Names
TAMIL_NAMES = [
    "Meenakshi Sundaram", "Ramesh Kumar", "Karthik Raja", "Priya Venkatesh",
    "Senthil Nathan", "Anitha Murugan", "Vijayalakshmi Raman", "Saravanan Natarajan",
    "Dhanalakshmi S", "Suresh Balakrishnan", "Bhuvaneshwari K", "Muthukumar P",
    "Revathi Subramanian", "Vigneshwaran R", "Kavitha Selvam", "Manikandan C",
    "Deepa Ganesan", "Aravind Swaminathan", "Shanthi Chandrasekar", "Gopinath V",
    "Lakshmi Narayanan", "Rajeshwari S", "Murugesan K", "Divya Bharathi",
    "Thirunavukkarasu M", "Geetha Radhakrishnan", "Mohanraj T", "Sangeetha R",
    "Sivakumar P", "Nandhini Devi", "Palaniswamy A", "Radhika Krishnan",
    "Venkatesan D", "Umadevi S", "Balaji Raghavan", "Abirami V",
    "Kalyanasundaram N", "Hemalatha B", "Prabhakaran K", "Sujatha Mohan",
    "Dhandapani R", "Poornima S", "Shanmugam C", "Chitra Devi",
    "Arumugam P", "Sowmya Narayan", "Govindaraj M", "Aarthi Kannan",
    "Natarajan S", "Menaka R", "Ganesh Babu", "Kausalya P",
    "Sridhar Venkat", "Subashini K", "Vijayan T", "Karpagam S",
    "Mani Ratnam", "Gayathri Shankaran", "Pandian K", "Pavithra M",
    "Vasanth Kumar", "Yamuna Rani", "Ashok Sundaram", "Keerthana R",
    "Chandran V", "Suguna Devi", "Ilango S", "Archana Murugan",
    "Sathish Kumar", "Malathi V", "Gunasekaran K", "Nalini Krishnan",
    "Boopathi R", "Thilagavathi S", "Elangovan M", "Gomathi N",
    "Hariharan G", "Janani S", "Jayachandran K", "Padmavathi R",
    "Kathiresan P", "Preethi Mohan", "Loganathan C", "Pushpa V",
    "Mahalingam S", "Renuka Devi", "Naveen Raj", "Savithri Raman",
    "Paramasivam K", "Sindhuja B", "Rajarathinam M", "Vaidehi K",
    "Sankaranarayanan G", "Vinodhini S", "Soundararajan P", "Vimala Devi",
    "Subramanian T", "Yashodha N", "Thangaraj C", "Anusuya R",
    "Vadivelu K", "Brindha S", "Velmurugan M", "Devika Nathan",
    "Yogeshwaran P", "Gowri Shankar", "Santhanam R", "Indira Priyadarshini",
    "Praveen Kumar", "Hamsaveni S"
]

AREAS = [
    "T. Nagar, Chennai", "Mylapore, Chennai", "Anna Nagar, Chennai",
    "Velachery, Chennai", "Tambaram, Chennai", "Adyar, Chennai",
    "Gandhipuram, Coimbatore", "RS Puram, Coimbatore", "Town Hall, Coimbatore",
    "KK Nagar, Madurai", "Simmakkal, Madurai", "Anna Nagar, Madurai",
    "Fairlands, Salem", "Suramangalam, Salem", "Tirupur Main Road",
    "Thillai Nagar, Trichy", "Cantonment, Trichy", "Erode Brough Road"
]

# High customer items (>= 12g up to 65g)
HIGH_ITEMS = [
    ("22K Gold Rope Chain", 14.5),
    ("Traditional Kasu Malai", 32.0),
    ("Antique Temple Haram", 48.5),
    ("Bridal Necklace Set", 62.0),
    ("Solid Gold Bangle Pair", 24.0),
    ("Mugappu Gold Chain", 18.2),
    ("Ruby Emerald Choker", 28.5),
    ("Guttapusalu Necklace", 42.0),
    ("Heavy Men's Gold Kada", 35.0),
    ("Gold Oddiyanam / Waist Belt", 65.0),
    ("Navaratna Gold Bangle", 16.0),
    ("Classic Lakshmi Haram", 38.0),
    ("Handcrafted Designer Bangles (4 pcs)", 44.0),
    ("Traditional Thali Chain with Mugappu", 22.5),
    ("Gold Broad Cuff Bracelet", 15.5),
    ("Bridal Mango Malai", 52.0),
    ("Diamond Cut Solid Chain", 13.5),
    ("Antique Peacock Collar", 30.0),
    ("22K Sovereign Gold Bullion (2 Sov)", 16.0),
    ("22K Sovereign Gold Bullion (4 Sov)", 32.0)
]

# Low customer items (2g to 11.9g)
LOW_ITEMS = [
    ("22K Daily Wear Gold Ring", 3.2),
    ("Lightweight Floral Ear Studs", 2.6),
    ("Lakshmi Gold Casting Pendant", 4.5),
    ("Men's Navaratna Ring", 7.2),
    ("Kids Daily Wear Bangle / Kada", 5.0),
    ("Gold Bracelet with Heart Charms", 8.4),
    ("Lord Murugan Pendant with Ring", 4.0),
    ("Gold Jhumka Earrings", 9.8),
    ("Sovereign Lakshmi Gold Coin (8g)", 8.0),
    ("Lightweight Sleek Daily Chain", 11.5),
    ("Stone Studded Gold Ear Tops", 3.8),
    ("Featherweight Drop Earrings", 2.4),
    ("Adjustable Couple Ring", 6.0),
    ("Ganesha Gold Coin (4g)", 4.0),
    ("Traditional Baby Anklet Charms", 5.5),
    ("Simple Sleek Bangle (Single)", 10.5),
    ("Gold Nose Pin & Stud Duo", 2.2),
    ("Modern Geometric Pendant", 4.8),
    ("Gold Daily Wear Hoop Bali", 3.5),
    ("Floral Cluster Ring", 6.8)
]

LEAD_SOURCES = ["Store Walk-in", "WhatsApp Enquiry", "Instagram Ad", "Festival Referral", "Direct Call", "Stall Exhibition"]
STATUSES = ["Waiting", "Contacted", "Completed"]
REMARKS_LIST = [
    "Interested in Akshaya Tritiya scheme",
    "Requested gold rate alert on WhatsApp",
    "Planning daughter wedding jewellery in 6 months",
    "Regular repeat customer for gold coins",
    "Exchanged old gold for new ornaments",
    "Enquired about making charge discounts",
    "Prefers antique finish designs",
    "Looking for 0% V.A. offers",
    "Requested home viewing catalog",
    "Interested in monthly savings chit fund"
]

def seed_jewellery():
    db = SessionLocal()
    try:
        print("Ensuring Swamy Jewellery Campaign exists...")
        campaign = db.query(Campaign).filter(Campaign.name == "Swamy Jewellery Campaign").first()
        if not campaign:
            campaign = Campaign(
                name="Swamy Jewellery Campaign",
                type="Jewellery Retail & Telecalling",
                source="Store Walk-in & Digital Ads",
                status="Active",
                leads_generated=110
            )
            db.add(campaign)
            db.commit()
            db.refresh(campaign)
            print(f"Created Campaign: {campaign.name} ({campaign.id})")
        else:
            print(f"Found Existing Campaign: {campaign.name} ({campaign.id})")

        # Company
        company = db.query(Company).filter(Company.company_name == "Customer Base").first()
        if not company:
            company = Company(company_name="Customer Base", industry="Jewellery Retail")
            db.add(company)
            db.commit()
            db.refresh(company)

        # Clear previous demo customers if any, or append
        existing_count = db.query(Contact).count()
        print(f"Current contacts count: {existing_count}")

        # If existing is already large, check if grams are populated
        contacts_to_add = []
        random.seed(42)

        # We will generate 110 entries:
        # 50 High Customers (>= 12g)
        # 60 Low Customers (2g to 11.9g)
        total_high = 0
        total_low = 0

        for i, name in enumerate(TAMIL_NAMES):
            # Alternate or partition into High and Low
            is_high = (i < 50) # First 50 are High Customers, next 60 are Low Customers
            
            if is_high:
                item_name, base_grams = random.choice(HIGH_ITEMS)
                # Add minor variation to grams
                grams = round(base_grams + random.uniform(-1.0, 3.5), 2)
                if grams < 12.0:
                    grams = 12.5
                total_high += 1
            else:
                item_name, base_grams = random.choice(LOW_ITEMS)
                grams = round(base_grams + random.uniform(-0.5, 1.2), 2)
                if grams < 2.0:
                    grams = 2.2
                elif grams >= 12.0:
                    grams = 11.4
                total_low += 1

            area = random.choice(AREAS)
            phone = f"+91 {random.choice([9840, 9841, 9842, 9444, 9790, 8939, 7358])}{random.randint(100000, 999999)}"
            email_user = name.lower().replace(" ", ".").replace("/", "")
            email = f"{email_user}{random.randint(10, 99)}@gmail.com"
            source = random.choice(LEAD_SOURCES)
            status = random.choice(STATUSES)
            remark = random.choice(REMARKS_LIST)

            contact = Contact(
                full_name=name,
                job_title=f"{'VIP Buyer' if is_high else 'Retail Buyer'}",
                email=email,
                phone=phone,
                area=area,
                address=f"Door No {random.randint(1, 150)}, {area}",
                lead_source=source,
                campaign_id=campaign.id,
                company_id=company.id,
                status=status,
                remarks=remark,
                feedback=f"Purchased {item_name} weighing {grams}g.",
                gold_grams=grams,
                jewellery_item=item_name
            )
            contacts_to_add.append(contact)

        db.bulk_save_objects(contacts_to_add)
        db.commit()

        # Update campaign leads count
        total_in_db = db.query(Contact).count()
        campaign.leads_generated = total_in_db
        db.commit()

        print(f"Successfully added {len(contacts_to_add)} jewellery customers!")
        print(f"- High Customers (>= 12g): {total_high}")
        print(f"- Low Customers (2 to 12g): {total_low}")
        print(f"- Total Contacts in DB now: {total_in_db}")

    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        print(f"Error seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_jewellery()
