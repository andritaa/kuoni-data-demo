-- =============================================================================
-- KUONI DATA PLATFORM - GOLD LAYER
-- Analytics / Business Layer — Pre-aggregated for performance
-- Named in business language — feeds BI tools, APIs, dashboards
-- All objects are VIEWS over SILVER for freshness, or TABLES for performance
-- =============================================================================

USE DATABASE KUONI_DW;
USE SCHEMA GOLD;
USE WAREHOUSE KUONI_WH_ETL;

-- =============================================================================
-- RPT_REVENUE_BY_DESTINATION
-- Monthly revenue by destination and region
-- Feeds: Revenue trend charts, destination performance dashboards
-- =============================================================================

CREATE OR REPLACE VIEW RPT_REVENUE_BY_DESTINATION AS
SELECT
    dd.YEAR,
    dd.MONTH_NUM,
    dd.MONTH_NAME,
    dd.YEAR || '-' || LPAD(dd.MONTH_NUM::VARCHAR, 2, '0')   AS YEAR_MONTH,
    dd.QUARTER_NAME,
    dd.FISCAL_YEAR,
    dest.DESTINATION_ID,
    dest.DESTINATION_NAME,
    dest.COUNTRY,
    dest.REGION                                              AS DESTINATION_REGION,
    dest.CONTINENT,
    dest.TIER                                                AS DESTINATION_TIER,
    COUNT(DISTINCT fb.BOOKING_SK)                            AS NUM_BOOKINGS,
    COUNT(DISTINCT fb.CUSTOMER_SK)                           AS NUM_UNIQUE_CUSTOMERS,
    SUM(fb.NUM_PASSENGERS)                                   AS TOTAL_PASSENGERS,
    SUM(fb.TOTAL_VALUE_GBP)                                  AS TOTAL_REVENUE_GBP,
    AVG(fb.TOTAL_VALUE_GBP)                                  AS AVG_BOOKING_VALUE_GBP,
    SUM(fb.MARGIN_GBP)                                       AS TOTAL_MARGIN_GBP,
    AVG(fb.MARGIN_PCT)                                       AS AVG_MARGIN_PCT,
    SUM(fb.TOTAL_VALUE_GBP) / NULLIF(COUNT(DISTINCT fb.BOOKING_SK), 0) AS REVENUE_PER_BOOKING
FROM SILVER.FCT_BOOKING fb
JOIN SILVER.DIM_DATE dd ON fb.BOOKING_DATE_KEY = dd.DATE_KEY
JOIN SILVER.DIM_DESTINATION dest ON fb.DESTINATION_SK = dest.DESTINATION_SK
WHERE fb.STATUS IN ('Confirmed', 'Completed')
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12
ORDER BY 1 DESC, 2 DESC, 16 DESC;

-- =============================================================================
-- RPT_CUSTOMER_LTV
-- Customer lifetime value segmentation
-- Feeds: CRM targeting, loyalty programme, marketing spend allocation
-- =============================================================================

