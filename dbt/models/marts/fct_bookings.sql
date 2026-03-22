-- Fact table: one row per booking with all dimensions resolved
{{ config(materialized='table') }}

select * from {{ ref('int_booking_enriched') }}
