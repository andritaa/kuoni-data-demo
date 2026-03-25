from typing import List, Optional
from pydantic import BaseModel, Field


class Customer360Filter(BaseModel):
    customer_name: Optional[str] = None
    segment: Optional[str] = None


class TopCustomer(BaseModel):
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    segment: Optional[str] = None
    loyalty_tier: Optional[str] = None
    total_revenue: float = 0.0
    total_bookings: int = 0
    avg_booking_value: float = 0.0
    last_booking_date: Optional[str] = None


class SegmentBreakdownItem(BaseModel):
    segment: str
    customer_count: int = 0
    total_revenue: float = 0.0
    total_bookings: int = 0


class BookingHistoryItem(BaseModel):
    booking_date: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    segment: Optional[str] = None
    loyalty_tier: Optional[str] = None
    booking_value: float = 0.0
    destination: Optional[str] = None
    product_name: Optional[str] = None


class LoyaltyTierDistributionItem(BaseModel):
    loyalty_tier: str
    customer_count: int = 0
    total_revenue: float = 0.0
    total_bookings: int = 0


class Customer360Response(BaseModel):
    filters: Customer360Filter = Field(default_factory=Customer360Filter)
    total_customers: int = 0
    top_customers: List[TopCustomer] = Field(default_factory=list)
    segment_breakdown: List[SegmentBreakdownItem] = Field(default_factory=list)
    booking_history: List[BookingHistoryItem] = Field(default_factory=list)
    loyalty_tier_distribution: List[LoyaltyTierDistributionItem] = Field(default_factory=list)
