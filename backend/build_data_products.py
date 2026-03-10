"""
Build Kuoni Data Mesh — Data Products in Snowflake
Creates:
  - DATA_PRODUCTS schema
  - Object Tags (DOMAIN, DATA_STEWARD, SLA_TIER, REFRESH_CADENCE)
  - 5 governed secure views (data products)
  - Comments on each for Snowsight Data Explorer discoverability
"""
import os
os.environ.setdefault('SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_ACCOUNT_ENV')
os.environ.setdefault('SNOWFLAKE_USER', 'SNOWFLAKE_USER_ENV')
os.environ.setdefault('SNOWFLAKE_PASSWORD', 'REDACTED_ROTATE_NOW')
os.environ.setdefault('SNOWFLAKE_DATABASE', 'KUONI_DEMO')
os.environ.setdefault('SNOWFLAKE_WAREHOUSE', 'KUONI_WH')

import snowflake_client as sf
conn = sf.get_connection()
cur  = conn.cursor()

def run(sql, msg=''):
    if msg: print(f'  → {msg}')
    cur.execute(sql)

print('\n=== Kuoni Data Mesh — Building Data Products ===\n')

# ── Schema ────────────────────────────────────────────────────────────────────
print('1. Creating DATA_PRODUCTS schema')
run("CREATE SCHEMA IF NOT EXISTS KUONI_DEMO.DATA_PRODUCTS COMMENT = 'Kuoni Data Mesh — governed, domain-owned data products discoverable via Snowsight'", 'schema')

# ── Object Tags ───────────────────────────────────────────────────────────────
print('\n2. Creating governance tags')
for tag, desc in [
    ('DOMAIN',          'Business domain that owns this data product'),
    ('DATA_STEWARD',    'Accountable team or person'),
    ('SLA_TIER',        'Availability and freshness SLA tier: PLATINUM, GOLD, SILVER'),
    ('REFRESH_CADENCE', 'How often the product is refreshed'),
    ('DATA_PRODUCT',    'Marks this object as a published data product'),
]:
    run(f"CREATE TAG IF NOT EXISTS KUONI_DEMO.DATA_PRODUCTS.{tag} COMMENT = '{desc}'", tag)

# ── Helper: apply tags ────────────────────────────────────────────────────────
def tag_view(view, domain, steward, sla, cadence):
    base = f'KUONI_DEMO.DATA_PRODUCTS.{view}'
    for tag, val in [
        ('DOMAIN', domain), ('DATA_STEWARD', steward),
        ('SLA_TIER', sla), ('REFRESH_CADENCE', cadence), ('DATA_PRODUCT', 'TRUE'),
    ]:
        run(f"ALTER VIEW {base} SET TAG KUONI_DEMO.DATA_PRODUCTS.{tag} = '{val}'")

# ── DP 1 — Customer 360 ───────────────────────────────────────────────────────
print('\n3. DP_CUSTOMER_360  (Customer domain)')
run("""
CREATE OR REPLACE SECURE VIEW KUONI_DEMO.DATA_PRODUCTS.DP_CUSTOMER_360
COMMENT = 'Unified customer profile — single source of truth for every Kuoni customer. Combines CRM data, booking history, lifetime value, and segment classification. PII masked for non-privileged roles. Owned by CRM Team.'
AS
SELECT
    c.CUSTOMER_BK                                       AS customer_id,
    c.SEGMENT,
    c.LOYALTY_TIER,
    c.COUNTRY,
    c.JOIN_DATE,
    -- Booking metrics
    COUNT(DISTINCT f.BOOKING_SK)                        AS total_bookings,
    ROUND(SUM(f.TOTAL_VALUE_GBP), 2)                   AS lifetime_value_gbp,
    ROUND(AVG(f.TOTAL_VALUE_GBP), 2)                   AS avg_booking_value_gbp,
    MAX(dd.FULL_DATE)                                   AS last_booking_date,
    DATEDIFF('day', MAX(dd.FULL_DATE), CURRENT_DATE())  AS days_since_last_booking,
    -- Favourite destination
    MODE(dest.DESTINATION_NAME)                         AS favourite_destination,
    MODE(dest.CONTINENT)                                AS favourite_continent,
    -- Preferred channel
    MODE(ch.CHANNEL_NAME)                               AS preferred_channel,
    -- Risk indicator
    CASE
        WHEN DATEDIFF('day', MAX(dd.FULL_DATE), CURRENT_DATE()) > 730 THEN 'At Risk'
        WHEN DATEDIFF('day', MAX(dd.FULL_DATE), CURRENT_DATE()) > 365 THEN 'Lapsing'
        ELSE 'Active'
    END                                                  AS retention_status,
    -- LTV band
    CASE
        WHEN SUM(f.TOTAL_VALUE_GBP) >= 100000 THEN 'Elite'
        WHEN SUM(f.TOTAL_VALUE_GBP) >= 50000  THEN 'Premium'
        WHEN SUM(f.TOTAL_VALUE_GBP) >= 20000  THEN 'Standard'
        ELSE 'New'
    END                                                  AS ltv_band
FROM GOLD.DIM_CUSTOMER c
LEFT JOIN GOLD.FCT_BOOKING     f    ON c.CUSTOMER_SK     = f.CUSTOMER_SK
LEFT JOIN GOLD.DIM_DATE        dd   ON f.BOOKING_DATE_SK = dd.DATE_SK
LEFT JOIN GOLD.DIM_DESTINATION dest ON f.DESTINATION_SK  = dest.DESTINATION_SK
LEFT JOIN GOLD.DIM_CHANNEL     ch   ON f.CHANNEL_SK      = ch.CHANNEL_SK
WHERE c.IS_CURRENT = TRUE
GROUP BY 1,2,3,4,5
""", 'create view')
tag_view('DP_CUSTOMER_360', 'Customer', 'CRM Team', 'GOLD', 'Daily')
print('  ✅ DP_CUSTOMER_360 tagged')

