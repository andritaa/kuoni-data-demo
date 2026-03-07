# Kuoni Data Intelligence Platform
### Built on Snowflake Medallion Architecture

> **Interview Demo** — Data Architect role at Kuoni/DERTOUR Group  
> Candidate: Stephen Adebola | Interview: Monday 9 March 2026

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA SOURCES                                      │
│  Booking Engine │ CRM (Salesforce) │ Web Analytics │ Supplier APIs   │
└────────────┬────────────────────────────────────────────────────────┘
             │  Fivetran / Kafka / Custom Connectors
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   BRONZE LAYER  (Raw Landing)                         │
│   RAW_BOOKINGS │ RAW_CUSTOMERS │ RAW_PRODUCTS │ RAW_INTERACTIONS     │
│   Immutable, timestamped, full-fidelity source data                  │
└────────────┬────────────────────────────────────────────────────────┘
             │  dbt transformations
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SILVER LAYER  (Cleansed / Conformed)               │
│   DIM_CUSTOMER │ DIM_DESTINATION │ DIM_PRODUCT │ DIM_DATE            │
│   FCT_BOOKING  │ FCT_INTERACTION                                      │
│   Deduped, validated, standardised — single source of truth          │
└────────────┬────────────────────────────────────────────────────────┘
             │  dbt aggregations
             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   GOLD LAYER  (Analytics / Business)                  │
│   RPT_REVENUE_BY_DESTINATION │ RPT_CUSTOMER_LTV                      │
│   RPT_BOOKING_FUNNEL │ RPT_TOP_PRODUCTS │ RPT_SEASONAL_TRENDS        │
│   RPT_AGENT_PERFORMANCE                                               │
│   Pre-aggregated for speed — feeds BI tools + APIs                   │
└────────────┬────────────────────────────────────────────────────────┘
             │
     ┌───────┴────────┐
     ▼                ▼
 FastAPI          Tableau /
 Backend       Power BI / Sigma
     │
     ▼
 Next.js
 Dashboard
```

---

## The Problem This Solves

Kuoni introduced Snowflake to solve **one reporting problem**. This demo shows how to make it the **foundation** of the entire data platform — from raw booking engine data through to real-time executive dashboards.

### 5 Business Problems We're Solving

| # | Problem | Solution |
|---|---------|----------|
| 1 | **Revenue reporting takes days** — finance team manually stitches Excel files from 4 systems | Gold layer `RPT_REVENUE_BY_DESTINATION` aggregates in real time, sub-second queries |
| 2 | **Customer 360 doesn't exist** — bookings, enquiries, and CRM data live in silos | Silver `DIM_CUSTOMER` unifies CRM + booking history + web interactions with dedup logic |
| 3 | **Conversion funnel is invisible** — nobody knows where enquiries drop off | `RPT_BOOKING_FUNNEL` tracks enquiry → quote → booking → completion with agent attribution |
| 4 | **Seasonal demand forecasting is gut-feel** — planning teams use last year's brochure | `RPT_SEASONAL_TRENDS` provides 3 years of weekly demand signals by destination tier |
| 5 | **Agent performance is anecdotal** — top consultants get recognised late, poor performers caught late | `RPT_AGENT_PERFORMANCE` gives real-time conversion rates, average booking value, margin per consultant |

---

## Data Model

```
RAW_CUSTOMERS ──────────────► DIM_CUSTOMER ──────────┐
                                                       │
RAW_DESTINATIONS ──────────► DIM_DESTINATION ─────────┤
                                                       ├──► FCT_BOOKING ──► RPT_*
RAW_PRODUCTS ──────────────► DIM_PRODUCT ─────────────┤
                                                       │
RAW_BOOKINGS ──────────────────────────────────────────┘