CREATE OR REPLACE VIEW RPT_CUSTOMER_LTV AS
WITH booking_summary AS (
    SELECT
        c.CUSTOMER_SK,
        c.CUSTOMER_ID,
        c.FULL_NAME,
        c.EMAIL,
        c.SEGMENT,
        c.LOYALTY_TIER,
        c.POSTCODE_DISTRICT,
        c.REGION,
        c.AGE_BAND,
        c.JOIN_DATE,
        COUNT(DISTINCT fb.BOOKING_SK)           AS TOTAL_BOOKINGS,
        SUM(fb.TOTAL_VALUE_GBP)                 AS TOTAL_SPEND_GBP,
        AVG(fb.TOTAL_VALUE_GBP)                 AS AVG_BOOKING_VALUE_GBP,
        MAX(fb.TOTAL_VALUE_GBP)                 AS MAX_BOOKING_VALUE_GBP,
        MIN(dd.FULL_DATE)                        AS FIRST_BOOKING_DATE,
        MAX(dd.FULL_DATE)                        AS LAST_BOOKING_DATE,
        DATEDIFF(day, MIN(dd.FULL_DATE), MAX(dd.FULL_DATE)) AS CUSTOMER_TENURE_DAYS,
        COUNT(DISTINCT dest.CONTINENT)           AS CONTINENTS_VISITED,
        COUNT(DISTINCT fb.DESTINATION_SK)        AS DESTINATIONS_VISITED,
        SUM(CASE WHEN fb.STATUS = 'Cancelled' THEN 1 ELSE 0 END) AS CANCELLATIONS
    FROM SILVER.DIM_CUSTOMER c
    LEFT JOIN SILVER.FCT_BOOKING fb ON c.CUSTOMER_SK = fb.CUSTOMER_SK
        AND fb.STATUS IN ('Confirmed', 'Completed')
    LEFT JOIN SILVER.DIM_DATE dd ON fb.BOOKING_DATE_KEY = dd.DATE_KEY
    LEFT JOIN SILVER.DIM_DESTINATION dest ON fb.DESTINATION_SK = dest.DESTINATION_SK
    WHERE c.IS_CURRENT = TRUE
    GROUP BY 1,2,3,4,5,6,7,8,9,10
),
ltv_bands AS (
    SELECT *,
        CASE
            WHEN TOTAL_SPEND_GBP >= 50000 THEN 'Platinum'
            WHEN TOTAL_SPEND_GBP >= 25000 THEN 'Gold'
            WHEN TOTAL_SPEND_GBP >= 10000 THEN 'Silver'
            WHEN TOTAL_SPEND_GBP >= 5000  THEN 'Bronze'
            ELSE 'New'
        END AS LTV_BAND,
        -- Predicted annual value based on booking frequency
        CASE
            WHEN CUSTOMER_TENURE_DAYS > 0
            THEN (TOTAL_SPEND_GBP / CUSTOMER_TENURE_DAYS) * 365
            ELSE 0
        END AS PREDICTED_ANNUAL_VALUE_GBP
    FROM booking_summary
)
SELECT
    *,
    NTILE(10) OVER (ORDER BY TOTAL_SPEND_GBP) AS LTV_DECILE,
    NTILE(4)  OVER (ORDER BY TOTAL_SPEND_GBP) AS LTV_QUARTILE
FROM ltv_bands;

-- =============================================================================
-- RPT_BOOKING_FUNNEL
-- Enquiry → Quote → Booking → Completion conversion tracking
-- Feeds: Sales performance, agent coaching, channel attribution
-- =============================================================================

CREATE OR REPLACE VIEW RPT_BOOKING_FUNNEL AS
WITH funnel AS (
    SELECT
        dd.YEAR,
        dd.MONTH_NUM,
        dd.MONTH_NAME,
        dd.YEAR || '-' || LPAD(dd.MONTH_NUM::VARCHAR, 2, '0') AS YEAR_MONTH,
        fi.CHANNEL,
        fi.INTERACTION_TYPE,
        COUNT(DISTINCT fi.INTERACTION_SK)                       AS INTERACTION_COUNT,
        COUNT(DISTINCT fi.CUSTOMER_SK)                          AS UNIQUE_CUSTOMERS,
        SUM(CASE WHEN fi.IS_CONVERTED THEN 1 ELSE 0 END)        AS CONVERTED_COUNT,
        AVG(fi.DURATION_MINS)                                   AS AVG_DURATION_MINS
    FROM SILVER.FCT_INTERACTION fi
    JOIN SILVER.DIM_DATE dd ON fi.INTERACTION_DATE_KEY = dd.DATE_KEY
    GROUP BY 1,2,3,4,5,6
),
bookings_by_channel AS (
    SELECT
        dd.YEAR,
        dd.MONTH_NUM,
        fb.CHANNEL,
        COUNT(DISTINCT fb.BOOKING_SK)   AS BOOKINGS,
        SUM(fb.TOTAL_VALUE_GBP)         AS REVENUE_GBP
    FROM SILVER.FCT_BOOKING fb
    JOIN SILVER.DIM_DATE dd ON fb.BOOKING_DATE_KEY = dd.DATE_KEY
    WHERE fb.STATUS IN ('Confirmed', 'Completed')
    GROUP BY 1,2,3
)
SELECT
    f.*,
    ROUND(f.CONVERTED_COUNT / NULLIF(f.INTERACTION_COUNT, 0) * 100, 2) AS CONVERSION_RATE_PCT
