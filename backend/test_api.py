import asyncio
import httpx
from app.main import app
from app.core.database import init_db

async def run_tests():
    print("[*] Running comprehensive API tests...")
    await init_db()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("  [OK] Health check passed")

        # 2. List Categories
        res = await client.get("/api/v1/categories")
        assert res.status_code == 200
        categories = res.json()
        assert len(categories) > 0
        print(f"  [OK] Categories listed: {len(categories)} categories")

        # 3. List Tasks
        res = await client.get("/api/v1/tasks")
        assert res.status_code == 200
        tasks = res.json()
        assert len(tasks) > 0
        print(f"  [OK] Tasks listed: {len(tasks)} tasks")

        # 4. Create a Daily Recurring Task
        new_task_payload = {
            "title": "Daily 30min Technical Reading",
            "description": "Read documentation or technical articles.",
            "recurrence_type": "DAILY",
            "recurrence_interval": 1,
            "priority": "HIGH",
            "category_id": categories[0]["id"],
            "subtasks": [
                {"id": 1, "title": "Pick topic", "completed": False},
                {"id": 2, "title": "Take notes", "completed": False}
            ]
        }
        res = await client.post("/api/v1/tasks", json=new_task_payload)
        assert res.status_code == 201, f"Create task failed: {res.text}"
        created_task = res.json()
        assert created_task["title"] == "Daily 30min Technical Reading"
        print(f"  [OK] Task created with ID: {created_task['id']}")

        # 5. Update Progress on Task
        res = await client.post(
            f"/api/v1/tasks/{created_task['id']}/progress",
            json={"progress_value": 50, "note": "Finished first chapter"}
        )
        assert res.status_code == 200
        assert res.json()["progress_percentage"] == 50
        assert res.json()["status"] == "IN_PROGRESS"
        print("  [OK] Task progress updated to 50%")

        # 6. Complete Recurring Task & verify advance
        res = await client.post(f"/api/v1/tasks/{created_task['id']}/complete")
        assert res.status_code == 200
        advanced_task = res.json()
        assert advanced_task["status"] == "PENDING"
        assert advanced_task["progress_percentage"] == 0
        assert advanced_task["due_date"] is not None
        print("  [OK] Recurring task completion successfully advanced next cycle")

        # 7. Daily Diary Entry
        diary_payload = {
            "entry_date": "2026-08-19",
            "title": "Integration Testing & Validation",
            "content": "Completed all backend integration tests and verified database consistency.",
            "mood": "GREAT",
            "productivity_score": 10,
            "tags": "testing,milestone",
            "activities": [
                {"time": "10:00 AM", "activity": "Ran automated test suite", "category": "Testing", "done": True}
            ]
        }
        res = await client.post("/api/v1/diary", json=diary_payload)
        assert res.status_code == 201, f"Diary create failed: {res.text}"
        print("  [OK] Daily Diary entry saved successfully")

        # 8. Alert Scan
        res = await client.post("/api/v1/reminders/scan")
        assert res.status_code == 200
        print("  [OK] Overdue & reminder alert scan triggered")

        # 9. Overview Stats
        res = await client.get("/api/v1/stats/overview")
        assert res.status_code == 200
        stats = res.json()
        assert stats["total_tasks"] > 0
        assert "daily_stats" in stats
        assert "monthly_stats" in stats
        assert "yearly_stats" in stats
        print(f"  [OK] Overview stats calculated: {stats['total_tasks']} tasks, completion rate: {stats['overall_completion_rate']}%")

    print("\n[SUCCESS] ALL API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
