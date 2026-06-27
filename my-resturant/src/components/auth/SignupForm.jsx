import MaterialIcon from "../ui/MaterialIcon";
import { useSessionStorageState } from "../../hooks/useSessionStorageState";

const inputShellClass =
  "group relative rounded-lg border border-border-subtle bg-surface-container-low transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary";

const inputClass =
  "block w-full border-none bg-transparent py-3 pr-10 pl-12 font-body-md text-body-md text-right text-on-surface outline-none placeholder:text-secondary-fixed-dim focus:ring-0";

export default function SignupForm({ onSubmit, isLoading = false, errors = {} }) {
  const [showPassword, setShowPassword] = useSessionStorageState("auth-signup-step1-password-visibility", false);
  const [formData, setFormData] = useSessionStorageState("auth-signup-step1-form", {
    restaurantName: "",
    restaurantNameEn: "",
    phone: "",
    email: "",
    address: "",
    password: "",
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
      {/* Restaurant Name */}
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
          اسم المطعم بالإنجليزية <span className="text-secondary/70">(اختياري)</span>
        </label>
        <div className={inputShellClass}>
          <MaterialIcon name="translate" className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary group-focus-within:text-primary text-xl" />
          <input
            className={`${inputClass} text-left`}
            dir="ltr"
            id="restaurantNameEn"
            name="restaurantNameEn"
            placeholder="e.g. Golden Spoon"
            type="text"
            value={formData.restaurantNameEn}
            onChange={handleChange}
          />
        </div>
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

      {/* Password */}
      <div className="space-y-1.5">
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
        {errors.password && <p className="font-label-sm text-label-sm text-error">{errors.password}</p>}
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
