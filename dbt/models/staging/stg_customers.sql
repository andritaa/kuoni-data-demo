with source as (
    select * from {{ source('bronze', 'raw_customers') }}
),

cleaned as (
    select
        customer_id,
        first_name,
        last_name,
        first_name || ' ' || last_name as full_name,
        email,
        phone,
        date_of_birth::date as date_of_birth,
        city,
        postcode,
        country,
        join_date::date as join_date,
        segment,
        loyalty_tier,
        travel_history_count::int as lifetime_bookings,
        gdpr_consent::boolean as has_gdpr_consent,
        _load_timestamp
    from source
    where customer_id is not null
)

select * from cleaned