# ── DP 2 — Booking Intelligence ───────────────────────────────────────────────
print('\n4. DP_BOOKING_INTELLIGENCE  (Commercial domain)')
run("""
CREATE OR REPLACE SECURE VIEW KUONI_DEMO.DATA_PRODUCTS.DP_BOOKING_INTELLIGENCE
COMMENT = 'Daily booking grain with full dimensional context — revenue, margin, channel, destination, and agent. The primary product for commercial analytics, Power BI reporting, and demand forecasting. Owned by Commercial Team.'
AS
SELECT
    f.BOOKING_REF                               AS booking_reference,
    f.BOOKING_STATUS,
    dd_book.FULL_DATE                           AS booking_date,
    dd_book.YEAR                                AS booking_year,
    dd_book.MONTH_NAME                          AS booking_month,
    dd_book.QUARTER_NAME                        AS booking_quarter,
    dd_book.IS_PEAK_SEASON                      AS booked_in_peak_season,
    dd_trav.FULL_DATE                           AS travel_date,
    dd_trav.YEAR                                AS travel_year,
    dd_trav.MONTH_NAME                          AS travel_month,
    dd_trav.IS_PEAK_SEASON                      AS travelling_in_peak_season,
    -- Customer
    c.SEGMENT                                   AS customer_segment,
    c.LOYALTY_TIER,
    c.COUNTRY                                   AS customer_country,
    -- Product
    p.PRODUCT_NAME,
    p.PRODUCT_TYPE,
    p.PRICE_BAND,
    p.ALL_INCLUSIVE,
    -- Destination
    dest.DESTINATION_NAME,
    dest.COUNTRY                                AS destination_country,
    dest.CONTINENT,
    dest.TIER                                   AS destination_tier,
    -- Agent & channel
    a.AGENT_NAME,
    a.REGION                                    AS agent_region,
    ch.CHANNEL_NAME,
    ch.CHANNEL_TYPE,
    -- Financials
    f.TOTAL_VALUE_GBP,
    f.MARGIN_PCT,
    ROUND(f.TOTAL_VALUE_GBP * f.MARGIN_PCT / 100, 2) AS margin_gbp,
    f.NUM_PASSENGERS,
    f.DURATION_DAYS,
    f.INSURANCE_INCLUDED
FROM GOLD.FCT_BOOKING       f
JOIN GOLD.DIM_DATE          dd_book ON f.BOOKING_DATE_SK = dd_book.DATE_SK
JOIN GOLD.DIM_DATE          dd_trav ON f.TRAVEL_DATE_SK  = dd_trav.DATE_SK
JOIN GOLD.DIM_CUSTOMER      c       ON f.CUSTOMER_SK     = c.CUSTOMER_SK
JOIN GOLD.DIM_PRODUCT       p       ON f.PRODUCT_SK      = p.PRODUCT_SK
JOIN GOLD.DIM_DESTINATION   dest    ON f.DESTINATION_SK  = dest.DESTINATION_SK
JOIN GOLD.DIM_AGENT         a       ON f.AGENT_SK        = a.AGENT_SK
JOIN GOLD.DIM_CHANNEL       ch      ON f.CHANNEL_SK      = ch.CHANNEL_SK
""", 'create view')
tag_view('DP_BOOKING_INTELLIGENCE', 'Commercial', 'Commercial Team', 'PLATINUM', 'Daily')
print('  ✅ DP_BOOKING_INTELLIGENCE tagged')

