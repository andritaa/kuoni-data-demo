-- =============================================================================
-- KUONI DATA PLATFORM - SILVER LAYER
-- Cleansed / Conformed Layer — Single Source of Truth
-- Typed, deduplicated, standardised, validated
-- =============================================================================

USE DATABASE KUONI_DW;
USE SCHEMA SILVER;
USE WAREHOUSE KUONI_WH_ETL;

-- =============================================================================
-- DIM_DATE
-- Pre-built date dimension — 10 years, heavily used in all analytics
-- =============================================================================

CREATE TABLE IF NOT EXISTS DIM_DATE (
    DATE_KEY            NUMBER          NOT NULL,   -- YYYYMMDD integer key
    FULL_DATE           DATE            NOT NULL,
    DAY_OF_WEEK         NUMBER          NOT NULL,
    DAY_NAME            VARCHAR(20)     NOT NULL,
    DAY_OF_MONTH        NUMBER          NOT NULL,
    DAY_OF_YEAR         NUMBER          NOT NULL,
    WEEK_OF_YEAR        NUMBER          NOT NULL,
    MONTH_NUM           NUMBER          NOT NULL,
    MONTH_NAME          VARCHAR(20)     NOT NULL,
    MONTH_ABBR          VARCHAR(5)      NOT NULL,
    QUARTER             NUMBER          NOT NULL,
    QUARTER_NAME        VARCHAR(10)     NOT NULL,
    YEAR                NUMBER          NOT NULL,
    IS_WEEKEND          BOOLEAN         NOT NULL,
    IS_UK_BANK_HOLIDAY  BOOLEAN         DEFAULT FALSE,
    IS_PEAK_TRAVEL      BOOLEAN         DEFAULT FALSE,  -- Jan, March, Oct
    FISCAL_YEAR         NUMBER,
    FISCAL_QUARTER      NUMBER,
    CONSTRAINT PK_DIM_DATE PRIMARY KEY (DATE_KEY)
)
COMMENT = 'Date dimension — 2020-2030, includes UK bank holidays and Kuoni peak periods';

-- Populate date dimension via stored procedure (called by dbt)
CREATE OR REPLACE PROCEDURE SILVER.POPULATE_DIM_DATE(START_DATE DATE, END_DATE DATE)
RETURNS VARCHAR
LANGUAGE SQL
AS
$$
DECLARE
    current_date_val DATE := START_DATE;
    rows_inserted NUMBER := 0;
BEGIN
    DELETE FROM SILVER.DIM_DATE WHERE FULL_DATE BETWEEN START_DATE AND END_DATE;
    
    INSERT INTO SILVER.DIM_DATE (
        DATE_KEY, FULL_DATE, DAY_OF_WEEK, DAY_NAME, DAY_OF_MONTH,
        DAY_OF_YEAR, WEEK_OF_YEAR, MONTH_NUM, MONTH_NAME, MONTH_ABBR,
        QUARTER, QUARTER_NAME, YEAR, IS_WEEKEND, FISCAL_YEAR, FISCAL_QUARTER
    )
    SELECT
        TO_NUMBER(TO_CHAR(d.date_val, 'YYYYMMDD'))                          AS DATE_KEY,
        d.date_val                                                           AS FULL_DATE,
        DAYOFWEEK(d.date_val)                                                AS DAY_OF_WEEK,
        DAYNAME(d.date_val)                                                  AS DAY_NAME,
        DAYOFMONTH(d.date_val)                                               AS DAY_OF_MONTH,
        DAYOFYEAR(d.date_val)                                                AS DAY_OF_YEAR,
        WEEKOFYEAR(d.date_val)                                               AS WEEK_OF_YEAR,
        MONTH(d.date_val)                                                    AS MONTH_NUM,
        MONTHNAME(d.date_val)                                                AS MONTH_NAME,
        LEFT(MONTHNAME(d.date_val), 3)                                       AS MONTH_ABBR,
        QUARTER(d.date_val)                                                  AS QUARTER,
        'Q' || QUARTER(d.date_val)                                           AS QUARTER_NAME,
        YEAR(d.date_val)                                                     AS YEAR,
        CASE WHEN DAYOFWEEK(d.date_val) IN (0,6) THEN TRUE ELSE FALSE END   AS IS_WEEKEND,
        -- Kuoni fiscal year starts April 1
        CASE WHEN MONTH(d.date_val) >= 4 THEN YEAR(d.date_val) ELSE YEAR(d.date_val)-1 END AS FISCAL_YEAR,
        CASE
            WHEN MONTH(d.date_val) IN (4,5,6) THEN 1
            WHEN MONTH(d.date_val) IN (7,8,9) THEN 2
            WHEN MONTH(d.date_val) IN (10,11,12) THEN 3
            ELSE 4
        END AS FISCAL_QUARTER
    FROM (
        SELECT DATEADD(day, seq4(), START_DATE) AS date_val
        FROM TABLE(GENERATOR(ROWCOUNT => DATEDIFF(day, START_DATE, END_DATE) + 1))
    ) d;
    
    RETURN 'OK: inserted ' || ROWCOUNT || ' date rows';
