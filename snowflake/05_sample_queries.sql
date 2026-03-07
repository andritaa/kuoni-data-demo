-- =============================================================================
-- KUONI DATA PLATFORM - DEMO QUERIES
-- Showcase queries for the Data Architect interview demo
-- Run against GOLD layer — all queries complete in < 1 second
-- =============================================================================

USE DATABASE KUONI_DW;
USE WAREHOUSE KUONI_WH_ANALYTICS;

-- =============================================================================
-- QUERY 1: Executive Headline KPIs
-- "What's the business performance at a glance?"
-- =============================================================================

SELECT
    '£' || TO_CHAR(TOTAL_REVENUE_GBP, '999,999,999') AS total_revenue,
    TOTAL_BOOKINGS                                     AS total_bookings,
    '£' || TO_CHAR(ROUND(AVG_BOOKING_VALUE_GBP), '999,999') AS avg_booking_value,
    TOP_DESTINATION                                    AS top_destination,
    ROUND(AVG_MARGIN_PCT, 1) || '%'                    AS avg_margin
FROM GOLD.RPT_OVERVIEW_KPI;


-- =============================================================================
-- QUERY 2: Revenue by Month — Last 24 Months
-- "Show me the revenue trend over the past 2 years"
-- =============================================================================

SELECT
    YEAR_MONTH,
    YEAR,
    MONTH_NAME,
    SUM(TOTAL_REVENUE_GBP)      AS monthly_revenue_gbp,
    SUM(NUM_BOOKINGS)           AS monthly_bookings,
    AVG(AVG_BOOKING_VALUE_GBP)  AS avg_booking_value,
    SUM(TOTAL_MARGIN_GBP)       AS monthly_margin_gbp
FROM GOLD.RPT_REVENUE_BY_DESTINATION
WHERE YEAR_MONTH >= TO_CHAR(DATEADD(month, -24, CURRENT_DATE()), 'YYYY-MM')
GROUP BY 1,2,3
ORDER BY 1;


-- =============================================================================
-- QUERY 3: Top 10 Destinations by Revenue
-- "Where are our biggest earning destinations?"
-- =============================================================================

SELECT
    DESTINATION_NAME,
    COUNTRY,
    DESTINATION_TIER,
    SUM(TOTAL_REVENUE_GBP)                              AS total_revenue_gbp,
    SUM(NUM_BOOKINGS)                                   AS bookings,
    ROUND(AVG(AVG_BOOKING_VALUE_GBP))                   AS avg_booking_value,
    ROUND(AVG(AVG_MARGIN_PCT), 1)                       AS avg_margin_pct,
    RANK() OVER (ORDER BY SUM(TOTAL_REVENUE_GBP) DESC)  AS revenue_rank
FROM GOLD.RPT_REVENUE_BY_DESTINATION
GROUP BY 1,2,3
ORDER BY total_revenue_gbp DESC
LIMIT 10;


-- =============================================================================
-- QUERY 4: Customer LTV Segmentation
-- "Who are our most valuable customers and where are they?"
-- =============================================================================

SELECT
    LTV_BAND,
    SEGMENT,
    REGION,
    COUNT(*)                            AS customer_count,
    ROUND(AVG(TOTAL_SPEND_GBP))         AS avg_spend_gbp,
    ROUND(SUM(TOTAL_SPEND_GBP))         AS total_segment_value_gbp,
    ROUND(AVG(TOTAL_BOOKINGS), 1)       AS avg_bookings,
    ROUND(AVG(DESTINATIONS_VISITED), 1) AS avg_destinations_visited
FROM GOLD.RPT_CUSTOMER_LTV
GROUP BY 1,2,3
ORDER BY 
    CASE LTV_BAND
        WHEN 'Platinum' THEN 1
        WHEN 'Gold'     THEN 2
        WHEN 'Silver'   THEN 3
        WHEN 'Bronze'   THEN 4
        ELSE 5
    END, total_segment_value_gbp DESC;


