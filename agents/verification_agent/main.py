from damage_verifier import verify_damage_with_json
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

def run_damage_verification(before_path="before.jpg", after_path="after.jpg", output_dir="outputs"):
    """
    Simple wrapper that runs the OpenCV damage verification pipeline
    without requiring any AI agent API keys.
    """
    print(f"🔍 Starting damage verification...")
    print(f"   Before image: {before_path}")
    print(f"   After image:  {after_path}")
    print(f"   Output dir:   {output_dir}")
    
    try:
        # Call your OpenCV pipeline
        result = verify_damage_with_json(before_path, after_path, outdir=output_dir)
        
        print(f"✅ Verification complete!")
        print(f"   Damage detected: {result['is_damaged']}")
        print(f"   Severity score:  {result['damage_severity']:.2f}")
        print(f"   Overlay saved:   {result['overlay_path']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error during verification: {str(e)}")
        return {
            "is_damaged": False,
            "damage_severity": 0.0,
            "overlay_path": None,
            "error": str(e)
        }

if __name__ == "__main__":
    # Run the damage verification without CrewAI
    result = run_damage_verification("before.jpg", "after.jpg", "outputs")
    print("\n📊 Final Result:")
    print(result)
