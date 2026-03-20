"""
DERTOUR Data Chatbot — Natural language → SQL → Answer
Uses OpenAI to generate Snowflake SQL from plain English questions.
"""

import os
import json
import logging
import requests
import snowflake.connector

logger = logging.getLogger(__name__)

SCHEMA_CONTEXT = """
You are a data analyst for DERTOUR Group, an international travel company.
You have access to a Snowflake data warehouse with the following schema:

DATABASE: KUONI_DEMO

=== GOLD LAYER (star schema) ===

FCT_BOOKING — 26,900 rows
  BOOKING_SK, BOOKING_DATE_SK, TRAVEL_DATE_SK, CUSTOMER_SK, PRODUCT_SK,
  DESTINATION_SK, AGENT_SK, CHANNEL_SK, BRAND_SK,
  BOOKING_REF, BOOKING_STATUS (Confirmed/Completed/Cancelled/Pending),
  CANCELLATION_REASON, INSURANCE_INCLUDED, CURRENCY,
  TOTAL_VALUE_GBP, DEPOSIT_AMOUNT_GBP, MARGIN_PCT, MARGIN_GBP,
  NUM_PASSENGERS, DURATION_DAYS, EXCHANGE_RATE

DIM_BRAND — 10 rows
  BRAND_SK, BRAND_CODE, BRAND_NAME (Kuoni/Apollo/DERTOUR/ITS/Prijsvrij Vakanties/Exim Tours/Fischer/Helvetic Tours/Meiers Weltreisen/D-reizen),
  REGION, MARKET, BRAND_TYPE, HQ_COUNTRY, IS_ACTIVE

DIM_CUSTOMER — 2,000 rows
  CUSTOMER_SK, CUSTOMER_BK, FIRST_NAME, LAST_NAME, EMAIL, PHONE,
  DATE_OF_BIRTH, CITY, POSTCODE, COUNTRY, JOIN_DATE,
  SEGMENT (Explorer/Premium/Budget/Family/Adventure), LOYALTY_TIER (Bronze/Silver/Gold/Platinum),
  TRAVEL_HISTORY_CNT, GDPR_CONSENT

DIM_PRODUCT — 200 rows
  PRODUCT_SK, PRODUCT_BK, PRODUCT_NAME, PRODUCT_TYPE (Beach/Adventure/Cultural/Cruise/Safari/Ski/City Break),
  DURATION_DAYS, BASE_PRICE_GBP, PRICE_BAND, ACCOMMODATION_TIER, ALL_INCLUSIVE, INCLUDED_FLIGHTS

DIM_DESTINATION — 50 rows
  DESTINATION_SK, DESTINATION_BK, DESTINATION_NAME, COUNTRY, REGION, CONTINENT,
  TIER (Budget/Standard/Premium/Luxury), AVG_DURATION_DAYS, FLIGHT_HRS_FROM_LHR, VISA_REQUIRED

DIM_AGENT — 20 rows
  AGENT_SK, AGENT_BK, AGENT_NAME, EMAIL, BRANCH_CODE, BRANCH_NAME, REGION, SPECIALISATION

DIM_CHANNEL — 4 rows
  CHANNEL_SK, CHANNEL_NAME, CHANNEL_TYPE, IS_DIGITAL

DIM_DATE — 4,018 rows
  DATE_SK, FULL_DATE, YEAR, QUARTER, QUARTER_NAME, MONTH_NUM, MONTH_NAME, WEEK_NUM,
  DAY_OF_WEEK, DAY_NAME, IS_WEEKEND, IS_PEAK_SEASON

=== PRE-BUILT VIEWS ===
GOLD.RPT_GROUP_KPI — Brand-level KPIs (revenue, bookings, margins, cancel rate)
GOLD.RPT_BRAND_MONTHLY — Monthly revenue by brand
GOLD.RPT_BRAND_DESTINATIONS — Top destinations by brand
GOLD.RPT_OVERVIEW_KPI — Overall KPIs
GOLD.RPT_MONTHLY_REVENUE — Monthly revenue trend
GOLD.RPT_CUSTOMER_LTV — Customer lifetime value
GOLD.RPT_TOP_PRODUCTS — Best selling products

RULES:
- Always use KUONI_DEMO.GOLD schema for queries
- Join FCT_BOOKING to dimension tables using _SK keys
- Currency values are in GBP
- Return at most 20 rows
- Format large numbers nicely
- If unsure, use the pre-built RPT_ views
"""


