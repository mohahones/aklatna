import { useMemo } from "react";
import useSalesChart from "../../hooks/useSalesChart";

export default function SalesChart({ range, setRange, onBarClick }) {
  const { chartData, isLoading, error } = useSalesChart(range);

  const maxValue = useMemo(() => {
    if (!chartData.length) return 1;
    return Math.max(...chartData.map((item) => Number(item.val || 0)), 1);
  }, [chartData]);

  if (isLoading) {
    return (
      <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm p-6 text-right">
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-32 bg-surface-container-high rounded"></div>
          <div className="h-48 w-full bg-surface-container-high rounded-xl"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm p-6 text-right">
        <div className="text-sm text-red-500">{error}</div>
      </section>
    );
  }

  return (
    <section className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm p-6 text-right">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-lg font-bold">نظرة عامة على المبيعات</h3>
          <p className="text-secondary text-sm">أداء آخر {range} يوماً</p>
        </div>
        <div className="flex bg-surface-container-low p-1 rounded-full">
          <button
            onClick={() => setRange(7)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              range === 7 ? "bg-primary text-white shadow-sm" : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            آخر 7 أيام
          </button>
          <button
            onClick={() => setRange(30)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              range === 30 ? "bg-primary text-white shadow-sm" : "text-secondary hover:bg-surface-container-high"
            }`}
          >
            آخر 30 يوماً
          </button>
        </div>
      </div>

      <div className="relative h-[300px] w-full flex items-end justify-between px-4 pb-8 flex-row-reverse">
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pt-4 pb-[54px] px-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-t border-border-subtle/50 w-full h-0"></div>
          ))}
        </div>

        {chartData.map((item, idx) => {
          const label = item.day || (item.date ? new Date(item.date).getDate().toString() : `اليوم ${idx + 1}`);
          const numericValue = Number(item.val || 0);
          const barHeight = numericValue <= 0 ? "6px" : maxValue > 0 ? `${(numericValue / maxValue) * 100}%` : "6px";

          return (
            <div
              key={item.date || idx}
              onClick={() => onBarClick(item.date, item.day || label)}
              className="group relative flex flex-col items-center gap-2 h-full justify-end flex-1 cursor-pointer"
            >
              <div
                className={`bg-secondary-container rounded-t-lg transition-all group-hover:bg-primary/60 ${
                  range === 7 ? "w-8" : "w-2 max-w-[8px]"
                }`}
                style={{ height: barHeight }}
                title={item.day || label}
              ></div>
              <span className="text-[10px] text-secondary font-medium mt-1">{label}</span>
            </div>
          );
        })}

        {range === 30 && (
          <div className="absolute bottom-1 left-0 w-full flex justify-between px-4 text-[10px] text-secondary opacity-60">
            <span>قبل 30 يوم</span>
            <span>اليوم</span>
          </div>
        )}
      </div>
    </section>
  );
}
