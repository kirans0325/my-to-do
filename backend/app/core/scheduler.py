import asyncio
import logging
from app.core.database import AsyncSessionLocal
from app.services.alert_service import scan_and_generate_alerts
from app.core.config import settings

logger = logging.getLogger("taskflow.scheduler")

class BackgroundAlertScheduler:
    def __init__(self):
        self._task: asyncio.Task | None = None
        self._is_running = False

    async def _run_loop(self):
        logger.info(f"Background alert monitor started (Interval: {settings.ALERT_CHECK_INTERVAL_SECONDS}s).")
        while self._is_running:
            try:
                async with AsyncSessionLocal() as session:
                    await scan_and_generate_alerts(session)
            except Exception as e:
                logger.error(f"Error in background alert monitor: {e}", exc_info=True)
            
            # Wait for next interval
            await asyncio.sleep(settings.ALERT_CHECK_INTERVAL_SECONDS)

    def start(self):
        if not self._is_running:
            self._is_running = True
            self._task = asyncio.create_task(self._run_loop())

    async def stop(self):
        if self._is_running:
            self._is_running = False
            if self._task:
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass
            logger.info("Background alert monitor stopped.")

scheduler = BackgroundAlertScheduler()
