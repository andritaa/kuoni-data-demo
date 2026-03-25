from fastapi import FastAPI, Depends, Query

from app.services.snowflake import SnowflakeService
from app.services.customer_360_service import Customer360Service

app = FastAPI()

# existing routes...


@app.get("/api/customers/360")
def get_customer_360(
    customer_name: str | None = Query(default=None),
    segment: str | None = Query(default=None),
):
    service = Customer360Service(SnowflakeService())
    return service.get_customer_360(customer_name=customer_name, segment=segment)
