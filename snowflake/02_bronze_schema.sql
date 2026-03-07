-- =============================================================================
-- KUONI DATA PLATFORM - BRONZE LAYER
-- Raw/Landing Layer DDL — Immutable source data
-- All tables include _LOAD_TIMESTAMP and _SOURCE_SYSTEM for auditability
-- =============================================================================

USE DATABASE KUONI_DW;
USE SCHEMA BRONZE;
USE WAREHOUSE KUONI_WH_ETL;

-- =============================================================================
-- RAW_CUSTOMERS
-- Source: Salesforce CRM
-- Landing raw CRM data with no transformations applied
-- =============================================================================

CREATE TABLE IF NOT EXISTS RAW_CUSTOMERS (
    -- Source fields
    CUSTOMER_ID         VARCHAR(50)     NOT NULL,
    FIRST_NAME          VARCHAR(100),
    LAST_NAME           VARCHAR(100),
    EMAIL               VARCHAR(255),
    PHONE               VARCHAR(50),
    DATE_OF_BIRTH       VARCHAR(20),         -- raw string, typed in silver
    ADDRESS_LINE1       VARCHAR(255),
    ADDRESS_LINE2       VARCHAR(255),
    CITY                VARCHAR(100),
    POSTCODE            VARCHAR(20),
    COUNTRY             VARCHAR(100),
    JOIN_DATE           VARCHAR(20),         -- raw string, typed in silver
    SEGMENT             VARCHAR(50),
    PREFERRED_CONTACT   VARCHAR(50),
    TRAVEL_HISTORY_COUNT VARCHAR(10),        -- raw string, typed in silver
    LOYALTY_TIER        VARCHAR(50),
    GDPR_CONSENT        VARCHAR(10),
    SOURCE_SYSTEM       VARCHAR(50),
    -- Metadata
    _LOAD_TIMESTAMP     TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _SOURCE_FILE        VARCHAR(500),
    _BATCH_ID           VARCHAR(100),
    _IS_DELETED         BOOLEAN         DEFAULT FALSE
)
COMMENT = 'Raw CRM customer data from Salesforce — loaded by Fivetran/ETL, never modified'
DATA_RETENTION_TIME_IN_DAYS = 90;

-- =============================================================================
-- RAW_DESTINATIONS
-- Source: Internal reference database
-- =============================================================================

CREATE TABLE IF NOT EXISTS RAW_DESTINATIONS (
    DESTINATION_ID      VARCHAR(50)     NOT NULL,
    DESTINATION_NAME    VARCHAR(200),
    COUNTRY             VARCHAR(100),
    REGION              VARCHAR(100),
    CONTINENT           VARCHAR(50),
    TIER                VARCHAR(50),        -- Ultra-Luxury / Luxury / Premium
    AVG_DURATION_DAYS   VARCHAR(10),
    PEAK_SEASON_START   VARCHAR(20),
    PEAK_SEASON_END     VARCHAR(20),
    FLIGHT_HRS_FROM_LHR VARCHAR(10),
    VISA_REQUIRED       VARCHAR(10),
    CURRENCY            VARCHAR(10),
    CLIMATE_TYPE        VARCHAR(100),
    POPULAR_ACTIVITIES  VARIANT,            -- JSON array
    IS_ACTIVE           VARCHAR(10),
    -- Metadata
    _LOAD_TIMESTAMP     TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _SOURCE_FILE        VARCHAR(500),
    _BATCH_ID           VARCHAR(100)
)
COMMENT = 'Raw destination reference data'
DATA_RETENTION_TIME_IN_DAYS = 90;

-- =============================================================================
-- RAW_PRODUCTS
-- Source: Product management system / brochure database
-- =============================================================================

CREATE TABLE IF NOT EXISTS RAW_PRODUCTS (
    PRODUCT_ID          VARCHAR(50)     NOT NULL,
    PRODUCT_NAME        VARCHAR(500),
    DESTINATION_ID      VARCHAR(50),
    PRODUCT_TYPE        VARCHAR(100),       -- Tailor-Made / Group / Honeymoon / Adventure / Cultural
    DURATION_DAYS       VARCHAR(10),
    BASE_PRICE_GBP      VARCHAR(20),        -- raw string
    INCLUDED_FLIGHTS    VARCHAR(10),
    ALL_INCLUSIVE       VARCHAR(10),
    MAX_GROUP_SIZE      VARCHAR(10),
    MIN_PASSENGERS      VARCHAR(10),
    ACCOMMODATION_TIER  VARCHAR(100),
    DESCRIPTION         VARCHAR(5000),
    HIGHLIGHTS          VARIANT,
    IS_ACTIVE           VARCHAR(10),
    LAUNCH_DATE         VARCHAR(20),
    DISCONTINUE_DATE    VARCHAR(20),
    -- Metadata
    _LOAD_TIMESTAMP     TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _SOURCE_FILE        VARCHAR(500),
    _BATCH_ID           VARCHAR(100)
)
COMMENT = 'Raw holiday package/product data from product catalogue'
DATA_RETENTION_TIME_IN_DAYS = 90;

-- =============================================================================
-- RAW_BOOKINGS
-- Source: Booking engine (primary transactional system)
-- High-frequency updates — append-only with full history
-- =============================================================================

