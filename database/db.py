"""
Neon Serverless PostgreSQL Database Connection & Query Helper.
Engineered using pure-Python pg8000 with mandatory SSL encryption for Neon.
"""

import os
import ssl
import sys
from urllib.parse import urlparse
from typing import Any, List, Optional
import pg8000.native
from dotenv import load_dotenv

# Ensure UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Load environment variables from .env
load_dotenv()


def get_db_connection() -> pg8000.native.Connection:
    """Establish an SSL connection to the Neon PostgreSQL database."""
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise ValueError("DATABASE_URL environment variable is missing from .env")

    parsed = urlparse(database_url)

    # Neon requires SSL
    ssl_context = ssl.create_default_context()

    conn = pg8000.native.Connection(
        user=parsed.username,
        password=parsed.password,
        host=parsed.hostname,
        port=parsed.port or 5432,
        database=parsed.path.lstrip("/"),
        ssl_context=ssl_context
    )
    return conn


def execute_sql_file(filepath: str) -> None:
    """Execute all SQL commands from a schema file."""
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"SQL file not found at {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        sql = f.read()

    conn = get_db_connection()
    try:
        conn.run(sql)
        print(f"Successfully executed SQL script: {filepath}")
    finally:
        conn.close()