def get_snowflake_conn():
    return snowflake.connector.connect(
        account=os.environ.get('SNOWFLAKE_ACCOUNT', 'lqpklal-fl98075'),
        user=os.environ.get('SNOWFLAKE_USER', 'habaclaw'),
        password=os.environ.get('SNOWFLAKE_PASSWORD', ''),
        database='KUONI_DEMO',
        warehouse=os.environ.get('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH'),
    )


def generate_sql(question: str) -> str:
    """Use OpenAI to generate SQL from natural language."""
    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return None

    resp = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {api_key}'},
        json={
            'model': 'gpt-4o-mini',
            'messages': [
                {'role': 'system', 'content': SCHEMA_CONTEXT + "\n\nGenerate a single Snowflake SQL query to answer the user's question. Return ONLY the SQL, no explanation."},
                {'role': 'user', 'content': question}
            ],
            'temperature': 0.1,
            'max_tokens': 500,
        },
        timeout=15,
    )
    if resp.status_code != 200:
        logger.error(f"OpenAI error: {resp.status_code} {resp.text[:200]}")
        return None

    sql = resp.json()['choices'][0]['message']['content'].strip()
    # Clean markdown code blocks
    if sql.startswith('```'):
        sql = sql.split('\n', 1)[1] if '\n' in sql else sql[3:]
    if sql.endswith('```'):
        sql = sql[:-3]
    sql = sql.strip()
    return sql


def generate_answer(question: str, sql: str, columns: list, rows: list) -> str:
    """Use OpenAI to generate a natural language answer from query results."""
    api_key = os.environ.get('OPENAI_API_KEY', '')
    if not api_key:
        return format_basic_answer(columns, rows)

    # Format results as table
    result_text = f"Columns: {', '.join(columns)}\n"
    for row in rows[:20]:
        result_text += f"{row}\n"

    resp = requests.post(
        'https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {api_key}'},
        json={
            'model': 'gpt-4o-mini',
            'messages': [
                {'role': 'system', 'content': "You are a data analyst for DERTOUR Group. Give a clear, concise answer based on the query results. Use numbers, percentages, and comparisons. Be specific. 2-4 sentences max."},
                {'role': 'user', 'content': f"Question: {question}\n\nSQL: {sql}\n\nResults:\n{result_text}"}
            ],
            'temperature': 0.3,
            'max_tokens': 300,
        },
        timeout=15,
    )
    if resp.status_code == 200:
        return resp.json()['choices'][0]['message']['content'].strip()
    return format_basic_answer(columns, rows)


def format_basic_answer(columns, rows):
    if not rows:
        return "No results found."
    if len(rows) == 1 and len(columns) == 1:
        return str(rows[0][0])
    lines = [', '.join(str(v) for v in row) for row in rows[:10]]
    return '\n'.join(lines)


def ask(question: str) -> dict:
    """Main entry: question → SQL → execute → answer."""
    try:
        sql = generate_sql(question)
        if not sql:
            return {'error': 'Could not generate SQL', 'sql': None, 'answer': None}

        conn = get_snowflake_conn()
        cur = conn.cursor()
        cur.execute("USE WAREHOUSE COMPUTE_WH")
        cur.execute(sql)
        columns = [d[0] for d in cur.description]
        rows = cur.fetchall()
        conn.close()

        # Convert Decimal/date to JSON-serializable
        clean_rows = []
        for row in rows:
            clean_rows.append([float(v) if hasattr(v, 'as_tuple') else str(v) if hasattr(v, 'isoformat') else v for v in row])

        answer = generate_answer(question, sql, columns, clean_rows)

        return {
            'question': question,
            'sql': sql,
            'columns': columns,
            'rows': clean_rows[:20],
            'row_count': len(rows),
            'answer': answer,
        }
    except Exception as e:
        logger.error(f"Chatbot error: {e}")
        return {'error': str(e), 'sql': sql if 'sql' in dir() else None, 'answer': None}
