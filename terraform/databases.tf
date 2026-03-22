# ─── Databases ────────────────────────────────────────────────

resource "snowflake_database" "dertour" {
  name                        = "DERTOUR_DW"
  comment                     = "DERTOUR Group data warehouse — production"
  data_retention_time_in_days = 7
}

resource "snowflake_database" "dertour_dev" {
  name                        = "DERTOUR_DW_DEV"
  comment                     = "DERTOUR Group data warehouse — development"
  data_retention_time_in_days = 1
}

# ─── Schemas ──────────────────────────────────────────────────

resource "snowflake_schema" "bronze" {
  database = snowflake_database.dertour.name
  name     = "BRONZE"
  comment  = "Raw ingested data from source systems"
}

resource "snowflake_schema" "silver" {
  database = snowflake_database.dertour.name
  name     = "SILVER"
  comment  = "Cleaned and conformed data"
}

resource "snowflake_schema" "gold" {
  database = snowflake_database.dertour.name
  name     = "GOLD"
  comment  = "Star schema — dimensions and facts"
}

resource "snowflake_schema" "data_products" {
  database = snowflake_database.dertour.name
  name     = "DATA_PRODUCTS"
  comment  = "Data mesh — self-serve analytical products"
}

resource "snowflake_schema" "knowledge_base" {
  database = snowflake_database.dertour.name
  name     = "KNOWLEDGE_BASE"
  comment  = "RAG vector store for AI assistant"
}
