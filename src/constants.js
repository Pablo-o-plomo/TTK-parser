// ─── СВОДНАЯ СТАТИСТИКА ───────────────────────────────────────────────────
export const SUMMARY = {
  totalTTK: 1568,
  restaurants: { РОСТОВ: 703, САХАЛИН: 257, СОЧИ: 608 },
  uniqueDishes: 1471,
  sharedDishes: 75,
  withErrors: 466,
  cleanTTK: 965,
  crossDiscrepancies: 75,
  bruttoMismatch: 422,
  nettoGtBrutto: 3,
  readyGtNetto: 33,
  noIngredients: 10,
  withPF: 1119,
};

// ─── КАТЕГОРИИ ────────────────────────────────────────────────────────────
export const CAT_STATS = {
  "Рыба и морепродукты":  { total: 263, errors: 78 },
  "Японская кухня":       { total: 150, errors: 73 },
  "Десерты":              { total: 142, errors: 50 },
  "Детское меню":         { total:  83, errors: 52 },
  "Соусы":                { total: 108, errors: 20 },
  "Итальянская кухня":    { total:  71, errors: 28 },
  "Мясо и птица":         { total:  50, errors: 13 },
  "Салаты":               { total:  50, errors: 16 },
  "Гарниры":              { total:  36, errors:  4 },
  "Супы":                 { total:  34, errors:  8 },
  "Горячие блюда":        { total:  25, errors:  7 },
  "Напитки":              { total:  25, errors:  2 },
  "Выпечка и хлеб":       { total:  24, errors: 10 },
  "Холодные закуски":     { total:  19, errors:  5 },
  "Бизнес-ланч":          { total:   8, errors:  3 },
  "Полуфабрикаты":        { total:   2, errors:  0 },
  "Прочее":               { total: 478, errors: 89 },
};

// ─── СТАНЦИИ ──────────────────────────────────────────────────────────────
export const STA_STATS = {
  "Горячий цех":      { total: 994, errors: 278 },
  "Суши-бар":         { total: 150, errors:  73 },
  "Кондитерская":     { total: 142, errors:  50 },
  "Заготовочный цех": { total: 110, errors:  20 },
  "Гриль":            { total:  80, errors:  17 },
  "Холодный цех":     { total:  68, errors:  18 },
  "Пекарня":          { total:  24, errors:  10 },
};

// ─── ЦВЕТА И ИКОНКИ ───────────────────────────────────────────────────────
export const REST_COLOR = { РОСТОВ: "#2563eb", Ростов: "#2563eb", Петровка: "#7c3aed", Краснодар: "#dc2626", Авиапарк: "#0891b2", САХАЛИН: "#b45309", Сахалин: "#b45309", СОЧИ: "#15803d", Сочи: "#15803d" };
export const REST_BG    = { РОСТОВ: "#eff6ff", Ростов: "#eff6ff", Петровка: "#f5f3ff", Краснодар: "#fef2f2", Авиапарк: "#e0f2fe", САХАЛИН: "#fffbeb", Сахалин: "#fffbeb", СОЧИ: "#f0fdf4", Сочи: "#f0fdf4"  };

export const CAT_ICONS = {
  "Рыба и морепродукты": "🐟", "Японская кухня": "🍣",  "Десерты": "🍰",
  "Итальянская кухня":   "🍝", "Мясо и птица":   "🥩",  "Салаты": "🥗",
  "Супы":                "🍲", "Гарниры":         "🥦",  "Соусы": "🫙",
  "Выпечка и хлеб":      "🍞", "Холодные закуски":"🥙",  "Горячие блюда": "🔥",
  "Напитки":             "🥤", "Детское меню":    "🧒",  "Бизнес-ланч": "💼",
  "Полуфабрикаты":       "📦", "Прочее":          "🍴",
};

export const STA_ICONS = {
  "Горячий цех":      "🔥",
  "Суши-бар":         "🍣",
  "Кондитерская":     "🎂",
  "Заготовочный цех": "📦",
  "Гриль":            "🥩",
  "Холодный цех":     "❄️",
  "Пекарня":          "🍞",
};

// ─── ТИПЫ ОШИБОК ──────────────────────────────────────────────────────────
export const ERR_LABELS = {
  1: "Брутто ≠ кг",
  2: "Нетто > Брутто",
  4: "Готово > Нетто",
  8: "Нет состава",
};

// ─── ФОТО-КОНТРОЛЬ ────────────────────────────────────────────────────────
export const PHOTO_SLOTS = [
  { id: 1, icon: "⬆️", label: "Сверху",       desc: "Готовое блюдо, вид сверху (90°)" },
  { id: 2, icon: "📐", label: "45°",           desc: "Готовое блюдо под углом 45°" },
  { id: 3, icon: "🔍", label: "Крупный план",  desc: "Детальный крупный план" },
  { id: 4, icon: "⚖️", label: "Вес",           desc: "Блюдо на весах, контроль граммовки" },
  { id: 5, icon: "🍽️", label: "Подача",        desc: "Финальная подача гостю" },
];

// ─── НАВИГАЦИЯ ────────────────────────────────────────────────────────────
export const NAV_ITEMS = [
  { id: "dashboard",    label: "Главная",           badge: null, badgeRed: false },
  { id: "network",      label: "Сеть ресторанов",   badge: null, badgeRed: false },
  { id: "dishes",       label: "Блюда",             badge: 1568, badgeRed: false },
  { id: "comparison",   label: "Сверка ТТК",        badge: null, badgeRed: false },
  { id: "review",       label: "Задания",           badge: null, badgeRed: false },
  { id: "uploads",      label: "Загрузки ТТК",      badge: null, badgeRed: false },
  { id: "photos",       label: "Фотоэталоны",       badge: null, badgeRed: false },
  { id: "pf",           label: "Полуфабрикаты",     badge: null, badgeRed: false },
  { id: "audit",        label: "Аудит",             badge: 466,  badgeRed: true  },
  { id: "analytics",    label: "Аналитика",         badge: null, badgeRed: false },
  { id: "settings",     label: "Настройки",         badge: null, badgeRed: false },
];
