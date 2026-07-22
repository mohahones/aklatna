import React from "react";

const tips = [
  {
    icon: "lightbulb",
    title: "نصيحة للمنشأة",
    text: "استخدم مسميات وظيفية واضحة لجذب المرشحين المناسبين بسرعة أكبر.",
    colorClass: "text-pending-amber",
    bgClass: "bg-pending-amber/10",
  },
  {
    icon: "verified",
    title: "التوثيق",
    text: "جميع الوظائف تخضع للمراجعة خلال 24 ساعة قبل ظهورها للباحثين عن عمل.",
    colorClass: "text-success-green",
    bgClass: "bg-success-green/10",
  },
  {
    icon: "support_agent",
    title: "هل تحتاج مساعدة؟",
    text: "فريق الدعم متاح لمساعدتك في صياغة إعلانك الوظيفي باحترافية.",
    colorClass: "text-tertiary",
    bgClass: "bg-tertiary/10",
  },
];

export default function JobTipsGrid() {
  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
      {tips.map((tip) => (
        <div key={tip.title} className="bg-white p-6 rounded-2xl border border-border-subtle flex gap-4 items-start shadow-sm">
          <div className={`${tip.bgClass} w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className={`material-symbols-outlined ${tip.colorClass}`}>{tip.icon}</span>
          </div>
          <div>
            <h4 className="font-bold text-sm">{tip.title}</h4>
            <p className="text-xs text-secondary mt-1 leading-relaxed">{tip.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
