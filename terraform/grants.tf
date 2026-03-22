# ─── Grants ───────────────────────────────────────────────────

# Analyst: read Gold + Data Products
resource "snowflake_grant_privileges_to_account_role" "analyst_gold_usage" {
  account_role_name = snowflake_account_role.analyst.name
  privileges        = ["USAGE"]
  on_schema {
    schema_name = "\"${snowflake_database.dertour.name}\".\"${snowflake_schema.gold.name}\""
  }
}

resource "snowflake_grant_privileges_to_account_role" "analyst_gold_select" {
  account_role_name = snowflake_account_role.analyst.name
  privileges        = ["SELECT"]
  on_schema_object {
    future {
      object_type_plural = "TABLES"
      in_schema          = "\"${snowflake_database.dertour.name}\".\"${snowflake_schema.gold.name}\""
    }
  }
}

# API Service: warehouse + read Gold
resource "snowflake_grant_privileges_to_account_role" "api_wh" {
  account_role_name = snowflake_account_role.api_service.name
  privileges        = ["USAGE"]
  on_account_object {
    object_type = "WAREHOUSE"
    object_name = snowflake_warehouse.api.name
  }
}

# Engineer: all warehouses + read/write all schemas
resource "snowflake_grant_privileges_to_account_role" "engineer_dbt_wh" {
  account_role_name = snowflake_account_role.engineer.name
  privileges        = ["USAGE", "OPERATE"]
  on_account_object {
    object_type = "WAREHOUSE"
    object_name = snowflake_warehouse.dbt.name
  }
}
