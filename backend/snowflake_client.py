"""
Snowflake client for Kuoni Analytics API
Falls back to mock data if Snowflake credentials not configured
"""

import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_conn = None


def get_connection():
    """Get or create Snowflake connection (lazy singleton)"""
    global _conn
    
    required = ["SNOWFLAKE_ACCOUNT", "SNOWFLAKE_USER", "SNOWFLAKE_PASSWORD"]
    if not all(os.environ.get(k) for k in required):
        return None
    
    if _conn is None or _conn.is_closed():
        try:
            import snowflake.connector
            _conn = snowflake.connector.connect(
                account=os.environ["SNOWFLAKE_ACCOUNT"],
                user=os.environ["SNOWFLAKE_USER"],
                password=os.environ["SNOWFLAKE_PASSWORD"],
                database=os.environ.get("SNOWFLAKE_DATABASE", "KUONI_DW"),
                warehouse=os.environ.get("SNOWFLAKE_WAREHOUSE", "KUONI_WH_API"),
                schema="GOLD",
                login_timeout=10,
            )
            logger.info("Snowflake connection established")
        except Exception as e:
            logger.warning(f"Snowflake connection failed: {e}. Using mock data.")
            _conn = None
    
    return _conn


def query(sql: str, params: tuple = ()) -> list[dict]:
    """Execute a query and return list of dicts. Falls back to [] on error."""
    conn = get_connection()
    if conn is None:
        return []
    
    try:
        cursor = conn.cursor()
        cursor.execute(sql, params)
        columns = [col[0].lower() for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]
        cursor.close()
        return rows
    except Exception as e:
        logger.error(f"Query failed: {e}\nSQL: {sql[:200]}")
        return []


def is_connected() -> bool:
    """Check if Snowflake is available"""
    conn = get_connection()
    if conn is None:
        return False
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.close()
        return True
    except Exception:
        return False
