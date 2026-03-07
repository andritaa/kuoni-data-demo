-- =============================================================================
-- KUONI DATA PLATFORM - SETUP
-- Snowflake Account Setup: Warehouses, Databases, Schemas, Roles
-- Run as ACCOUNTADMIN
-- =============================================================================

USE ROLE ACCOUNTADMIN;

-- =============================================================================
-- ROLES
-- =============================================================================

CREATE ROLE IF NOT EXISTS KUONI_DATA_ENGINEER
    COMMENT = 'ETL/ELT engineers — read/write to bronze, silver, gold';

CREATE ROLE IF NOT EXISTS KUONI_DATA_ANALYST
    COMMENT = 'Analysts — read-only gold + silver layer';

CREATE ROLE IF NOT EXISTS KUONI_EXECUTIVE
    COMMENT = 'Exec dashboards — read-only gold layer';

CREATE ROLE IF NOT EXISTS KUONI_DBT
    COMMENT = 'Service account for dbt transformations';

-- Role hierarchy
GRANT ROLE KUONI_DATA_ANALYST TO ROLE KUONI_DATA_ENGINEER;
GRANT ROLE KUONI_DBT TO ROLE KUONI_DATA_ENGINEER;

-- Grant to SYSADMIN for management
GRANT ROLE KUONI_DATA_ENGINEER TO ROLE SYSADMIN;
GRANT ROLE KUONI_DATA_ANALYST TO ROLE SYSADMIN;
GRANT ROLE KUONI_EXECUTIVE TO ROLE SYSADMIN;

-- =============================================================================
-- WAREHOUSES
-- Separate compute clusters prevent analytics queries from competing with ETL
-- =============================================================================

-- ETL Warehouse: used for data loading and dbt transformations
CREATE WAREHOUSE IF NOT EXISTS KUONI_WH_ETL
    WAREHOUSE_SIZE = 'SMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE
    INITIALLY_SUSPENDED = TRUE
    COMMENT = 'ETL/dbt transformations — auto-suspends after 60s idle';

-- Analytics Warehouse: used for BI tools and dashboard queries
CREATE WAREHOUSE IF NOT EXISTS KUONI_WH_ANALYTICS
    WAREHOUSE_SIZE = 'SMALL'
    AUTO_SUSPEND = 300
    AUTO_RESUME = TRUE
    INITIALLY_SUSPENDED = TRUE
    COMMENT = 'Analytics queries — auto-suspends after 5 min idle';

-- Executive/API Warehouse: dedicated for API + exec dashboards (fast, small)
CREATE WAREHOUSE IF NOT EXISTS KUONI_WH_API
    WAREHOUSE_SIZE = 'X-SMALL'
    AUTO_SUSPEND = 60
    AUTO_RESUME = TRUE
    INITIALLY_SUSPENDED = TRUE
    COMMENT = 'FastAPI backend + exec dashboards — always snappy';

-- =============================================================================
-- DATABASE & SCHEMAS (Medallion Architecture)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS KUONI_DW
    COMMENT = 'Kuoni Data Warehouse — Medallion Architecture';

USE DATABASE KUONI_DW;

-- Bronze: Raw landing zone — immutable, full-fidelity source data
CREATE SCHEMA IF NOT EXISTS BRONZE
    DATA_RETENTION_TIME_IN_DAYS = 90
    COMMENT = 'Raw/landing layer — immutable source data, never modified';

-- Silver: Cleansed and conformed — single source of truth
CREATE SCHEMA IF NOT EXISTS SILVER
    DATA_RETENTION_TIME_IN_DAYS = 90
    COMMENT = 'Cleansed/conformed layer — deduplicated, standardised, validated';

-- Gold: Analytics and business layer — pre-aggregated for performance
CREATE SCHEMA IF NOT EXISTS GOLD
    DATA_RETENTION_TIME_IN_DAYS = 30
    COMMENT = 'Analytics layer — business-ready aggregations and reports';

-- Staging: Temporary tables for in-flight transformations
CREATE SCHEMA IF NOT EXISTS STAGING
    DATA_RETENTION_TIME_IN_DAYS = 1
    COMMENT = 'Ephemeral staging area for transformation steps';

-- =============================================================================
-- WAREHOUSE GRANTS
-- =============================================================================

GRANT USAGE ON WAREHOUSE KUONI_WH_ETL TO ROLE KUONI_DATA_ENGINEER;
GRANT USAGE ON WAREHOUSE KUONI_WH_ETL TO ROLE KUONI_DBT;
GRANT USAGE ON WAREHOUSE KUONI_WH_ANALYTICS TO ROLE KUONI_DATA_ANALYST;
GRANT USAGE ON WAREHOUSE KUONI_WH_ANALYTICS TO ROLE KUONI_DATA_ENGINEER;
GRANT USAGE ON WAREHOUSE KUONI_WH_API TO ROLE KUONI_EXECUTIVE;
GRANT USAGE ON WAREHOUSE KUONI_WH_API TO ROLE KUONI_DATA_ANALYST;

-- =============================================================================
-- DATABASE & SCHEMA GRANTS
-- =============================================================================

