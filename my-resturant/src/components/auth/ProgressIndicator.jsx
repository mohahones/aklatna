export default function ProgressIndicator({ currentStep = 1, totalSteps = 2 }) {
  // Calculate progress: step 1 of 2 = 50%, step 2 of 2 = 100%
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
          الخطوة {currentStep} من {totalSteps}
        </span>
        <span className="font-label-sm text-label-sm text-secondary">
          {currentStep === 1 ? "تفاصيل العمل" : "بيانات المدير"}
        </span>
      </div>
      <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden flex justify-end">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${progressPercent}%`,
          }}
        />
      </div>
    </div>
  );
}
