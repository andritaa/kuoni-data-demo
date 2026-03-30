"""
Brand Onboarding — Real AWS + Snowflake provisioning
=====================================================
Creates actual resources when called from the portal.
"""

import os
import logging
import json
import time
import boto3
import snowflake.connector

logger = logging.getLogger(__name__)

def get_aws_client(service, region='eu-west-2'):
    return boto3.client(service,
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
        region_name=region)

def get_snowflake():
    return snowflake.connector.connect(
        account=os.environ.get('SNOWFLAKE_ACCOUNT', 'lqpklal-fl98075'),
        user=os.environ.get('SNOWFLAKE_USER', 'habaclaw'),
        password=os.environ.get('SNOWFLAKE_PASSWORD', ''),
        database='KUONI_DEMO')

def onboard_brand(brand: str, callback=None):
    """
    Onboard a DERTOUR brand — creates real AWS + Snowflake resources.
    Returns a list of steps with status.
    callback(step_num, step_name, status, detail) called after each step.
    """
    brand_lower = brand.lower().replace(' ', '-').replace("'", '')
    brand_upper = brand_lower.upper().replace('-', '_')
    steps = []

    def step(name, fn):
        step_num = len(steps) + 1
        try:
            detail = fn()
            steps.append({'step': step_num, 'name': name, 'status': 'success', 'detail': detail})
            if callback:
                callback(step_num, name, 'success', detail)
            logger.info(f"[onboard:{brand}] Step {step_num} {name}: {detail}")
        except Exception as e:
            detail = str(e)[:200]
            steps.append({'step': step_num, 'name': name, 'status': 'error', 'detail': detail})
            if callback:
                callback(step_num, name, 'error', detail)
            logger.error(f"[onboard:{brand}] Step {step_num} {name} FAILED: {detail}")

    # ─── Step 1: Create S3 bucket ─────────────────────────
    def create_s3():
        s3 = get_aws_client('s3')
        bucket = f"dertour-{brand_lower}-data-prod"
        try:
            s3.create_bucket(
                Bucket=bucket,
                CreateBucketConfiguration={'LocationConstraint': 'eu-west-2'})
        except s3.exceptions.BucketAlreadyOwnedByYou:
            return f"s3://{bucket} (already exists)"
        except Exception as e:
            if 'BucketAlreadyOwnedByYou' in str(e):
                return f"s3://{bucket} (already exists)"
            raise
        # Create folders
        for prefix in ['raw/bookings/', 'raw/customers/', 'raw/products/', 'processed/', 'archive/']:
            s3.put_object(Bucket=bucket, Key=prefix, Body=b'')
        return f"s3://{bucket} with 5 folders"

    step('Create S3 Bucket', create_s3)

    # ─── Step 2: Create SQS Queue ─────────────────────────
    def create_sqs():
        sqs = get_aws_client('sqs')
        queue_name = f"dertour-{brand_lower}-snowpipe-prod"
        try:
            resp = sqs.create_queue(QueueName=queue_name,
                Attributes={'MessageRetentionPeriod': '86400', 'VisibilityTimeout': '300'})
            return f"{queue_name} → {resp['QueueUrl']}"
        except Exception as e:
            if 'QueueAlreadyExists' in str(e):
                return f"{queue_name} (already exists)"
            raise

    step('Create SQS Queue', create_sqs)

    # ─── Step 3: Snowflake Schemas ─────────────────────────
    def create_schemas():
        conn = get_snowflake()
        cur = conn.cursor()
        cur.execute("USE WAREHOUSE COMPUTE_WH")
        created = []
        for schema in [f'{brand_upper}_BRONZE', f'{brand_upper}_SILVER', f'{brand_upper}_GOLD']:
            cur.execute(f"CREATE SCHEMA IF NOT EXISTS KUONI_DEMO.{schema}")
            created.append(schema)
        conn.close()
        return ', '.join(created)

    step('Create Snowflake Schemas', create_schemas)

    # ─── Step 4: Snowflake Warehouse ───────────────────────
    def create_warehouse():
        conn = get_snowflake()
        cur = conn.cursor()
        wh = f"{brand_upper}_WH"
        cur.execute(f"""
            CREATE WAREHOUSE IF NOT EXISTS {wh}
            WITH WAREHOUSE_SIZE = 'XSMALL'
            AUTO_SUSPEND = 120 AUTO_RESUME = TRUE
            INITIALLY_SUSPENDED = TRUE
            COMMENT = '{brand} brand compute'
        """)
        conn.close()
        return f"{wh} (X-Small, auto-suspend 120s)"

    step('Create Snowflake Warehouse', create_warehouse)

    # ─── Step 5: Snowflake Roles ───────────────────────────
    def create_roles():
        conn = get_snowflake()
        cur = conn.cursor()
        roles = []
        for suffix, desc in [('READER', 'read Gold'), ('WRITER', 'read/write all')]:
            role = f"{brand_upper}_{suffix}"
            cur.execute(f"CREATE ROLE IF NOT EXISTS {role} COMMENT = '{brand} {desc}'")
            roles.append(role)
        # Grant reader access to Gold
        try:
            cur.execute(f"GRANT USAGE ON SCHEMA KUONI_DEMO.{brand_upper}_GOLD TO ROLE {brand_upper}_READER")
            cur.execute(f"GRANT SELECT ON ALL TABLES IN SCHEMA KUONI_DEMO.{brand_upper}_GOLD TO ROLE {brand_upper}_READER")
            cur.execute(f"GRANT SELECT ON FUTURE TABLES IN SCHEMA KUONI_DEMO.{brand_upper}_GOLD TO ROLE {brand_upper}_READER")
        except Exception:
            pass
        # Grant writer access to all schemas
        for schema in [f'{brand_upper}_BRONZE', f'{brand_upper}_SILVER', f'{brand_upper}_GOLD']:
            try:
                cur.execute(f"GRANT ALL ON SCHEMA KUONI_DEMO.{schema} TO ROLE {brand_upper}_WRITER")
            except Exception:
                pass
        conn.close()
        return ', '.join(roles)

    step('Create Snowflake Roles', create_roles)

    # ─── Step 6: Create sample tables in Bronze ────────────
    def create_tables():
        conn = get_snowflake()
        cur = conn.cursor()
        cur.execute("USE WAREHOUSE COMPUTE_WH")
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS KUONI_DEMO.{brand_upper}_BRONZE.RAW_BOOKINGS (
                BOOKING_ID VARCHAR(20), CUSTOMER_ID VARCHAR(20), PRODUCT_ID VARCHAR(20),
                BOOKING_DATE DATE, TRAVEL_DATE DATE, RETURN_DATE DATE,
                NUM_PASSENGERS INT, TOTAL_VALUE_GBP DECIMAL(12,2),
                STATUS VARCHAR(20), CHANNEL VARCHAR(20), BRAND VARCHAR(30) DEFAULT '{brand}',
                _LOAD_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
            )
        """)
        cur.execute(f"""
            CREATE TABLE IF NOT EXISTS KUONI_DEMO.{brand_upper}_BRONZE.RAW_CUSTOMERS (
                CUSTOMER_ID VARCHAR(20), FIRST_NAME VARCHAR(100), LAST_NAME VARCHAR(100),
                EMAIL VARCHAR(200), SEGMENT VARCHAR(30), LOYALTY_TIER VARCHAR(20),
                BRAND VARCHAR(30) DEFAULT '{brand}',
                _LOAD_TIMESTAMP TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP()
            )
        """)
        conn.close()
        return f"{brand_upper}_BRONZE.RAW_BOOKINGS + RAW_CUSTOMERS"

    step('Create Bronze Tables', create_tables)

    # ─── Step 7: Upload Airflow DAG ────────────────────────
    def upload_dag():
        s3 = get_aws_client('s3')
        dag_content = f'''
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator

BRAND = "{brand_lower}"

default_args = {{"owner": "stephen.adebola", "retries": 1, "retry_delay": timedelta(minutes=5)}}

def check_data(**ctx):
    import snowflake.connector, os
    conn = snowflake.connector.connect(account=os.environ.get("SNOWFLAKE_ACCOUNT","lqpklal-fl98075"),
        user=os.environ.get("SNOWFLAKE_USER","habaclaw"), password=os.environ.get("SNOWFLAKE_PASSWORD",""),
        database="KUONI_DEMO")
    cur = conn.cursor()
    cur.execute("USE WAREHOUSE COMPUTE_WH")
    cur.execute(f"SELECT COUNT(*) FROM {BRAND.upper().replace('-','_')}_BRONZE.RAW_BOOKINGS")
    print(f"[{{BRAND}}] Bookings: {{cur.fetchone()[0]}}")
    conn.close()

with DAG(f"dertour_{{BRAND}}_pipeline", default_args=default_args,
    schedule_interval="0 6 * * *", start_date=datetime(2026,3,31),
    catchup=False, tags=["dertour", BRAND]) as dag:
    PythonOperator(task_id="check_data", python_callable=check_data)
'''
        s3.put_object(
            Bucket='dertour-airflow-dags-804516735527',
            Key=f'dags/brand_{brand_lower.replace("-","_")}.py',
            Body=dag_content.encode())
        return f"dags/brand_{brand_lower.replace('-','_')}.py → S3"

    step('Deploy Airflow DAG', upload_dag)

    return {
        'brand': brand,
        'brand_code': brand_lower,
        'steps': steps,
        'success': all(s['status'] == 'success' for s in steps),
        'resources': {
            's3_bucket': f"dertour-{brand_lower}-data-prod",
            'sqs_queue': f"dertour-{brand_lower}-snowpipe-prod",
            'snowflake_schemas': [f'{brand_upper}_BRONZE', f'{brand_upper}_SILVER', f'{brand_upper}_GOLD'],
            'snowflake_warehouse': f'{brand_upper}_WH',
            'snowflake_roles': [f'{brand_upper}_READER', f'{brand_upper}_WRITER'],
            'airflow_dag': f'dertour_{brand_lower.replace("-","_")}_pipeline',
        }
    }
