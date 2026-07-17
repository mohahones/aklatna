export const INITIAL_CATEGORIES = [
  { id: "appetizers", name: "المقبلات", count: 12 },
  { id: "mains", name: "الأطباق الرئيسية", count: 24 },
  { id: "drinks", name: "المشروبات", count: 45 },
  { id: "desserts", name: "الحلويات", count: 8 },
];

export const INITIAL_DISHES = [
  {
    id: "dish-1",
    categoryId: "mains",
    name: "برجر بيسترو كلاسيكي",
    price: 14.99,
    description: "لحم بقري ممتاز، جبن شيدر معتق، خبز بريوش، صوص منزلي، وبطاطس متبلة.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCKrbag_rkYnSSFTaQa8vEXwMj1axqvN7fLYOc7QMQwNZpz5ucr00VftYrnVBo6dNwnuVAgkFqrkxRhs_pX5jSDTI_QDgPns-_ODwL9hP-eZpdBeiNXKgnf4zMt6KBg_31CvdWR-WrqiOxb9bLKu4LSf9EeFkhqM-o2vgV17jZBU2Oh4QldFvEy-RQX5cXmWLOye68Z3eb34GePZ1Uvx1yAZGqwIIZWzWBWhuKzI1FiO-qKC8uwiMLuDIxOM9yHN1pWu7Xyje0aIw",
    imagePath: null,
    available: true,
    badge: "الأكثر مبيعاً",
    showHoverOverlay: false,
    ingredients: [
      { id: "ing-1", name: "جبنة إضافية", price: 1.5 },
      { id: "ing-2", name: "صوص حار", price: 0.75 },
    ],
  },
  {
    id: "dish-2",
    categoryId: "mains",
    name: "بيني البحر الأبيض المتوسط",
    price: 18.5,
    description: "فلفل محمص، زيتون كالاماتا، فيتا، بيستو الريحان، وصنوبر.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBSuu-c5ZDqooEdBb9L86fQj76hIGgZncRz9AA2FavSR7LUWbexxpcGGgo7CBzJIwcfX6VOMXSSprsk88SFAt2QVCefTsscGtTsJnF4J_THc8vMX5iOAqbW7jWZmThKValVPGTbtV2CoVV1MS1Da1H97jhm83-24lx81-NijH3rQJHszYLbpiEuoUTzRvodiPEmoAbLUytGD9pXPocNGyp0ebqK7HC7hxoD2ygi54j098rrW8qB6UmcqJOfwVJHOsoESMfOGq-kMQ",
    imagePath: null,
    available: true,
    badge: null,
    showHoverOverlay: false,
    ingredients: [
      { id: "ing-1", name: "جبنة إضافية", price: 1.5 },
      { id: "ing-2", name: "صوص حار", price: 0.75 },
    ],
  },
  {
    id: "dish-3",
    categoryId: "mains",
    name: "ستيك ريب آي مشوي",
    price: 32,
    description: "12 أونصة ريب آي ممتاز، زبدة الثوم والأعشاب، هليون محمص، وهريس ترافل.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAt-nn6Id3JT5m9u4aSeeCK73eiCVrMXLDl8jNOXMaKUpunrpVNETtNg5AbuUqa-qXcBxrxjNluCYuRoScs-djEJzpLTmXloA9QFpjPSIeqZIbigRD9STkZSYPtoxucRAQgvbUTSUoCCssFIsFD9A8HUPvKjxQGJbiKMF7NzEdQXcoovihJCtn3Eu3cafvao5t8R-_e2OAE0ukJac243FLPgjzSUpylnKnFd8iKGjVBIFMQZPVRaxd91FjEzyMkfqShf6ayjza8sw",
    imagePath: null,
    available: false,
    badge: null,
    showHoverOverlay: true,
    ingredients: [
      { id: "ing-1", name: "جبنة إضافية", price: 1.5 },
      { id: "ing-2", name: "صوص حار", price: 0.75 },
    ],
  },
  {
    id: "dish-4",
    categoryId: "mains",
    name: "وعاء كينوا منعش",
    price: 16.25,
    description: "كينوا عضوية، أفوكادو، بنجر مبشور، حمص، وتتبيلة الليمون والطحينة.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDlr0gORcug1eu9iFxA0y4YlVPumUNt1nvpn-qLm2MYIXltFtECNPtjaYPlLpOYxTAwXQjSBajssgum2bM1Zdi07TCINVkDTT-gxrv52xQJ086I5w7Jw_-klSMRFIKm82pVPyTEXmjyJWPDL3OdkVFUtZM2T11L08Y4MXn6vN5VA8LgNt81Tunn_msWo8KozNp-Su2aACVvuQlyr13xDuhweiTjAMX78Q1Jw5Mna6Jz7e8Noh9czNgx-vTG9cOrGuMw5Ie5hTehjg",
    imagePath: null,
    available: true,
    badge: null,
    showHoverOverlay: false,
    ingredients: [
      { id: "ing-1", name: "جبنة إضافية", price: 1.5 },
      { id: "ing-2", name: "صوص حار", price: 0.75 },
    ],
  },
  {
    id: "dish-5",
    categoryId: "mains",
    name: "سلمون مشوح بالمقلاة",
    price: 26,
    description: "سلمون بري، صوص زبدة بالليمون، سبانخ سوتيه، وأرز بري.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAGOpVHLgKcF7WLlNMBIlWEJebSL0Drlj7i8V1jfgONoY0dG3lbYhQHipizuF9hbKsAZuvHsJ1Smq3ruGNs5tnd5pxzI4_yuLGinEObW6g3R5MyPWWEVutBqndUFBrAHWc2_HVunpUk6YCiRDaSyOKACL9RviaYwZirqek14VP4LKQH_YUsULkUOOvLnNN6ajat5QrcEe0MlHp8J27aHXlatVZk_XYpT-cpyo7EivZwXqBQOdOSVQ6PWJzk4DCLSUY5sA9KnavxjA",
    imagePath: null,
    available: true,
    badge: null,
    showHoverOverlay: false,
    ingredients: [
      { id: "ing-1", name: "جبنة إضافية", price: 1.5 },
      { id: "ing-2", name: "صوص حار", price: 0.75 },
    ],
  },
];

export const CATEGORY_ICON_OPTIONS = ["restaurant", "lunch_dining", "local_pizza", "local_bar"];
