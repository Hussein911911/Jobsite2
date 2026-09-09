"""البيانات التجريبية الابتدائية — نفس محتوى الواجهة الأصلية."""
from __future__ import annotations

from datetime import datetime, timedelta

MEDICINES = [
    {"id": "m01", "name": "بانادول إكسترا", "scientific": "باراسيتامول + كافيين", "category": "مسكن ومضاد التهاب", "form": "أقراص", "strength": "500 ملغ", "batch": "240312", "prodDate": "2025-03-12", "expiry": "2027-03-18", "qty": 340, "minQty": 60, "buyPrice": 1500, "sellPrice": 2250, "company": "بايونير", "stripsPerPiece": 10, "piecesPerCarton": 12, "createdAt": 1},
    {"id": "m02", "name": "أوجمنتين", "scientific": "أموكسيسيلين + حامض الكلافولانيك", "category": "مضاد حيوي", "form": "أقراص", "strength": "1 غم", "batch": "241102", "prodDate": "2024-11-15", "expiry": "2026-11-02", "qty": 120, "minQty": 30, "buyPrice": 4500, "sellPrice": 6000, "company": "الكندي", "stripsPerPiece": 10, "piecesPerCarton": 10, "createdAt": 2},
    {"id": "m03", "name": "أموكسيل", "scientific": "أموكسيسيلين", "category": "مضاد حيوي", "form": "كبسولات", "strength": "500 ملغ", "batch": "240618", "prodDate": "2025-01-20", "expiry": "2026-12-15", "qty": 18, "minQty": 25, "buyPrice": 2000, "sellPrice": 3000, "company": "بايونير", "stripsPerPiece": 10, "piecesPerCarton": 12, "createdAt": 3},
    {"id": "m04", "name": "فولتارين", "scientific": "ديكلوفيناك صوديوم", "category": "مسكن ومضاد التهاب", "form": "حقن", "strength": "75 ملغ/3مل", "batch": "240425", "prodDate": "2025-05-10", "expiry": "2027-06-30", "qty": 64, "minQty": 20, "buyPrice": 2750, "sellPrice": 4000, "company": "دجلة", "stripsPerPiece": 5, "piecesPerCarton": 20, "createdAt": 4},
    {"id": "m05", "name": "كونكور", "scientific": "بيسوبرولول", "category": "قلب وضغط", "form": "أقراص", "strength": "5 ملغ", "batch": "240730", "prodDate": "2025-08-01", "expiry": "2027-09-12", "qty": 210, "minQty": 40, "buyPrice": 3200, "sellPrice": 4500, "company": "الكندي", "stripsPerPiece": 6, "piecesPerCarton": 20, "createdAt": 5},
    {"id": "m06", "name": "جلوكوفاج", "scientific": "ميتفورمين", "category": "سكري", "form": "أقراص", "strength": "850 ملغ", "batch": "240210", "prodDate": "2025-01-25", "expiry": "2027-01-25", "qty": 0, "minQty": 50, "buyPrice": 1800, "sellPrice": 2750, "company": "أسوار", "stripsPerPiece": 10, "piecesPerCarton": 12, "createdAt": 6},
    {"id": "m07", "name": "فنتولين", "scientific": "سالبوتامول", "category": "جهاز تنفسي", "form": "بخاخ", "strength": "100 مكغ", "batch": "240115", "prodDate": "2024-04-20", "expiry": "2026-04-20", "qty": 45, "minQty": 15, "buyPrice": 5500, "sellPrice": 7500, "company": "دجلة", "stripsPerPiece": 1, "piecesPerCarton": 24, "createdAt": 7},
    {"id": "m08", "name": "فيتامين D3", "scientific": "كولي كالسيفيرول", "category": "فيتامينات ومكملات", "form": "كبسولات", "strength": "5000 IU", "batch": "240620", "prodDate": "2025-05-08", "expiry": "2027-05-08", "qty": 12, "minQty": 20, "buyPrice": 4000, "sellPrice": 6000, "company": "الكندي", "stripsPerPiece": 6, "piecesPerCarton": 12, "createdAt": 8},
    {"id": "m09", "name": "نيكسيوم", "scientific": "إيسوميبرازول", "category": "جهاز هضمي", "form": "أقراص", "strength": "40 ملغ", "batch": "230905", "prodDate": "2023-10-30", "expiry": "2025-10-30", "qty": 85, "minQty": 25, "buyPrice": 6500, "sellPrice": 8500, "company": "أسوار", "stripsPerPiece": 10, "piecesPerCarton": 10, "createdAt": 9},
    {"id": "m10", "name": "زيرتك", "scientific": "سيتريزين", "category": "مضاد حساسية", "form": "أقراص", "strength": "10 ملغ", "batch": "240512", "prodDate": "2024-08-14", "expiry": "2026-08-14", "qty": 150, "minQty": 30, "buyPrice": 2200, "sellPrice": 3250, "company": "بايونير", "stripsPerPiece": 10, "piecesPerCarton": 12, "createdAt": 10},
    {"id": "m11", "name": "بيتادين", "scientific": "بوفيدون أيودين", "category": "مطهرات ومحاليل", "form": "محلول", "strength": "10%", "batch": "250118", "prodDate": "2026-01-10", "expiry": "2028-02-01", "qty": 70, "minQty": 15, "buyPrice": 2500, "sellPrice": 3750, "company": "دجلة", "stripsPerPiece": 1, "piecesPerCarton": 12, "createdAt": 11},
    {"id": "m12", "name": "سيفترياكسون", "scientific": "سيفترياكسون صوديوم", "category": "مضاد حيوي", "form": "حقن", "strength": "1 غم", "batch": "240328", "prodDate": "2024-05-05", "expiry": "2026-05-05", "qty": 95, "minQty": 25, "buyPrice": 3000, "sellPrice": 4250, "company": "بايونير", "stripsPerPiece": 5, "piecesPerCarton": 20, "createdAt": 12},
    {"id": "m13", "name": "بروفين", "scientific": "آيبوبروفين", "category": "مسكن ومضاد التهاب", "form": "أقراص", "strength": "400 ملغ", "batch": "241002", "prodDate": "2025-11-01", "expiry": "2027-11-20", "qty": 260, "minQty": 50, "buyPrice": 1000, "sellPrice": 1750, "company": "دجلة", "stripsPerPiece": 10, "piecesPerCarton": 12, "createdAt": 13},
    {"id": "m14", "name": "أماريل", "scientific": "غليميبيرايد", "category": "سكري", "form": "أقراص", "strength": "2 ملغ", "batch": "240405", "prodDate": "2024-10-05", "expiry": "2026-10-05", "qty": 40, "minQty": 20, "buyPrice": 3800, "sellPrice": 5250, "company": "الكندي", "stripsPerPiece": 10, "piecesPerCarton": 12, "createdAt": 14},
    {"id": "m15", "name": "كلاريتين", "scientific": "لوراتادين", "category": "مضاد حساسية", "form": "شراب", "strength": "5ملغ/5مل", "batch": "240218", "prodDate": "2024-03-28", "expiry": "2026-03-28", "qty": 28, "minQty": 12, "buyPrice": 2800, "sellPrice": 4000, "company": "أسوار", "stripsPerPiece": 1, "piecesPerCarton": 12, "createdAt": 15},
    {"id": "m16", "name": "فلاجيل", "scientific": "ميترونيدازول", "category": "مضاد حيوي", "form": "أقراص", "strength": "500 ملغ", "batch": "240530", "prodDate": "2025-04-10", "expiry": "2027-04-10", "qty": 130, "minQty": 30, "buyPrice": 1400, "sellPrice": 2250, "company": "بايونير", "stripsPerPiece": 10, "piecesPerCarton": 12, "createdAt": 16},
    {"id": "m17", "name": "لازكس", "scientific": "فوروسيميد", "category": "قلب وضغط", "form": "أقراص", "strength": "40 ملغ", "batch": "240310", "prodDate": "2024-09-18", "expiry": "2026-09-18", "qty": 22, "minQty": 25, "buyPrice": 1200, "sellPrice": 2000, "company": "دجلة", "stripsPerPiece": 10, "piecesPerCarton": 12, "createdAt": 17},
    {"id": "m18", "name": "بيتنوفيت", "scientific": "بيتاميثازون فاليرات", "category": "جلدية وموضعي", "form": "مرهم موضعي", "strength": "0.1%", "batch": "240125", "prodDate": "2024-04-02", "expiry": "2026-04-02", "qty": 55, "minQty": 10, "buyPrice": 2100, "sellPrice": 3250, "company": "أسوار", "stripsPerPiece": 1, "piecesPerCarton": 24, "createdAt": 18},
]

