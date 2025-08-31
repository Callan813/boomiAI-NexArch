# payout_agent.py

"""
Payout Agent
------------
Handles secure deposits, rental payments, and refunds.
Ensures payments are tracked in Supabase and status updated automatically.

Tables used:
- payments
- rentals
- users
"""

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

def fetch_pending_payments():
    """Fetch all payments with status 'pending'."""
    response = supabase.table("payments").select("*").eq("status", "pending").execute()
    return response.data if response.data else []

def update_payment_status(payment_id: str, status: str):
    """Update payment status in Supabase."""
    supabase.table("payments").update({"status": status}).eq("payment_id", payment_id).execute()
    print(f"[INFO] Payment {payment_id} updated to {status}")

def process_payment(payment: dict):
    """
    Placeholder for real payment processing.
    Integrate with:
    - UPI (Razorpay, Google Pay API, etc.)
    - Card gateways (Stripe, Razorpay, PayPal)
    """
    payment_id = payment.get("payment_id")
    amount = payment.get("amount")
    method = payment.get("payment_method")
    
    # Simulate success/failure
    success = True  # Replace with actual API call result
    
    if success:
        update_payment_status(payment_id, "completed")
        print(f"[PAYMENT SUCCESS] {payment_id}: {amount} via {method}")
    else:
        update_payment_status(payment_id, "failed")
        print(f"[PAYMENT FAILED] {payment_id}: {amount} via {method}")
    
    return success

# =========================
# CrewAI Task
# =========================
payout_task = Task(
    name="payout_agent",
    description="""
    Processes pending payments and refunds.
    Reads: payments, rentals, users
    Writes: updates payment status
    """,
    required_output=["payments_processed"],
)

# =========================
# Agent
# =========================
payout_agent = Agent(name="PayoutAgent", tasks=[payout_task])

@payout_agent.on_task("payout_agent")
def run_payout_agent(task_input: dict):
    """
    Optional task_input can include:
    {
        "process_all": True  # if set, process all pending payments
    }
    """
    pending_payments = fetch_pending_payments()
    processed_count = 0
    
    for payment in pending_payments:
        if process_payment(payment):
            processed_count += 1
    
    return {"payments_processed": processed_count}

# =========================
# Run Agent (for testing)
# =========================
if __name__ == "__main__":
    result = run_payout_agent({})
    print(f"[INFO] Payout Agent Result: {result}")
