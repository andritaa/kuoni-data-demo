import streamlit as st
from snowflake.snowpark.context import get_active_session
import pandas as pd

st.set_page_config(page_title="Kuoni Data Intelligence Platform", layout="wide")

session = get_active_session()

st.title("❄️ Kuoni Data Intelligence Platform")
st.caption("🥉 BRONZE → 🥈 SILVER → 🥇 GOLD  |  Star Schema · Live Snowflake Data  |  AWS eu-west-2")
st.divider()

# ── KPIs ──────────────────────────────────────────────────────────────────────
kpi_df = session.sql("""
    SELECT
        ROUND(SUM(f.TOTAL_VALUE_GBP) / 1000000, 2)                        AS revenue_m,
        COUNT(*)                                                             AS bookings,
        ROUND(AVG(f.TOTAL_VALUE_GBP), 0)                                   AS avg_value,
        ROUND(SUM(f.TOTAL_VALUE_GBP * f.MARGIN_PCT / 100) / 1000000, 2)   AS margin_m,
        COUNT(DISTINCT f.CUSTOMER_SK)                                       AS customers,
        ROUND(AVG(f.MARGIN_PCT), 1)                                        AS avg_margin_pct
    FROM GOLD.FCT_BOOKING f
    WHERE f.BOOKING_STATUS != 'Cancelled'
""").to_pandas()

r = kpi_df.iloc[0]
k1, k2, k3, k4, k5, k6 = st.columns(6)
k1.metric("💷 Total Revenue",     f"£{r['REVENUE_M']}M")
k2.metric("✈️ Total Bookings",    f"{int(r['BOOKINGS']):,}")
k3.metric("📈 Avg Booking Value", f"£{int(r['AVG_VALUE']):,}")
k4.metric("💰 Total Margin",      f"£{r['MARGIN_M']}M")
k5.metric("👥 Customers",         f"{int(r['CUSTOMERS']):,}")
k6.metric("📊 Avg Margin %",      f"{r['AVG_MARGIN_PCT']}%")

st.divider()

# ── Revenue Trend + Top Destinations ─────────────────────────────────────────
col1, col2 = st.columns([3, 2])

with col1:
    st.subheader("📈 Monthly Revenue Trend")
    rev_df = session.sql("""
        SELECT
            dd.YEAR::VARCHAR || '-' || LPAD(dd.MONTH_NUM::VARCHAR, 2, '0') AS period,
            dd.MONTH_NUM,
            dd.YEAR,
            ROUND(SUM(f.TOTAL_VALUE_GBP) / 1000, 0) AS revenue_k
        FROM GOLD.FCT_BOOKING f
        JOIN GOLD.DIM_DATE dd ON f.BOOKING_DATE_SK = dd.DATE_SK
        WHERE dd.YEAR >= 2024 AND f.BOOKING_STATUS != 'Cancelled'
        GROUP BY 1, 2, 3
        ORDER BY 3, 2
    """).to_pandas()
    st.line_chart(rev_df.set_index('PERIOD')[['REVENUE_K']].rename(columns={'REVENUE_K': 'Revenue (£000s)'}))

with col2:
    st.subheader("🌍 Top Destinations")
    dest_df = session.sql("""
        SELECT
            d.DESTINATION_NAME                          AS destination,
            ROUND(SUM(f.TOTAL_VALUE_GBP) / 1000, 0)   AS revenue_k
        FROM GOLD.FCT_BOOKING f
        JOIN GOLD.DIM_DESTINATION d ON f.DESTINATION_SK = d.DESTINATION_SK
        WHERE f.BOOKING_STATUS != 'Cancelled'
        GROUP BY 1 ORDER BY 2 DESC LIMIT 10
    """).to_pandas()
    st.bar_chart(dest_df.set_index('DESTINATION')[['REVENUE_K']].rename(columns={'REVENUE_K': 'Revenue (£000s)'}))

st.divider()

# ── Segments + Channels + Agents ─────────────────────────────────────────────
col3, col4, col5 = st.columns(3)

with col3:
    st.subheader("👥 Customer Segments")
    seg_df = session.sql("""
        SELECT
            dc.SEGMENT,
            ROUND(SUM(f.TOTAL_VALUE_GBP) / 1000, 0) AS revenue_k,
            COUNT(DISTINCT f.CUSTOMER_SK)             AS customers
        FROM GOLD.FCT_BOOKING f
        JOIN GOLD.DIM_CUSTOMER dc ON f.CUSTOMER_SK = dc.CUSTOMER_SK
        WHERE f.BOOKING_STATUS != 'Cancelled'
        GROUP BY 1 ORDER BY 2 DESC
    """).to_pandas()
    st.bar_chart(seg_df.set_index('SEGMENT')[['REVENUE_K']].rename(columns={'REVENUE_K': 'Revenue (£000s)'}))

