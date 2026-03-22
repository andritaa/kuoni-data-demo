-- Destination performance analysis
{{ config(materialized='table') }}

select
    destination_name,
    destination_country,
    destination_region,
    continent,
    destination_tier,
    count(*) as total_bookings,
    round(sum(total_value_gbp), 0) as total_revenue_gbp,
    round(avg(total_value_gbp), 0) as avg_booking_value_gbp,
    round(avg(duration_days), 1) as avg_duration_days,
    sum(case when is_cancelled then 1 else 0 end) as cancellations,
    round(sum(case when is_cancelled then 1 else 0 end) * 100.0 / count(*), 1) as cancel_rate_pct
from {{ ref('int_booking_enriched') }}
group by 1, 2, 3, 4, 5