END;
$$;

-- =============================================================================
-- DIM_CUSTOMER
-- Source: BRONZE.RAW_CUSTOMERS
-- Unified customer profile with dedup + standardisation
-- =============================================================================

CREATE TABLE IF NOT EXISTS DIM_CUSTOMER (
    CUSTOMER_SK         NUMBER          NOT NULL AUTOINCREMENT,  -- surrogate key
    CUSTOMER_ID         VARCHAR(50)     NOT NULL,                -- natural key
    FIRST_NAME          VARCHAR(100),
    LAST_NAME           VARCHAR(100),
    FULL_NAME           VARCHAR(200),
    EMAIL               VARCHAR(255),
    PHONE               VARCHAR(50),
    DATE_OF_BIRTH       DATE,
    AGE_BAND            VARCHAR(20),    -- 35-44 / 45-54 / 55-64 / 65+
    ADDRESS_LINE1       VARCHAR(255),
    CITY                VARCHAR(100),
    POSTCODE            VARCHAR(20),
    POSTCODE_DISTRICT   VARCHAR(10),    -- first part of postcode (e.g. SW1A)
    REGION              VARCHAR(100),   -- Greater London / South East / etc.
    JOIN_DATE           DATE,
    SEGMENT             VARCHAR(50),    -- Luxury / Premium / Explorer
    PREFERRED_CONTACT   VARCHAR(50),
    TRAVEL_HISTORY_COUNT NUMBER,
    LOYALTY_TIER        VARCHAR(50),    -- Bronze / Silver / Gold / Platinum
    GDPR_CONSENT        BOOLEAN,
    IS_ACTIVE           BOOLEAN         DEFAULT TRUE,
    DEDUP_MASTER_ID     VARCHAR(50),    -- points to master if this is a duplicate
    IS_MASTER_RECORD    BOOLEAN         DEFAULT TRUE,
    -- SCD Type 2 fields
    EFFECTIVE_FROM      DATE            NOT NULL,
    EFFECTIVE_TO        DATE,
    IS_CURRENT          BOOLEAN         DEFAULT TRUE,
    -- Audit
    _CREATED_AT         TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _UPDATED_AT         TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _SOURCE_BATCH_ID    VARCHAR(100),
    CONSTRAINT PK_DIM_CUSTOMER PRIMARY KEY (CUSTOMER_SK)
)
COMMENT = 'Unified customer dimension — deduplicated, standardised, SCD Type 2';

-- =============================================================================
-- DIM_DESTINATION
-- Source: BRONZE.RAW_DESTINATIONS
-- Enriched destination reference data
-- =============================================================================

