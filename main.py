"""
HealthGuard Root Main Entrypoint
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
from backend.main import supabase, app

# Execute test query on actual 'patients' table in Supabase
try:
    response = supabase.table("patients").select("*").limit(1).execute()
    print("Connected! Data:", response.data)
except Exception as e:
    print("Supabase connection check:", e)

if __name__ == "__main__":
    import uvicorn
    print("Starting HealthGuard FastAPI Backend on http://127.0.0.1:8000 ...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8000, reload=True)
