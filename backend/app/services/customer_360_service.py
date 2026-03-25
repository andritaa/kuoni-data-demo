from typing import Any, Dict, List, Optional
from fastapi import HTTPException, status

from app.schemas.customer_360 import (
    BookingHistoryItem,
    Customer360Filter,
    Customer360Response,
    LoyaltyTierDistributionItem,
    SegmentBreakdownItem,
    TopCustomer,
)
from app.services.snowflake import SnowflakeService


class Customer360Service:
    def __init__(self, snowflake_service: SnowflakeService):
        self.snowflake_service = snowflake_service

    def get_customer_360(
        self,
        customer_name: Optional[str] = None,
        segment: Optional[str] = None,
    ) -> Customer360Response:
        rows = self.snowflake_service.fetch_customer_360(
            customer_name=customer_name,
            segment=segment,
        )

        if rows is None:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Failed to fetch Customer 360 data from Snowflake",
            )

        if len(rows) == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No Customer 360 data found for the provided filters",
            )

        top_customers_map: Dict[str, Dict[str, Any]] = {}
        segment_map: Dict[str, Dict[str, Any]] = {}
        loyalty_map: Dict[str, Dict[str, Any]] = {}
        booking_history: List[BookingHistoryItem] = []

        for row in rows:
            customer_id = str(row.get("CUSTOMER_ID") or row.get("customer_id") or "")
            customer_name_value = row.get("CUSTOMER_NAME") or row.get("customer_name")
            segment_value = row.get("SEGMENT") or row.get("segment") or "Unknown"
            loyalty_tier_value = row.get("LOYALTY_TIER") or row.get("loyalty_tier") or "Unknown"
            revenue = float(row.get("TOTAL_REVENUE") or row.get("total_revenue") or 0)
            bookings = int(row.get("TOTAL_BOOKINGS") or row.get("total_bookings") or 0)
            avg_booking_value = float(row.get("AVG_BOOKING_VALUE") or row.get("avg_booking_value") or 0)
            last_booking_date = row.get("LAST_BOOKING_DATE") or row.get("last_booking_date")

            if customer_id not in top_customers_map:
                top_customers_map[customer_id] = {
                    "customer_id": customer_id or None,
                    "customer_name": customer_name_value,
                    "segment": segment_value,
                    "loyalty_tier": loyalty_tier_value,
                    "total_revenue": 0.0,
                    "total_bookings": 0,
                    "avg_booking_value": 0.0,
                    "last_booking_date": last_booking_date,
                }

            top_customers_map[customer_id]["total_revenue"] += revenue
            top_customers_map[customer_id]["total_bookings"] += bookings
            top_customers_map[customer_id]["avg_booking_value"] = avg_booking_value or top_customers_map[customer_id]["avg_booking_value"]
            top_customers_map[customer_id]["last_booking_date"] = last_booking_date or top_customers_map[customer_id]["last_booking_date"]

            if segment_value not in segment_map:
                segment_map[segment_value] = {
                    "segment": segment_value,
                    "customer_count": 0,
                    "total_revenue": 0.0,
                    "total_bookings": 0,
                }
            segment_map[segment_value]["customer_count"] += 1
            segment_map[segment_value]["total_revenue"] += revenue
            segment_map[segment_value]["total_bookings"] += bookings

            if loyalty_tier_value not in loyalty_map:
                loyalty_map[loyalty_tier_value] = {
                    "loyalty_tier": loyalty_tier_value,
                    "customer_count": 0,
                    "total_revenue": 0.0,
                    "total_bookings": 0,
                }
            loyalty_map[loyalty_tier_value]["customer_count"] += 1
            loyalty_map[loyalty_tier_value]["total_revenue"] += revenue
            loyalty_map[loyalty_tier_value]["total_bookings"] += bookings

            booking_history.append(
                BookingHistoryItem(
                    booking_date=str(row.get("BOOKING_DATE") or row.get("booking_date") or "") or None,
                    customer_id=customer_id or None,
                    customer_name=customer_name_value,
                    segment=segment_value,
                    loyalty_tier=loyalty_tier_value,
                    booking_value=float(row.get("BOOKING_VALUE") or row.get("booking_value") or 0),
                    destination=row.get("DESTINATION") or row.get("destination"),
                    product_name=row.get("PRODUCT_NAME") or row.get("product_name"),
                )
            )

        top_customers = sorted(
            [TopCustomer(**item) for item in top_customers_map.values()],
            key=lambda x: x.total_revenue,
            reverse=True,
        )[:20]

        segment_breakdown = sorted(
            [SegmentBreakdownItem(**item) for item in segment_map.values()],
            key=lambda x: x.total_revenue,
            reverse=True,
        )

        loyalty_tier_distribution = sorted(
            [LoyaltyTierDistributionItem(**item) for item in loyalty_map.values()],
            key=lambda x: x.total_revenue,
            reverse=True,
        )

        return Customer360Response(
            filters=Customer360Filter(customer_name=customer_name, segment=segment),
            total_customers=len(top_customers_map),
            top_customers=top_customers,
            segment_breakdown=segment_breakdown,
            booking_history=booking_history,
            loyalty_tier_distribution=loyalty_tier_distribution,
        )