# ── DP 3 — Destination Performance ───────────────────────────────────────────
print('\n5. DP_DESTINATION_PERFORMANCE  (Destination domain)')
run("""
CREATE OR REPLACE SECURE VIEW KUONI_DEMO.DATA_PRODUCTS.DP_DESTINATION_PERFORMANCE
COMMENT = 'Destination-level commercial performance — revenue, margin, booking volumes, seasonality patterns, and customer mix. Used by product management to optimise the portfolio and by pricing teams for demand-based pricing. Owned by Destination Team.'
AS
SELECT
    dest.DESTINATION_NAME,
    dest.COUNTRY,
    dest.REGION,
    dest.CONTINENT,
    dest.TIER,
    dest.VISA_REQUIRED,
    dd.YEAR,
    dd.QUARTER_NAME,
    dd.MONTH_NAME,
    dd.MONTH_NUM,
    dd.IS_PEAK_SEASON,
    COUNT(*)                                            AS bookings,
    COUNT(DISTINCT f.CUSTOMER_SK)                       AS unique_customers,
    ROUND(SUM(f.TOTAL_VALUE_GBP), 2)                   AS revenue_gbp,
    ROUND(SUM(f.TOTAL_VALUE_GBP * f.MARGIN_PCT / 100), 2) AS margin_gbp,
    ROUND(AVG(f.TOTAL_VALUE_GBP), 2)                   AS avg_booking_value,
    ROUND(AVG(f.MARGIN_PCT), 2)                        AS avg_margin_pct,
    ROUND(AVG(f.DURATION_DAYS), 1)                     AS avg_duration_days,
    ROUND(AVG(f.NUM_PASSENGERS), 1)                    AS avg_party_size,
    SUM(CASE WHEN f.BOOKING_STATUS = 'Cancelled' THEN 1 ELSE 0 END) AS cancellations,
    ROUND(100.0 * SUM(CASE WHEN f.BOOKING_STATUS='Cancelled' THEN 1 ELSE 0 END) / COUNT(*), 1) AS cancellation_rate_pct
FROM GOLD.FCT_BOOKING       f
JOIN GOLD.DIM_DESTINATION   dest ON f.DESTINATION_SK  = dest.DESTINATION_SK
JOIN GOLD.DIM_DATE          dd   ON f.BOOKING_DATE_SK = dd.DATE_SK
GROUP BY 1,2,3,4,5,6,7,8,9,10,11
""", 'create view')
tag_view('DP_DESTINATION_PERFORMANCE', 'Destination', 'Destination Team', 'GOLD', 'Daily')
print('  ✅ DP_DESTINATION_PERFORMANCE tagged')

# ── DP 4 — Agent Scorecard ────────────────────────────────────────────────────
print('\n6. DP_AGENT_SCORECARD  (Operations domain)')
run("""
CREATE OR REPLACE SECURE VIEW KUONI_DEMO.DATA_PRODUCTS.DP_AGENT_SCORECARD
COMMENT = 'Monthly sales consultant performance scorecard — revenue, margin contribution, booking count, average value, and cancellation rate. Used by branch managers for performance reviews and incentive calculations. Owned by Operations Team.'
AS
SELECT
    a.AGENT_NAME,
    a.BRANCH_CODE,
    a.BRANCH_NAME,
    a.REGION,
    a.SPECIALISATION,
    dd.YEAR,
    dd.MONTH_NAME,
    dd.MONTH_NUM,
    COUNT(*)                                                AS bookings,
    COUNT(DISTINCT f.CUSTOMER_SK)                           AS unique_customers,
    ROUND(SUM(f.TOTAL_VALUE_GBP), 2)                       AS revenue_gbp,
    ROUND(SUM(f.TOTAL_VALUE_GBP * f.MARGIN_PCT / 100), 2)  AS margin_gbp,
    ROUND(AVG(f.TOTAL_VALUE_GBP), 2)                       AS avg_booking_value,
    ROUND(AVG(f.MARGIN_PCT), 2)                            AS avg_margin_pct,
    SUM(CASE WHEN f.BOOKING_STATUS = 'Cancelled' THEN 1 ELSE 0 END) AS cancellations,
    ROUND(100.0 * SUM(CASE WHEN f.BOOKING_STATUS='Cancelled' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0), 1) AS cancellation_rate_pct,
    -- Performance rank within region/month
    RANK() OVER (PARTITION BY a.REGION, dd.YEAR, dd.MONTH_NUM ORDER BY SUM(f.TOTAL_VALUE_GBP) DESC) AS revenue_rank_in_region
FROM GOLD.FCT_BOOKING   f
JOIN GOLD.DIM_AGENT     a  ON f.AGENT_SK        = a.AGENT_SK
JOIN GOLD.DIM_DATE      dd ON f.BOOKING_DATE_SK = dd.DATE_SK
GROUP BY 1,2,3,4,5,6,7,8
""", 'create view')
tag_view('DP_AGENT_SCORECARD', 'Operations', 'Operations Team', 'GOLD', 'Daily')
print('  ✅ DP_AGENT_SCORECARD tagged')

