with source as (
    select * from {{ source('bronze', 'raw_bookings') }}
),

cleaned as (
    select
        booking_id,
        customer_id,
        product_id,
        booking_date::date as booking_date,
        travel_date::date as travel_date,
        return_date::date as return_date,
        num_passengers,
        total_value_gbp::decimal(12,2) as total_value_gbp,
        deposit_amount_gbp::decimal(12,2) as deposit_amount_gbp,
        margin_pct::decimal(5,2) as margin_pct,
        status as booking_status,
        channel,
        agent_id,
        branch_code,
        currency,
        insurance_included::boolean as is_insured,
        cancellation_date::date as cancellation_date,
        cancellation_reason,
        _load_timestamp
    from source
    where booking_id is not null
)

select * from cleaned
