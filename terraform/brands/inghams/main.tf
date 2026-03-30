# ─────────────────────────────────────────────────────────
# Brand: Inghams — First pilot brand
# This file demonstrates onboarding a DERTOUR brand
# Copy this folder for each new brand, change "inghams" to brand name
# ─────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    snowflake = {
      source  = "Snowflake-Labs/snowflake"
      version = "~> 1.0"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

provider "snowflake" {
  account  = var.snowflake_account
  user     = var.snowflake_user
  password = var.snowflake_password
  role     = "SYSADMIN"
}

variable "snowflake_account" { type = string }
variable "snowflake_user" { type = string }
variable "snowflake_password" { type = string; sensitive = true }

# ─── AWS Resources ────────────────────────────────────────

module "aws" {
  source = "../../modules/brand-aws"
  brand  = "inghams"
}

# ─── Snowflake Resources ──────────────────────────────────

module "snowflake" {
  source        = "../../modules/brand-snowflake"
  brand         = "inghams"
  aws_s3_bucket = module.aws.s3_bucket
  aws_role_arn  = module.aws.snowflake_role_arn
  aws_sqs_arn   = module.aws.sqs_queue_arn
}

# ─── Outputs ──────────────────────────────────────────────

output "brand_summary" {
  value = {
    brand             = "inghams"
    aws_s3_bucket     = module.aws.s3_bucket
    aws_sqs_queue     = module.aws.sqs_queue_arn
    snowflake_schemas = "${module.snowflake.bronze_schema}, ${module.snowflake.silver_schema}, ${module.snowflake.gold_schema}"
    snowflake_wh      = module.snowflake.warehouse
    snowflake_roles   = "${module.snowflake.reader_role}, ${module.snowflake.writer_role}"
  }
}