-- =============================================================================
-- QUERY 5: Booking Funnel — Conversion Rates by Channel
-- "Where are leads falling off in our sales funnel?"
-- =============================================================================

SELECT
    CHANNEL,
    INTERACTION_TYPE,
    SUM(INTERACTION_COUNT)      AS total_interactions,
    SUM(CONVERTED_COUNT)        AS conversions,
    ROUND(AVG(CONVERSION_RATE_PCT), 2) AS avg_conversion_rate_pct,
    ROUND(AVG(AVG_DURATION_MINS), 1) AS avg_duration_mins
FROM GOLD.RPT_BOOKING_FUNNEL
WHERE YEAR_MONTH >= TO_CHAR(DATEADD(month, -12, CURRENT_DATE()), 'YYYY-MM')
GROUP BY 1,2
ORDER BY avg_conversion_rate_pct DESC;


-- =============================================================================
-- QUERY 6: Seasonal Demand Heatmap
-- "When should we push marketing for each destination type?"
-- =============================================================================

SELECT
    MONTH_ABBR,
    MONTH_NUM,
    DESTINATION_TIER,
    SUM(BOOKINGS)                   AS bookings,
    ROUND(AVG(AVG_BOOKING_VALUE))   AS avg_value_gbp,
    ROUND(AVG(AVG_LEAD_TIME_DAYS))  AS avg_lead_time_days,
    -- Colour coding for heatmap
    CASE
        WHEN SUM(BOOKINGS) > PERCENTILE_CONT(0.8) WITHIN GROUP (ORDER BY SUM(BOOKINGS)) 
             OVER (PARTITION BY DESTINATION_TIER) THEN 'HIGH'
        WHEN SUM(BOOKINGS) > PERCENTILE_CONT(0.4) WITHIN GROUP (ORDER BY SUM(BOOKINGS))
             OVER (PARTITION BY DESTINATION_TIER) THEN 'MEDIUM'
        ELSE 'LOW'
    END AS DEMAND_LEVEL
FROM GOLD.RPT_SEASONAL_TRENDS
GROUP BY 1,2,3
ORDER BY 3, 2;


-- =============================================================================
-- QUERY 7: Top Performing Agents — Current Year
-- "Who are our star consultants this year?"
-- =============================================================================

SELECT
    AGENT_NAME,
    BRANCH_NAME,
    SPECIALISATION,
    BOOKINGS,
    '£' || TO_CHAR(REVENUE_GBP, '9,999,999')        AS revenue,
    '£' || TO_CHAR(ROUND(AVG_BOOKING_VALUE_GBP), '99,999') AS avg_booking,
    ROUND(AVG_MARGIN_PCT, 1) || '%'                  AS margin,
    COALESCE(CONVERSION_RATE_PCT || '%', 'N/A')      AS conversion_rate,
    PERFORMANCE_QUARTILE,
    CASE PERFORMANCE_QUARTILE
        WHEN 4 THEN '⭐ Top Performer'
        WHEN 3 THEN '✅ Above Average'
        WHEN 2 THEN '📈 Meeting Target'
        ELSE '⚠️ Needs Support'
    END AS performance_label
FROM GOLD.RPT_AGENT_PERFORMANCE
WHERE YEAR = YEAR(CURRENT_DATE())
  AND QUARTER_NAME = 'Q' || QUARTER(CURRENT_DATE())
ORDER BY REVENUE_GBP DESC
LIMIT 20;


-- =============================================================================
-- QUERY 8: Best-Selling Packages
-- "What should we feature in the next brochure?"
-- =============================================================================

SELECT
    PRODUCT_NAME,
    DESTINATION_NAME,
    PRODUCT_TYPE,
    PRICE_BAND,
    BASE_PRICE_GBP,
    TOTAL_BOOKINGS,
    '£' || TO_CHAR(TOTAL_REVENUE_GBP, '9,999,999') AS total_revenue,
    ROUND(AVG_MARGIN_PCT, 1) || '%'                 AS margin,
    CANCELLATION_RATE_PCT || '%'                    AS cancellation_rate,
    REVENUE_RANK
