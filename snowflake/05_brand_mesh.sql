-- =============================================================================
-- KUONI / DERTOUR GROUP — DATA MESH: BRAND LAYER
-- Simulates multi-brand DERTOUR Northern Europe structure
-- Brands: Kuoni UK, Kuoni France, Apollo, Prijsvrij Vakanties, D-reizen
-- Strategy: Partition existing bookings across brands using deterministic hash
--           so data is consistent and realistic on every query
-- =============================================================================

USE DATABASE KUONI_DW;
USE WAREHOUSE KUONI_WH_ETL;

-- =============================================================================
-- SILVER.DIM_BRAND
-- Brand registry — each DERTOUR Northern Europe entity
-- =============================================================================

CREATE TABLE IF NOT EXISTS SILVER.DIM_BRAND (
    BRAND_SK            NUMBER          NOT NULL AUTOINCREMENT,
    BRAND_ID            VARCHAR(50)     NOT NULL,
    BRAND_NAME          VARCHAR(200)    NOT NULL,
    COUNTRY             VARCHAR(100),
    MARKET              VARCHAR(100),
    BRAND_TYPE          VARCHAR(100),   -- Premium, Luxury, Online, Package
    PARENT_UNIT         VARCHAR(100),   -- DERTOUR Northern Europe
    CURRENCY            VARCHAR(10),
    REVENUE_SHARE_PCT   NUMBER(5,2),    -- % of NE portfolio
    HEADCOUNT           NUMBER,
    STORE_COUNT         NUMBER,
    IS_ACTIVE           BOOLEAN         DEFAULT TRUE,
    _CREATED_AT         TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    CONSTRAINT PK_DIM_BRAND PRIMARY KEY (BRAND_SK)
) COMMENT = 'DERTOUR Northern Europe brand registry — all operating entities';

-- Seed brand data
INSERT INTO SILVER.DIM_BRAND (BRAND_ID, BRAND_NAME, COUNTRY, MARKET, BRAND_TYPE, PARENT_UNIT, CURRENCY, REVENUE_SHARE_PCT, HEADCOUNT, STORE_COUNT)
SELECT * FROM VALUES
    ('KUONI_UK',    'Kuoni UK',             'United Kingdom',    'UK',          'Luxury & Premium',      'DERTOUR Northern Europe', 'GBP', 42.0, 550, 53),
    ('KUONI_FR',    'Kuoni France',          'France',           'France',      'Luxury & Premium',      'DERTOUR Northern Europe', 'EUR', 18.0, 210, 31),
    ('APOLLO',      'Apollo Travel',         'Sweden',           'Nordics',     'Package & Sun/Beach',   'DERTOUR Northern Europe', 'SEK', 24.0, 480, 0),
    ('PRIJSVRIJ',   'Prijsvrij Vakanties',   'Netherlands',      'Netherlands', 'Online Travel',         'DERTOUR Northern Europe', 'EUR', 10.0, 95,  0),
    ('DREIZEN',     'D-reizen',              'Belgium',          'Belgium',     'Online & Independent',  'DERTOUR Northern Europe', 'EUR',  6.0, 320, 148)
AS t(BRAND_ID, BRAND_NAME, COUNTRY, MARKET, BRAND_TYPE, PARENT_UNIT, CURRENCY, REVENUE_SHARE_PCT, HEADCOUNT, STORE_COUNT);


-- =============================================================================
-- SILVER.VW_FCT_BOOKING_BY_BRAND
-- Assigns each booking to a brand using deterministic hash
-- Shares: Kuoni UK 42%, Kuoni FR 18%, Apollo 24%, Prijsvrij 10%, D-reizen 6%
-- Currency conversion applied (approximate for demo purposes)
-- =============================================================================

CREATE OR REPLACE VIEW SILVER.VW_FCT_BOOKING_BY_BRAND AS
WITH brand_assignment AS (
    SELECT
        fb.*,
        -- Deterministic assignment based on booking_sk modulo — consistent across queries
        CASE
            WHEN MOD(fb.BOOKING_SK, 100) < 42  THEN 'KUONI_UK'
            WHEN MOD(fb.BOOKING_SK, 100) < 60  THEN 'KUONI_FR'
            WHEN MOD(fb.BOOKING_SK, 100) < 84  THEN 'APOLLO'
            WHEN MOD(fb.BOOKING_SK, 100) < 94  THEN 'PRIJSVRIJ'
            ELSE                                     'DREIZEN'
        END AS BRAND_ID,
        -- Currency conversion (illustrative — GBP base)
        CASE
            WHEN MOD(fb.BOOKING_SK, 100) < 42  THEN fb.TOTAL_VALUE_GBP * 1.00   -- GBP
            WHEN MOD(fb.BOOKING_SK, 100) < 60  THEN fb.TOTAL_VALUE_GBP * 1.17   -- EUR
            WHEN MOD(fb.BOOKING_SK, 100) < 84  THEN fb.TOTAL_VALUE_GBP * 13.50  -- SEK (approx)
            WHEN MOD(fb.BOOKING_SK, 100) < 94  THEN fb.TOTAL_VALUE_GBP * 1.17   -- EUR
            ELSE                                     fb.TOTAL_VALUE_GBP * 1.17   -- EUR
        END AS TOTAL_VALUE_LOCAL_CCY,
        fb.TOTAL_VALUE_GBP AS TOTAL_VALUE_GBP_EQUIV   -- keep GBP equivalent for group rollup
    FROM SILVER.FCT_BOOKING fb
    WHERE fb.STATUS IN ('Confirmed', 'Completed')
)
SELECT
    ba.*,
    b.BRAND_NAME,
    b.COUNTRY AS BRAND_COUNTRY,
    b.MARKET,
    b.BRAND_TYPE,
    b.CURRENCY AS BRAND_CURRENCY,
    b.REVENUE_SHARE_PCT
