from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.stats_schema import OverviewStatsResponse
from app.services.stats_service import calculate_overview_stats

router = APIRouter(prefix="/stats", tags=["Statistics & Progress Monitor"])

@router.get("/overview", response_model=OverviewStatsResponse)
async def get_overview_stats(db: AsyncSession = Depends(get_db)):
    """Fetch aggregated statistics, streak counter, and recurrence breakdowns."""
    return await calculate_overview_stats(db)
