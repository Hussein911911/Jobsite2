import { useEffect, useState } from "react";
import { CHART_COLORS, fmtMoney, fmtNum } from "../types";

function useMounted(delay = 60): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return ready;
}

/* ---------- أعمدة المبيعات ---------- */

export function BarChart({ data }: { data: { label: string; value: number }[] }) {
  const ready = useMounted();
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 560;
  const H = 210;
  const padTop = 22;
  const padBottom = 30;
  const innerH = H - padTop - padBottom;
  const gap = 14;
  const bw = (W - gap * (data.length + 1)) / data.length;

  return (
    <div dir="ltr">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="مخطط المبيعات">
        {/* خطوط الشبكة */}
        {[0.25, 0.5, 0.75, 1].map((p) => (
          <line
            key={p}
            x1={0}
            x2={W}
            y1={padTop + innerH * (1 - p)}
            y2={padTop + innerH * (1 - p)}
            stroke="#e2e8f0"
            strokeDasharray="3 5"
          />
        ))}
        {data.map((d, i) => {
          const h = Math.max(d.value > 0 ? 6 : 2, (d.value / max) * innerH);
          const x = gap + i * (bw + gap);
          const y = padTop + innerH - h;
          const isMax = d.value === max && d.value > 0;
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={bw}
                height={h}
                rx={7}
                fill={isMax ? "#0891b2" : "#a5f3fc"}
                className="transition-all duration-300 hover:opacity-80"
                style={{
                  transform: ready ? "scaleY(1)" : "scaleY(0)",
                  transformOrigin: "bottom",
                  transformBox: "fill-box",
                  transition: `transform .7s cubic-bezier(.22,1,.36,1) ${i * 60}ms, opacity .2s`,
                }}
              >
                <title>{`${d.label}: ${fmtMoney(d.value)}`}</title>
              </rect>
              <text
                x={x + bw / 2}
                y={y - 7}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={isMax ? "#0e7490" : "#94a3b8"}
                style={{ opacity: ready ? 1 : 0, transition: `opacity .4s ${i * 60 + 400}ms` }}
              >
                {d.value > 0 ? fmtNum(d.value / 1000) + "k" : ""}
              </text>
              <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#64748b" direction="rtl">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ---------- دائري (توزيع المخزون) ---------- */

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: { label: string; value: number }[];
  centerLabel: string;
  centerValue: string;
}) {
  const ready = useMounted(150);
  const total = Math.max(1, slices.reduce((s, x) => s + x.value, 0));
  const R = 62;
  const C = 2 * Math.PI * R;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div className="relative">
        <svg width="170" height="170" viewBox="0 0 170 170" className="-rotate-90">
          <circle cx="85" cy="85" r={R} fill="none" stroke="#f1f5f9" strokeWidth="20" />
          {slices.map((s, i) => {
            const frac = s.value / total;
            const dash = frac * C;
            const el = (
              <circle
                key={i}
                cx="85"
                cy="85"
                r={R}
                fill="none"
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth="20"
                strokeLinecap="butt"
                strokeDasharray={`${ready ? dash : 0} ${C}`}
                strokeDashoffset={-offset}
                style={{ transition: `stroke-dasharray .9s cubic-bezier(.22,1,.36,1) ${i * 90}ms` }}
              >
                <title>{`${s.label}: ${fmtMoney(s.value)}`}</title>
              </circle>
            );
            offset += dash;
            return el;
          })}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-lg font-extrabold leading-none text-slate-800 tabular-nums">{centerValue}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-400">{centerLabel}</p>
          </div>
        </div>
      </div>
      <ul className="min-w-40 space-y-2">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2.5 text-[13px]">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
            <span className="font-medium text-slate-600">{s.label}</span>
            <span className="ms-auto font-display font-bold text-slate-800 tabular-nums">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