FROM brand_assignment ba
JOIN SILVER.DIM_BRAND b ON ba.BRAND_ID = b.BRAND_ID;


-- =============================================================================
-- DATA_PRODUCTS.DP_BRAND_PERFORMANCE
-- Monthly KPIs per brand — feeds DERTOUR Group reporting
-- Domain: DERTOUR Northern Europe
-- SLA: PLATINUM — board-level reporting
-- =============================================================================

CREATE OR REPLACE SECURE VIEW DATA_PRODUCTS.DP_BRAND_PERFORMANCE
    COMMENT = 'DERTOUR Northern Europe — monthly brand performance. Domain: Group. SLA: PLATINUM.'
AS
SELECT
    bb.BRAND_ID,
    bb.BRAND_NAME,
    bb.BRAND_COUNTRY,
    bb.MARKET,
    bb.BRAND_TYPE,
    bb.BRAND_CURRENCY,
    bb.REVENUE_SHARE_PCT,
    dd.YEAR,
    dd.MONTH_NUM,
    dd.MONTH_NAME,
    dd.YEAR || '-' || LPAD(dd.MONTH_NUM::VARCHAR, 2, '0')   AS YEAR_MONTH,
    dd.QUARTER_NAME,
    -- Volume
    COUNT(DISTINCT bb.BOOKING_SK)                            AS BOOKINGS,
    COUNT(DISTINCT bb.CUSTOMER_SK)                           AS UNIQUE_CUSTOMERS,
    SUM(bb.NUM_PASSENGERS)                                   AS TOTAL_PASSENGERS,
    -- Revenue (local ccy)
    SUM(bb.TOTAL_VALUE_LOCAL_CCY)                            AS REVENUE_LOCAL_CCY,
    AVG(bb.TOTAL_VALUE_LOCAL_CCY)                            AS AVG_BOOKING_VALUE_LOCAL_CCY,
    -- Revenue (GBP equivalent — for group rollup)
    SUM(bb.TOTAL_VALUE_GBP_EQUIV)                            AS REVENUE_GBP_EQUIV,
    AVG(bb.TOTAL_VALUE_GBP_EQUIV)                            AS AVG_BOOKING_VALUE_GBP,
    -- Margin
    SUM(bb.MARGIN_GBP)                                       AS MARGIN_GBP,
    AVG(bb.MARGIN_PCT)                                       AS AVG_MARGIN_PCT,
    -- Cancellations
    COUNT(CASE WHEN bb.STATUS = 'Cancelled' THEN 1 END)      AS CANCELLATIONS,
    -- YoY (requires self-join via window, simplified here as LAG)
    LAG(COUNT(DISTINCT bb.BOOKING_SK), 12) OVER (
        PARTITION BY bb.BRAND_ID
        ORDER BY dd.YEAR, dd.MONTH_NUM
    ) AS BOOKINGS_PRIOR_YEAR,
    ROUND(
        (COUNT(DISTINCT bb.BOOKING_SK) - LAG(COUNT(DISTINCT bb.BOOKING_SK), 12) OVER (
            PARTITION BY bb.BRAND_ID ORDER BY dd.YEAR, dd.MONTH_NUM
        )) / NULLIF(LAG(COUNT(DISTINCT bb.BOOKING_SK), 12) OVER (
            PARTITION BY bb.BRAND_ID ORDER BY dd.YEAR, dd.MONTH_NUM
        ), 0) * 100, 2
    ) AS BOOKINGS_YOY_PCT
FROM SILVER.VW_FCT_BOOKING_BY_BRAND bb
JOIN SILVER.DIM_DATE dd ON bb.BOOKING_DATE_KEY = dd.DATE_KEY
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12;


-- =============================================================================
-- DATA_PRODUCTS.DP_BRAND_ROLLUP
-- Single-row summary per brand — all-time KPIs
-- Powers the Group CIO dashboard consolidation view
-- =============================================================================

