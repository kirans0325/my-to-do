import asyncio
import httpx
import uuid
from app.main import app
from app.core.database import init_db

async def run_tests():
    print("[*] Running comprehensive API tests with Strict User Isolation check...")
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

        # 3. Unauthenticated requests return 0 tasks and 0 notes
        unauth_tasks = await client.get("/api/v1/tasks")
        assert unauth_tasks.status_code == 200
        assert len(unauth_tasks.json()) == 0, "Unauthenticated client should see 0 tasks!"
        
        unauth_diary = await client.get("/api/v1/diary")
        assert unauth_diary.status_code == 200
        assert len(unauth_diary.json()) == 0, "Unauthenticated client should see 0 diary notes!"
        print("  [OK] Unauthenticated client sees zero tasks and zero notes")

        # 4. Create a test user A
        unique_suffix = str(uuid.uuid4())[:8]
        user_a_name = f"user_a_{unique_suffix}"
        user_a_email = f"usera_{unique_suffix}@example.com"
        reg_a = await client.post("/api/v1/auth/register", json={
            "username": user_a_name,
            "email": user_a_email,
            "password": "Password123!"
        })
        assert reg_a.status_code == 201, f"User A registration failed: {reg_a.text}"
        token_a = reg_a.json()["access_token"]
        headers_a = {"Authorization": f"Bearer {token_a}"}
        print("  [OK] Registered User A successfully")

        # 5. User A creates a private task and diary note
        task_payload_a = {
            "title": "User A Private Task",
            "description": "Task created by User A only",
            "recurrence_type": "DAILY",
            "priority": "HIGH",
            "category_id": categories[0]["id"]
        }
        res_task = await client.post("/api/v1/tasks", json=task_payload_a, headers=headers_a)
        assert res_task.status_code == 201
        task_a_id = res_task.json()["id"]

        diary_payload_a = {
            "entry_date": "2026-08-20",
            "title": "User A Private Notes",
            "content": "Confidential diary entry for User A only.",
            "mood": "GREAT",
            "productivity_score": 9,
            "tags": "private,secret"
        }
        res_diary = await client.post("/api/v1/diary", json=diary_payload_a, headers=headers_a)
        assert res_diary.status_code == 201
        diary_a_id = res_diary.json()["id"]
        print("  [OK] User A created private task and diary entry")

        # 6. Create test user B
        user_b_name = f"user_b_{unique_suffix}"
        user_b_email = f"userb_{unique_suffix}@example.com"
        reg_b = await client.post("/api/v1/auth/register", json={
            "username": user_b_name,
            "email": user_b_email,
            "password": "Password123!"
        })
        assert reg_b.status_code == 201, f"User B registration failed: {reg_b.text}"
        token_b = reg_b.json()["access_token"]
        headers_b = {"Authorization": f"Bearer {token_b}"}
        print("  [OK] Registered User B successfully")

        # 7. Verify User B CANNOT see User A's tasks or notes
        b_tasks = await client.get("/api/v1/tasks", headers=headers_b)
        assert b_tasks.status_code == 200
        assert len(b_tasks.json()) == 0, "SECURITY BUG: Newly created User B saw User A's task!"

        b_notes = await client.get("/api/v1/diary", headers=headers_b)
        assert b_notes.status_code == 200
        assert len(b_notes.json()) == 0, "SECURITY BUG: Newly created User B saw User A's diary note!"
        print("  [OK] User B starts with 0 tasks and 0 notes, completely isolated from User A")

        # 8. Verify User A CAN see their own task and diary note
        a_tasks = await client.get("/api/v1/tasks", headers=headers_a)
        assert a_tasks.status_code == 200
        assert len(a_tasks.json()) == 1
        assert a_tasks.json()[0]["id"] == task_a_id

        a_notes = await client.get("/api/v1/diary", headers=headers_a)
        assert a_notes.status_code == 200
        assert len(a_notes.json()) == 1
        assert a_notes.json()[0]["id"] == diary_a_id
        print("  [OK] User A sees exactly their own task and diary note")

        # 9. Verify User B CANNOT delete or modify User A's task or diary note
        del_attempt = await client.delete(f"/api/v1/diary/{diary_a_id}", headers=headers_b)
        assert del_attempt.status_code == 403
        
        task_del_attempt = await client.delete(f"/api/v1/tasks/{task_a_id}", headers=headers_b)
        assert task_del_attempt.status_code == 403
        print("  [OK] User B forbidden from modifying or deleting User A's tasks/notes")

        # 10. Alert Scan & Per-User Overview Stats
        res = await client.post("/api/v1/reminders/scan")
        assert res.status_code == 200
        
        stats_a = await client.get("/api/v1/stats/overview", headers=headers_a)
        assert stats_a.status_code == 200
        assert stats_a.json()["total_tasks"] == 1

        stats_b = await client.get("/api/v1/stats/overview", headers=headers_b)
        assert stats_b.status_code == 200
        assert stats_b.json()["total_tasks"] == 0
        print("  [OK] Per-user stats verified: User A has 1 task, User B has 0 tasks")

    print("\n[SUCCESS] ALL STRICT USER ISOLATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