FROM GOLD.RPT_TOP_PRODUCTS
LIMIT 15;


-- =============================================================================
-- QUERY 9: YoY Revenue Growth by Region
-- "Which regions are growing, which need attention?"
-- =============================================================================

WITH regional_yoy AS (
    SELECT
        DESTINATION_REGION,
        YEAR,
        SUM(TOTAL_REVENUE_GBP) AS annual_revenue
    FROM GOLD.RPT_REVENUE_BY_DESTINATION
    GROUP BY 1,2
)
SELECT
    r.DESTINATION_REGION,
    r.YEAR,
    r.ANNUAL_REVENUE,
    r_prev.ANNUAL_REVENUE                           AS PRIOR_YEAR_REVENUE,
    r.ANNUAL_REVENUE - r_prev.ANNUAL_REVENUE        AS REVENUE_GROWTH_GBP,
    ROUND((r.ANNUAL_REVENUE - r_prev.ANNUAL_REVENUE) / 
          NULLIF(r_prev.ANNUAL_REVENUE, 0) * 100, 1) AS GROWTH_PCT,
    CASE
        WHEN (r.ANNUAL_REVENUE - r_prev.ANNUAL_REVENUE) / NULLIF(r_prev.ANNUAL_REVENUE, 0) > 0.1 
             THEN '🟢 Growing'
        WHEN (r.ANNUAL_REVENUE - r_prev.ANNUAL_REVENUE) / NULLIF(r_prev.ANNUAL_REVENUE, 0) > 0 
             THEN '🟡 Stable'
        ELSE '🔴 Declining'
    END AS TREND
FROM regional_yoy r
LEFT JOIN regional_yoy r_prev
    ON r.DESTINATION_REGION = r_prev.DESTINATION_REGION
    AND r.YEAR = r_prev.YEAR + 1
WHERE r.YEAR >= 2022
ORDER BY r.YEAR DESC, r.ANNUAL_REVENUE DESC;


-- =============================================================================
-- QUERY 10: Data Quality Dashboard
-- "How clean is our data? Where are the gaps?"
-- (Great for demo — shows the architect thinks about DQ, not just analytics)
-- =============================================================================

SELECT 'DIM_CUSTOMER'       AS table_name, COUNT(*) AS total_rows,
       SUM(CASE WHEN EMAIL IS NULL THEN 1 ELSE 0 END) AS null_emails,
       SUM(CASE WHEN POSTCODE IS NULL THEN 1 ELSE 0 END) AS null_postcodes,
       SUM(CASE WHEN IS_CURRENT = FALSE THEN 1 ELSE 0 END) AS scd_history_rows,
       SUM(CASE WHEN IS_MASTER_RECORD = FALSE THEN 1 ELSE 0 END) AS duplicate_records
FROM SILVER.DIM_CUSTOMER

UNION ALL

SELECT 'FCT_BOOKING', COUNT(*),
       SUM(CASE WHEN CUSTOMER_SK IS NULL THEN 1 ELSE 0 END),
       SUM(CASE WHEN PRODUCT_SK IS NULL THEN 1 ELSE 0 END),
       SUM(CASE WHEN AGENT_SK IS NULL THEN 1 ELSE 0 END),
       SUM(CASE WHEN TOTAL_VALUE_GBP <= 0 THEN 1 ELSE 0 END)
FROM SILVER.FCT_BOOKING

UNION ALL

SELECT 'FCT_INTERACTION', COUNT(*),
       SUM(CASE WHEN CUSTOMER_SK IS NULL THEN 1 ELSE 0 END),
       SUM(CASE WHEN CHANNEL IS NULL THEN 1 ELSE 0 END),
       SUM(CASE WHEN INTERACTION_TYPE IS NULL THEN 1 ELSE 0 END),
       SUM(CASE WHEN OUTCOME IS NULL THEN 1 ELSE 0 END)
FROM SILVER.FCT_INTERACTION;
