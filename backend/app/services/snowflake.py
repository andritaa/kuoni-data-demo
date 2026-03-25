from typing import Any, Dict, List, Optional

from fastapi import HTTPException, status

from app.core.config import settings


class SnowflakeService:
    def __init__(self):
        self._conn = None

    def _get_connection(self):
        try:
            import snowflake.connector
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Snowflake connector not available: {exc}",
            )

        try:
            return snowflake.connector.connect(
                user=settings.SNOWFLAKE_USER,
                password=settings.SNOWFLAKE_PASSWORD,
                account=settings.SNOWFLAKE_ACCOUNT,
                warehouse=settings.SNOWFLAKE_WAREHOUSE,
                database=settings.SNOWFLAKE_DATABASE,
                schema=settings.SNOWFLAKE_SCHEMA,
                role=settings.SNOWFLAKE_ROLE,
            )
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Unable to connect to Snowflake: {exc}",
            )

    def fetch_customer_360(
        self,
        customer_name: Optional[str] = None,
        segment: Optional[str] = None,
    ) -> Optional[List[Dict[str, Any]]]:
        conn = None
        cursor = None
        try:
            conn = self._get_connection()
            cursor = conn.cursor()

            sql = """
                SELECT
                    CUSTOMER_ID,
                    CUSTOMER_NAME,
                    SEGMENT,
                    LOYALTY_TIER,
                    TOTAL_REVENUE,
                    TOTAL_BOOKINGS,
                    AVG_BOOKING_VALUE,
                    LAST_BOOKING_DATE,
                    BOOKING_DATE,
                    BOOKING_VALUE,
                    DESTINATION,
                    PRODUCT_NAME
                FROM RPT_CUSTOMER_LTV
                WHERE (%(customer_name)s IS NULL OR UPPER(CUSTOMER_NAME) LIKE UPPER('%%' || %(customer_name)s || '%%'))
                  AND (%(segment)s IS NULL OR UPPER(SEGMENT) = UPPER(%(segment)s))
                ORDER BY TOTAL_REVENUE DESC, LAST_BOOKING_DATE DESC
            """

            params = {"customer_name": customer_name, "segment": segment}
            cursor.execute(sql, params)
            columns = [col[0] for col in cursor.description]
            rows = cursor.fetchall()
            return [dict(zip(columns, row)) for row in rows]
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Snowflake query failed: {exc}",
            )
        finally:
            try:
                if cursor is not None:
                    cursor.close()
            finally:
                if conn is not None:
                    conn.close()
