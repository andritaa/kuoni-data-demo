"""
DERTOUR Data Assistant — RAG + SQL + Multimodal
================================================
1. RAG: Searches vectorised knowledge base in Snowflake for context
2. SQL: Generates and runs queries against live Snowflake data
3. Multimodal: Accepts images (base64) for analysis via GPT-5.4 vision
4. Memory: Stores conversation history for context continuity
"""

import os, json, logging, uuid, base64
import requests
import snowflake.connector

logger = logging.getLogger(__name__)

OPENAI_KEY = os.environ.get('OPENAI_API_KEY', '')
MODEL = 'gpt-5.4-mini'
MODEL_VISION = 'gpt-5.4'

SCHEMA_CONTEXT = """
DATABASE: KUONI_DEMO (Snowflake)

GOLD LAYER (star schema):
- FCT_BOOKING (26,900 rows) — BOOKING_SK, BOOKING_DATE_SK, TRAVEL_DATE_SK, CUSTOMER_SK, PRODUCT_SK, DESTINATION_SK, AGENT_SK, CHANNEL_SK, BRAND_SK, BOOKING_REF, BOOKING_STATUS, TOTAL_VALUE_GBP, MARGIN_PCT, MARGIN_GBP, NUM_PASSENGERS, DURATION_DAYS
- DIM_BRAND (10) — BRAND_SK, BRAND_NAME (Kuoni/Apollo/DERTOUR/ITS/Prijsvrij Vakanties/Exim Tours/Fischer/Helvetic Tours/Meiers Weltreisen/D-reizen), REGION, MARKET, BRAND_TYPE
- DIM_CUSTOMER (2,000) — CUSTOMER_SK, FIRST_NAME, LAST_NAME, SEGMENT, LOYALTY_TIER, CITY, COUNTRY
- DIM_PRODUCT (200) — PRODUCT_SK, PRODUCT_NAME, PRODUCT_TYPE, BASE_PRICE_GBP, DURATION_DAYS, ACCOMMODATION_TIER
- DIM_DESTINATION (50) — DESTINATION_SK, DESTINATION_NAME, COUNTRY, REGION, CONTINENT, TIER
- DIM_DATE (4,018) — DATE_SK, FULL_DATE, YEAR, MONTH_NAME, QUARTER_NAME, IS_PEAK_SEASON
- DIM_AGENT (20), DIM_CHANNEL (4)

VIEWS: RPT_GROUP_KPI, RPT_BRAND_MONTHLY, RPT_BRAND_DESTINATIONS, RPT_OVERVIEW_KPI, RPT_MONTHLY_REVENUE, RPT_CUSTOMER_LTV, RPT_TOP_PRODUCTS

KNOWLEDGE_BASE.DOCUMENTS — vectorised knowledge about DERTOUR Group, architecture, meetings

=== ATLAS VOYAGES (demo brand) ===
ATLAS_VOYAGES_GOLD.FCT_BOOKINGS — 500 rows
  booking_id, customer_id, customer_name, destination, travel_date, return_date,
  duration_days, passengers, total_value_gbp, value_per_person, booking_status,
  channel (Website/Phone/Agency/App), brand, season (Peak Summer/Peak Winter/Shoulder),
  is_cancelled (boolean)

ATLAS_VOYAGES_GOLD.RPT_REVENUE_BY_DESTINATION — revenue by destination
ATLAS_VOYAGES_GOLD.RPT_CHANNEL_PERFORMANCE — bookings, revenue, cancel_rate by channel
ATLAS_VOYAGES_GOLD.RPT_MONTHLY_TREND — monthly bookings + revenue

ATLAS_VOYAGES_DATA_PRODUCTS.DP_REVENUE_SUMMARY — mesh product (no PII)
ATLAS_VOYAGES_DATA_PRODUCTS.DP_DESTINATION_DEMAND — mesh product
ATLAS_VOYAGES_DATA_PRODUCTS.DP_CHANNEL_MIX — mesh product

RULES: Use KUONI_DEMO.GOLD schema. Join on _SK keys. Values in GBP. Max 20 rows.
"""


def get_conn():
    return snowflake.connector.connect(
        account=os.environ.get('SNOWFLAKE_ACCOUNT', 'lqpklal-fl98075'),
        user=os.environ.get('SNOWFLAKE_USER', 'habaclaw'),
        password=os.environ.get('SNOWFLAKE_PASSWORD', ''),
        database='KUONI_DEMO',
        warehouse=os.environ.get('SNOWFLAKE_WAREHOUSE', 'COMPUTE_WH'),
    )