CREATE TABLE IF NOT EXISTS DIM_DESTINATION (
    DESTINATION_SK      NUMBER          NOT NULL AUTOINCREMENT,
    DESTINATION_ID      VARCHAR(50)     NOT NULL,
    DESTINATION_NAME    VARCHAR(200)    NOT NULL,
    COUNTRY             VARCHAR(100),
    REGION              VARCHAR(100),
    CONTINENT           VARCHAR(50),
    TIER                VARCHAR(50),        -- Ultra-Luxury / Luxury / Premium
    AVG_DURATION_DAYS   NUMBER,
    PEAK_SEASON_START   VARCHAR(20),        -- e.g. 'November'
    PEAK_SEASON_END     VARCHAR(20),
    FLIGHT_HRS_FROM_LHR NUMBER,
    VISA_REQUIRED       BOOLEAN,
    CURRENCY            VARCHAR(10),
    CLIMATE_TYPE        VARCHAR(100),
    IS_ACTIVE           BOOLEAN             DEFAULT TRUE,
    -- Audit
    _CREATED_AT         TIMESTAMP_NTZ       DEFAULT CURRENT_TIMESTAMP(),
    _UPDATED_AT         TIMESTAMP_NTZ       DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT PK_DIM_DESTINATION PRIMARY KEY (DESTINATION_SK)
)
COMMENT = 'Enriched destination dimension — all Kuoni destination markets';

-- =============================================================================
-- DIM_PRODUCT
-- Source: BRONZE.RAW_PRODUCTS
-- Holiday package definitions with pricing
-- =============================================================================

CREATE TABLE IF NOT EXISTS DIM_PRODUCT (
    PRODUCT_SK          NUMBER          NOT NULL AUTOINCREMENT,
    PRODUCT_ID          VARCHAR(50)     NOT NULL,
    PRODUCT_NAME        VARCHAR(500),
    DESTINATION_SK      NUMBER,
    DESTINATION_ID      VARCHAR(50),
    PRODUCT_TYPE        VARCHAR(100),       -- Tailor-Made / Group / Honeymoon / Adventure / Cultural
    DURATION_DAYS       NUMBER,
    BASE_PRICE_GBP      NUMBER(10,2),
    PRICE_BAND          VARCHAR(20),        -- Budget £2k-5k / Mid £5k-10k / Premium £10k-20k / Ultra £20k+
    INCLUDED_FLIGHTS    BOOLEAN,
    ALL_INCLUSIVE       BOOLEAN,
    MAX_GROUP_SIZE      NUMBER,
    MIN_PASSENGERS      NUMBER,
    ACCOMMODATION_TIER  VARCHAR(100),
    IS_ACTIVE           BOOLEAN             DEFAULT TRUE,
    LAUNCH_DATE         DATE,
    DISCONTINUE_DATE    DATE,
    -- Audit
    _CREATED_AT         TIMESTAMP_NTZ       DEFAULT CURRENT_TIMESTAMP(),
    _UPDATED_AT         TIMESTAMP_NTZ       DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT PK_DIM_PRODUCT PRIMARY KEY (PRODUCT_SK)
)
COMMENT = 'Holiday package dimension — all Kuoni products and packages';

-- =============================================================================
-- DIM_AGENT
-- Source: HR system / CRM agent records
-- Sales consultant dimension
-- =============================================================================

CREATE TABLE IF NOT EXISTS DIM_AGENT (
    AGENT_SK            NUMBER          NOT NULL AUTOINCREMENT,
    AGENT_ID            VARCHAR(50)     NOT NULL,
    AGENT_NAME          VARCHAR(200),
    BRANCH_CODE         VARCHAR(20),
    BRANCH_NAME         VARCHAR(200),
    REGION              VARCHAR(100),
    SPECIALISATION      VARCHAR(200),   -- e.g. 'Indian Ocean & Maldives'
    HIRE_DATE           DATE,
    IS_ACTIVE           BOOLEAN         DEFAULT TRUE,
    -- Audit
    _CREATED_AT         TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT PK_DIM_AGENT PRIMARY KEY (AGENT_SK)
)
COMMENT = 'Sales consultant / travel agent dimension';

