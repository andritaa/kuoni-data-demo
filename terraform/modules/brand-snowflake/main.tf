# ─────────────────────────────────────────────────────────
# Module: brand-snowflake
# Creates Snowflake resources for a new DERTOUR brand
# Usage: module "inghams_sf" { source = "../modules/brand-snowflake"; brand = "inghams" }
# ─────────────────────────────────────────────────────────

variable "brand" {
  type        = string
  description = "Brand name (lowercase) e.g. inghams, explore, santas_lapland"
}

variable "database" {
  type    = string
  default = "DERTOUR_DW"
}

variable "aws_s3_bucket" {
  type        = string
  description = "S3 bucket ARN for this brand's data"
}

variable "aws_role_arn" {
  type        = string
  description = "IAM role ARN for Snowflake to access S3"
}

variable "aws_sqs_arn" {
  type        = string
  description = "SQS queue ARN for Snowpipe notifications"
}

locals {
  brand_upper = upper(var.brand)
}

# ─── Brand Schemas (medallion) ────────────────────────────

resource "snowflake_schema" "bronze" {
  database = var.database
  name     = "${local.brand_upper}_BRONZE"
  comment  = "${var.brand} — raw ingested data"
}

resource "snowflake_schema" "silver" {
  database = var.database
  name     = "${local.brand_upper}_SILVER"
  comment  = "${var.brand} — cleaned and conformed"
}

resource "snowflake_schema" "gold" {
  database = var.database
  name     = "${local.brand_upper}_GOLD"
  comment  = "${var.brand} — star schema, facts and dimensions"
}

# ─── Brand Warehouse ──────────────────────────────────────

resource "snowflake_warehouse" "brand" {
  name                = "${local.brand_upper}_WH"
  warehouse_size      = "X-SMALL"
  auto_suspend        = 120
  auto_resume         = true
  initially_suspended = true
  comment             = "${var.brand} — brand-level compute"
}

# ─── Brand Roles ──────────────────────────────────────────

resource "snowflake_account_role" "brand_reader" {
  name    = "${local.brand_upper}_READER"
  comment = "${var.brand} — read access to Gold layer"
}

resource "snowflake_account_role" "brand_writer" {
  name    = "${local.brand_upper}_WRITER"
  comment = "${var.brand} — read/write all layers"
}

# Grant reader → Gold schema
resource "snowflake_grant_privileges_to_account_role" "reader_gold_usage" {
  account_role_name = snowflake_account_role.brand_reader.name
  privileges        = ["USAGE"]
  on_schema {
    schema_name = "\"${var.database}\".\"${snowflake_schema.gold.name}\""
  }
}

resource "snowflake_grant_privileges_to_account_role" "reader_gold_select" {
  account_role_name = snowflake_account_role.brand_reader.name
  privileges        = ["SELECT"]
  on_schema_object {
    future {
      object_type_plural = "TABLES"
      in_schema          = "\"${var.database}\".\"${snowflake_schema.gold.name}\""
    }
  }
}

# Grant writer → all schemas
resource "snowflake_grant_privileges_to_account_role" "writer_warehouse" {
  account_role_name = snowflake_account_role.brand_writer.name
  privileges        = ["USAGE", "OPERATE"]
  on_account_object {
    object_type = "WAREHOUSE"
    object_name = snowflake_warehouse.brand.name
  }
}

# ─── Storage Integration (S3 → Snowflake) ─────────────────

resource "snowflake_storage_integration" "brand_s3" {
  name                      = "${local.brand_upper}_S3_INT"
  type                      = "EXTERNAL_STAGE"
  storage_provider           = "S3"
  storage_allowed_locations  = ["s3://${var.aws_s3_bucket}/"]
  storage_aws_role_arn       = var.aws_role_arn
  enabled                   = true
  comment                   = "${var.brand} — S3 data landing zone"
}

# ─── Outputs ──────────────────────────────────────────────

output "bronze_schema" {
  value = snowflake_schema.bronze.name
}

output "silver_schema" {
  value = snowflake_schema.silver.name
}

output "gold_schema" {
  value = snowflake_schema.gold.name
}

output "warehouse" {
  value = snowflake_warehouse.brand.name
}

output "reader_role" {
  value = snowflake_account_role.brand_reader.name
}

output "writer_role" {
  value = snowflake_account_role.brand_writer.name
}
