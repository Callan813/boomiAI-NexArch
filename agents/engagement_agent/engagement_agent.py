# engagement_agent.py

"""
Engagement Agent
----------------
Sends smart reminders to borrowers and lenders about upcoming rentals, returns, or overdue items.

Tables used:
- rentals
- users
"""

from datetime import datetime, timedelta
from crewai import Agent, Task
from supabase import create_client, Client
import os

# =========================
# Environment Variables
# =========================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# =========================
# Helper Functions
# =========================

def fetch_upcoming_rentals(days_ahead=1):
    """Fetch rentals that are due within 'days_ahead' days."""
    today = datetime.utcnow().date()
    target_date = today + timedelta(days=days_ahead)
    response = supabase.table("rentals").select("*").eq("status", "active").lte("end_date", target_date).execute()
    return response.data if response.data else []

def fetch_user_contact(user_id: str):
    """Fetch user's contact info."""
    response = supabase.table("users").select("full_name, email, phone").eq("user_id", user_id).execute()
    return response.data[0] if response.data else {}

def send_reminder(user_contact: dict, rental_info: dict, reminder_type="return_due"):
    """
    Placeholder for notification logic.
    For production, integrate with:
    - WhatsApp Business API
    - Twilio / SMS
    - Email
    """
    name = user_contact.get("full_name", "User")
    rental_id = rental_info.get("rental_id")
    item_id = rental_info.get("item_id")
    message = f"Hello {name}, your rental ({rental_id}) is due {reminder_type} soon."
    # Replace this with actual API call
    print(f"[REMINDER] {message}")
    return True

# =========================
# CrewAI Task
# =========================
engagement_task = Task(
    name="engagement_agent",
    description="""
    Sends reminders to borrowers and lenders for upcoming or overdue rentals.
    Reads: rentals, users
    Writes: (optional) logs or notifications
    """,
    required_output=["reminders_sent"],
)

# =========================
# Agent
# =========================
engagement_agent = Agent(name="EngagementAgent", tasks=[engagement_task])

@engagement_agent.on_task("engagement_agent")
def run_engagement_agent(task_input: dict):
    """
    Optional task_input:
    {
        "days_ahead": 1  # fetch rentals due in next 'days_ahead' days
    }
    """
    days_ahead = task_input.get("days_ahead", 1)
    rentals_due = fetch_upcoming_rentals(days_ahead)

    reminders_sent = 0
    for rental in rentals_due:
        # Notify borrower
        borrower_contact = fetch_user_contact(rental.get("renter_id"))
        if borrower_contact:
            send_reminder(borrower_contact, rental, reminder_type="return_due")
            reminders_sent += 1

        # Notify lender
        lender_contact = fetch_user_contact(rental.get("lender_id"))
        if lender_contact:
            send_reminder(lender_contact, rental, reminder_type="pickup_due")
            reminders_sent += 1

    return {"reminders_sent": reminders_sent}

# =========================
# Run Agent (for testing)
# =========================
if __name__ == "__main__":
    result = run_engagement_agent({"days_ahead": 1})
    print(f"[INFO] Engagement Agent Result: {result}")
