"""
Kuoni Data Intelligence Platform — Analytics API
FastAPI backend serving the executive dashboard

Endpoints:
    GET /api/overview              — Headline KPIs
    GET /api/revenue/monthly       — Monthly revenue last 24 months
    GET /api/destinations/top      — Top 10 destinations by revenue
    GET /api/customers/segments    — Customer segment breakdown
    GET /api/bookings/funnel       — Conversion funnel stats
    GET /api/products/top          — Top performing packages
    GET /health                    — Health check

Run:
    uvicorn main:app --reload --port 8000
"""

import os
import random
import logging
from datetime import date, timedelta
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import snowflake_client as sf

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Kuoni Data Intelligence Platform API",
    description="Analytics API for Kuoni/DERTOUR travel data platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# MOCK DATA (fallback when Snowflake not connected)
# ─────────────────────────────────────────────

def _mock_monthly_revenue() -> list[dict]:
    """Generate 24 months of realistic mock revenue data"""
    months = []
    base_date = date.today().replace(day=1) - timedelta(days=720)
    
    # Seasonal multipliers: Jan, Mar, Oct are peaks
    seasonal = {1:2.2, 2:1.2, 3:1.8, 4:1.0, 5:1.1, 6:0.9, 7:0.8, 8:0.7, 9:1.0, 10:1.9, 11:1.3, 12:0.9}
    
    base_revenue = 1_800_000
    for i in range(24):
        d = base_date + timedelta(days=30 * i)
        month = d.month
        year = d.year
        multiplier = seasonal.get(month, 1.0)
        revenue = base_revenue * multiplier * random.uniform(0.9, 1.1)
        bookings = int(revenue / random.uniform(8500, 12000))
        
        months.append({
            "year_month": f"{year}-{month:02d}",
            "year": year,
            "month_name": d.strftime("%B"),
            "month_num": month,
            "total_revenue_gbp": round(revenue, 0),
            "num_bookings": bookings,
            "avg_booking_value_gbp": round(revenue / max(bookings, 1), 0),
            "total_margin_gbp": round(revenue * 0.21, 0),
        })
    return months


def _mock_top_destinations() -> list[dict]:
    destinations = [
        {"destination_name": "Maldives",       "country": "Maldives",      "destination_tier": "Ultra-Luxury",  "total_revenue_gbp": 4_250_000, "num_bookings": 342},
        {"destination_name": "Seychelles",     "country": "Seychelles",    "destination_tier": "Ultra-Luxury",  "total_revenue_gbp": 3_890_000, "num_bookings": 298},
        {"destination_name": "Safari Kenya",   "country": "Kenya",         "destination_tier": "Luxury",        "total_revenue_gbp": 3_450_000, "num_bookings": 287},
        {"destination_name": "Japan",          "country": "Japan",         "destination_tier": "Luxury",        "total_revenue_gbp": 3_120_000, "num_bookings": 312},
        {"destination_name": "Amalfi Coast",   "country": "Italy",         "destination_tier": "Luxury",        "total_revenue_gbp": 2_870_000, "num_bookings": 356},
        {"destination_name": "Bali",           "country": "Indonesia",     "destination_tier": "Luxury",        "total_revenue_gbp": 2_640_000, "num_bookings": 389},
        {"destination_name": "Canada Rockies", "country": "Canada",        "destination_tier": "Luxury",        "total_revenue_gbp": 2_310_000, "num_bookings": 198},
        {"destination_name": "Peru",           "country": "Peru",          "destination_tier": "Luxury",        "total_revenue_gbp": 2_080_000, "num_bookings": 187},
        {"destination_name": "Santorini",      "country": "Greece",        "destination_tier": "Luxury",        "total_revenue_gbp": 1_970_000, "num_bookings": 234},
        {"destination_name": "New Zealand",    "country": "New Zealand",   "destination_tier": "Luxury",        "total_revenue_gbp": 1_820_000, "num_bookings": 143},
    ]
    for d in destinations:
        d["avg_booking_value_gbp"] = round(d["total_revenue_gbp"] / d["num_bookings"])
        d["avg_margin_pct"] = round(random.uniform(0.16, 0.26), 4)
    return destinations


def _mock_customer_segments() -> list[dict]:
    return [
        {"segment": "Luxury",   "customer_count": 492,  "avg_spend_gbp": 28400, "total_spend_gbp": 13_972_800, "avg_bookings": 4.2},
        {"segment": "Premium",  "customer_count": 904,  "avg_spend_gbp": 15200, "total_spend_gbp": 13_740_800, "avg_bookings": 2.8},
        {"segment": "Explorer", "customer_count": 604,  "avg_spend_gbp": 9800,  "total_spend_gbp":  5_919_200, "avg_bookings": 1.9},
    ]


