# trust_agent.py

"""
Trust Agent
-----------
Calculates and updates user credibility scores based on past rentals, ratings, and damage reports.

Tables used:
- users
- rentals
- ratings
- damage_reports
"""

from datetime import datetime
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
    print("[WARN] Supabase credentials not found for trust agent")
    supabase = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# Helper Functions
# =========================

def fetch_user_rentals(user_id: str):
    """Fetch all rentals where user was renter or lender."""
    response = supabase.table("rentals").select("*").or_(f"renter_id.eq.{user_id},lender_id.eq.{user_id}").execute()
    return response.data if response.data else []

def fetch_user_ratings(user_id: str):
    """Fetch all ratings received by the user."""
    response = supabase.table("ratings").select("*").eq("rated_user_id", user_id).execute()
    return response.data if response.data else []

def fetch_user_damage_reports(user_id: str):
    """Fetch damage reports related to user as renter."""
    response = supabase.table("damage_reports").select("*").eq("reporter_id", user_id).execute()
    return response.data if response.data else []

def calculate_credibility_score(rentals, ratings, damages):
    """
    Compute credibility score (0.0 - 1.0)
    - Average rating (50%)
    - Timely return rate (30%)
    - Low damage incidents (20%)
    """
    # Average rating score
    avg_rating = sum([r["score"] for r in ratings]) / len(ratings) if ratings else 0.0

    # Timely return rate
    timely_returns = sum(1 for r in rentals if r["status"] == "completed")  # assume completed = on-time
    total_rentals = len(rentals)
    timely_rate = timely_returns / total_rentals if total_rentals > 0 else 1.0

    # Damage factor
    unresolved_damages = sum(1 for d in damages if d["status"] == "pending")
    damage_factor = 1 - (unresolved_damages / len(damages)) if damages else 1.0

    # Weighted credibility
    credibility = 0.5 * (avg_rating / 5.0) + 0.3 * timely_rate + 0.2 * damage_factor
    return round(credibility, 2)

def update_user_credibility(user_id: str, score: float):
    """Update the user's credibility_score in Supabase."""
    if not supabase:
        print("[WARN] Supabase not available, skipping credibility update")
        return score
        
    supabase.table("users").update({
        "credibility_score": score,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("user_id", user_id).execute()
    return score

# =========================
# Main Function for Orchestrator
# =========================

def evaluate_trust(renter_id: str, lender_id: str) -> dict:
    """
    Evaluate trust between renter and lender.
    This is the main function called by the orchestrator.
    """
    if not supabase:
        print("[WARN] Supabase not available, returning default trust result")
        return {"ok": True, "trust_score": 0.85, "reason": "Mock trust evaluation"}
    
    try:
        # Get credibility scores for both users
        renter_response = supabase.table("users").select("credibility_score").eq("user_id", renter_id).execute()
        lender_response = supabase.table("users").select("credibility_score").eq("user_id", lender_id).execute()
        
        renter_score = 0.5  # Default score
        lender_score = 0.5  # Default score
        
        if renter_response.data:
            renter_score = renter_response.data[0].get("credibility_score", 0.5)
        
        if lender_response.data:
            lender_score = lender_response.data[0].get("credibility_score", 0.5)
        
        # Simple trust evaluation
        combined_score = (renter_score + lender_score) / 2
        trust_threshold = 0.3  # Minimum trust score required
        
        if combined_score >= trust_threshold:
            return {
                "ok": True,
                "trust_score": combined_score,
                "reason": f"Trust score {combined_score:.2f} meets threshold"
            }
        else:
            return {
                "ok": False,
                "trust_score": combined_score,
                "reason": f"Trust score {combined_score:.2f} below threshold {trust_threshold}"
            }
            
    except Exception as e:
        print(f"[ERROR] Error evaluating trust: {e}")
        return {"ok": True, "trust_score": 0.5, "reason": "Error in trust evaluation, defaulting to allow"}

# =========================
# CrewAI Task (Commented out for now)
# =========================
# trust_task = Task(
#     name="trust_agent",
#     description="""
#     Calculates and updates user credibility scores based on ratings, rentals, and damage history.
#     Reads: users, rentals, ratings, damage_reports
#     Writes: users.credibility_score
#     """,
#     expected_output="credibility_score",
# )

# =========================
# Agent (Commented out for now)
# =========================
# trust_agent = Agent(name="TrustAgent", tasks=[trust_task])

# @trust_agent.on_task("trust_agent")
def run_trust_agent(task_input: dict):
    """
    Expected task_input:
    {
        "user_id": "<user uuid>"
    }
    """
    user_id = task_input.get("user_id")
    if not user_id:
        return {"error": "Missing user_id in task input"}

    rentals = fetch_user_rentals(user_id)
    ratings = fetch_user_ratings(user_id)
    damages = fetch_user_damage_reports(user_id)

    score = calculate_credibility_score(rentals, ratings, damages)
    update_user_credibility(user_id, score)

    return {"credibility_score": score}

# =========================
# Run Agent (for testing)
# =========================
if __name__ == "__main__":
    sample_user_id = "PUT_SAMPLE_USER_UUID_HERE"
    result = run_trust_agent({"user_id": sample_user_id})
    print(f"[INFO] Trust Agent Result: {result}")
