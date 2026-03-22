output "analytics_warehouse" {
  value = snowflake_warehouse.analytics.name
}

output "api_warehouse" {
  value = snowflake_warehouse.api.name
}

output "database_prod" {
  value = snowflake_database.dertour.name
}

output "database_dev" {
  value = snowflake_database.dertour_dev.name
}
