# orchestrator.py
import os
import sys
from datetime import datetime, timedelta
from typing import List, Dict
from dotenv import load_dotenv

# -------------------------
# Supabase Setup
# -------------------------
from supabase import create_client, Client

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials not found in .env")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -------------------------
# Import Real Agents
# -------------------------
# Add parent directory to Python path to import sibling modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from matching_agent.matching_agent import match_rentals as matching_agent
    print("[INFO] Imported real matching agent")
except ImportError as e:
    print(f"[WARN] Could not import matching agent: {e}")
    def matching_agent(rental):
        return {"item_id": "mock-item-001"}

try:
    from pricing_agent.pricing_agent import calculate_price as pricing_agent
    print("[INFO] Imported real pricing agent")
except ImportError as e:
    print(f"[WARN] Could not import pricing agent: {e}")
    def pricing_agent(rental_id):
        return 150.0

try:
    from trust_agent.trust_agent import evaluate_trust as trust_agent
    print("[INFO] Imported real trust agent")
except ImportError as e:
    print(f"[WARN] Could not import trust agent: {e}")
    def trust_agent(renter_id, lender_id):
        return {"ok": True, "trust_score": 0.85}

try:
    from verification_agent.main import verify_damage as verification_agent
    print("[INFO] Imported real verification agent")
except ImportError as e:
    print(f"[WARN] Could not import verification agent: {e}")
    def verification_agent(rental_id, before_image, after_image):
        return {"damage_detected": False, "confidence": 0.95}

# -------------------------
# Helpers: Supabase Interactions
# -------------------------

def fetch_rentals(status="pending") -> List[Dict]:
    """Fetch pending rentals from Supabase"""
    response = supabase.table("rentals").select("*").eq("status", status).execute()
    return response.data or []

def update_rental_item(rental_id: str, item_id: str):
    """Update rental with matched item and set status to active"""
    supabase.table("rentals").update({
        "item_id": item_id, 
        "status": "active"
    }).eq("rental_id", rental_id).execute()

def update_rental_price(rental_id: str, price: float):
    """Update rental total cost"""
    supabase.table("rentals").update({"total_cost": price}).eq("rental_id", rental_id).execute()

def store_verification(verification_result: dict):
    """Insert verification result into damage_reports table"""
    supabase.table("damage_reports").insert(verification_result).execute()

def mark_rental_flagged(rental_id: str):
    """Flag rental if trust fails"""
    supabase.table("rentals").update({"status": "flagged"}).eq("rental_id", rental_id).execute()
    print(f"[WARN] Rental {rental_id} flagged due to trust issues")


# -------------------------
# Orchestrator Loop
# -------------------------

def orchestrate():
    rentals = fetch_rentals(status="pending")

    if not rentals:
        print("[INFO] No pending rentals found")
        return

    for rental in rentals:
        rental_id = rental["rental_id"]
        print(f"\n[INFO] Processing rental: {rental_id}")

        # ---- Matching Agent ----
        matched_item = matching_agent(rental)  # Must return dict with "item_id"
        if matched_item and matched_item.get("item_id"):
            update_rental_item(rental_id, matched_item["item_id"])
            print(f"[INFO] Rental {rental_id} assigned item {matched_item['item_id']}")
        else:
            print(f"[WARN] No matching item found for rental {rental_id}")
            continue

        # ---- Pricing Agent ----
        price = pricing_agent(rental_id)
        if price:
            update_rental_price(rental_id, price)
            print(f"[INFO] Rental {rental_id} price updated to {price}")

        # ---- Trust Agent ----
        trust_result = trust_agent(rental["renter_id"], rental["lender_id"])
        if not trust_result.get("ok", True):
            mark_rental_flagged(rental_id)
            print(f"[WARN] Rental {rental_id} flagged due to trust issues")
            continue
        else:
            print(f"[INFO] Trust check passed for rental {rental_id}")

        # ---- Verification Agent ----
        # Fetch before/after images for this rental from damage_reports if exists
        before_image = rental.get("image_before_url")
        after_image = rental.get("image_after_url")
        if before_image and after_image:
            verification_result = verification_agent(
                rental_id=rental_id,
                before_image=before_image,
                after_image=after_image
            )
            # Add extra fields expected in damage_reports
            verification_result.update({
                "rental_id": rental_id,
                "reporter_id": rental.get("renter_id"),
                "status": "pending",
                "verified_by_agent": True
            })
            store_verification(verification_result)
            print(f"[INFO] Verification result stored for rental {rental_id}")

        print(f"[INFO] Rental {rental_id} processed successfully.")

# -------------------------
# Entry Point
# -------------------------

if __name__ == "__main__":
    print("[INFO] Starting Orchestrator...")
    orchestrate()
