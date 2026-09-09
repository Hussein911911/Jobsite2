import type { Medicine } from "../types";
import { fmtDate, fmtMoney, fmtNum, getStatus } from "../types";

export function PrintReport({ medicines, title }: { medicines: Medicine[]; title: string }) {
  const now = new Date();
  const totalValue = medicines.reduce((s, m) => s + m.qty * m.sellPrice, 0);
  const alerts = medicines.filter((m) => getStatus(m) !== "ok").length;

  return (
    <div className="print-area" dir="rtl">
      <div style={{ fontFamily: "'Alexandria', 'Tajawal', sans-serif", color: "#0f172a", fontSize: 13 }}>
        {/* ترويسة التقرير */}
        <div style={{ borderBottom: "3px solid #0e7490", paddingBottom: 12, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: "#0e7490",
                  color: "white",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                AF
              </div>
              <div>
                <h1 style={{ fontSize: 19, fontWeight: 800, margin: 0 }}>مكتب الفيض الدوائي العلمي</h1>
                <p style={{ margin: 0, fontSize: 12, color: "#475569" }}>نظام إدارة الأدوية والمخزون — تقرير {title}</p>
              </div>
            </div>
            <div style={{ textAlign: "left", fontSize: 11, color: "#475569" }}>
              <p style={{ margin: 0 }}>
                تاريخ الإصدار: {now.toLocaleDateString("ar", { day: "numeric", month: "long", year: "numeric" })}
              </p>
              <p style={{ margin: 0 }}>
                الساعة: {now.toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>

        {/* ملخص */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          {[
            { l: "عدد الأصناف", v: fmtNum(medicines.length) },
            { l: "القيمة البيعية للمخزون", v: fmtMoney(totalValue) },
            { l: "أصناف تحتاج إجراء", v: fmtNum(alerts) },
          ].map((s) => (
            <div key={s.l} style={{ flex: 1, border: "1px solid #cbd5e1", borderRadius: 8, padding: "8px 12px" }}>
              <p style={{ margin: 0, fontSize: 10, color: "#64748b" }}>{s.l}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 800, fontSize: 14 }}>{s.v}</p>
            </div>
          ))}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr>
              {["#", "الدواء والتركيز", "التصنيف", "الشركة", "رقم الباج", "الإنتاج", "الانتهاء", "الكمية", "سعر القطعة"].map((h) => (
                <th
                  key={h}
                  style={{
                    background: "#164e63",
                    color: "white",
                    padding: "7px 6px",
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: 10.5,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {medicines.map((m, i) => (
              <tr key={m.id} style={{ background: i % 2 ? "#f8fafc" : "white" }}>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0" }}>{i + 1}</td>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>
                  {m.name} — {m.strength}
                </td>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0" }}>{m.category}</td>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{m.company}</td>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0", fontFamily: "monospace" }}>{m.batch}</td>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0" }}>{fmtDate(m.prodDate)}</td>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0" }}>{fmtDate(m.expiry)}</td>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{fmtNum(m.qty)}</td>
                <td style={{ padding: "6px", borderBottom: "1px solid #e2e8f0", fontWeight: 700 }}>{fmtMoney(m.sellPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: 16, fontSize: 10, color: "#94a3b8", textAlign: "center", borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
          مكتب الفيض الدوائي العلمي — وثيقة داخلية صادرة من نظام إدارة الأدوية
        </p>
      </div>
    </div>
  );
}
