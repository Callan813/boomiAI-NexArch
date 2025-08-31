# matching_agent.py
import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[WARN] Supabase credentials not found for matching agent")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -------------------------
# Helpers
# -------------------------

def fetch_available_items(category: str):
    """Fetch all available items of a given category"""
    response = (
        supabase.table("items")
        .select("*")
        .eq("available", True)
        .eq("category", category)
        .execute()
    )
    return response.data or []

def get_owner_credibility(user_id: str) -> float:
    """Fetch owner's credibility score from users table"""
    if not user_id:
        return 0
    response = supabase.table("users").select("credibility_score").eq("user_id", user_id).single().execute()
    data = response.data
    if data and "credibility_score" in data:
        return data["credibility_score"]
    return 0

def select_best_item(items):
    """Pick the best item based on owner's credibility"""
    if not items:
        return None
    # Sort items by owner credibility descending
    items.sort(key=lambda x: get_owner_credibility(x.get("user_id")), reverse=True)
    return items[0]

# -------------------------
# Main Function for Orchestrator
# -------------------------

def match_rentals(rental: dict) -> dict:
    """
    Match a single rental to an appropriate item.
    Called by orchestrator.
    """
    if not supabase:
        print("[WARN] Supabase not available, returning mock item")
        return {"item_id": "mock-item-001"}
    
    try:
        rental_id = rental["rental_id"]
        category = rental.get("item_type") or "General"

        # Fetch available items
        items = fetch_available_items(category)
        best_item = select_best_item(items)

        if best_item:
            item_id = best_item["item_id"]

            # Assign item and mark unavailable
            supabase.table("rentals").update({
                "item_id": item_id,
                "status": "active"
            }).eq("rental_id", rental_id).execute()

            supabase.table("items").update({
                "available": False
            }).eq("item_id", item_id).execute()

            print(f"[INFO] Rental {rental_id} assigned item {item_id}")
            return {"item_id": item_id}

        print(f"[WARN] No available item found for rental {rental_id}")
        return {"item_id": None}

    except Exception as e:
        print(f"[ERROR] Error matching rental {rental_id}: {e}")
        return {"item_id": None}
