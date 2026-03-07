-- Bronze: raw bookings source view
-- Selects from RAW_BOOKINGS with no transformation — just exposes for lineage

{{ config(materialized='view', schema='BRONZE') }}

SELECT
    BOOKING_ID,
    CUSTOMER_ID,
    PRODUCT_ID,
    BOOKING_DATE,
    TRAVEL_DATE,
    RETURN_DATE,
    NUM_PASSENGERS,
    TOTAL_VALUE_GBP,
    DEPOSIT_AMOUNT_GBP,
    BALANCE_DUE_DATE,
    STATUS,
    CHANNEL,
    AGENT_ID,
    BRANCH_CODE,
    MARGIN_PCT,
    CURRENCY,
    EXCHANGE_RATE,
    SPECIAL_REQUESTS,
    INSURANCE_INCLUDED,
    CANCELLATION_DATE,
    CANCELLATION_REASON,
    _LOAD_TIMESTAMP,
    _BATCH_ID,
    _RECORD_HASH
FROM {{ source('bronze', 'RAW_BOOKINGS') }}
