# ─────────────────────────────────────────────────────────────
# DERTOUR Group — Snowflake Infrastructure as Code
# ─────────────────────────────────────────────────────────────

terraform {
  required_version = ">= 1.5"
  required_providers {
    snowflake = {
      source  = "Snowflake-Labs/snowflake"
      version = "~> 1.0"
    }
  }
}

provider "snowflake" {
  account  = var.snowflake_account
  user     = var.snowflake_user
  password = var.snowflake_password
  role     = "SYSADMIN"
}

# ─── Variables ────────────────────────────────────────────────

variable "snowflake_account" {
  type        = string
  description = "Snowflake account identifier"
}

variable "snowflake_user" {
  type        = string
  description = "Snowflake username"
}

variable "snowflake_password" {
  type        = string
  sensitive   = true
  description = "Snowflake password"
}

variable "environment" {
  type    = string
  default = "dev"
}
