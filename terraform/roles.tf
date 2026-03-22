# ─── Roles (RBAC) ────────────────────────────────────────────

resource "snowflake_account_role" "analyst" {
  name    = "DERTOUR_ANALYST"
  comment = "Read-only access to Gold layer and Data Products"
}

resource "snowflake_account_role" "engineer" {
  name    = "DERTOUR_ENGINEER"
  comment = "Read/write Bronze-Gold, run dbt, manage pipelines"
}

resource "snowflake_account_role" "api_service" {
  name    = "DERTOUR_API_SERVICE"
  comment = "Service account for dashboard API — read-only Gold"
}

resource "snowflake_account_role" "admin" {
  name    = "DERTOUR_ADMIN"
  comment = "Full admin — schema management, grants, monitoring"
}

# ─── Role Hierarchy ──────────────────────────────────────────

resource "snowflake_grant_account_role" "analyst_to_engineer" {
  role_name        = snowflake_account_role.analyst.name
  parent_role_name = snowflake_account_role.engineer.name
}

resource "snowflake_grant_account_role" "engineer_to_admin" {
  role_name        = snowflake_account_role.engineer.name
  parent_role_name = snowflake_account_role.admin.name
}

resource "snowflake_grant_account_role" "admin_to_sysadmin" {
  role_name        = snowflake_account_role.admin.name
  parent_role_name = "SYSADMIN"
}
