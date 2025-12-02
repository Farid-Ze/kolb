import sqlite3
from app.core.config import settings

def check_schema():
    db_path = "sql_app.db"
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    print("--- Alembic Version ---")
    try:
        cursor.execute("SELECT * FROM alembic_version")
        print(cursor.fetchall())
    except Exception as e:
        print(f"Error reading alembic_version: {e}")

    print("\n--- Columns in assessment_sessions ---")
    try:
        cursor.execute("PRAGMA table_info(assessment_sessions)")
        columns = cursor.fetchall()
        for col in columns:
            print(col)
            
        col_names = [c[1] for c in columns]
        if "is_finalized" in col_names:
            print("\nSUCCESS: is_finalized column exists.")
        else:
            print("\nFAILURE: is_finalized column is MISSING.")
            
    except Exception as e:
        print(f"Error inspecting table: {e}")
        
    conn.close()

if __name__ == "__main__":
    check_schema()
