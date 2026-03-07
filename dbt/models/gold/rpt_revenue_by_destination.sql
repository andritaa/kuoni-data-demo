-- Gold: RPT_REVENUE_BY_DESTINATION
-- Monthly revenue by destination — primary analytics output
-- Feeds: Executive dashboard, BI tools, FastAPI /api/revenue/monthly

{{ config(
    materialized='table',
    schema='GOLD',
    tags=['gold', 'revenue', 'daily']
) }}

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
    AVG(fb.MARGIN_PCT)                                       AS AVG_MARGIN_PCT
FROM {{ ref('fct_booking') }} fb
JOIN {{ ref('dim_date') }}        dd   ON fb.BOOKING_DATE_KEY = dd.DATE_KEY
JOIN {{ ref('dim_destination') }} dest ON fb.DESTINATION_SK   = dest.DESTINATION_SK
WHERE fb.STATUS IN ('Confirmed', 'Completed')
GROUP BY 1,2,3,4,5,6,7,8,9,10,11,12
