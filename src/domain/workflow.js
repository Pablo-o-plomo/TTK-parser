// Domain entities prepared for a future Supabase/PostgreSQL backend:
// Restaurant, Dish, DishVersion, Comparison, Task, TaskSubmission, Photo,
// Comment and ApprovalStatus are represented in the UI as normalized dish
// objects, comparison rows and localStorage task records on this first stage.

export const NETWORK_RESTAURANTS = ['Петровка', 'Ростов', 'Сочи', 'Краснодар', 'Авиапарк']

export const APPROVAL_STATUS = {
  NEW: 'new',
  HAS_DIFFERENCES: 'has_differences',
  TASK_SENT: 'task_sent',
  WAITING_SUBMISSION: 'waiting_submission',
  SUBMITTED: 'submitted',
  IN_REVIEW: 'in_review',
  NEEDS_REVISION: 'needs_revision',
  APPROVED: 'approved',
  CLOSED: 'closed',
}

export const STATUS_LABELS = {
  [APPROVAL_STATUS.NEW]: 'Новая',
  [APPROVAL_STATUS.HAS_DIFFERENCES]: 'Есть расхождения',
  [APPROVAL_STATUS.TASK_SENT]: 'Отправлено на проработку',
  [APPROVAL_STATUS.WAITING_SUBMISSION]: 'Ждём данные от ресторана',
  [APPROVAL_STATUS.SUBMITTED]: 'На проверке',
  [APPROVAL_STATUS.IN_REVIEW]: 'На проверке',
  [APPROVAL_STATUS.NEEDS_REVISION]: 'Вернуть на доработку',
  [APPROVAL_STATUS.APPROVED]: 'Подтверждено',
  [APPROVAL_STATUS.CLOSED]: 'Закрыто',
}

export const STATUS_COLORS = {
  [APPROVAL_STATUS.NEW]: '#64748b',
  [APPROVAL_STATUS.HAS_DIFFERENCES]: '#dc2626',
  [APPROVAL_STATUS.TASK_SENT]: '#d97706',
  [APPROVAL_STATUS.WAITING_SUBMISSION]: '#d97706',
  [APPROVAL_STATUS.SUBMITTED]: '#7c3aed',
  [APPROVAL_STATUS.IN_REVIEW]: '#7c3aed',
  [APPROVAL_STATUS.NEEDS_REVISION]: '#ef4444',
  [APPROVAL_STATUS.APPROVED]: '#16a34a',
  [APPROVAL_STATUS.CLOSED]: '#0f766e',
}

export const FIELD_LABELS = {
  name: 'Название блюда',
  code: 'Код блюда',
  category: 'Категория',
  station: 'Цех',
  output: 'Выход',
  components: 'Список полуфабрикатов',
  componentsCount: 'Количество полуфабрикатов',
  ingredients: 'Ингредиенты',
  technology: 'Технология приготовления',
  photos: 'Фото блюда',
  pfPhotos: 'Фото полуфабриката',
  date: 'Дата обновления',
  approvalStatus: 'Статус проверки',
}

export const REQUIRED_MATERIALS = [
  { id: 'dishPhoto', label: 'Фото готового блюда' },
  { id: 'pfPhoto', label: 'Фото полуфабриката' },
  { id: 'actualOutput', label: 'Фактический выход' },
  { id: 'updatedTtk', label: 'Обновлённая ТТК' },
  { id: 'restaurantComment', label: 'Комментарий ресторана' },
]

export function normalizeDishName(name = '') {
  return String(name)
    .toLowerCase()
    .replace(/^д\s+/u, '')
    .replace(/\b\d+\s*гр\b/gu, '')
    .replace(/\b\d+\s*г\b/gu, '')
    .replace(/[^а-яёa-z0-9\s]/giu, ' ')
    .replace(/\s+/gu, ' ')
    .trim()
}

export function dishMatchKey(dish) {
  return normalizeDishName(dish?.name || '')
}

function normalizeComparableList(value) {
  const list = Array.isArray(value) ? value : []
  return list.map(item => String(item).trim().toLowerCase()).filter(Boolean).sort()
}