CUSTOMERS = [
    {"id": "c1", "name": "صيدلية النور", "kind": "pharmacy", "phone": "0770 111 2233", "city": "بغداد", "createdAt": 1},
    {"id": "c2", "name": "صيدلية الرشيد", "kind": "pharmacy", "phone": "0781 444 5566", "city": "بغداد", "createdAt": 2},
    {"id": "c3", "name": "مذخر الشفاء", "kind": "warehouse", "phone": "0790 777 8899", "city": "البصرة", "createdAt": 3},
    {"id": "c4", "name": "صيدلية الحكمة", "kind": "pharmacy", "phone": "0771 222 3344", "city": "الموصل", "createdAt": 4},
    {"id": "c5", "name": "صيدلية بغداد", "kind": "pharmacy", "phone": "0782 555 6677", "city": "بغداد", "createdAt": 5},
    {"id": "c6", "name": "مذخر دجلة", "kind": "warehouse", "phone": "0773 888 9900", "city": "كركوك", "createdAt": 6},
    {"id": "c7", "name": "صيدلية الأمل", "kind": "pharmacy", "phone": "0783 121 3434", "city": "النجف", "createdAt": 7},
]


def _med(mid: str) -> dict:
    return next(m for m in MEDICINES if m["id"] == mid)


def _days_ago_iso(days: int, hour: int) -> str:
    d = datetime.now() - timedelta(days=days)
    d = d.replace(hour=hour, minute=10 + days * 3, second=0, microsecond=0)
    return d.isoformat()


