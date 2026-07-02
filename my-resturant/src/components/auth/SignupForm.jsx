import { useState } from "react";
import MaterialIcon from "../ui/MaterialIcon";
import { useSessionStorageState } from "../../hooks/useSessionStorageState";

const inputShellClass =
  "group relative rounded-lg border border-border-subtle bg-surface-container-low transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary";

const inputClass =
  "block w-full border-none bg-transparent py-3 pr-10 pl-12 font-body-md text-body-md text-right text-on-surface outline-none placeholder:text-secondary-fixed-dim focus:ring-0";

export default function SignupForm({ onSubmit, isLoading = false, errors = {} }) {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useSessionStorageState("auth-signup-step1-form", {
    restaurantName: "",
    restaurantNameEn: "",
    businessType: "",
    phone: "",
    email: "",
    address: "",
    password: "",
    passwordConfirm: "",
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (typeof onSubmit === "function") {
      onSubmit(formData);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      {/* Restaurant Names & Business Type Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Restaurant Name in Arabic */}
        <div className="space-y-1.5">
          <label className="font-label-sm text-label-sm text-on-surface-variant mr-1" htmlFor="restaurantName">
            اسم المطعم
          </label>
          <div className={inputShellClass}>
            <MaterialIcon name="restaurant" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
            <input
              className={inputClass}
              id="restaurantName"
              name="restaurantName"
              placeholder="مثال: الملعقة الذهبية"
              required
              type="text"
              value={formData.restaurantName}
              onChange={handleChange}
            />
          </div>
          {errors.restaurantName && <p className="font-label-sm text-label-sm text-error">{errors.restaurantName}</p>}
        </div>

        {/* Restaurant Name in English */}
        <div className="space-y-1.5">
          <label className="font-label-sm text-label-sm text-on-surface-variant mr-1" htmlFor="restaurantNameEn">
            اسم المطعم بالإنجليزية
          </label>
          <div className={inputShellClass}>
            <MaterialIcon name="translate" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
            <input
              className={`${inputClass} text-left`}
              dir="ltr"
              id="restaurantNameEn"
              name="restaurantNameEn"
              placeholder="e.g. Golden Spoon"
              required
              type="text"
              value={formData.restaurantNameEn}
              onChange={handleChange}
            />
          </div>
          {errors.restaurantNameEn && <p className="font-label-sm text-label-sm text-error">{errors.restaurantNameEn}</p>}
        </div>
      </div>

      {/* Business Type */}
      <div className="space-y-1.5">
        <label className="font-label-sm text-label-sm text-on-surface-variant mr-1" htmlFor="businessType">
          نوع المشروع
        </label>
        <div className={inputShellClass}>
          <MaterialIcon name="category" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
          <select
            className={inputClass + " appearance-none"}
            id="businessType"
            name="businessType"
            required
            value={formData.businessType}
            onChange={handleChange}
          >
            <option value="">اختر نوع المشروع</option>
            <option value="restaurant">مطعم</option>
            <option value="juice_shop">محل عصير</option>
          </select>
        </div>
        {errors.businessType && <p className="font-label-sm text-label-sm text-error">{errors.businessType}</p>}
      </div>

      {/* Phone & Email Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="font-label-sm text-label-sm text-on-surface-variant mr-1" htmlFor="phone">
            رقم الهاتف
          </label>
          <div className={inputShellClass}>
            <MaterialIcon name="call" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
            <input
              className={inputClass}
              dir="ltr"
              id="phone"
              name="phone"
              placeholder="+966 50 000 0000"
              required
              type="tel"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          {errors.phone && <p className="font-label-sm text-label-sm text-error">{errors.phone}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="font-label-sm text-label-sm text-on-surface-variant mr-1" htmlFor="email">
            البريد الإلكتروني
          </label>
          <div className={inputShellClass}>
            <MaterialIcon name="mail" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
            <input
              className={inputClass}
              dir="ltr"
              id="email"
              name="email"
              placeholder="manager@bistro.com"
              required
              type="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          {errors.email && <p className="font-label-sm text-label-sm text-error">{errors.email}</p>}
        </div>
      </div>

      {/* Business Address */}
      <div className="space-y-1.5">
        <label className="font-label-sm text-label-sm text-on-surface-variant mr-1" htmlFor="address">
          عنوان العمل
        </label>
        <div className={inputShellClass}>
          <MaterialIcon name="location_on" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
          <input
            className={inputClass}
            id="address"
            name="address"
            placeholder="123 شارع الطهي، جناح 400"
            required
            type="text"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        {errors.address && <p className="font-label-sm text-label-sm text-error">{errors.address}</p>}
      </div>

      {/* Password & Confirm Password */}
      <div className="space-y-1.5">
        {/* Password */}
        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mr-1" htmlFor="password">
            كلمة المرور
          </label>
          <div className={inputShellClass}>
            <MaterialIcon name="lock" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
            <input
              className={inputClass}
              id="password"
              name="password"
              placeholder="••••••••••••"
              required
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleChange}
            />
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-xl" />
            </button>
          </div>
          {errors.password && <p className="font-label-sm text-label-sm text-error mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="font-label-sm text-label-sm text-on-surface-variant mr-1" htmlFor="passwordConfirm">
            تأكيد كلمة المرور
          </label>
          <div className={inputShellClass}>
            <MaterialIcon name="done_all" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
            <input
              className={inputClass}
              id="passwordConfirm"
              name="passwordConfirm"
              placeholder="••••••••••••"
              required
              type={showPassword ? "text" : "password"}
              value={formData.passwordConfirm}
              onChange={handleChange}
            />
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary hover:text-on-surface transition-colors"
              type="button"
              onClick={() => setShowPassword((current) => !current)}
            >
              <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} className="text-xl" />
            </button>
          </div>
          {errors.passwordConfirm && <p className="font-label-sm text-label-sm text-error mt-1">{errors.passwordConfirm}</p>}
        </div>
      </div>

      {/* CTA */}
      <div className="pt-4">
        <button
          className="btn-accent w-full py-4 rounded-xl font-headline-md text-headline-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <MaterialIcon name="sync" className="text-xl animate-spin" />
              جاري المتابعة...
            </>
          ) : (
            <>
              التالي
              <MaterialIcon name="arrow_forward" className="text-xl" style={{ transform: "scaleX(-1)" }} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
