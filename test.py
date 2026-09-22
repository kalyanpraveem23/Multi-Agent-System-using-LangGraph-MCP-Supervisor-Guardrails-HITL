import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    conn = psycopg.connect(
        DATABASE_URL,
        connect_timeout=10,
        sslmode="disable"
    )

    print("PostgreSQL connection successful WITHOUT SSL!")

    conn.close()

except Exception as e:
    print("PostgreSQL connection failed WITHOUT SSL:")
    print(type(e).__name__)
    print(e)