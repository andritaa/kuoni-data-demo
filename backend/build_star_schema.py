"""
Build the Kuoni Star Schema in Snowflake GOLD layer.
Creates proper dimensional model tables:
  DIM_DATE, DIM_CUSTOMER, DIM_PRODUCT, DIM_DESTINATION, DIM_AGENT, DIM_CHANNEL
  FCT_BOOKING
"""
import os, sys

os.environ.setdefault('SNOWFLAKE_ACCOUNT', 'SNOWFLAKE_ACCOUNT_ENV')
os.environ.setdefault('SNOWFLAKE_USER', 'SNOWFLAKE_USER_ENV')
os.environ.setdefault('SNOWFLAKE_PASSWORD', 'REDACTED_ROTATE_NOW')
os.environ.setdefault('SNOWFLAKE_DATABASE', 'KUONI_DEMO')
os.environ.setdefault('SNOWFLAKE_WAREHOUSE', 'KUONI_WH')

import snowflake_client as sf

conn = sf.get_connection()
cur  = conn.cursor()

def run(sql, desc=''):
    if desc:
        print(f'  → {desc}')
    cur.execute(sql)
    try:
        rows = cur.fetchone()
        if rows:
            print(f'    {rows[0]}')
    except:
        pass

print('\n=== Building Kuoni Star Schema ===\n')

# ── DIM_DATE ──────────────────────────────────────────────────────────────────
print('1. DIM_DATE')
run("DROP TABLE IF EXISTS GOLD.DIM_DATE", "drop existing")
run("""
CREATE TABLE GOLD.DIM_DATE (
    DATE_SK         INTEGER       NOT NULL PRIMARY KEY,  -- YYYYMMDD
    FULL_DATE       DATE          NOT NULL,
    YEAR            INTEGER,
    QUARTER         INTEGER,
    QUARTER_NAME    VARCHAR(6),
    MONTH_NUM       INTEGER,
    MONTH_NAME      VARCHAR(20),
    MONTH_ABBR      VARCHAR(5),
    WEEK_NUM        INTEGER,
    DAY_OF_WEEK     INTEGER,
    DAY_NAME        VARCHAR(15),
    IS_WEEKEND      BOOLEAN,
    IS_PEAK_SEASON  BOOLEAN,  -- Jun–Sep & Dec
    FISCAL_YEAR     INTEGER,
    FISCAL_QUARTER  INTEGER
)
""", "create table")

run("""
INSERT INTO GOLD.DIM_DATE
WITH date_spine AS (
    SELECT DATEADD(DAY, SEQ4(), '2020-01-01') AS d
    FROM TABLE(GENERATOR(ROWCOUNT => 4018))  -- 2020-01-01 to 2030-12-31
)
SELECT
    TO_NUMBER(TO_CHAR(d, 'YYYYMMDD'))           AS DATE_SK,
    d                                            AS FULL_DATE,
    YEAR(d)                                      AS YEAR,
    QUARTER(d)                                   AS QUARTER,
    'Q' || QUARTER(d)                            AS QUARTER_NAME,
    MONTH(d)                                     AS MONTH_NUM,
    MONTHNAME(d)                                 AS MONTH_NAME,
    LEFT(MONTHNAME(d), 3)                        AS MONTH_ABBR,
    WEEKOFYEAR(d)                                AS WEEK_NUM,
    DAYOFWEEK(d)                                 AS DAY_OF_WEEK,
    DAYNAME(d)                                   AS DAY_NAME,
    DAYOFWEEK(d) IN (0, 6)                       AS IS_WEEKEND,
    MONTH(d) IN (6,7,8,9,12)                     AS IS_PEAK_SEASON,
    CASE WHEN MONTH(d) >= 4 THEN YEAR(d)
         ELSE YEAR(d) - 1 END                    AS FISCAL_YEAR,
    CASE WHEN MONTH(d) BETWEEN 4 AND 6  THEN 1
         WHEN MONTH(d) BETWEEN 7 AND 9  THEN 2
         WHEN MONTH(d) BETWEEN 10 AND 12 THEN 3
         ELSE 4 END                              AS FISCAL_QUARTER
FROM date_spine
""", "populate 4,018 date rows")

