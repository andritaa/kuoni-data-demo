-- Inghams fact table — brand-level data product
-- Enriched with customer + product + destination context
{{ config(materialized='table', schema='GOLD') }}

with bookings as (
    select * from {{ ref('stg_inghams_bookings') }}
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
    b.brand,
    b.booking_date,
    b.travel_date,
    b.booking_status,
    b.channel,
    b.num_passengers,
    b.total_value_gbp,
    b.margin_pct,
    b.total_value_gbp * b.margin_pct / 100 as margin_gbp,
    b.is_insured,
    -- Customer
    c.customer_id,
    c.first_name || ' ' || c.last_name as customer_name,
    c.segment as customer_segment,
    c.loyalty_tier,
    -- Product
    p.product_name,
    p.product_type,
    p.duration_days,
    p.base_price_gbp,
    -- Destination
    d.destination_name,
    d.country as destination_country,
    d.region as destination_region,
    d.tier as destination_tier
from bookings b
left join customers c on b.customer_id = c.customer_id
left join products p on b.product_id = p.product_id
left join destinations d on p.destination_id = d.destination_id
