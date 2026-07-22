export default function DishCard({ dish, onEdit, onToggleAvailability, onDelete }) {
  return (
    <div className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group hover:-translate-y-1">
      <div className="relative h-48 overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          src={
            dish.image ||
            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f1f5f9' width='400' height='300'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%2394a3b8' font-size='20'%3Eلا صورة%3C/text%3E%3C/svg%3E"
          }
          alt={dish.name}
        />
        {dish.badge && (
          <div className="absolute top-3 left-3">
            <span className="bg-success-green/10 text-success-green px-3 py-1 rounded-full text-label-sm font-label-sm backdrop-blur-md">
              {dish.badge}
            </span>
          </div>
        )}
        {dish.showHoverOverlay && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white font-bold px-4 py-2 border-2 border-white rounded-lg">عرض التفاصيل</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-headline-md text-headline-md text-on-surface">{dish.name}</h4>
          <div className="flex items-baseline gap-1">
            <span className="font-body-lg text-body-lg text-primary font-bold">
              {(Number(dish.price) || 0).toFixed(2)}
            </span>
            <span className="font-body-lg text-body-lg text-primary font-bold">ل.س</span>
          </div>
        </div>
        <p className="text-secondary text-body-md mb-6 line-clamp-2">{dish.description}</p>
        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={dish.available}
                onChange={() => onToggleAvailability(dish.id)}
              />
              <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
              <span
                className={`mr-3 text-body-md font-body-md ${
                  dish.available ? "text-on-surface" : "text-secondary"
                }`}
              >
                {dish.available ? "متوفر" : "غير متوفر"}
              </span>
            </label>
          </div>
          <div className="flex items-end gap-0">
            <button
              type="button"
              onClick={() => onEdit(dish)}
              className="text-secondary hover:text-primary transition-colors p-1"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(dish.id)}
              className="text-error hover:text-error/80 transition-colors p-1"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
