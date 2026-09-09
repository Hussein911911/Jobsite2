import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { fmtMoney, fmtNum } from "../types";

function useCountUp(target: number, duration = 750): number {
  const [value, setValue] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    if (from === target) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

interface StatCardProps {
  title: string;
  value: number;
  money?: boolean;
  hint: string;
  icon: ReactNode;
  tone: "cyan" | "emerald" | "amber" | "rose";
  delay?: number;
}

const TONES = {
  cyan: {
    tile: "bg-cyan-50 text-cyan-700 ring-cyan-200/70",
    bar: "bg-cyan-500",
  },
  emerald: {
    tile: "bg-emerald-50 text-emerald-700 ring-emerald-200/70",
    bar: "bg-emerald-500",
  },
  amber: {
    tile: "bg-amber-50 text-amber-700 ring-amber-200/70",
    bar: "bg-amber-500",
  },
  rose: {
    tile: "bg-rose-50 text-rose-700 ring-rose-200/70",
    bar: "bg-rose-500",
  },
};

export function StatCard({ title, value, money, hint, icon, tone, delay = 0 }: StatCardProps) {
  const animated = useCountUp(value);
  const shown = money ? fmtMoney(Math.round(animated)) : fmtNum(Math.round(animated));
  const t = TONES[tone];

  return (
    <div
      className="anim-fade-up group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-slate-900/8 sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={`absolute inset-y-0 right-0 w-1 ${t.bar} opacity-80 transition-all duration-300 group-hover:w-1.5`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-slate-500">{title}</p>
          <p className="mt-1.5 font-display text-2xl font-bold leading-none text-slate-900 tabular-nums sm:text-[27px]">
            {money ? (
              <>
                {fmtNum(Math.round(animated))}
                <span className="ms-1.5 text-[13px] font-semibold text-slate-400">د.ع</span>
              </>
            ) : (
              shown
            )}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">{hint}</p>
        </div>
        <div
          className={`grid size-11 shrink-0 place-items-center rounded-lg ring-1 text-[22px] transition-transform duration-300 group-hover:scale-110 ${t.tile}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