GRANT USAGE ON DATABASE KUONI_DW TO ROLE KUONI_DATA_ENGINEER;
GRANT USAGE ON DATABASE KUONI_DW TO ROLE KUONI_DATA_ANALYST;
GRANT USAGE ON DATABASE KUONI_DW TO ROLE KUONI_EXECUTIVE;
GRANT USAGE ON DATABASE KUONI_DW TO ROLE KUONI_DBT;

-- Bronze: full access for engineers and dbt; no access for analysts
GRANT USAGE ON SCHEMA KUONI_DW.BRONZE TO ROLE KUONI_DATA_ENGINEER;
GRANT USAGE ON SCHEMA KUONI_DW.BRONZE TO ROLE KUONI_DBT;
GRANT ALL ON ALL TABLES IN SCHEMA KUONI_DW.BRONZE TO ROLE KUONI_DATA_ENGINEER;
GRANT ALL ON FUTURE TABLES IN SCHEMA KUONI_DW.BRONZE TO ROLE KUONI_DATA_ENGINEER;
GRANT ALL ON ALL TABLES IN SCHEMA KUONI_DW.BRONZE TO ROLE KUONI_DBT;
GRANT ALL ON FUTURE TABLES IN SCHEMA KUONI_DW.BRONZE TO ROLE KUONI_DBT;

-- Silver: read/write for engineers; read for analysts
GRANT USAGE ON SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DATA_ENGINEER;
GRANT USAGE ON SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DATA_ANALYST;
GRANT USAGE ON SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DBT;
GRANT ALL ON ALL TABLES IN SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DATA_ENGINEER;
GRANT ALL ON FUTURE TABLES IN SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DATA_ENGINEER;
GRANT ALL ON ALL TABLES IN SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DBT;
GRANT ALL ON FUTURE TABLES IN SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DBT;
GRANT SELECT ON ALL TABLES IN SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DATA_ANALYST;
GRANT SELECT ON FUTURE TABLES IN SCHEMA KUONI_DW.SILVER TO ROLE KUONI_DATA_ANALYST;

-- Gold: read for analysts and executives
GRANT USAGE ON SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DATA_ENGINEER;
GRANT USAGE ON SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DATA_ANALYST;
GRANT USAGE ON SCHEMA KUONI_DW.GOLD TO ROLE KUONI_EXECUTIVE;
GRANT USAGE ON SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DBT;
GRANT ALL ON ALL TABLES IN SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DATA_ENGINEER;
GRANT ALL ON FUTURE TABLES IN SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DATA_ENGINEER;
GRANT ALL ON ALL TABLES IN SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DBT;
GRANT ALL ON FUTURE TABLES IN SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DBT;
GRANT SELECT ON ALL TABLES IN SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DATA_ANALYST;
GRANT SELECT ON FUTURE TABLES IN SCHEMA KUONI_DW.GOLD TO ROLE KUONI_DATA_ANALYST;
GRANT SELECT ON ALL TABLES IN SCHEMA KUONI_DW.GOLD TO ROLE KUONI_EXECUTIVE;
GRANT SELECT ON FUTURE TABLES IN SCHEMA KUONI_DW.GOLD TO ROLE KUONI_EXECUTIVE;

-- =============================================================================
-- RESOURCE MONITORS (cost governance)
-- =============================================================================

CREATE RESOURCE MONITOR IF NOT EXISTS KUONI_MONTHLY_LIMIT
    WITH CREDIT_QUOTA = 100
    FREQUENCY = MONTHLY
    START_TIMESTAMP = IMMEDIATELY
    TRIGGERS
        ON 75 PERCENT DO NOTIFY
        ON 90 PERCENT DO NOTIFY
        ON 100 PERCENT DO SUSPEND;

ALTER WAREHOUSE KUONI_WH_ETL SET RESOURCE_MONITOR = KUONI_MONTHLY_LIMIT;
ALTER WAREHOUSE KUONI_WH_ANALYTICS SET RESOURCE_MONITOR = KUONI_MONTHLY_LIMIT;
ALTER WAREHOUSE KUONI_WH_API SET RESOURCE_MONITOR = KUONI_MONTHLY_LIMIT;

-- =============================================================================
-- SERVICE ACCOUNT (for dbt and FastAPI)
-- =============================================================================

-- Create service user (run separately with password management)
-- CREATE USER dbt_service_account
--     DEFAULT_WAREHOUSE = KUONI_WH_ETL
--     DEFAULT_ROLE = KUONI_DBT
--     MUST_CHANGE_PASSWORD = FALSE;
-- GRANT ROLE KUONI_DBT TO USER dbt_service_account;

-- CREATE USER api_service_account
--     DEFAULT_WAREHOUSE = KUONI_WH_API
--     DEFAULT_ROLE = KUONI_EXECUTIVE
--     MUST_CHANGE_PASSWORD = FALSE;
-- GRANT ROLE KUONI_EXECUTIVE TO USER api_service_account;

-- =============================================================================
-- VERIFY SETUP
-- =============================================================================

SHOW WAREHOUSES LIKE 'KUONI%';
SHOW SCHEMAS IN DATABASE KUONI_DW;
SHOW ROLES LIKE 'KUONI%';
