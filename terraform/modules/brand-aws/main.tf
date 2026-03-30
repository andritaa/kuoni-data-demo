# ─────────────────────────────────────────────────────────
# Module: brand-aws
# Creates AWS resources for a new DERTOUR brand
# Usage: module "inghams_aws" { source = "../modules/brand-aws"; brand = "inghams" }
# ─────────────────────────────────────────────────────────

variable "brand" {
  type        = string
  description = "Brand name (lowercase, no spaces) e.g. inghams, explore, santas-lapland"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "region" {
  type    = string
  default = "eu-west-2"
}

variable "snowflake_account" {
  type    = string
  default = "lqpklal-fl98075"
}

# ─── S3 Bucket for brand data landing zone ────────────────

resource "aws_s3_bucket" "brand_data" {
  bucket = "dertour-${var.brand}-data-${var.environment}"
  tags = {
    Brand       = var.brand
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "dertour-data-platform"
  }
}

resource "aws_s3_bucket_versioning" "brand_data" {
  bucket = aws_s3_bucket.brand_data.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "brand_data" {
  bucket = aws_s3_bucket.brand_data.id
  rule {
    apply_server_side_encryption_by_default { sse_algorithm = "AES256" }
  }
}

# Folder structure
resource "aws_s3_object" "folders" {
  for_each = toset(["raw/bookings/", "raw/customers/", "raw/products/", "raw/interactions/", "processed/", "archive/"])
  bucket   = aws_s3_bucket.brand_data.id
  key      = each.value
  content  = ""
}

# ─── SQS Queue for Snowpipe notifications ─────────────────

resource "aws_sqs_queue" "snowpipe" {
  name                       = "dertour-${var.brand}-snowpipe-${var.environment}"
  message_retention_seconds  = 86400
  visibility_timeout_seconds = 300
  tags = {
    Brand   = var.brand
    Purpose = "snowpipe-notifications"
  }
}

resource "aws_sqs_queue_policy" "snowpipe" {
  queue_url = aws_sqs_queue.snowpipe.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = "SQS:SendMessage"
        Resource  = aws_sqs_queue.snowpipe.arn
        Condition = { ArnEquals = { "aws:SourceArn" = aws_s3_bucket.brand_data.arn } }
      }
    ]
  })
}

# S3 → SQS notification on new files
resource "aws_s3_bucket_notification" "snowpipe" {
  bucket = aws_s3_bucket.brand_data.id
  queue {
    queue_arn     = aws_sqs_queue.snowpipe.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "raw/"
  }
}

# ─── IAM Role for Snowflake to access S3 ──────────────────

resource "aws_iam_role" "snowflake_access" {
  name = "dertour-${var.brand}-snowflake-access-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::804516735527:root" }
        Action    = "sts:AssumeRole"
        Condition = { StringEquals = { "sts:ExternalId" = "dertour_snowflake_${var.brand}" } }
      }
    ]
  })
}

resource "aws_iam_role_policy" "snowflake_s3" {
  name = "snowflake-s3-access"
  role = aws_iam_role.snowflake_access.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject", "s3:GetObjectVersion", "s3:ListBucket"]
        Resource = [aws_s3_bucket.brand_data.arn, "${aws_s3_bucket.brand_data.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueUrl", "sqs:GetQueueAttributes"]
        Resource = [aws_sqs_queue.snowpipe.arn]
      }
    ]
  })
}

# ─── Outputs ──────────────────────────────────────────────

output "s3_bucket" {
  value = aws_s3_bucket.brand_data.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.brand_data.arn
}

output "sqs_queue_arn" {
  value = aws_sqs_queue.snowpipe.arn
}

output "snowflake_role_arn" {
  value = aws_iam_role.snowflake_access.arn
}
