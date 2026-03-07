#!/usr/bin/env python3
"""
Kuoni Data Platform — Snowflake Data Loader
Loads generated CSV files into Snowflake BRONZE layer

Usage:
    python load_data.py [--table TABLE] [--all]

Requires:
    pip install snowflake-connector-python pandas
    
Environment variables:
    SNOWFLAKE_ACCOUNT, SNOWFLAKE_USER, SNOWFLAKE_PASSWORD
    SNOWFLAKE_DATABASE (default: KUONI_DW)
    SNOWFLAKE_WAREHOUSE (default: KUONI_WH_ETL)
"""

import os
import sys
import csv
import uuid
import logging
from pathlib import Path
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

try:
    import snowflake.connector
    from snowflake.connector.pandas_tools import write_pandas
    import pandas as pd
    SNOWFLAKE_AVAILABLE = True
except ImportError:
    SNOWFLAKE_AVAILABLE = False
    logger.warning("snowflake-connector-python not installed. Run: pip install snowflake-connector-python pandas")

DATA_DIR = Path(__file__).parent / "output"

TABLE_MAP = {
    "destinations":  "BRONZE.RAW_DESTINATIONS",
    "products":      "BRONZE.RAW_PRODUCTS",
    "agents":        "BRONZE.RAW_AGENTS",
    "customers":     "BRONZE.RAW_CUSTOMERS",
    "bookings":      "BRONZE.RAW_BOOKINGS",
    "interactions":  "BRONZE.RAW_INTERACTIONS",
}

LOAD_ORDER = ["destinations", "products", "agents", "customers", "bookings", "interactions"]


def get_connection():
    """Create Snowflake connection from environment variables"""
    required = ["SNOWFLAKE_ACCOUNT", "SNOWFLAKE_USER", "SNOWFLAKE_PASSWORD"]
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        raise ValueError(f"Missing environment variables: {', '.join(missing)}")
    
    conn = snowflake.connector.connect(
        account=os.environ["SNOWFLAKE_ACCOUNT"],
        user=os.environ["SNOWFLAKE_USER"],
        password=os.environ["SNOWFLAKE_PASSWORD"],
        database=os.environ.get("SNOWFLAKE_DATABASE", "KUONI_DW"),
        warehouse=os.environ.get("SNOWFLAKE_WAREHOUSE", "KUONI_WH_ETL"),
        schema="BRONZE",
    )
    logger.info(f"Connected to Snowflake: {os.environ['SNOWFLAKE_ACCOUNT']}")
    return conn


def load_csv_to_snowflake(conn, csv_file: Path, table: str, batch_id: str) -> dict:
    """Load a single CSV file into a Snowflake table"""
    logger.info(f"Loading {csv_file.name} → {table}")
    
    if not csv_file.exists():
        logger.error(f"File not found: {csv_file}")
        return {"status": "FAILED", "error": "File not found", "rows_loaded": 0}
    
    df = pd.read_csv(csv_file, dtype=str).fillna("")
    
    # Add metadata columns
    df["_LOAD_TIMESTAMP"] = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    df["_SOURCE_FILE"] = str(csv_file.name)
    df["_BATCH_ID"] = batch_id
    
    # Uppercase column names for Snowflake
    df.columns = [c.upper() for c in df.columns]
    
    try:
        rows_before = df.shape[0]
        success, nchunks, nrows, output = write_pandas(
            conn,
            df,
            table.split(".")[-1],
            schema="BRONZE",
            auto_create_table=False,
            overwrite=False,
        )
        logger.info(f"  Loaded {nrows:,} rows in {nchunks} chunk(s)")
        return {"status": "SUCCESS", "rows_loaded": nrows, "error": None}
    except Exception as e:
        logger.error(f"  Failed: {e}")
        return {"status": "FAILED", "rows_loaded": 0, "error": str(e)}


def log_batch(conn, batch_id: str, source: str, target: str, result: dict):
    """Write batch result to ETL log table"""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO BRONZE._ETL_BATCH_LOG 
                (BATCH_ID, SOURCE_TABLE, TARGET_TABLE, BATCH_START, BATCH_END, 
                 ROWS_LOADED, ROWS_REJECTED, STATUS, ERROR_MESSAGE, TRIGGERED_BY)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            batch_id, source, target,
            datetime.utcnow(), datetime.utcnow(),
            result.get("rows_loaded", 0),
            result.get("rows_rejected", 0),
            result["status"],
            result.get("error", ""),
            "load_data.py"
        ))
        cursor.close()
    except Exception as e:
        logger.warning(f"Could not write batch log: {e}")


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", choices=list(TABLE_MAP.keys()), help="Load specific table")
    parser.add_argument("--all", action="store_true", help="Load all tables")
    args = parser.parse_args()
    
    if not args.table and not args.all:
        parser.print_help()
        print("\nExample: python load_data.py --all")
        sys.exit(1)
    
    if not SNOWFLAKE_AVAILABLE:
        logger.error("Install dependencies: pip install snowflake-connector-python pandas")
        sys.exit(1)
    
    tables_to_load = LOAD_ORDER if args.all else [args.table]
    batch_id = str(uuid.uuid4())
    
    print(f"\n🏔️  Kuoni Data Loader — Batch {batch_id[:8]}\n")
    
    conn = get_connection()
    
    results = {}
    for table_key in tables_to_load:
        csv_file = DATA_DIR / f"{table_key}.csv"
        target = TABLE_MAP[table_key]
        result = load_csv_to_snowflake(conn, csv_file, target, batch_id)
        log_batch(conn, batch_id, table_key, target, result)
        results[table_key] = result
    
    conn.close()
    
    print("\n── Summary ──────────────────────────────")
    total_rows = 0
    for table, res in results.items():
        status = "✅" if res["status"] == "SUCCESS" else "❌"
        print(f"  {status} {table:15s}: {res['rows_loaded']:>8,} rows  {res.get('error','')}")
        total_rows += res["rows_loaded"]
    print(f"{'─'*42}")
    print(f"  Total rows loaded: {total_rows:,}")
    print(f"\n✨ Batch {batch_id[:8]} complete\n")
    print("Next: run dbt to transform Bronze → Silver → Gold")
    print("  cd ../dbt && dbt run")


if __name__ == "__main__":
    main()
