with source as (
    select * from {{ source('bronze', 'raw_destinations') }}
)

select
    destination_id,
    destination_name,
    country,
    region,
    continent,
    tier,
    avg_duration_days::int as avg_duration_days,
    peak_season_start,
    peak_season_end,
    flight_hrs_from_lhr::decimal(4,1) as flight_hours_from_london,
    visa_required::boolean as requires_visa,
    climate_type,
    is_active::boolean as is_active,
    _load_timestamp
from source
