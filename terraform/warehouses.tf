# ─── Warehouses ───────────────────────────────────────────────

resource "snowflake_warehouse" "analytics" {
  name                = "DERTOUR_ANALYTICS_WH"
  warehouse_size      = "X-SMALL"
  auto_suspend        = 120
  auto_resume         = true
  initially_suspended = true
  comment             = "Analytics queries — dashboards, reports, ad-hoc"

  warehouse_type                  = "STANDARD"
  min_cluster_count               = 1
  max_cluster_count               = 2
  scaling_policy                  = "ECONOMY"
  enable_query_acceleration       = false
  query_acceleration_max_scale_factor = 0
}

resource "snowflake_warehouse" "api" {
  name                = "DERTOUR_API_WH"
  warehouse_size      = "X-SMALL"
  auto_suspend        = 60
  auto_resume         = true
  initially_suspended = true
  comment             = "API backend queries — low latency, auto-suspend aggressive"
}

resource "snowflake_warehouse" "dbt" {
  name                = "DERTOUR_DBT_WH"
  warehouse_size      = "SMALL"
  auto_suspend        = 300
  auto_resume         = true
  initially_suspended = true
  comment             = "dbt transformations — CI/CD pipeline"
}

resource "snowflake_warehouse" "loading" {
  name                = "DERTOUR_LOADING_WH"
  warehouse_size      = "SMALL"
  auto_suspend        = 120
  auto_resume         = true
  initially_suspended = true
  comment             = "Data ingestion — Snowpipe, bulk loads"
}
