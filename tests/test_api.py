#!/usr/bin/env python3
"""فحوصات واجهة REST لنظام الفيض."""
from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

os.environ["ALFAYD_DB"] = str(Path(tempfile.mkdtemp()) / "test.db")
os.environ["ALFAYD_ADMIN_PASSWORD"] = "1234"
os.environ["ALFAYD_STAFF_PASSWORD"] = "1234"

from fastapi.testclient import TestClient  # noqa: E402
from server.app import app, init_db  # noqa: E402

init_db()
client = TestClient(app)


class ApiTests(unittest.TestCase):
    def setUp(self):
        client.cookies.clear()

    def test_health(self):
        r = client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["ok"])

    def test_snapshot_requires_auth(self):
        r = client.get("/api/snapshot")
        self.assertEqual(r.status_code, 401)

    def test_login_wrong_password(self):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "nope"})
        self.assertEqual(r.status_code, 401)

    def test_login_and_snapshot(self):
        r = client.post("/api/auth/login", json={"username": "admin", "password": "1234"})
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["user"]["username"], "admin")
        self.assertNotIn("password", r.json()["user"])

        me = client.get("/api/auth/me")
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.json()["user"]["role"], "مدير النظام")

        snap = client.get("/api/snapshot")
        self.assertEqual(snap.status_code, 200)
        data = snap.json()
        self.assertGreaterEqual(len(data["medicines"]), 18)
        self.assertGreaterEqual(len(data["invoices"]), 8)
        self.assertGreaterEqual(len(data["customers"]), 7)
        self.assertGreaterEqual(len(data["purchases"]), 5)
        first = data["medicines"][0]
        self.assertIn("stripsPerPiece", first)
        self.assertIn("sellPrice", first)

    def test_save_medicine_roundtrip(self):
        client.post("/api/auth/login", json={"username": "admin", "password": "1234"})
        snap = client.get("/api/snapshot").json()
        snap["medicines"].append({
            "id": "m-test-1",
            "name": "دواء تجريبي",
            "scientific": "test",
            "category": "أخرى",
            "form": "أقراص",
            "strength": "10 ملغ",
            "batch": "T1",
            "prodDate": "2026-01-01",
            "expiry": "2028-01-01",
            "qty": 9,
            "minQty": 2,
            "buyPrice": 100,
            "sellPrice": 150,
            "company": "بايونير",
            "stripsPerPiece": 10,
            "piecesPerCarton": 12,
            "createdAt": 99,
        })
        saved = client.put("/api/snapshot", json=snap)
        self.assertEqual(saved.status_code, 200, saved.text)
        names = [m["name"] for m in saved.json()["medicines"]]
        self.assertIn("دواء تجريبي", names)

    def test_staff_cannot_restore(self):
        r = client.post("/api/auth/login", json={"username": "staff", "password": "1234"})
        self.assertEqual(r.status_code, 200)
        denied = client.post("/api/admin/restore")
        self.assertEqual(denied.status_code, 403)

    def test_admin_restore_and_clear(self):
        client.post("/api/auth/login", json={"username": "admin", "password": "1234"})
        cleared = client.post("/api/admin/clear")
        self.assertEqual(cleared.status_code, 200)
        self.assertEqual(cleared.json()["medicines"], [])
        restored = client.post("/api/admin/restore")
        self.assertEqual(restored.status_code, 200)
        self.assertGreaterEqual(len(restored.json()["medicines"]), 18)

    def test_logout(self):
        client.post("/api/auth/login", json={"username": "admin", "password": "1234"})
        self.assertEqual(client.post("/api/auth/logout").status_code, 200)
        self.assertEqual(client.get("/api/auth/me").status_code, 401)


if __name__ == "__main__":
    unittest.main(verbosity=2)
