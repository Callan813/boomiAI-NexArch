# pricing_agent.py

"""
Pricing Agent
--------------
Adjusts item pricing dynamically based on historical rentals and demand.

Tables used:
- items
- rentals
"""

from datetime import datetime, timedelta
from crewai import Agent, Task
from supabase import create_client, Client
import os

# =========================
# Environment Variables
# =========================
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Updated to match .env file

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[WARN] Supabase credentials not found for pricing agent")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# Helper Functions
# =========================

def fetch_item(item_id: str):
    """Fetch item data from Supabase."""
    response = supabase.table("items").select("*").eq("item_id", item_id).execute()
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None

def fetch_rental_history(item_id: str):
    """Fetch past rentals for the item from the rentals table."""
    response = supabase.table("rentals").select("*").eq("item_id", item_id).execute()
    return response.data if response.data else []

def calculate_price(item, rentals):
    """Adjust price based on demand in the last 90 days."""
    base_price = item["price_per_day"]
    if not rentals:
        return base_price

    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    recent_rentals = [
        r for r in rentals 
        if r.get("start_date") and datetime.fromisoformat(r["start_date"]) > ninety_days_ago
    ]

    demand_score = len(recent_rentals)

    if demand_score >= 5:
        return round(base_price * 1.1, 2)  # +10% if high demand
    elif demand_score <= 1:
        return round(base_price * 0.9, 2)  # -10% if low demand
    else:
        return base_price  # unchanged

def update_price(item_id: str, new_price: float):
    """Update the item's price_per_day in Supabase."""
    supabase.table("items").update({"price_per_day": new_price, "updated_at": datetime.utcnow().isoformat()}).eq("item_id", item_id).execute()
    return new_price

# =========================
# Main Function for Orchestrator
# =========================

def calculate_price(rental_id: str) -> float:
    """
    Calculate dynamic pricing for a rental.
    This is the main function called by the orchestrator.
    """
    if not supabase:
        print("[WARN] Supabase not available, returning default price")
        return 150.0
    
    try:
        # Get rental details
        rental_response = supabase.table("rentals").select("*").eq("rental_id", rental_id).execute()
        if not rental_response.data:
            print(f"[WARN] Rental {rental_id} not found")
            return 150.0
            
        rental = rental_response.data[0]
        item_id = rental.get("item_id")
        
        if not item_id:
            print(f"[WARN] No item assigned to rental {rental_id}")
            return 150.0
            
        # Get item details
        item_response = supabase.table("items").select("*").eq("item_id", item_id).execute()
        if not item_response.data:
            print(f"[WARN] Item {item_id} not found")
            return 150.0
            
        item = item_response.data[0]
        base_price = item.get("price_per_day", 100.0)
        
        # Calculate days
        start_date = datetime.fromisoformat(rental["start_date"])
        end_date = datetime.fromisoformat(rental["end_date"])
        days = (end_date - start_date).days
        
        # Simple dynamic pricing (can be enhanced)
        demand_factor = 1.0  # Simple fallback, can use calculate_demand_factor when implemented
        dynamic_price = base_price * demand_factor * days
        
        print(f"[INFO] Calculated price for rental {rental_id}: ${dynamic_price:.2f}")
        return dynamic_price
        
    except Exception as e:
        print(f"[ERROR] Error calculating price for rental {rental_id}: {e}")
        return 150.0

# =========================
# CrewAI Task (Optional)
# =========================
# Commented out for now to avoid configuration issues
# pricing_task = Task(
#     name="pricing_agent",
#     description="""
#     Adjusts the price of an item dynamically based on historical rentals and recent demand.
#     Reads: items, rentals
#     Writes: items.price_per_day
#     """,
#     expected_output="adjusted_price",
# )

# =========================
# Agent (Commented out for now)
# =========================
# pricing_agent = Agent(name="PricingAgent", tasks=[pricing_task])

# @pricing_agent.on_task("pricing_agent")
def run_pricing_agent(task_input: dict):
    """
    Expected task_input:
    {
        "item_id": "<item uuid>"
    }
    """
    item_id = task_input.get("item_id")
    if not item_id:
        return {"error": "Missing item_id in task input"}

    item = fetch_item(item_id)
    if not item:
        return {"error": f"Item {item_id} not found"}

    rentals = fetch_rental_history(item_id)
    new_price = calculate_price(item, rentals)
    update_price(item_id, new_price)

    return {"adjusted_price": new_price}

# =========================
# Run Agent (for testing)
# =========================
if __name__ == "__main__":
    sample_item_id = "PUT_SAMPLE_ITEM_UUID_HERE"
    result = run_pricing_agent({"item_id": sample_item_id})
    print(f"[INFO] Pricing Agent Result: {result}")