def search_knowledge(question: str, top_k: int = 3) -> list:
    """Vector similarity search against knowledge base."""
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("USE WAREHOUSE COMPUTE_WH")
        cur.execute("""
            SELECT TITLE, CONTENT, DOC_TYPE, SOURCE,
                   VECTOR_COSINE_SIMILARITY(EMBEDDING,
                       SNOWFLAKE.CORTEX.EMBED_TEXT_768('snowflake-arctic-embed-m', %s)
                   ) AS similarity
            FROM KUONI_DEMO.KNOWLEDGE_BASE.DOCUMENTS
            ORDER BY similarity DESC
            LIMIT %s
        """, (question, top_k))
        results = []
        for r in cur.fetchall():
            if r[4] > 0.3:  # similarity threshold
                results.append({'title': r[0], 'content': r[1], 'type': r[2], 'source': r[3], 'score': float(r[4])})
        conn.close()
        return results
    except Exception as e:
        logger.error(f"Knowledge search error: {e}")
        return []


def classify_intent(question: str) -> str:
    """Classify: 'sql' (needs data query), 'knowledge' (use RAG), 'both', or 'image'."""
    q = question.lower()
    sql_signals = ['revenue', 'booking', 'how many', 'total', 'average', 'count', 'top', 'compare', 'trend', 'monthly', 'quarterly', 'by brand', 'cancellation', 'customer', 'destination', 'margin', 'atlas', 'channel', 'cancel rate', 'value', 'passengers']
    knowledge_signals = ['what is dertour', 'who', 'structure', 'recommend', 'roadmap', 'meeting', 'architecture', 'explain', 'dorking', 'brand overview']
    
    has_sql = any(s in q for s in sql_signals)
    has_knowledge = any(s in q for s in knowledge_signals)
    
    if has_sql and has_knowledge:
        return 'both'
    elif has_sql:
        return 'sql'
    else:
        return 'knowledge'


def generate_sql(question: str, context: str = '') -> str:
    """Generate Snowflake SQL from natural language."""
    messages = [
        {'role': 'system', 'content': SCHEMA_CONTEXT + "\n\nGenerate a single Snowflake SQL query. Return ONLY the SQL."},
    ]
    if context:
        messages.append({'role': 'system', 'content': f"Additional context:\n{context}"})
    messages.append({'role': 'user', 'content': question})

    resp = requests.post('https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {OPENAI_KEY}'},
        json={'model': MODEL, 'messages': messages, 'temperature': 0.1, 'max_completion_tokens': 500},
        timeout=15)
    if resp.status_code != 200:
        return None
    sql = resp.json()['choices'][0]['message']['content'].strip()
    for prefix in ['```sql', '```']:
        if sql.startswith(prefix): sql = sql[len(prefix):]
    if sql.endswith('```'): sql = sql[:-3]
    return sql.strip()


def run_sql(sql: str) -> dict:
    """Execute SQL and return columns + rows."""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("USE WAREHOUSE COMPUTE_WH")
    cur.execute(sql)
    columns = [d[0] for d in cur.description]
    rows = cur.fetchall()
    conn.close()
    # JSON-safe
    clean = []
    for row in rows[:20]:
        clean.append([float(v) if hasattr(v, 'as_tuple') else str(v) if hasattr(v, 'isoformat') else v for v in row])
    return {'columns': columns, 'rows': clean, 'row_count': len(rows)}


def generate_answer(question: str, sql: str = None, data: dict = None, knowledge: list = None, image_desc: str = None) -> str:
    """Generate natural language answer combining all sources."""
    system = "You are Andrita, the DERTOUR Group AI data analyst. Give clear, specific answers with numbers. 2-4 sentences max. Be conversational but professional."
    
    context_parts = []
    if knowledge:
        context_parts.append("KNOWLEDGE BASE:\n" + "\n".join(f"- {k['title']}: {k['content'][:200]}" for k in knowledge))
    if sql and data:
        result_text = f"SQL: {sql}\nColumns: {', '.join(data['columns'])}\n"
        for row in data['rows'][:10]:
            result_text += f"{row}\n"
        context_parts.append(f"QUERY RESULTS:\n{result_text}")
    if image_desc:
        context_parts.append(f"IMAGE ANALYSIS:\n{image_desc}")

    messages = [
        {'role': 'system', 'content': system},
        {'role': 'user', 'content': f"Question: {question}\n\n{''.join(context_parts)}"}
    ]

    resp = requests.post('https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {OPENAI_KEY}'},
        json={'model': MODEL, 'messages': messages, 'temperature': 0.3, 'max_completion_tokens': 400},
        timeout=15)
    if resp.status_code == 200:
        return resp.json()['choices'][0]['message']['content'].strip()
    return "I couldn't generate an answer. Please try rephrasing."


