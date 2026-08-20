import asyncio
import httpx
import uuid
from app.main import app
from app.core.database import init_db

async def run_tests():
    print("[*] Running comprehensive API tests with User Isolation check...")
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

        # 3. Create a test user A
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

        # 4. User A creates a private diary note
        diary_payload_a = {
            "entry_date": "2026-08-20",
            "title": "User A Private Notes",
            "content": "Confidential diary entry for User A only.",
            "mood": "GREAT",
            "productivity_score": 9,
            "tags": "private,secret"
        }
        res = await client.post("/api/v1/diary", json=diary_payload_a, headers=headers_a)
        assert res.status_code == 201, f"User A diary creation failed: {res.text}"
        diary_a_id = res.json()["id"]
        print("  [OK] User A created a private diary entry")

        # 5. Verify unauthenticated client CANNOT see User A's private diary notes
        unauth_notes = await client.get("/api/v1/diary")
        assert unauth_notes.status_code == 200
        unauth_note_ids = [d["id"] for d in unauth_notes.json()]
        assert diary_a_id not in unauth_note_ids, "SECURITY BUG: Unauthenticated user saw User A's private diary note!"
        print("  [OK] Unauthenticated client cannot see User A's notes")

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

        # 7. Verify User B CANNOT see User A's private diary notes
        b_notes = await client.get("/api/v1/diary", headers=headers_b)
        assert b_notes.status_code == 200
        b_note_ids = [d["id"] for d in b_notes.json()]
        assert diary_a_id not in b_note_ids, "SECURITY BUG: User B saw User A's private diary note!"
        print("  [OK] User B cannot see User A's notes")

        # 8. Verify User A CAN see their own diary note
        a_notes = await client.get("/api/v1/diary", headers=headers_a)
        assert a_notes.status_code == 200
        a_note_ids = [d["id"] for d in a_notes.json()]
        assert diary_a_id in a_note_ids, "User A could not retrieve their own note!"
        print("  [OK] User A can see their own diary note")

        # 9. Verify User B CANNOT delete User A's diary note
        del_attempt = await client.delete(f"/api/v1/diary/{diary_a_id}", headers=headers_b)
        assert del_attempt.status_code == 403, f"Expected 403 Forbidden, got: {del_attempt.status_code}"
        print("  [OK] User B forbidden from deleting User A's note")

        # 10. Alert Scan & Overview Stats
        res = await client.post("/api/v1/reminders/scan")
        assert res.status_code == 200
        
        stats = await client.get("/api/v1/stats/overview", headers=headers_a)
        assert stats.status_code == 200
        assert "daily_stats" in stats.json()
        print("  [OK] Per-user overview stats calculated successfully")

    print("\n[SUCCESS] ALL API AND USER ISOLATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