FROM funnel f
ORDER BY 1 DESC, 2 DESC;

-- =============================================================================
-- RPT_TOP_PRODUCTS
-- Best-selling holiday packages by revenue, bookings, and margin
-- Feeds: Product team, marketing, brochure planning
-- =============================================================================

CREATE OR REPLACE VIEW RPT_TOP_PRODUCTS AS
SELECT
    p.PRODUCT_ID,
    p.PRODUCT_NAME,
    p.PRODUCT_TYPE,
    p.DURATION_DAYS,
    p.BASE_PRICE_GBP,
    p.PRICE_BAND,
    p.INCLUDED_FLIGHTS,
    p.ALL_INCLUSIVE,
    dest.DESTINATION_NAME,
    dest.COUNTRY,
    dest.REGION,
    dest.TIER                                           AS DESTINATION_TIER,
    COUNT(DISTINCT fb.BOOKING_SK)                       AS TOTAL_BOOKINGS,
    SUM(fb.TOTAL_VALUE_GBP)                             AS TOTAL_REVENUE_GBP,
    AVG(fb.TOTAL_VALUE_GBP)                             AS AVG_BOOKING_VALUE_GBP,
    SUM(fb.MARGIN_GBP)                                  AS TOTAL_MARGIN_GBP,
    AVG(fb.MARGIN_PCT)                                  AS AVG_MARGIN_PCT,
    SUM(fb.NUM_PASSENGERS)                              AS TOTAL_PASSENGERS,
    -- Rolling 12m
    SUM(CASE WHEN fb.BOOKING_DATE_KEY >= TO_NUMBER(TO_CHAR(DATEADD(year, -1, CURRENT_DATE()), 'YYYYMMDD'))
             THEN fb.TOTAL_VALUE_GBP ELSE 0 END)        AS REVENUE_LAST_12M_GBP,
    COUNT(CASE WHEN fb.STATUS = 'Cancelled' THEN 1 END) AS CANCELLATIONS,
    ROUND(COUNT(CASE WHEN fb.STATUS = 'Cancelled' THEN 1 END) / 
          NULLIF(COUNT(DISTINCT fb.BOOKING_SK), 0) * 100, 2) AS CANCELLATION_RATE_PCT,
    RANK() OVER (ORDER BY SUM(fb.TOTAL_VALUE_GBP) DESC) AS REVENUE_RANK
FROM SILVER.DIM_PRODUCT p
JOIN SILVER.FCT_BOOKING fb ON p.PRODUCT_SK = fb.PRODUCT_SK
JOIN SILVER.DIM_DESTINATION dest ON p.DESTINATION_SK = dest.DESTINATION_SK
WHERE fb.STATUS IN ('Confirmed', 'Completed')
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12
ORDER BY TOTAL_REVENUE_GBP DESC;

-- =============================================================================
-- RPT_SEASONAL_TRENDS
-- Weekly/monthly demand patterns by destination tier and product type
-- Feeds: Capacity planning, dynamic pricing, supplier negotiations
-- =============================================================================