# ── DIM_CUSTOMER ──────────────────────────────────────────────────────────────
print('\n2. DIM_CUSTOMER')
run("DROP TABLE IF EXISTS GOLD.DIM_CUSTOMER", "drop existing")
run("""
CREATE TABLE GOLD.DIM_CUSTOMER (
    CUSTOMER_SK         INTEGER       NOT NULL AUTOINCREMENT PRIMARY KEY,
    CUSTOMER_BK         VARCHAR(50)   NOT NULL,  -- natural/business key
    FIRST_NAME          VARCHAR(100),
    LAST_NAME           VARCHAR(100),
    EMAIL               VARCHAR(255),
    PHONE               VARCHAR(30),
    DATE_OF_BIRTH       DATE,
    CITY                VARCHAR(100),
    POSTCODE            VARCHAR(20),
    COUNTRY             VARCHAR(100),
    JOIN_DATE           DATE,
    SEGMENT             VARCHAR(50),
    LOYALTY_TIER        VARCHAR(30),
    TRAVEL_HISTORY_CNT  INTEGER,
    GDPR_CONSENT        BOOLEAN,
    -- SCD Type 2 columns
    VALID_FROM          DATE          NOT NULL,
    VALID_TO            DATE,
    IS_CURRENT          BOOLEAN       NOT NULL DEFAULT TRUE
)
""", "create table")

run("""
INSERT INTO GOLD.DIM_CUSTOMER (
    CUSTOMER_BK, FIRST_NAME, LAST_NAME, EMAIL, PHONE, DATE_OF_BIRTH,
    CITY, POSTCODE, COUNTRY, JOIN_DATE, SEGMENT, LOYALTY_TIER,
    TRAVEL_HISTORY_CNT, GDPR_CONSENT, VALID_FROM, VALID_TO, IS_CURRENT
)
SELECT
    CUSTOMER_ID,
    FIRST_NAME,
    LAST_NAME,
    EMAIL,
    PHONE,
    TRY_TO_DATE(DATE_OF_BIRTH, 'YYYY-MM-DD'),
    CITY,
    POSTCODE,
    COUNTRY,
    TRY_TO_DATE(JOIN_DATE, 'YYYY-MM-DD'),
    SEGMENT,
    LOYALTY_TIER,
    TRY_TO_NUMBER(TRAVEL_HISTORY_COUNT),
    TRY_TO_BOOLEAN(GDPR_CONSENT),
    CURRENT_DATE(),
    NULL,
    TRUE
FROM BRONZE.RAW_CUSTOMERS
""", "load from Bronze")

# ── DIM_PRODUCT ───────────────────────────────────────────────────────────────
print('\n3. DIM_PRODUCT')
run("DROP TABLE IF EXISTS GOLD.DIM_PRODUCT", "drop existing")
run("""
CREATE TABLE GOLD.DIM_PRODUCT (
    PRODUCT_SK          INTEGER     NOT NULL AUTOINCREMENT PRIMARY KEY,
    PRODUCT_BK          VARCHAR(50) NOT NULL,
    PRODUCT_NAME        VARCHAR(255),
    PRODUCT_TYPE        VARCHAR(50),
    DURATION_DAYS       INTEGER,
    BASE_PRICE_GBP      FLOAT,
    PRICE_BAND          VARCHAR(30),
    ACCOMMODATION_TIER  VARCHAR(30),
    ALL_INCLUSIVE       BOOLEAN,
    INCLUDED_FLIGHTS    BOOLEAN,
    MAX_GROUP_SIZE      INTEGER,
    IS_ACTIVE           BOOLEAN
)
""", "create table")

