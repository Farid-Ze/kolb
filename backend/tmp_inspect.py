import sqlite3
conn = sqlite3.connect('klsi.db')
print(conn.execute("select name from sqlite_master where type='table'").fetchall())