with col4:
    st.subheader("📡 Booking Channels")
    ch_df = session.sql("""
        SELECT
            ch.CHANNEL_NAME,
            COUNT(*)                                   AS bookings,
            ROUND(SUM(f.TOTAL_VALUE_GBP) / 1000, 0)  AS revenue_k,
            ROUND(AVG(f.TOTAL_VALUE_GBP), 0)          AS avg_value
        FROM GOLD.FCT_BOOKING f
        JOIN GOLD.DIM_CHANNEL ch ON f.CHANNEL_SK = ch.CHANNEL_SK
        GROUP BY 1 ORDER BY 2 DESC
    """).to_pandas()
    st.bar_chart(ch_df.set_index('CHANNEL_NAME')[['BOOKINGS']].rename(columns={'BOOKINGS': 'Bookings'}))
    st.dataframe(ch_df.rename(columns={
        'CHANNEL_NAME': 'Channel', 'BOOKINGS': 'Bookings',
        'REVENUE_K': 'Revenue £k', 'AVG_VALUE': 'Avg £'
    }))

with col5:
    st.subheader("🧑‍💼 Top Agents")
    agent_df = session.sql("""
        SELECT
            da.AGENT_NAME,
            COUNT(*)                                    AS bookings,
            ROUND(SUM(f.TOTAL_VALUE_GBP) / 1000, 0)  AS revenue_k
        FROM GOLD.FCT_BOOKING f
        JOIN GOLD.DIM_AGENT da ON f.AGENT_SK = da.AGENT_SK
        WHERE da.AGENT_NAME IS NOT NULL
        GROUP BY 1 ORDER BY 3 DESC LIMIT 8
    """).to_pandas()
    st.bar_chart(agent_df.set_index('AGENT_NAME')[['REVENUE_K']].rename(columns={'REVENUE_K': 'Revenue (£000s)'}))

st.divider()

# ── Seasonal + Schema ─────────────────────────────────────────────────────────
col6, col7 = st.columns([2, 1])

with col6:
    st.subheader("🗓️ Seasonal Demand — Bookings by Month & Year")
    heat_df = session.sql("""
        SELECT
            dd.MONTH_ABBR  AS month,
            dd.MONTH_NUM,
            SUM(CASE WHEN dd.YEAR = 2024 THEN 1 ELSE 0 END) AS "2024",
            SUM(CASE WHEN dd.YEAR = 2025 THEN 1 ELSE 0 END) AS "2025",
            SUM(CASE WHEN dd.YEAR = 2026 THEN 1 ELSE 0 END) AS "2026"
        FROM GOLD.FCT_BOOKING f
        JOIN GOLD.DIM_DATE dd ON f.BOOKING_DATE_SK = dd.DATE_SK
        GROUP BY 1, 2 ORDER BY 2
    """).to_pandas()
    st.bar_chart(heat_df.set_index('MONTH')[['2024','2025','2026']])

with col7:
    st.subheader("📐 Star Schema")
    st.markdown("""
    | Table | Rows |
    |-------|------|
    | `FCT_BOOKING` | 8,000 |
    | `DIM_DATE` | 4,018 |
    | `DIM_CUSTOMER` | 2,000 |
    | `DIM_PRODUCT` | 200 |
    | `DIM_DESTINATION` | 50 |
    | `DIM_AGENT` | 20 |
    | `DIM_CHANNEL` | 4 |

    **Lineage:** BRONZE → SILVER (DV2.0) → GOLD (Star Schema)

    🔒 PII masked on 5 fields
    ✅ Referential integrity enforced
    📅 Date spine: 2020–2030
    """)

    st.subheader("🔍 Sample Query")
    st.code("""SELECT dd.MONTH_NAME,
       SUM(f.TOTAL_VALUE_GBP) AS revenue,
       COUNT(*) AS bookings
FROM GOLD.FCT_BOOKING f
JOIN GOLD.DIM_DATE dd
  ON f.BOOKING_DATE_SK = dd.DATE_SK
GROUP BY 1 ORDER BY 2 DESC""", language="sql")

st.divider()

# ── Data Mesh — Data Products Catalogue ──────────────────────────────────────
st.subheader("📦 Data Mesh — Data Products Catalogue")
st.caption("Domain-owned, governed, discoverable data products. Each is a SECURE VIEW in KUONI_DEMO.DATA_PRODUCTS, tagged with DOMAIN · DATA_STEWARD · SLA_TIER · REFRESH_CADENCE.")

