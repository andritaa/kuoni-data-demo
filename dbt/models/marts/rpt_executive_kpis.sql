-- Executive KPI summary
{{ config(materialized='table') }}

select
    count(*) as total_bookings,
    round(sum(total_value_gbp), 0) as total_revenue_gbp,
    round(avg(total_value_gbp), 0) as avg_booking_value_gbp,
    count(distinct customer_id) as unique_customers,
    sum(case when is_cancelled then 1 else 0 end) as cancellations,
    round(sum(case when is_cancelled then 1 else 0 end) * 100.0 / count(*), 1) as cancellation_rate_pct,
    round(sum(margin_gbp), 0) as total_margin_gbp,
    round(avg(margin_pct), 1) as avg_margin_pct,
    round(avg(lead_time_days), 0) as avg_lead_time_days
from {{ ref('int_booking_enriched') }}
