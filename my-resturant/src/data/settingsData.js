export const INITIAL_RESTAURANT_INFO = {
  nameAr: "",
  nameEn: "",
  phone: "",
  address: "",
};

export const INITIAL_LOGO_URL = "";

export const INITIAL_COVER_URL = "";

/** ترتيب الأيام مطابق للتسجيل: 0=الإثنين … 6=الأحد */
export const WEEK_DAY_LABELS = [
  "الإثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
  "الأحد",
];

export function createDefaultWorkingHours() {
  return WEEK_DAY_LABELS.map((day, dayOfWeek) => ({
    dayOfWeek,
    day,
    isOpen: true,
    openTime: "09:00",
    closeTime: "22:00",
    highlight: dayOfWeek === 4 || dayOfWeek === 5,
  }));
}

export const INITIAL_WORKING_HOURS = createDefaultWorkingHours();