def _mock_booking_funnel() -> list[dict]:
    return [
        {"stage": "Enquiries",  "count": 24500, "conversion_pct": 100.0,  "channel_breakdown": {"Web": 8400, "Phone": 6800, "Email": 5400, "In-Store": 2900, "WhatsApp": 1000}},
        {"stage": "Quotes",     "count": 14700, "conversion_pct": 60.0,   "channel_breakdown": {"Web": 4200, "Phone": 5100, "Email": 3400, "In-Store": 1600, "WhatsApp": 400}},
        {"stage": "Bookings",   "count": 8200,  "conversion_pct": 33.5,   "channel_breakdown": {"Web": 2870, "Phone": 2460, "Email": 1640, "In-Store": 984,  "WhatsApp": 246}},
        {"stage": "Completed",  "count": 7216,  "conversion_pct": 29.5,   "channel_breakdown": {"Web": 2525, "Phone": 2165, "Email": 1443, "In-Store": 866,  "WhatsApp": 217}},
    ]


def _mock_top_products() -> list[dict]:
    return [
        {"product_name": "Maldives Bespoke Explorer",         "destination_name": "Maldives",     "product_type": "Tailor-Made",  "total_revenue_gbp": 1_870_000, "total_bookings": 124, "base_price_gbp": 18500, "avg_margin_pct": 0.22},
        {"product_name": "Seychelles Honeymoon Paradise",     "destination_name": "Seychelles",   "product_type": "Honeymoon",    "total_revenue_gbp": 1_640_000, "total_bookings": 98,  "base_price_gbp": 22000, "avg_margin_pct": 0.24},
        {"product_name": "Kenya Wildlife Safari",             "destination_name": "Safari Kenya", "product_type": "Adventure",    "total_revenue_gbp": 1_480_000, "total_bookings": 132, "base_price_gbp": 12500, "avg_margin_pct": 0.20},
        {"product_name": "Japan Cultural Immersion",          "destination_name": "Japan",        "product_type": "Cultural",     "total_revenue_gbp": 1_320_000, "total_bookings": 145, "base_price_gbp": 9800,  "avg_margin_pct": 0.19},
        {"product_name": "Amalfi Coast Private Journey",      "destination_name": "Amalfi Coast", "product_type": "Tailor-Made",  "total_revenue_gbp": 1_190_000, "total_bookings": 167, "base_price_gbp": 7800,  "avg_margin_pct": 0.21},
    ]


def _mock_overview() -> dict:
    return {
        "total_revenue_gbp":       34_640_000,
        "total_bookings":          3847,
        "avg_booking_value_gbp":   9006,
        "total_margin_gbp":        7_274_400,
        "avg_margin_pct":          0.21,
        "active_customers":        2000,
        "revenue_cy_gbp":          12_800_000,
        "bookings_cy":             1423,
        "revenue_py_gbp":          11_200_000,
        "bookings_py":             1245,
        "revenue_yoy_growth_pct":  14.3,
        "top_destination":         "Maldives",
        "data_source":             "mock",
        "refreshed_at":            date.today().isoformat(),
    }


# ─────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "snowflake_connected": sf.is_connected(),
        "data_source": "snowflake" if sf.is_connected() else "mock",
    }


@app.get("/api/overview")
def get_overview():
    """Headline KPIs for executive dashboard"""
    rows = sf.query("SELECT * FROM GOLD.RPT_OVERVIEW_KPI LIMIT 1")
    if rows:
        data = rows[0]
        data["data_source"] = "snowflake"
        return data
    return _mock_overview()


@app.get("/api/revenue/monthly")
def get_monthly_revenue(months: int = Query(default=24, ge=1, le=60)):
    """Monthly revenue for the past N months"""
    sql = """
        SELECT
            YEAR_MONTH,
            YEAR,
            MONTH_NAME,
            MONTH_NUM,
            SUM(TOTAL_REVENUE_GBP)      AS total_revenue_gbp,
            SUM(NUM_BOOKINGS)           AS num_bookings,
            AVG(AVG_BOOKING_VALUE_GBP)  AS avg_booking_value_gbp,
            SUM(TOTAL_MARGIN_GBP)       AS total_margin_gbp
        FROM GOLD.RPT_REVENUE_BY_DESTINATION
        WHERE YEAR_MONTH >= TO_CHAR(DATEADD(month, -%s, CURRENT_DATE()), 'YYYY-MM')
        GROUP BY 1,2,3,4
        ORDER BY 1
    """
    rows = sf.query(sql, (months,))
    return rows if rows else _mock_monthly_revenue()[-months:]


