# How to Onboard a New DERTOUR Brand

## Prerequisites
- AWS account access (IAM credentials in GitHub Secrets)
- Snowflake account access (credentials in GitHub Secrets)
- Brand name confirmed (lowercase, no spaces)

## Steps

### 1. Create brand Terraform config
```bash
cp -r terraform/brands/inghams terraform/brands/{brand_name}
# Edit main.tf: change "inghams" to your brand name
```

### 2. Create brand dbt models
```bash
cp -r dbt/models/brands/inghams dbt/models/brands/{brand_name}
# Edit _sources.yml: update schema names
# Edit staging models: update brand identifier
```

### 3. Create brand Airflow DAG
```bash
cp dags/brand_onboard_inghams.py dags/brand_onboard_{brand_name}.py
# Edit: change BRAND = "inghams" to your brand name
```

### 4. Add to CI/CD
Edit `.github/workflows/brand-onboard.yml`:
```yaml
matrix:
  brand: [inghams, {brand_name}]  # Add here
```

### 5. PR + Merge
```bash
git checkout -b feature/onboard-{brand_name}
git add -A
git commit -m "feat: onboard {brand_name} brand"
git push
# Create PR → CI runs terraform plan + dbt test
# Merge → CD runs terraform apply + dbt run + deploy DAGs
```

## What Gets Created

### AWS
- S3 bucket: `dertour-{brand}-data-prod`
- SQS queue: `dertour-{brand}-snowpipe-prod`
- IAM role: `dertour-{brand}-snowflake-access-prod`

### Snowflake
- Schemas: `{BRAND}_BRONZE`, `{BRAND}_SILVER`, `{BRAND}_GOLD`
- Warehouse: `{BRAND}_WH`
- Roles: `{BRAND}_READER`, `{BRAND}_WRITER`
- Storage integration: `{BRAND}_S3_INT`

### Airflow
- DAG: `dertour_{brand}_pipeline` (daily at 6am)
  - check_s3_files → load_to_bronze → data_quality_checks → refresh_gold

### dbt
- Staging: `stg_{brand}_bookings`, `stg_{brand}_customers`, etc.
- Marts: `fct_{brand}_bookings` (enriched fact table)
- Tests: unique, not_null, accepted_values, value ranges

## Time to onboard: ~15 minutes (PR + merge + auto-deploy)