CREATE OR REPLACE SECURE VIEW DATA_PRODUCTS.DP_BRAND_ROLLUP
    COMMENT = 'DERTOUR Northern Europe — brand KPI summary (all-time). Domain: Group. SLA: PLATINUM.'
AS
SELECT
    bb.BRAND_ID,
    bb.BRAND_NAME,
    bb.BRAND_COUNTRY,
    bb.MARKET,
    bb.BRAND_TYPE,
    bb.BRAND_CURRENCY,
    bb.REVENUE_SHARE_PCT,
    COUNT(DISTINCT bb.BOOKING_SK)       AS TOTAL_BOOKINGS,
    COUNT(DISTINCT bb.CUSTOMER_SK)      AS TOTAL_CUSTOMERS,
    ROUND(SUM(bb.TOTAL_VALUE_GBP_EQUIV), 0)     AS TOTAL_REVENUE_GBP,
    ROUND(AVG(bb.TOTAL_VALUE_GBP_EQUIV), 0)     AS AVG_BOOKING_VALUE_GBP,
    ROUND(SUM(bb.MARGIN_GBP), 0)                AS TOTAL_MARGIN_GBP,
    ROUND(AVG(bb.MARGIN_PCT) * 100, 1)          AS AVG_MARGIN_PCT,
    -- Group share
    ROUND(SUM(bb.TOTAL_VALUE_GBP_EQUIV) / SUM(SUM(bb.TOTAL_VALUE_GBP_EQUIV)) OVER () * 100, 1) AS ACTUAL_REVENUE_SHARE_PCT,
    MIN(bb.BOOKING_SK)  AS _FIRST_BOOKING_SK,   -- debug
    MAX(bb.BOOKING_SK)  AS _LAST_BOOKING_SK
FROM SILVER.VW_FCT_BOOKING_BY_BRAND bb
GROUP BY 1,2,3,4,5,6,7;


-- =============================================================================
-- DATA_PRODUCTS.DP_BRAND_DESTINATION_MIX
-- How each brand's destination portfolio differs — personalisation intelligence
-- =============================================================================

CREATE OR REPLACE SECURE VIEW DATA_PRODUCTS.DP_BRAND_DESTINATION_MIX
    COMMENT = 'DERTOUR Northern Europe — destination portfolio by brand. Domain: Group. SLA: GOLD.'
AS
SELECT
    bb.BRAND_ID,
    bb.BRAND_NAME,
    bb.MARKET,
    dest.DESTINATION_NAME,
    dest.CONTINENT,
    dest.TIER AS DESTINATION_TIER,
    COUNT(DISTINCT bb.BOOKING_SK)           AS BOOKINGS,
    SUM(bb.TOTAL_VALUE_GBP_EQUIV)           AS REVENUE_GBP,
    ROUND(AVG(bb.TOTAL_VALUE_GBP_EQUIV), 0) AS AVG_BOOKING_VALUE_GBP,
    -- Share of brand's own portfolio
    ROUND(
        COUNT(DISTINCT bb.BOOKING_SK) /
        SUM(COUNT(DISTINCT bb.BOOKING_SK)) OVER (PARTITION BY bb.BRAND_ID) * 100, 1
    ) AS PCT_OF_BRAND_BOOKINGS
FROM SILVER.VW_FCT_BOOKING_BY_BRAND bb
JOIN SILVER.DIM_DESTINATION dest ON bb.DESTINATION_SK = dest.DESTINATION_SK
GROUP BY 1,2,3,4,5,6;


-- =============================================================================
-- TAG all new data products
-- =============================================================================

ALTER VIEW DATA_PRODUCTS.DP_BRAND_PERFORMANCE    SET TAG GOVERNANCE.DATA_DOMAIN = 'Group';
ALTER VIEW DATA_PRODUCTS.DP_BRAND_ROLLUP         SET TAG GOVERNANCE.DATA_DOMAIN = 'Group';
ALTER VIEW DATA_PRODUCTS.DP_BRAND_DESTINATION_MIX SET TAG GOVERNANCE.DATA_DOMAIN = 'Group';
ALTER VIEW DATA_PRODUCTS.DP_BRAND_PERFORMANCE    SET TAG GOVERNANCE.SLA_TIER = 'PLATINUM';
ALTER VIEW DATA_PRODUCTS.DP_BRAND_ROLLUP         SET TAG GOVERNANCE.SLA_TIER = 'PLATINUM';
ALTER VIEW DATA_PRODUCTS.DP_BRAND_DESTINATION_MIX SET TAG GOVERNANCE.SLA_TIER = 'GOLD';

-- =============================================================================
-- VERIFY
-- =============================================================================

-- Quick sanity check: each brand should have data
SELECT BRAND_NAME, TOTAL_BOOKINGS, TOTAL_REVENUE_GBP, AVG_BOOKING_VALUE_GBP, AVG_MARGIN_PCT
FROM DATA_PRODUCTS.DP_BRAND_ROLLUP
ORDER BY TOTAL_REVENUE_GBP DESC;
