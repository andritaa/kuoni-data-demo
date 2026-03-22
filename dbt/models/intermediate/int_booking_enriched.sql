-- Enriched bookings with customer, product, and destination context
with bookings as (
    select * from {{ ref('stg_bookings') }}
),

customers as (
    select * from {{ ref('stg_customers') }}
),

products as (
    select * from {{ ref('stg_products') }}
),

destinations as (
    select * from {{ ref('stg_destinations') }}
)

select
    b.booking_id,
    b.booking_date,
    b.travel_date,
    b.return_date,
    b.booking_status,
    b.channel,
    b.num_passengers,
    b.total_value_gbp,
    b.deposit_amount_gbp,
    b.margin_pct,
    b.total_value_gbp * b.margin_pct / 100 as margin_gbp,
    b.is_insured,
    b.cancellation_date,
    b.cancellation_reason,

    -- Customer
    c.customer_id,
    c.full_name as customer_name,
    c.segment as customer_segment,
    c.loyalty_tier,
    c.city as customer_city,
    c.country as customer_country,

    -- Product
    p.product_id,
    p.product_name,
    p.product_type,
    p.duration_days,
    p.base_price_gbp,
    p.accommodation_tier,
    p.is_all_inclusive,

    -- Destination
    d.destination_name,
    d.country as destination_country,
    d.region as destination_region,
    d.continent,
    d.tier as destination_tier,
    d.requires_visa,

    -- Derived
    datediff('day', b.booking_date, b.travel_date) as lead_time_days,
    case when b.booking_status = 'Cancelled' then true else false end as is_cancelled

from bookings b
left join customers c on b.customer_id = c.customer_id
left join products p on b.product_id = p.product_id
left join destinations d on p.destination_id = d.destination_id
