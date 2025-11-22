from app.db.database import engine
from sqlalchemy import text

def drop_tables():
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS gamification_badges"))
        conn.execute(text("DROP TABLE IF EXISTS growth_challenges"))
        conn.execute(text("DROP TABLE IF EXISTS sphere_nodes"))
        conn.execute(text("DROP TABLE IF EXISTS store_products"))
        conn.execute(text("DROP TABLE IF EXISTS user_achievements"))
        conn.execute(text("DROP TABLE IF EXISTS user_challenges"))
        conn.execute(text("DROP TABLE IF EXISTS assessment_item_responses"))
        conn.execute(text("DROP TABLE IF EXISTS memory_reflections"))
        conn.commit()
        print("Dropped orphaned tables.")

if __name__ == "__main__":
    drop_tables()