CREATE TABLE IF NOT EXISTS RAW_BOOKINGS (
    BOOKING_ID          VARCHAR(50)     NOT NULL,
    CUSTOMER_ID         VARCHAR(50),
    PRODUCT_ID          VARCHAR(50),
    BOOKING_DATE        VARCHAR(20),
    TRAVEL_DATE         VARCHAR(20),
    RETURN_DATE         VARCHAR(20),
    NUM_PASSENGERS      VARCHAR(10),
    TOTAL_VALUE_GBP     VARCHAR(20),
    DEPOSIT_AMOUNT_GBP  VARCHAR(20),
    BALANCE_DUE_DATE    VARCHAR(20),
    STATUS              VARCHAR(50),        -- Confirmed / Completed / Cancelled / Pending
    CHANNEL             VARCHAR(50),        -- Online / Phone / Agent / Referral
    AGENT_ID            VARCHAR(50),
    BRANCH_CODE         VARCHAR(20),
    MARGIN_PCT          VARCHAR(20),
    CURRENCY            VARCHAR(10),
    EXCHANGE_RATE       VARCHAR(20),
    SPECIAL_REQUESTS    VARCHAR(2000),
    INSURANCE_INCLUDED  VARCHAR(10),
    CANCELLATION_DATE   VARCHAR(20),
    CANCELLATION_REASON VARCHAR(500),
    -- Metadata
    _LOAD_TIMESTAMP     TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _SOURCE_FILE        VARCHAR(500),
    _BATCH_ID           VARCHAR(100),
    _RECORD_HASH        VARCHAR(64)         -- MD5 of key fields for change detection
)
COMMENT = 'Raw booking engine data — append-only, immutable audit trail'
DATA_RETENTION_TIME_IN_DAYS = 90;

-- =============================================================================
-- RAW_SUPPLIERS
-- Source: Supplier management system
-- =============================================================================

CREATE TABLE IF NOT EXISTS RAW_SUPPLIERS (
    SUPPLIER_ID         VARCHAR(50)     NOT NULL,
    SUPPLIER_NAME       VARCHAR(200),
    SUPPLIER_TYPE       VARCHAR(100),       -- Hotel / Flight / Transfer / Activity
    DESTINATION_ID      VARCHAR(50),
    COUNTRY             VARCHAR(100),
    CONTACT_NAME        VARCHAR(200),
    CONTACT_EMAIL       VARCHAR(255),
    CONTRACT_START      VARCHAR(20),
    CONTRACT_END        VARCHAR(20),
    COMMISSION_PCT      VARCHAR(20),
    STAR_RATING         VARCHAR(10),
    IS_PREFERRED        VARCHAR(10),
    IS_ACTIVE           VARCHAR(10),
    -- Metadata
    _LOAD_TIMESTAMP     TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _SOURCE_FILE        VARCHAR(500),
    _BATCH_ID           VARCHAR(100)
)
COMMENT = 'Raw supplier/partner data (hotels, flights, transfers)'
DATA_RETENTION_TIME_IN_DAYS = 90;

-- =============================================================================
-- RAW_INTERACTIONS
-- Source: CRM interaction logs + web analytics
-- High volume — tracks every customer touchpoint
-- =============================================================================

CREATE TABLE IF NOT EXISTS RAW_INTERACTIONS (
    INTERACTION_ID      VARCHAR(50)     NOT NULL,
    CUSTOMER_ID         VARCHAR(50),
    INTERACTION_DATE    VARCHAR(20),
    INTERACTION_TIME    VARCHAR(20),
    CHANNEL             VARCHAR(50),        -- Web / Phone / Email / In-Store / WhatsApp
    INTERACTION_TYPE    VARCHAR(100),       -- Enquiry / Quote / Booking / Post-trip / Complaint
    DURATION_MINS       VARCHAR(10),
    OUTCOME             VARCHAR(100),       -- Converted / Follow-up / No-action / Resolved
    AGENT_ID            VARCHAR(50),
    DESTINATION_INTEREST VARCHAR(200),
    BUDGET_RANGE        VARCHAR(100),
    TRAVEL_PARTY_SIZE   VARCHAR(10),
    SESSION_ID          VARCHAR(100),
    REFERRAL_SOURCE     VARCHAR(200),
    NOTES               VARCHAR(5000),
    -- Metadata
    _LOAD_TIMESTAMP     TIMESTAMP_NTZ   DEFAULT CURRENT_TIMESTAMP(),
    _SOURCE_FILE        VARCHAR(500),
    _BATCH_ID           VARCHAR(100)
)
COMMENT = 'Raw customer interaction events — all touchpoints across all channels'
DATA_RETENTION_TIME_IN_DAYS = 90;

-- =============================================================================
-- INGESTION TRACKING TABLE
-- Track ETL batch runs for monitoring and alerting
-- =============================================================================

CREATE TABLE IF NOT EXISTS _ETL_BATCH_LOG (
    BATCH_ID            VARCHAR(100)    NOT NULL,
    SOURCE_TABLE        VARCHAR(200)    NOT NULL,
    TARGET_TABLE        VARCHAR(200)    NOT NULL,
    BATCH_START         TIMESTAMP_NTZ,
    BATCH_END           TIMESTAMP_NTZ,
    ROWS_LOADED         NUMBER,
    ROWS_REJECTED       NUMBER,
    STATUS              VARCHAR(20),        -- RUNNING / SUCCESS / FAILED
    ERROR_MESSAGE       VARCHAR(5000),
    TRIGGERED_BY        VARCHAR(200)
)
COMMENT = 'ETL batch run tracking — monitors all data ingestion jobs';

-- =============================================================================
-- VERIFY
-- =============================================================================

SHOW TABLES IN SCHEMA KUONI_DW.BRONZE;
