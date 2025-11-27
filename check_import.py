import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

try:
    from app.routers import telemetry
    print("Import successful")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