run("""
INSERT INTO GOLD.DIM_PRODUCT (
    PRODUCT_BK, PRODUCT_NAME, PRODUCT_TYPE, DURATION_DAYS,
    BASE_PRICE_GBP, PRICE_BAND, ACCOMMODATION_TIER, ALL_INCLUSIVE,
    INCLUDED_FLIGHTS, MAX_GROUP_SIZE, IS_ACTIVE
)
SELECT
    PRODUCT_ID,
    PRODUCT_NAME,
    PRODUCT_TYPE,
    TRY_TO_NUMBER(DURATION_DAYS),
    TRY_TO_DOUBLE(BASE_PRICE_GBP),
    PRICE_BAND,
    ACCOMMODATION_TIER,
    TRY_TO_BOOLEAN(ALL_INCLUSIVE),
    TRY_TO_BOOLEAN(INCLUDED_FLIGHTS),
    TRY_TO_NUMBER(MAX_GROUP_SIZE),
    TRY_TO_BOOLEAN(IS_ACTIVE)
FROM BRONZE.RAW_PRODUCTS
""", "load from Bronze")

# ── DIM_DESTINATION ───────────────────────────────────────────────────────────
print('\n4. DIM_DESTINATION')
run("DROP TABLE IF EXISTS GOLD.DIM_DESTINATION", "drop existing")
run("""
CREATE TABLE GOLD.DIM_DESTINATION (
    DESTINATION_SK      INTEGER      NOT NULL AUTOINCREMENT PRIMARY KEY,
    DESTINATION_BK      VARCHAR(50)  NOT NULL,
    DESTINATION_NAME    VARCHAR(255),
    COUNTRY             VARCHAR(100),
    REGION              VARCHAR(100),
    CONTINENT           VARCHAR(50),
    TIER                VARCHAR(30),
    AVG_DURATION_DAYS   INTEGER,
    PEAK_SEASON_START   VARCHAR(10),
    PEAK_SEASON_END     VARCHAR(10),
    FLIGHT_HRS_FROM_LHR FLOAT,
    VISA_REQUIRED       BOOLEAN,
    CLIMATE_TYPE        VARCHAR(50)
)
""", "create table")

run("""
INSERT INTO GOLD.DIM_DESTINATION (
    DESTINATION_BK, DESTINATION_NAME, COUNTRY, REGION, CONTINENT, TIER,
    AVG_DURATION_DAYS, PEAK_SEASON_START, PEAK_SEASON_END,
    FLIGHT_HRS_FROM_LHR, VISA_REQUIRED, CLIMATE_TYPE
)
SELECT
    DESTINATION_ID, DESTINATION_NAME, COUNTRY, REGION, CONTINENT, TIER,
    TRY_TO_NUMBER(AVG_DURATION_DAYS), PEAK_SEASON_START, PEAK_SEASON_END,
    TRY_TO_DOUBLE(FLIGHT_HRS_FROM_LHR), TRY_TO_BOOLEAN(VISA_REQUIRED), CLIMATE_TYPE
FROM BRONZE.RAW_DESTINATIONS
""", "load from Bronze")

# ── DIM_AGENT ─────────────────────────────────────────────────────────────────
print('\n5. DIM_AGENT')
run("DROP TABLE IF EXISTS GOLD.DIM_AGENT", "drop existing")
run("""
CREATE TABLE GOLD.DIM_AGENT (
    AGENT_SK        INTEGER      NOT NULL AUTOINCREMENT PRIMARY KEY,
    AGENT_BK        VARCHAR(50)  NOT NULL,
    AGENT_NAME      VARCHAR(255),
    EMAIL           VARCHAR(255),
    BRANCH_CODE     VARCHAR(30),
    BRANCH_NAME     VARCHAR(100),
    REGION          VARCHAR(100),
    SPECIALISATION  VARCHAR(100),
    START_DATE      DATE,
    IS_ACTIVE       BOOLEAN,
    VALID_FROM      DATE,
    VALID_TO        DATE,
    IS_CURRENT      BOOLEAN DEFAULT TRUE
)
""", "create table")

run("""
INSERT INTO GOLD.DIM_AGENT (
    AGENT_BK, AGENT_NAME, EMAIL, BRANCH_CODE, BRANCH_NAME,
    REGION, SPECIALISATION, START_DATE, IS_ACTIVE, VALID_FROM, IS_CURRENT
)
SELECT
    AGENT_ID,
    COALESCE(AGENT_NAME, FULL_NAME),
    EMAIL,
    BRANCH_CODE,
    BRANCH_NAME,
    REGION,
    SPECIALISATION,
    TRY_TO_DATE(COALESCE(START_DATE, HIRE_DATE), 'YYYY-MM-DD'),
    TRY_TO_BOOLEAN(IS_ACTIVE),
    CURRENT_DATE(),
    TRUE
FROM BRONZE.RAW_AGENTS
""", "load from Bronze")

