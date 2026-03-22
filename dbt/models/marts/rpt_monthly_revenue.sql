-- Monthly revenue trend
{{ config(materialized='table') }}

select
    date_trunc('month', booking_date)::date as month,
    count(*) as bookings,
    round(sum(total_value_gbp), 0) as revenue_gbp,
    round(sum(margin_gbp), 0) as margin_gbp,
    round(avg(total_value_gbp), 0) as avg_value_gbp,
    count(distinct customer_id) as unique_customers
from {{ ref('int_booking_enriched') }}
group by 1
order by 1
