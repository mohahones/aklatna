import { brand } from "../../data/loginContent";
import MaterialIcon from "../ui/MaterialIcon";

export default function BrandIdentity() {
  return (
    <div className="mb-8 flex flex-col items-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-on-primary shadow-lg transition-transform duration-300 hover:scale-105">
        <MaterialIcon name={brand.icon} className="text-4xl" />
      </div>
      <h1 className="font-display-lg text-display-lg tracking-normal text-on-background max-sm:text-display-lg-mobile">
        {brand.name}
      </h1>
      <p className="mt-1 font-body-md text-body-md text-secondary">{brand.subtitle}</p>
    </div>
  );
}