function listEquals(a, b) {
  const aa = normalizeComparableList(a)
  const bb = normalizeComparableList(b)
  return aa.length === bb.length && aa.every((item, index) => item === bb[index])
}

function textEquals(a, b) {
  return String(a ?? '').trim().toLowerCase() === String(b ?? '').trim().toLowerCase()
}

function numberClose(a, b) {
  const aa = Number(a) || 0
  const bb = Number(b) || 0
  if (!aa && !bb) return true
  return Math.abs(aa - bb) <= Math.max(1, Math.min(Math.abs(aa), Math.abs(bb)) * 0.03)
}

export function compareDishVersions(reference, version) {
  if (!version) {
    return Object.keys(FIELD_LABELS).map(field => ({
      field,
      label: FIELD_LABELS[field],
      severity: 'missing',
      message: 'Нет данных',
    }))
  }

  const checks = [
    ['name', textEquals(reference.name, version.name) || dishMatchKey(reference) === dishMatchKey(version), 'warning'],
    ['code', textEquals(reference.code, version.code), 'warning'],
    ['category', textEquals(reference.category, version.category), 'critical'],
    ['station', textEquals(reference.station, version.station), 'critical'],
    ['output', numberClose(reference.output, version.output), 'critical'],
    ['components', listEquals(reference.components, version.components), 'critical'],
    ['componentsCount', (reference.components?.length || 0) === (version.components?.length || 0), 'warning'],
    ['ingredients', listEquals(reference.ingredients, version.ingredients), 'critical'],
    ['technology', !reference.technology || textEquals(reference.technology, version.technology), 'warning'],
    ['photos', (reference.photos?.length || 0) === 0 || (version.photos?.length || 0) > 0, 'warning'],
    ['pfPhotos', (version.pfPhotos?.length || 0) > 0 || (reference.pfPhotos?.length || 0) === 0, 'warning'],
    ['date', Boolean(version.date), 'warning'],
  ]

  return checks
    .filter(([, ok]) => !ok)
    .map(([field, , severity]) => ({
      field,
      label: FIELD_LABELS[field],
      severity,
      message: `${FIELD_LABELS[field]} отличается от эталона`,
      referenceValue: reference[field],
      versionValue: version[field],
    }))
}

export function buildDishGroups(dishes, manualLinks = []) {
  const groups = new Map()
  dishes.forEach(dish => {
    const manual = manualLinks.find(link => link.restaurant === dish.restaurant && link.dishId === dish.id)
    const key = manual?.targetKey || dishMatchKey(dish) || dish.id
    if (!groups.has(key)) groups.set(key, { key, name: dish.name, versions: [] })
    groups.get(key).versions.push(dish)
  })
  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'))
}

export function latestTaskFor(tasks, dishKey, restaurant) {
  return tasks
    .filter(task => task.dishKey === dishKey && task.restaurant === restaurant)
    .sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))[0]
}

export function getComparisonRows({ group, referenceRestaurant, restaurants = NETWORK_RESTAURANTS, tasks = [] }) {
  const reference = group?.versions.find(version => version.restaurant === referenceRestaurant) || group?.versions[0]
  if (!group || !reference) return []

  return restaurants.map(restaurant => {
    const version = group.versions.find(item => item.restaurant === restaurant)
    const task = latestTaskFor(tasks, group.key, restaurant)
    const diffs = restaurant === reference.restaurant ? [] : compareDishVersions(reference, version)
    const criticalCount = diffs.filter(diff => diff.severity === 'critical').length
    const warningCount = diffs.filter(diff => diff.severity === 'warning').length
    const missing = !version
    const status = restaurant === reference.restaurant
      ? 'reference'
      : task?.status === APPROVAL_STATUS.APPROVED || task?.status === APPROVAL_STATUS.CLOSED
        ? task.status
        : missing
          ? 'no_data'
          : diffs.length > 0
            ? APPROVAL_STATUS.HAS_DIFFERENCES
            : APPROVAL_STATUS.APPROVED

    return { restaurant, version, task, diffs, criticalCount, warningCount, missing, status }
  })
}

export function makeTaskId() {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}