-- =============================================================================
-- FCT_BOOKING
-- Source: BRONZE.RAW_BOOKINGS
-- Cleansed booking fact — one row per booking
-- =============================================================================

CREATE TABLE IF NOT EXISTS FCT_BOOKING (
    BOOKING_SK          NUMBER          NOT NULL AUTOINCREMENT,
    BOOKING_ID          VARCHAR(50)     NOT NULL,
    -- Foreign keys (surrogate)
    CUSTOMER_SK         NUMBER,
    PRODUCT_SK          NUMBER,
    DESTINATION_SK      NUMBER,
    AGENT_SK            NUMBER,
    -- Date keys
    BOOKING_DATE_KEY    NUMBER,         -- FK to DIM_DATE
    TRAVEL_DATE_KEY     NUMBER,
    RETURN_DATE_KEY     NUMBER,
    -- Measures
    NUM_PASSENGERS      NUMBER,
    TOTAL_VALUE_GBP     NUMBER(12,2),
    DEPOSIT_AMOUNT_GBP  NUMBER(12,2),
    MARGIN_PCT          NUMBER(5,2),
    MARGIN_GBP          NUMBER(12,2),   -- derived: total_value * margin_pct
    VALUE_PER_PAX_GBP   NUMBER(12,2),   -- derived: total_value / num_passengers
    -- Attributes
    STATUS              VARCHAR(50),
    CHANNEL             VARCHAR(50),
    INSURANCE_INCLUDED  BOOLEAN,
    LEAD_TIME_DAYS      NUMBER,         -- booking_date to travel_date
    IS_CANCELLED        BOOLEAN         DEFAULT FALSE,
    CANCELLATION_DATE   DATE,
    -- Audit
    _CREATED_AT         TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _UPDATED_AT         TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _SOURCE_BATCH_ID    VARCHAR(100),
    CONSTRAINT PK_FCT_BOOKING PRIMARY KEY (BOOKING_SK)
)
COMMENT = 'Cleansed booking fact — one row per booking, all dimensions resolved';

-- =============================================================================
-- FCT_INTERACTION
-- Source: BRONZE.RAW_INTERACTIONS
-- Cleansed interaction events — customer touchpoints
-- =============================================================================

CREATE TABLE IF NOT EXISTS FCT_INTERACTION (
    INTERACTION_SK      NUMBER          NOT NULL AUTOINCREMENT,
    INTERACTION_ID      VARCHAR(50)     NOT NULL,
    CUSTOMER_SK         NUMBER,
    AGENT_SK            NUMBER,
    INTERACTION_DATE_KEY NUMBER,
    -- Attributes
    INTERACTION_DATETIME TIMESTAMP_NTZ,
    CHANNEL             VARCHAR(50),
    INTERACTION_TYPE    VARCHAR(100),
    DURATION_MINS       NUMBER,
    OUTCOME             VARCHAR(100),
    DESTINATION_INTEREST VARCHAR(200),
    BUDGET_LOW_GBP      NUMBER,
    BUDGET_HIGH_GBP     NUMBER,
    TRAVEL_PARTY_SIZE   NUMBER,
    REFERRAL_SOURCE     VARCHAR(200),
    -- Derived
    IS_CONVERTED        BOOLEAN,        -- did this lead to a booking?
    BOOKING_ID          VARCHAR(50),    -- if converted, which booking
    -- Audit
    _CREATED_AT         TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT PK_FCT_INTERACTION PRIMARY KEY (INTERACTION_SK)
)
COMMENT = 'Cleansed interaction fact — all customer touchpoints with conversion tracking';

-- =============================================================================
-- INDEXES (Snowflake: clustering keys for large tables)
-- =============================================================================

ALTER TABLE FCT_BOOKING CLUSTER BY (BOOKING_DATE_KEY, STATUS);
ALTER TABLE FCT_INTERACTION CLUSTER BY (INTERACTION_DATE_KEY, CHANNEL);

-- =============================================================================
-- VERIFY
-- =============================================================================

SHOW TABLES IN SCHEMA KUONI_DW.SILVER;