# ── DP 5 — Executive KPIs ─────────────────────────────────────────────────────
print('\n7. DP_EXECUTIVE_KPIS  (Executive domain)')
run("""
CREATE OR REPLACE SECURE VIEW KUONI_DEMO.DATA_PRODUCTS.DP_EXECUTIVE_KPIS
COMMENT = 'Monthly executive KPI roll-up — revenue, margin, bookings, and YoY growth. The single authoritative source for board reporting, CIO dashboards, and DERTOUR Group submissions. Owned by Data Platform team. PLATINUM SLA.'
AS
WITH monthly AS (
    SELECT
        dd.YEAR,
        dd.MONTH_NUM,
        dd.MONTH_NAME,
        dd.QUARTER_NAME,
        SUM(f.TOTAL_VALUE_GBP)                                 AS revenue_gbp,
        SUM(f.TOTAL_VALUE_GBP * f.MARGIN_PCT / 100)           AS margin_gbp,
        COUNT(*)                                                AS bookings,
        COUNT(DISTINCT f.CUSTOMER_SK)                           AS unique_customers,
        AVG(f.TOTAL_VALUE_GBP)                                 AS avg_booking_value,
        AVG(f.MARGIN_PCT)                                      AS avg_margin_pct,
        SUM(CASE WHEN f.BOOKING_STATUS='Cancelled' THEN 1 ELSE 0 END) AS cancellations
    FROM GOLD.FCT_BOOKING f
    JOIN GOLD.DIM_DATE dd ON f.BOOKING_DATE_SK = dd.DATE_SK
    GROUP BY 1,2,3,4
)
SELECT
    m.YEAR,
    m.MONTH_NUM,
    m.MONTH_NAME,
    m.QUARTER_NAME,
    ROUND(m.revenue_gbp, 2)                                    AS revenue_gbp,
    ROUND(m.margin_gbp, 2)                                     AS margin_gbp,
    m.bookings,
    m.unique_customers,
    ROUND(m.avg_booking_value, 2)                              AS avg_booking_value_gbp,
    ROUND(m.avg_margin_pct, 2)                                 AS avg_margin_pct,
    m.cancellations,
    ROUND(100.0 * m.cancellations / NULLIF(m.bookings, 0), 1) AS cancellation_rate_pct,
    -- YoY comparison
    LAG(m.revenue_gbp, 12) OVER (ORDER BY m.YEAR, m.MONTH_NUM) AS revenue_gbp_prior_year,
    ROUND(100.0 * (m.revenue_gbp - LAG(m.revenue_gbp, 12) OVER (ORDER BY m.YEAR, m.MONTH_NUM))
          / NULLIF(LAG(m.revenue_gbp, 12) OVER (ORDER BY m.YEAR, m.MONTH_NUM), 0), 1) AS revenue_yoy_pct
FROM monthly m
""", 'create view')
tag_view('DP_EXECUTIVE_KPIS', 'Executive', 'Data Platform', 'PLATINUM', 'Daily')
print('  ✅ DP_EXECUTIVE_KPIS tagged')

# ── Verify ────────────────────────────────────────────────────────────────────
print('\n=== Data Products Created ===')
cur.execute("SHOW VIEWS IN SCHEMA KUONI_DEMO.DATA_PRODUCTS")
rows = cur.fetchall()
cols = [d[0] for d in cur.description]
for row in rows:
    d = dict(zip(cols, row))
    if d.get('name','').startswith('DP_'):
        print(f"  ✅ {d['name']}")

# Quick row count sample
for dp in ['DP_CUSTOMER_360','DP_BOOKING_INTELLIGENCE','DP_DESTINATION_PERFORMANCE','DP_AGENT_SCORECARD','DP_EXECUTIVE_KPIS']:
    cur.execute(f'SELECT COUNT(*) FROM KUONI_DEMO.DATA_PRODUCTS.{dp}')
    cnt = cur.fetchone()[0]
    print(f'     {dp}: {cnt:,} rows')

cur.close()
conn.close()
print('\n✅ Data Mesh build complete!')