@app.get("/api/destinations/top")
def get_top_destinations(limit: int = Query(default=10, ge=1, le=50)):
    """Top destinations by total revenue"""
    sql = """
        SELECT
            DESTINATION_NAME,
            COUNTRY,
            DESTINATION_TIER,
            SUM(TOTAL_REVENUE_GBP)      AS total_revenue_gbp,
            SUM(NUM_BOOKINGS)           AS num_bookings,
            AVG(AVG_BOOKING_VALUE_GBP)  AS avg_booking_value_gbp,
            AVG(AVG_MARGIN_PCT)         AS avg_margin_pct
        FROM GOLD.RPT_REVENUE_BY_DESTINATION
        GROUP BY 1,2,3
        ORDER BY total_revenue_gbp DESC
        LIMIT %s
    """
    rows = sf.query(sql, (limit,))
    return rows if rows else _mock_top_destinations()[:limit]


@app.get("/api/customers/segments")
def get_customer_segments():
    """Customer segment breakdown with LTV metrics"""
    sql = """
        SELECT
            SEGMENT,
            LTV_BAND,
            COUNT(*) AS customer_count,
            ROUND(AVG(TOTAL_SPEND_GBP)) AS avg_spend_gbp,
            ROUND(SUM(TOTAL_SPEND_GBP)) AS total_spend_gbp,
            ROUND(AVG(TOTAL_BOOKINGS), 1) AS avg_bookings
        FROM GOLD.RPT_CUSTOMER_LTV
        GROUP BY 1,2
        ORDER BY total_spend_gbp DESC
    """
    rows = sf.query(sql)
    return rows if rows else _mock_customer_segments()


@app.get("/api/bookings/funnel")
def get_booking_funnel():
    """Enquiry → Quote → Booking → Completion conversion funnel"""
    sql = """
        SELECT
            INTERACTION_TYPE        AS stage,
            SUM(INTERACTION_COUNT)  AS count,
            ROUND(AVG(CONVERSION_RATE_PCT), 1) AS avg_conversion_rate_pct
        FROM GOLD.RPT_BOOKING_FUNNEL
        WHERE YEAR_MONTH >= TO_CHAR(DATEADD(month, -12, CURRENT_DATE()), 'YYYY-MM')
        GROUP BY 1
        ORDER BY count DESC
    """
    rows = sf.query(sql)
    return rows if rows else _mock_booking_funnel()


@app.get("/api/products/top")
def get_top_products(limit: int = Query(default=10, ge=1, le=50)):
    """Top performing holiday packages"""
    sql = """
        SELECT
            PRODUCT_NAME,
            DESTINATION_NAME,
            PRODUCT_TYPE,
            TOTAL_BOOKINGS,
            TOTAL_REVENUE_GBP,
            AVG_BOOKING_VALUE_GBP,
            BASE_PRICE_GBP,
            AVG_MARGIN_PCT,
            CANCELLATION_RATE_PCT
        FROM GOLD.RPT_TOP_PRODUCTS
        LIMIT %s
    """
    rows = sf.query(sql, (limit,))
    return rows if rows else _mock_top_products()[:limit]


@app.get("/api/agents/performance")
def get_agent_performance(year: Optional[int] = None):
    """Sales consultant performance metrics"""
    year = year or date.today().year
    sql = """
        SELECT
            AGENT_NAME,
            BRANCH_NAME,
            SPECIALISATION,
            BOOKINGS,
            REVENUE_GBP,
            AVG_BOOKING_VALUE_GBP,
            AVG_MARGIN_PCT,
            CONVERSION_RATE_PCT,
            PERFORMANCE_QUARTILE
        FROM GOLD.RPT_AGENT_PERFORMANCE
        WHERE YEAR = %s
        ORDER BY REVENUE_GBP DESC
        LIMIT 20
    """
    rows = sf.query(sql, (year,))
    return rows if rows else []


@app.get("/api/seasonal/trends")
def get_seasonal_trends():
    """Monthly demand patterns by destination tier"""
    sql = """
        SELECT
            MONTH_ABBR,
            MONTH_NUM,
            DESTINATION_TIER,
            SUM(BOOKINGS) AS bookings,
            ROUND(AVG(AVG_BOOKING_VALUE)) AS avg_booking_value
        FROM GOLD.RPT_SEASONAL_TRENDS
        GROUP BY 1,2,3
        ORDER BY 3, 2
    """
    rows = sf.query(sql)
    return rows if rows else []


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