# ── DIM_CHANNEL ───────────────────────────────────────────────────────────────
print('\n6. DIM_CHANNEL')
run("DROP TABLE IF EXISTS GOLD.DIM_CHANNEL", "drop existing")
run("""
CREATE TABLE GOLD.DIM_CHANNEL (
    CHANNEL_SK      INTEGER     NOT NULL AUTOINCREMENT PRIMARY KEY,
    CHANNEL_NAME    VARCHAR(50) NOT NULL,
    CHANNEL_TYPE    VARCHAR(30),
    IS_DIGITAL      BOOLEAN,
    SUB_CHANNEL     VARCHAR(50)
)
""", "create table")

run("""
INSERT INTO GOLD.DIM_CHANNEL (CHANNEL_NAME, CHANNEL_TYPE, IS_DIGITAL, SUB_CHANNEL)
SELECT DISTINCT
    CHANNEL,
    CASE WHEN CHANNEL IN ('Online','Mobile App','Website') THEN 'Digital'
         WHEN CHANNEL IN ('Branch','Store') THEN 'Physical'
         ELSE 'Trade' END,
    CHANNEL IN ('Online','Mobile App','Website'),
    CHANNEL
FROM BRONZE.RAW_BOOKINGS
WHERE CHANNEL IS NOT NULL
""", "derive from booking channels")

# ── FCT_BOOKING ───────────────────────────────────────────────────────────────
print('\n7. FCT_BOOKING (fact table)')
run("DROP TABLE IF EXISTS GOLD.FCT_BOOKING", "drop existing")
run("""
CREATE TABLE GOLD.FCT_BOOKING (
    BOOKING_SK          INTEGER  NOT NULL AUTOINCREMENT PRIMARY KEY,
    -- Foreign keys
    BOOKING_DATE_SK     INTEGER,
    TRAVEL_DATE_SK      INTEGER,
    CUSTOMER_SK         INTEGER,
    PRODUCT_SK          INTEGER,
    DESTINATION_SK      INTEGER,
    AGENT_SK            INTEGER,
    CHANNEL_SK          INTEGER,
    -- Degenerate dimensions
    BOOKING_REF         VARCHAR(50),
    BOOKING_STATUS      VARCHAR(30),
    CANCELLATION_REASON VARCHAR(255),
    INSURANCE_INCLUDED  BOOLEAN,
    CURRENCY            VARCHAR(10),
    -- Measures
    TOTAL_VALUE_GBP     FLOAT,
    DEPOSIT_AMOUNT_GBP  FLOAT,
    MARGIN_PCT          FLOAT,
    MARGIN_GBP          FLOAT,
    NUM_PASSENGERS      INTEGER,
    DURATION_DAYS       INTEGER,
    EXCHANGE_RATE       FLOAT
)
""", "create fact table")