RAW_INTERACTIONS ──────────► FCT_INTERACTION ──────► RPT_BOOKING_FUNNEL
```

---

## Medallion Architecture — Why Three Layers?

### 🥉 Bronze — Immutable Truth
Raw data lands here exactly as it comes from source systems. Nothing is ever deleted or modified. This is your **audit trail** and **reprocessing safety net**. If a transformation has a bug, you can replay from Bronze without re-extracting from source.

### 🥈 Silver — Single Source of Truth  
This is where business logic lives. Customer deduplication, address standardisation, currency normalisation, null handling. **One place, one version.** Every downstream consumer uses Silver, eliminating the "which extract did you use?" argument.

### 🥇 Gold — Business-Ready
Pre-aggregated, named in business language, optimised for query performance. The Gold layer is what BI tools, dashboards, and APIs consume. Analysts don't need to know SQL joins — they query `RPT_REVENUE_BY_DESTINATION` and get exactly what they need.

---

## Technology Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Data Warehouse | **Snowflake** | Elastic compute, zero-copy clones, time travel, native Python |
| Transformation | **dbt Core** | Version-controlled SQL, lineage, testing, documentation |
| Orchestration | Airflow / Snowflake Tasks | Scheduling + dependency management |
| API | **FastAPI** | Async Python, auto-docs, Snowflake connector |
| Dashboard | **Next.js + Recharts** | React-based, deployable to Railway/Vercel |
| CI/CD | GitHub Actions | Automated dbt tests on PR |

---

## Project Structure

```
kuoni-data-demo/
├── snowflake/           # DDL scripts (run in order 01→05)
├── data/                # Dummy data generator + Snowflake loader
├── dbt/                 # dbt project (Bronze→Silver→Gold)
├── backend/             # FastAPI analytics API
└── frontend/            # Next.js dashboard (Kuoni-branded)
```

---

## Quick Start

### 1. Snowflake Setup
```sql
-- Run in order:
-- 01_setup.sql          → warehouses, databases, roles
-- 02_bronze_schema.sql  → raw landing tables
-- 03_silver_schema.sql  → cleansed dimensions + facts
-- 04_gold_schema.sql    → analytics reports
-- 05_sample_queries.sql → demo queries
```

### 2. Generate & Load Dummy Data
```bash
cd data
pip install faker snowflake-connector-python pandas
python generate_data.py          # creates CSV files in data/output/
python load_data.py              # loads into Snowflake BRONZE layer
```

### 3. Run dbt Transformations
```bash
cd dbt
pip install dbt-snowflake
cp profiles.yml.example ~/.dbt/profiles.yml
# Edit with your Snowflake credentials
dbt run                          # Bronze → Silver → Gold
dbt test                         # Data quality checks
```

### 4. Start the Backend
```bash
cd backend
pip install -r requirements.txt
export SNOWFLAKE_ACCOUNT=your_account
export SNOWFLAKE_USER=your_user
export SNOWFLAKE_PASSWORD=your_password
uvicorn main:app --reload        # http://localhost:8000
# API docs: http://localhost:8000/docs
```

### 5. Start the Frontend
```bash
cd frontend
npm install
npm run dev                      # http://localhost:3000
```

---

## Environment Variables

```env
SNOWFLAKE_ACCOUNT=your_account.snowflakecomputing.com
SNOWFLAKE_USER=your_username
SNOWFLAKE_PASSWORD=your_password
SNOWFLAKE_DATABASE=KUONI_DW
SNOWFLAKE_WAREHOUSE=KUONI_WH_ANALYTICS
```

---

## Demo Talking Points

- **"We started with one report"** — this architecture scales from that one report to your entire data estate without re-platforming
- **Time Travel** — Snowflake's 90-day time travel means we never lose data; rollback a bad transformation in seconds
- **Zero-Copy Clones** — dev/test environments spun up in seconds at no extra storage cost
- **Separation of Compute** — ETL warehouse and analytics warehouse scale independently; no contention
- **dbt as the contract** — every transformation is version-controlled, tested, and documented; the data team works like software engineers

---

## Deployment (Railway)

```bash
# Backend
railway up --service backend

# Frontend  
railway up --service frontend
```

See `railway.json` for configuration.

---

*Built for Kuoni/DERTOUR Group Data Architect interview — March 2026*
