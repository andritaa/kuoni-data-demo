-- Silver: FCT_BOOKING
-- Cleansed booking fact — typed, validated, all FK references resolved
-- Incremental: append new bookings, update status changes

{{ config(
    materialized='incremental',
    schema='SILVER',
    unique_key='BOOKING_ID',
    on_schema_change='sync_all_columns'
) }}

WITH source AS (
    SELECT
        BOOKING_ID,
        CUSTOMER_ID,
        PRODUCT_ID,
        TRY_TO_DATE(BOOKING_DATE, 'YYYY-MM-DD')     AS BOOKING_DATE,
        TRY_TO_DATE(TRAVEL_DATE, 'YYYY-MM-DD')      AS TRAVEL_DATE,
        TRY_TO_DATE(RETURN_DATE, 'YYYY-MM-DD')      AS RETURN_DATE,
        TRY_TO_NUMBER(NUM_PASSENGERS)                AS NUM_PASSENGERS,
        TRY_TO_DECIMAL(TOTAL_VALUE_GBP, 12, 2)      AS TOTAL_VALUE_GBP,
        TRY_TO_DECIMAL(DEPOSIT_AMOUNT_GBP, 12, 2)   AS DEPOSIT_AMOUNT_GBP,
        TRIM(STATUS)                                 AS STATUS,
        TRIM(CHANNEL)                                AS CHANNEL,
        NULLIF(TRIM(AGENT_ID), '')                  AS AGENT_ID,
        TRY_TO_DECIMAL(MARGIN_PCT, 5, 4)             AS MARGIN_PCT,
        CASE WHEN UPPER(INSURANCE_INCLUDED) = 'Y' THEN TRUE ELSE FALSE END AS INSURANCE_INCLUDED,
        TRY_TO_DATE(CANCELLATION_DATE, 'YYYY-MM-DD') AS CANCELLATION_DATE,
        NULLIF(TRIM(CANCELLATION_REASON), '')        AS CANCELLATION_REASON,
        _BATCH_ID,
        _LOAD_TIMESTAMP
    FROM {{ source('bronze', 'RAW_BOOKINGS') }}
    WHERE BOOKING_ID IS NOT NULL
      AND TOTAL_VALUE_GBP IS NOT NULL
      AND TRY_TO_NUMBER(TOTAL_VALUE_GBP) > 0
      
    {% if is_incremental() %}
    -- Only process records newer than the latest loaded batch
    AND _LOAD_TIMESTAMP > (SELECT MAX(_CREATED_AT) FROM {{ this }})
    {% endif %}
),

with_dim_keys AS (
    SELECT
        s.BOOKING_ID,
        -- Resolve surrogate keys
        c.CUSTOMER_SK,
        p.PRODUCT_SK,
        d.DESTINATION_SK,
        a.AGENT_SK,
        -- Date keys
        TO_NUMBER(TO_CHAR(s.BOOKING_DATE, 'YYYYMMDD'))  AS BOOKING_DATE_KEY,
        TO_NUMBER(TO_CHAR(s.TRAVEL_DATE, 'YYYYMMDD'))   AS TRAVEL_DATE_KEY,
        TO_NUMBER(TO_CHAR(s.RETURN_DATE, 'YYYYMMDD'))   AS RETURN_DATE_KEY,
        -- Measures
        s.NUM_PASSENGERS,
        s.TOTAL_VALUE_GBP,
        s.DEPOSIT_AMOUNT_GBP,
        s.MARGIN_PCT,
        -- Derived measures
        ROUND(s.TOTAL_VALUE_GBP * COALESCE(s.MARGIN_PCT, 0.18), 2)            AS MARGIN_GBP,
        ROUND(s.TOTAL_VALUE_GBP / NULLIF(s.NUM_PASSENGERS, 0), 2)             AS VALUE_PER_PAX_GBP,
        -- Attributes
        s.STATUS,
        s.CHANNEL,
        s.INSURANCE_INCLUDED,
        DATEDIFF(day, s.BOOKING_DATE, s.TRAVEL_DATE)                           AS LEAD_TIME_DAYS,
        CASE WHEN s.STATUS = 'Cancelled' THEN TRUE ELSE FALSE END               AS IS_CANCELLED,
        s.CANCELLATION_DATE,
        -- Audit
        CURRENT_TIMESTAMP()     AS _CREATED_AT,
        CURRENT_TIMESTAMP()     AS _UPDATED_AT,
        s._BATCH_ID             AS _SOURCE_BATCH_ID
    FROM source s
    LEFT JOIN {{ ref('dim_customer') }}    c ON s.CUSTOMER_ID = c.CUSTOMER_ID   AND c.IS_CURRENT = TRUE
    LEFT JOIN {{ ref('dim_product') }}     p ON s.PRODUCT_ID  = p.PRODUCT_ID
    LEFT JOIN {{ ref('dim_destination') }} d ON p.DESTINATION_ID = d.DESTINATION_ID
    LEFT JOIN {{ ref('dim_agent') }}       a ON s.AGENT_ID = a.AGENT_ID
)

SELECT
    {{ dbt_utils.generate_surrogate_key(['BOOKING_ID']) }} AS BOOKING_SK,
    *
FROM with_dim_keys