@app.get("/api/data-quality")
def get_data_quality():
    """Data quality scorecard across all Bronze tables"""
    checks = []
    try:
        conn = sf.get_connection()
        if conn:
            cur = conn.cursor()
            # Run DQ checks against Bronze tables
            dq_queries = {
                "RAW_CUSTOMERS": {
                    "total": "SELECT COUNT(*) FROM BRONZE.RAW_CUSTOMERS",
                    "null_email": "SELECT COUNT(*) FROM BRONZE.RAW_CUSTOMERS WHERE EMAIL IS NULL OR TRIM(EMAIL)=''",
                    "null_name": "SELECT COUNT(*) FROM BRONZE.RAW_CUSTOMERS WHERE FIRST_NAME IS NULL OR LAST_NAME IS NULL",
                    "invalid_postcode": "SELECT COUNT(*) FROM BRONZE.RAW_CUSTOMERS WHERE LENGTH(TRIM(POSTCODE)) < 5",
                    "duplicate_email": "SELECT COUNT(*)-COUNT(DISTINCT LOWER(EMAIL)) FROM BRONZE.RAW_CUSTOMERS WHERE EMAIL IS NOT NULL",
                },
                "RAW_BOOKINGS": {
                    "total": "SELECT COUNT(*) FROM BRONZE.RAW_BOOKINGS",
                    "null_value": "SELECT COUNT(*) FROM BRONZE.RAW_BOOKINGS WHERE TOTAL_VALUE_GBP IS NULL OR TRIM(TOTAL_VALUE_GBP)=''",
                    "missing_customer": "SELECT COUNT(*) FROM BRONZE.RAW_BOOKINGS b LEFT JOIN BRONZE.RAW_CUSTOMERS c ON b.CUSTOMER_ID=c.CUSTOMER_ID WHERE c.CUSTOMER_ID IS NULL",
                    "missing_product": "SELECT COUNT(*) FROM BRONZE.RAW_BOOKINGS b LEFT JOIN BRONZE.RAW_PRODUCTS p ON b.PRODUCT_ID=p.PRODUCT_ID WHERE p.PRODUCT_ID IS NULL",
                    "future_booking_date": "SELECT COUNT(*) FROM BRONZE.RAW_BOOKINGS WHERE TRY_TO_DATE(BOOKING_DATE,'YYYY-MM-DD') > CURRENT_DATE()",
                },
                "RAW_PRODUCTS": {
                    "total": "SELECT COUNT(*) FROM BRONZE.RAW_PRODUCTS",
                    "null_price": "SELECT COUNT(*) FROM BRONZE.RAW_PRODUCTS WHERE BASE_PRICE_GBP IS NULL OR TRIM(BASE_PRICE_GBP)=''",
                    "missing_destination": "SELECT COUNT(*) FROM BRONZE.RAW_PRODUCTS p LEFT JOIN BRONZE.RAW_DESTINATIONS d ON p.DESTINATION_ID=d.DESTINATION_ID WHERE d.DESTINATION_ID IS NULL",
                    "inactive": "SELECT COUNT(*) FROM BRONZE.RAW_PRODUCTS WHERE IS_ACTIVE='False'",
                },
                "RAW_DESTINATIONS": {
                    "total": "SELECT COUNT(*) FROM BRONZE.RAW_DESTINATIONS",
                    "null_country": "SELECT COUNT(*) FROM BRONZE.RAW_DESTINATIONS WHERE COUNTRY IS NULL",
                    "inactive": "SELECT COUNT(*) FROM BRONZE.RAW_DESTINATIONS WHERE IS_ACTIVE='False'",
                },
            }

            for table, queries in dq_queries.items():
                cur.execute(queries["total"])
                total = cur.fetchone()[0] or 1
                issues = {}
                for check, sql in queries.items():
                    if check == "total":
                        continue
                    cur.execute(sql)
                    issues[check] = cur.fetchone()[0]

                total_issues = sum(issues.values())
                score = round(max(0, (1 - total_issues / max(total, 1)) * 100), 1)
                checks.append({
                    "table": table,
                    "total_rows": total,
                    "score": score,
                    "issues": issues,
                    "total_issues": total_issues,
                })
            cur.close()
            conn.close()
    except Exception as e:
        logging.error(f"DQ check error: {e}")

    if not checks:
        # Mock fallback
        checks = [
            {"table": "RAW_CUSTOMERS", "total_rows": 2000, "score": 94.2, "issues": {"null_email": 8, "null_name": 3, "invalid_postcode": 12, "duplicate_email": 94}, "total_issues": 94},
            {"table": "RAW_BOOKINGS", "total_rows": 8000, "score": 97.8, "issues": {"null_value": 4, "missing_customer": 0, "missing_product": 0, "future_booking_date": 172}, "total_issues": 176},
            {"table": "RAW_PRODUCTS", "total_rows": 200, "score": 95.5, "issues": {"null_price": 2, "missing_destination": 0, "inactive": 7}, "total_issues": 9},
            {"table": "RAW_DESTINATIONS", "total_rows": 50, "score": 100.0, "issues": {"null_country": 0, "inactive": 0}, "total_issues": 0},
        ]

    return {"checks": checks, "overall_score": round(sum(c["score"] for c in checks) / len(checks), 1)}