products = [
    {
        "name": "DP_CUSTOMER_360",
        "title": "Customer 360",
        "domain": "Customer",
        "icon": "👥",
        "owner": "CRM Team",
        "sla": "🥇 GOLD",
        "refresh": "Daily",
        "desc": "Unified customer profile — LTV, segment, retention status, favourite destination, preferred channel. PII masked.",
        "query": "SELECT customer_id, segment, ltv_band, retention_status, lifetime_value_gbp\nFROM DATA_PRODUCTS.DP_CUSTOMER_360\nWHERE retention_status = 'At Risk'\nORDER BY lifetime_value_gbp DESC",
    },
    {
        "name": "DP_BOOKING_INTELLIGENCE",
        "title": "Booking Intelligence",
        "domain": "Commercial",
        "icon": "✈️",
        "owner": "Commercial Team",
        "sla": "⭐ PLATINUM",
        "refresh": "Daily",
        "desc": "Daily booking grain with full dimensional context — revenue, margin, destination, agent, channel. Primary source for Power BI and forecasting.",
        "query": "SELECT booking_month, destination_name,\n       SUM(total_value_gbp) AS revenue, COUNT(*) AS bookings\nFROM DATA_PRODUCTS.DP_BOOKING_INTELLIGENCE\nWHERE booking_year = 2025\nGROUP BY 1, 2 ORDER BY revenue DESC",
    },
    {
        "name": "DP_DESTINATION_PERFORMANCE",
        "title": "Destination Performance",
        "domain": "Destination",
        "icon": "🌍",
        "owner": "Destination Team",
        "sla": "🥇 GOLD",
        "refresh": "Daily",
        "desc": "Destination revenue, margin, booking volumes, seasonality, and cancellation rates. Used for portfolio optimisation and demand-based pricing.",
        "query": "SELECT destination_name, tier,\n       SUM(revenue_gbp) AS total_revenue,\n       ROUND(AVG(avg_margin_pct),1) AS margin_pct\nFROM DATA_PRODUCTS.DP_DESTINATION_PERFORMANCE\nWHERE year = 2025\nGROUP BY 1, 2 ORDER BY total_revenue DESC",
    },
    {
        "name": "DP_AGENT_SCORECARD",
        "title": "Agent Scorecard",
        "domain": "Operations",
        "icon": "🧑‍💼",
        "owner": "Operations Team",
        "sla": "🥇 GOLD",
        "refresh": "Daily",
        "desc": "Monthly sales consultant performance — revenue, margin, cancellation rate, and in-region rank. Used for performance reviews and incentive calculation.",
        "query": "SELECT agent_name, region, month_name,\n       revenue_gbp, revenue_rank_in_region\nFROM DATA_PRODUCTS.DP_AGENT_SCORECARD\nWHERE year = 2025 AND revenue_rank_in_region <= 3\nORDER BY region, month_name, revenue_rank_in_region",
    },
    {
        "name": "DP_EXECUTIVE_KPIS",
        "title": "Executive KPIs",
        "domain": "Executive",
        "icon": "📊",
        "owner": "Data Platform",
        "sla": "⭐ PLATINUM",
        "refresh": "Daily",
        "desc": "Monthly executive roll-up — revenue, margin, bookings, YoY growth. Single authoritative source for board reporting and DERTOUR Group submissions.",
        "query": "SELECT year, month_name,\n       revenue_gbp, margin_gbp,\n       revenue_yoy_pct AS yoy_growth_pct\nFROM DATA_PRODUCTS.DP_EXECUTIVE_KPIS\nORDER BY year, month_num",
    },
]

# Show as expandable cards
for p in products:
    with st.expander(f"{p['icon']}  {p['title']}  ·  {p['domain']} Domain  ·  {p['sla']}  ·  🔄 {p['refresh']}"):
        st.markdown(f"**Schema path:** `KUONI_DEMO.DATA_PRODUCTS.{p['name']}`  |  **Owner:** {p['owner']}")
        st.markdown(p["desc"])
        
        # Live row count
        try:
            cnt_df = session.sql(f"SELECT COUNT(*) AS n FROM DATA_PRODUCTS.{p['name']}").to_pandas()
            st.metric("Live row count", f"{int(cnt_df.iloc[0]['N']):,}")
        except Exception:
            st.caption("(row count unavailable)")
        
        st.code(p["query"], language="sql")
        st.caption("📌 Object tags: DOMAIN · DATA_STEWARD · SLA_TIER · REFRESH_CADENCE · DATA_PRODUCT — visible in Snowflake Horizon (Enterprise+)")
