import sqlite3
conn = sqlite3.connect('klsi.db')
cursor = conn.cursor()
cursor.execute("SELECT * FROM alembic_version")
print(cursor.fetchall())
conn.close()
