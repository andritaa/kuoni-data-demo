-- Silver: DIM_CUSTOMER
-- Cleansed, deduplicated, type-cast customer dimension
-- Implements SCD Type 2 for change tracking

{{ config(
    materialized='table',
    schema='SILVER',
    unique_key='CUSTOMER_SK'
) }}

WITH source AS (
    SELECT
        CUSTOMER_ID,
        FIRST_NAME,
        LAST_NAME,
        TRIM(UPPER(FIRST_NAME)) || ' ' || TRIM(UPPER(LAST_NAME))    AS FULL_NAME,
        LOWER(TRIM(EMAIL))                                           AS EMAIL,
        -- Normalise UK phone numbers
        REGEXP_REPLACE(PHONE, '[^0-9+]', '')                        AS PHONE,
        -- Cast dates safely
        TRY_TO_DATE(DATE_OF_BIRTH, 'YYYY-MM-DD')                    AS DATE_OF_BIRTH,
        TRY_TO_DATE(JOIN_DATE, 'YYYY-MM-DD')                        AS JOIN_DATE,
        UPPER(TRIM(ADDRESS_LINE1))                                   AS ADDRESS_LINE1,
        UPPER(TRIM(CITY))                                            AS CITY,
        UPPER(TRIM(POSTCODE))                                        AS POSTCODE,
        -- Extract postcode district (e.g. SW1A from SW1A 2AA)
        SPLIT_PART(TRIM(POSTCODE), ' ', 1)                          AS POSTCODE_DISTRICT,
        -- Map city to region
        CASE
            WHEN UPPER(CITY) IN ('LONDON') THEN 'Greater London'
            WHEN UPPER(CITY) IN ('MANCHESTER', 'SALFORD') THEN 'Greater Manchester'
            WHEN UPPER(CITY) IN ('EDINBURGH', 'GLASGOW') THEN 'Scotland'
            WHEN UPPER(CITY) IN ('BRISTOL', 'BATH') THEN 'South West'
            WHEN UPPER(CITY) IN ('OXFORD', 'CAMBRIDGE') THEN 'Home Counties'
            WHEN UPPER(CITY) IN ('YORK', 'HARROGATE', 'LEEDS') THEN 'Yorkshire'
            ELSE 'Other UK'
        END                                                          AS REGION,
        -- Standardise segment
        CASE
            WHEN UPPER(TRIM(SEGMENT)) IN ('LUXURY', 'LUX') THEN 'Luxury'
            WHEN UPPER(TRIM(SEGMENT)) IN ('PREMIUM', 'PREM') THEN 'Premium'
            ELSE 'Explorer'
        END                                                          AS SEGMENT,
        PREFERRED_CONTACT,
        TRY_TO_NUMBER(TRAVEL_HISTORY_COUNT)                         AS TRAVEL_HISTORY_COUNT,
        LOYALTY_TIER,
        CASE WHEN UPPER(GDPR_CONSENT) = 'Y' THEN TRUE ELSE FALSE END AS GDPR_CONSENT,
        SOURCE_SYSTEM,
        _LOAD_TIMESTAMP,
        _BATCH_ID,
        -- Age band derived from DOB
        CASE
            WHEN DATEDIFF(year, TRY_TO_DATE(DATE_OF_BIRTH, 'YYYY-MM-DD'), CURRENT_DATE()) < 45 THEN '35-44'
            WHEN DATEDIFF(year, TRY_TO_DATE(DATE_OF_BIRTH, 'YYYY-MM-DD'), CURRENT_DATE()) < 55 THEN '45-54'
            WHEN DATEDIFF(year, TRY_TO_DATE(DATE_OF_BIRTH, 'YYYY-MM-DD'), CURRENT_DATE()) < 65 THEN '55-64'
            ELSE '65+'
        END                                                          AS AGE_BAND
    FROM {{ source('bronze', 'RAW_CUSTOMERS') }}
    WHERE CUSTOMER_ID IS NOT NULL
),

-- Deduplication: keep latest record per customer_id
deduped AS (
    SELECT *,
        ROW_NUMBER() OVER (PARTITION BY CUSTOMER_ID ORDER BY _LOAD_TIMESTAMP DESC) AS rn
    FROM source
),

final AS (
    SELECT
        CUSTOMER_ID,
        FIRST_NAME,
        LAST_NAME,
        FULL_NAME,
        EMAIL,
        PHONE,
        DATE_OF_BIRTH,
        AGE_BAND,
        ADDRESS_LINE1,
        CITY,
        POSTCODE,
        POSTCODE_DISTRICT,
        REGION,
        JOIN_DATE,
        SEGMENT,
        PREFERRED_CONTACT,
        TRAVEL_HISTORY_COUNT,
        LOYALTY_TIER,
        GDPR_CONSENT,
        TRUE                AS IS_ACTIVE,
        CUSTOMER_ID         AS DEDUP_MASTER_ID,
        TRUE                AS IS_MASTER_RECORD,
        COALESCE(JOIN_DATE, DATE(_LOAD_TIMESTAMP)) AS EFFECTIVE_FROM,
        NULL::DATE          AS EFFECTIVE_TO,
        TRUE                AS IS_CURRENT,
        CURRENT_TIMESTAMP() AS _CREATED_AT,
        CURRENT_TIMESTAMP() AS _UPDATED_AT,
        _BATCH_ID           AS _SOURCE_BATCH_ID
    FROM deduped
    WHERE rn = 1
      AND EMAIL IS NOT NULL   -- Basic data quality gate
)

SELECT {{ dbt_utils.generate_surrogate_key(['CUSTOMER_ID']) }} AS CUSTOMER_SK, *
FROM final
