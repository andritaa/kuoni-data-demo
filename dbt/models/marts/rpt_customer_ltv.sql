-- Customer lifetime value
{{ config(materialized='table') }}

select
    customer_id,
    customer_name,
    customer_segment,
    loyalty_tier,
    customer_city,
    count(*) as total_bookings,
    round(sum(total_value_gbp), 0) as lifetime_value_gbp,
    round(avg(total_value_gbp), 0) as avg_booking_value_gbp,
    min(booking_date) as first_booking,
    max(booking_date) as last_booking,
    datediff('day', min(booking_date), max(booking_date)) as customer_tenure_days
from {{ ref('int_booking_enriched') }}
group by 1, 2, 3, 4, 5
