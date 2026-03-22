with source as (
    select * from {{ source('bronze', 'raw_products') }}
),

cleaned as (
    select
        product_id,
        product_name,
        destination_id,
        product_type,
        duration_days::int as duration_days,
        base_price_gbp::decimal(10,2) as base_price_gbp,
        included_flights::boolean as has_flights,
        all_inclusive::boolean as is_all_inclusive,
        max_group_size::int as max_group_size,
        accommodation_tier,
        is_active::boolean as is_active,
        launch_date::date as launch_date,
        _load_timestamp
    from source
    where product_id is not null
)

select * from cleaned