CREATE OR REPLACE VIEW RPT_SEASONAL_TRENDS AS
SELECT
    dd.YEAR,
    dd.MONTH_NUM,
    dd.MONTH_NAME,
    dd.MONTH_ABBR,
    dd.QUARTER_NAME,
    dd.IS_PEAK_TRAVEL,
    dest.CONTINENT,
    dest.TIER                                   AS DESTINATION_TIER,
    p.PRODUCT_TYPE,
    COUNT(DISTINCT fb.BOOKING_SK)               AS BOOKINGS,
    SUM(fb.TOTAL_VALUE_GBP)                     AS REVENUE_GBP,
    AVG(fb.TOTAL_VALUE_GBP)                     AS AVG_BOOKING_VALUE,
    SUM(fb.NUM_PASSENGERS)                      AS PASSENGERS,
    AVG(fb.LEAD_TIME_DAYS)                      AS AVG_LEAD_TIME_DAYS,
    -- Year-over-year comparison
    LAG(COUNT(DISTINCT fb.BOOKING_SK), 12) OVER (
        PARTITION BY dest.CONTINENT, dest.TIER, p.PRODUCT_TYPE
        ORDER BY dd.YEAR, dd.MONTH_NUM
    )                                           AS BOOKINGS_PRIOR_YEAR,
    ROUND(
        (COUNT(DISTINCT fb.BOOKING_SK) - LAG(COUNT(DISTINCT fb.BOOKING_SK), 12) OVER (
            PARTITION BY dest.CONTINENT, dest.TIER, p.PRODUCT_TYPE
            ORDER BY dd.YEAR, dd.MONTH_NUM
        )) / NULLIF(LAG(COUNT(DISTINCT fb.BOOKING_SK), 12) OVER (
            PARTITION BY dest.CONTINENT, dest.TIER, p.PRODUCT_TYPE
            ORDER BY dd.YEAR, dd.MONTH_NUM
        ), 0) * 100, 2
    )                                           AS BOOKINGS_YOY_PCT
FROM SILVER.FCT_BOOKING fb
JOIN SILVER.DIM_DATE dd ON fb.BOOKING_DATE_KEY = dd.DATE_KEY
JOIN SILVER.DIM_DESTINATION dest ON fb.DESTINATION_SK = dest.DESTINATION_SK
JOIN SILVER.DIM_PRODUCT p ON fb.PRODUCT_SK = p.PRODUCT_SK
WHERE fb.STATUS IN ('Confirmed', 'Completed')
GROUP BY 1,2,3,4,5,6,7,8,9
ORDER BY 1 DESC, 2 DESC;

-- =============================================================================
-- RPT_AGENT_PERFORMANCE
-- Sales consultant KPIs — conversion, revenue, margin, avg booking value
-- Feeds: HR performance reviews, commission calculations, training needs
-- =============================================================================

CREATE OR REPLACE VIEW RPT_AGENT_PERFORMANCE AS
WITH agent_metrics AS (
    SELECT
        a.AGENT_ID,
        a.AGENT_NAME,
        a.BRANCH_NAME,
        a.REGION                                AS AGENT_REGION,
        a.SPECIALISATION,
        dd.YEAR,
        dd.QUARTER_NAME,
        COUNT(DISTINCT fb.BOOKING_SK)           AS BOOKINGS,
        SUM(fb.TOTAL_VALUE_GBP)                 AS REVENUE_GBP,
        AVG(fb.TOTAL_VALUE_GBP)                 AS AVG_BOOKING_VALUE_GBP,
        SUM(fb.MARGIN_GBP)                      AS MARGIN_GBP,
        AVG(fb.MARGIN_PCT)                      AS AVG_MARGIN_PCT,
        COUNT(DISTINCT fb.CUSTOMER_SK)          AS UNIQUE_CUSTOMERS,
        SUM(fb.NUM_PASSENGERS)                  AS TOTAL_PASSENGERS,
        COUNT(CASE WHEN fb.STATUS = 'Cancelled' THEN 1 END) AS CANCELLATIONS
    FROM SILVER.DIM_AGENT a
    JOIN SILVER.FCT_BOOKING fb ON a.AGENT_SK = fb.AGENT_SK
    JOIN SILVER.DIM_DATE dd ON fb.BOOKING_DATE_KEY = dd.DATE_KEY
    WHERE fb.STATUS IN ('Confirmed', 'Completed', 'Cancelled')
    GROUP BY 1,2,3,4,5,6,7
),
interaction_metrics AS (
    SELECT
        a.AGENT_ID,
        dd.YEAR,
        dd.QUARTER_NAME,
        COUNT(DISTINCT fi.INTERACTION_SK)       AS TOTAL_INTERACTIONS,
        SUM(CASE WHEN fi.IS_CONVERTED THEN 1 ELSE 0 END) AS CONVERTED_INTERACTIONS
    FROM SILVER.DIM_AGENT a
    JOIN SILVER.FCT_INTERACTION fi ON a.AGENT_SK = fi.AGENT_SK
    JOIN SILVER.DIM_DATE dd ON fi.INTERACTION_DATE_KEY = dd.DATE_KEY
    GROUP BY 1,2,3
)
SELECT
    am.*,
    im.TOTAL_INTERACTIONS,
    im.CONVERTED_INTERACTIONS,
    ROUND(im.CONVERTED_INTERACTIONS / NULLIF(im.TOTAL_INTERACTIONS, 0) * 100, 2) AS CONVERSION_RATE_PCT,
    ROUND(am.CANCELLATIONS / NULLIF(am.BOOKINGS + am.CANCELLATIONS, 0) * 100, 2)  AS CANCELLATION_RATE_PCT,
    RANK() OVER (PARTITION BY am.YEAR, am.QUARTER_NAME ORDER BY am.REVENUE_GBP DESC) AS REVENUE_RANK,
    NTILE(4) OVER (PARTITION BY am.YEAR, am.QUARTER_NAME ORDER BY am.REVENUE_GBP) AS PERFORMANCE_QUARTILE