run("""
INSERT INTO GOLD.FCT_BOOKING (
    BOOKING_DATE_SK, TRAVEL_DATE_SK,
    CUSTOMER_SK, PRODUCT_SK, DESTINATION_SK, AGENT_SK, CHANNEL_SK,
    BOOKING_REF, BOOKING_STATUS, CANCELLATION_REASON, INSURANCE_INCLUDED, CURRENCY,
    TOTAL_VALUE_GBP, DEPOSIT_AMOUNT_GBP, MARGIN_PCT, MARGIN_GBP,
    NUM_PASSENGERS, DURATION_DAYS, EXCHANGE_RATE
)
SELECT
    -- Date keys
    TO_NUMBER(TO_CHAR(TRY_TO_DATE(b.BOOKING_DATE, 'YYYY-MM-DD'), 'YYYYMMDD')),
    TO_NUMBER(TO_CHAR(TRY_TO_DATE(b.TRAVEL_DATE, 'YYYY-MM-DD'), 'YYYYMMDD')),
    -- Dimension keys (lookup by business key)
    c.CUSTOMER_SK,
    p.PRODUCT_SK,
    d.DESTINATION_SK,
    a.AGENT_SK,
    ch.CHANNEL_SK,
    -- Degenerate dims
    b.BOOKING_ID,
    b.STATUS,
    b.CANCELLATION_REASON,
    TRY_TO_BOOLEAN(b.INSURANCE_INCLUDED),
    b.CURRENCY,
    -- Measures
    TRY_TO_DOUBLE(b.TOTAL_VALUE_GBP),
    TRY_TO_DOUBLE(b.DEPOSIT_AMOUNT_GBP),
    TRY_TO_DOUBLE(b.MARGIN_PCT),
    TRY_TO_DOUBLE(b.TOTAL_VALUE_GBP) * TRY_TO_DOUBLE(b.MARGIN_PCT) / 100,
    TRY_TO_NUMBER(b.NUM_PASSENGERS),
    DATEDIFF('day',
        TRY_TO_DATE(b.TRAVEL_DATE, 'YYYY-MM-DD'),
        TRY_TO_DATE(b.RETURN_DATE, 'YYYY-MM-DD')),
    TRY_TO_DOUBLE(b.EXCHANGE_RATE)
FROM BRONZE.RAW_BOOKINGS b
LEFT JOIN GOLD.DIM_CUSTOMER    c  ON b.CUSTOMER_ID    = c.CUSTOMER_BK    AND c.IS_CURRENT = TRUE
LEFT JOIN GOLD.DIM_PRODUCT     p  ON b.PRODUCT_ID     = p.PRODUCT_BK
LEFT JOIN BRONZE.RAW_PRODUCTS    rp ON b.PRODUCT_ID     = rp.PRODUCT_ID
LEFT JOIN GOLD.DIM_DESTINATION   d  ON rp.DESTINATION_ID = d.DESTINATION_BK
LEFT JOIN GOLD.DIM_AGENT       a  ON b.AGENT_ID       = a.AGENT_BK       AND a.IS_CURRENT = TRUE
LEFT JOIN GOLD.DIM_CHANNEL     ch ON b.CHANNEL        = ch.CHANNEL_NAME
""", "load 8,000+ booking facts")

# ── Verify ────────────────────────────────────────────────────────────────────
print('\n=== Row counts ===')
for tbl in ['DIM_DATE','DIM_CUSTOMER','DIM_PRODUCT','DIM_DESTINATION','DIM_AGENT','DIM_CHANNEL','FCT_BOOKING']:
    cur.execute(f'SELECT COUNT(*) FROM GOLD.{tbl}')
    cnt = cur.fetchone()[0]
    print(f'  GOLD.{tbl}: {cnt:,} rows')

# ── Snowsight-ready analytical queries ───────────────────────────────────────
print('\n=== Sample Star Schema query (Snowsight ready) ===')
cur.execute("""
SELECT
    dd.MONTH_NAME,
    dd.YEAR,
    da.REGION,
    SUM(f.TOTAL_VALUE_GBP)  AS revenue_gbp,
    SUM(f.MARGIN_GBP)       AS margin_gbp,
    COUNT(*)                 AS bookings,
    ROUND(AVG(f.TOTAL_VALUE_GBP), 0) AS avg_value
FROM GOLD.FCT_BOOKING f
JOIN GOLD.DIM_DATE        dd ON f.BOOKING_DATE_SK = dd.DATE_SK
JOIN GOLD.DIM_AGENT       da ON f.AGENT_SK        = da.AGENT_SK
WHERE dd.YEAR >= 2024
GROUP BY 1,2,3
ORDER BY dd.YEAR, dd.MONTH_NUM, revenue_gbp DESC
LIMIT 5
""")
rows = cur.fetchall()
cols = [d[0] for d in cur.description]
print('  ' + ' | '.join(cols))
for r in rows:
    print('  ' + ' | '.join(str(v) for v in r))

cur.close()
conn.close()
print('\n✅ Star Schema complete!')