def _inv(number: int, days: int, hour: int, customer_id: str, customer: str, payment: str, lines: list, settled: bool = False) -> dict:
    items = []
    for mid, qty in lines:
        m = _med(mid)
        items.append({
            "medicineId": m["id"],
            "name": m["name"],
            "strength": m["strength"],
            "unit": "piece",
            "qty": qty,
            "strips": qty * m["stripsPerPiece"],
            "price": m["sellPrice"],
            "cost": m["buyPrice"],
            "discountPct": 0,
            "total": qty * m["sellPrice"],
        })
    return {
        "id": f"seed-inv-{number}",
        "number": number,
        "date": _days_ago_iso(days, hour),
        "customerId": customer_id,
        "customer": customer,
        "payment": payment,
        "settled": settled,
        "approved": True,
        "items": items,
        "total": sum(i["total"] for i in items),
    }


def _strip_cost(m: dict) -> int:
    return round(m["buyPrice"] / max(1, m["stripsPerPiece"]))


def _po(number: int, days: int, hour: int, company: str, received: bool, lines: list) -> dict:
    items = []
    for mid, qty in lines:
        m = _med(mid)
        items.append({
            "medicineId": m["id"],
            "name": m["name"],
            "strength": m["strength"],
            "qty": qty,
            "cost": _strip_cost(m),
        })
    return {
        "id": f"seed-po-{number}",
        "number": number,
        "date": _days_ago_iso(days, hour),
        "company": company,
        "items": items,
        "total": sum(i["qty"] * i["cost"] for i in items),
        "received": received,
    }


def invoices() -> list[dict]:
    return [
        _inv(1001, 6, 10, "c1", "صيدلية النور", "نقدي", [("m01", 30), ("m13", 20)]),
        _inv(1002, 6, 13, "c2", "صيدلية الرشيد", "آجل", [("m02", 15)], settled=True),
        _inv(1003, 5, 11, "c3", "مذخر الشفاء", "نقدي", [("m05", 25), ("m14", 10)]),
        _inv(1004, 4, 16, "c4", "صيدلية الحكمة", "نقدي", [("m10", 20), ("m15", 8)]),
        _inv(1005, 3, 12, "c5", "صيدلية بغداد", "آجل", [("m12", 18), ("m16", 24)]),
        _inv(1006, 2, 10, "c6", "مذخر دجلة", "نقدي", [("m04", 16), ("m01", 40)]),
        _inv(1007, 1, 14, "c7", "صيدلية الأمل", "نقدي", [("m08", 10), ("m11", 12)]),
        _inv(1008, 0, 9, "c1", "صيدلية النور", "نقدي", [("m13", 30), ("m10", 15)]),
    ]


def purchases() -> list[dict]:
    return [
        _po(501, 9, 9, "بايونير", True, [("m01", 240), ("m16", 120)]),
        _po(502, 7, 12, "دجلة", True, [("m13", 240), ("m11", 36)]),
        _po(503, 5, 10, "الكندي", True, [("m05", 200), ("m08", 36)]),
        _po(504, 2, 11, "أسوار", False, [("m06", 240), ("m15", 36)]),
        _po(505, 0, 9, "بايونير", False, [("m03", 120), ("m12", 100)]),
    ]


def snapshot() -> dict:
    return {
        "medicines": [dict(m) for m in MEDICINES],
        "customers": [dict(c) for c in CUSTOMERS],
        "invoices": invoices(),
        "purchases": purchases(),
    }