FROM agent_metrics am
LEFT JOIN interaction_metrics im
    ON am.AGENT_ID = im.AGENT_ID
    AND am.YEAR = im.YEAR
    AND am.QUARTER_NAME = im.QUARTER_NAME
ORDER BY am.YEAR DESC, am.QUARTER_NAME, am.REVENUE_GBP DESC;

-- =============================================================================
-- RPT_OVERVIEW_KPI
-- Headline KPIs for executive dashboard
-- Feeds: Executive landing page, board reports
-- =============================================================================

CREATE OR REPLACE VIEW RPT_OVERVIEW_KPI AS
SELECT
    COUNT(DISTINCT fb.BOOKING_SK)                               AS TOTAL_BOOKINGS,
    SUM(fb.TOTAL_VALUE_GBP)                                     AS TOTAL_REVENUE_GBP,
    AVG(fb.TOTAL_VALUE_GBP)                                     AS AVG_BOOKING_VALUE_GBP,
    SUM(fb.MARGIN_GBP)                                          AS TOTAL_MARGIN_GBP,
    AVG(fb.MARGIN_PCT)                                          AS AVG_MARGIN_PCT,
    COUNT(DISTINCT fb.CUSTOMER_SK)                              AS ACTIVE_CUSTOMERS,
    -- Current year
    SUM(CASE WHEN dd.YEAR = YEAR(CURRENT_DATE()) THEN fb.TOTAL_VALUE_GBP ELSE 0 END) AS REVENUE_CY_GBP,
    COUNT(CASE WHEN dd.YEAR = YEAR(CURRENT_DATE()) THEN 1 END)  AS BOOKINGS_CY,
    -- Prior year
    SUM(CASE WHEN dd.YEAR = YEAR(CURRENT_DATE()) - 1 THEN fb.TOTAL_VALUE_GBP ELSE 0 END) AS REVENUE_PY_GBP,
    COUNT(CASE WHEN dd.YEAR = YEAR(CURRENT_DATE()) - 1 THEN 1 END) AS BOOKINGS_PY,
    -- Top destination
    (SELECT DESTINATION_NAME FROM RPT_REVENUE_BY_DESTINATION LIMIT 1) AS TOP_DESTINATION,
    CURRENT_TIMESTAMP()                                         AS REFRESHED_AT
FROM SILVER.FCT_BOOKING fb
JOIN SILVER.DIM_DATE dd ON fb.BOOKING_DATE_KEY = dd.DATE_KEY
WHERE fb.STATUS IN ('Confirmed', 'Completed');

-- =============================================================================
-- VERIFY
-- =============================================================================

SHOW VIEWS IN SCHEMA KUONI_DW.GOLD;