def analyse_image(image_b64: str, question: str) -> str:
    """Analyse an image using GPT-5.4 vision."""
    resp = requests.post('https://api.openai.com/v1/chat/completions',
        headers={'Authorization': f'Bearer {OPENAI_KEY}'},
        json={
            'model': MODEL_VISION,
            'messages': [{
                'role': 'user',
                'content': [
                    {'type': 'text', 'text': f"You are a DERTOUR Group data analyst. {question}"},
                    {'type': 'image_url', 'image_url': {'url': f"data:image/jpeg;base64,{image_b64}"}}
                ]
            }],
            'max_completion_tokens': 500
        }, timeout=30)
    if resp.status_code == 200:
        return resp.json()['choices'][0]['message']['content'].strip()
    return None


def save_chat(session_id: str, role: str, message: str, sql: str = None, sources: list = None):
    """Save to conversation history."""
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("USE WAREHOUSE COMPUTE_WH")
        cur.execute("""
            INSERT INTO KUONI_DEMO.KNOWLEDGE_BASE.CHAT_HISTORY 
            (SESSION_ID, ROLE, MESSAGE, SQL_GENERATED, SOURCES_USED)
            VALUES (%s, %s, %s, %s, PARSE_JSON(%s))
        """, (session_id, role, message, sql, json.dumps(sources or [])))
        conn.close()
    except Exception as e:
        logger.error(f"Save chat error: {e}")


def ask(question: str, session_id: str = None, image: str = None) -> dict:
    """Main entry: question (+ optional image) → intelligent answer."""
    if not session_id:
        session_id = str(uuid.uuid4())[:8]

    try:
        result = {'question': question, 'session_id': session_id, 'sources': []}

        # Image analysis
        image_desc = None
        if image:
            image_desc = analyse_image(image, question)
            result['image_analysis'] = image_desc
            result['sources'].append('vision')

        # RAG search
        knowledge = search_knowledge(question)
        if knowledge:
            result['knowledge'] = [{'title': k['title'], 'score': round(k['score'], 3)} for k in knowledge]
            result['sources'].append('knowledge_base')

        # SQL generation + execution
        intent = classify_intent(question)
        sql = None
        data = None
        
        if intent in ('sql', 'both'):
            kb_context = "\n".join(k['content'][:150] for k in knowledge) if knowledge else ''
            sql = generate_sql(question, kb_context)
            if sql:
                try:
                    data = run_sql(sql)
                    result['sql'] = sql
                    result['columns'] = data['columns']
                    result['rows'] = data['rows']
                    result['row_count'] = data['row_count']
                    result['sources'].append('snowflake')
                except Exception as e:
                    result['sql_error'] = str(e)
                    logger.error(f"SQL execution error: {e}")

        # Generate answer
        answer = generate_answer(question, sql, data, knowledge, image_desc)
        result['answer'] = answer

        # Save to history
        save_chat(session_id, 'user', question)
        save_chat(session_id, 'assistant', answer, sql, result['sources'])

        return result

    except Exception as e:
        logger.error(f"Ask error: {e}")
        return {'error': str(e), 'question': question}


def add_document(title: str, content: str, doc_type: str = 'text', source: str = '', tags: list = None) -> bool:
    """Add a document to the knowledge base."""
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("USE WAREHOUSE COMPUTE_WH")
        cur.execute("""
            INSERT INTO KUONI_DEMO.KNOWLEDGE_BASE.DOCUMENTS (TITLE, CONTENT, DOC_TYPE, SOURCE, TAGS, EMBEDDING)
            SELECT %s, %s, %s, %s, PARSE_JSON(%s),
                   SNOWFLAKE.CORTEX.EMBED_TEXT_768('snowflake-arctic-embed-m', %s)
        """, (title, content, doc_type, source, json.dumps(tags or []), content))
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Add doc error: {e}")
        return False
