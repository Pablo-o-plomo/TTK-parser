import { APPROVAL_STATUS, NETWORK_RESTAURANTS, buildDishGroups, getComparisonRows, normalizeDishName } from '../domain/workflow.js'

export const ROLES = {
  BRAND_CHEF: 'brand_chef',
  RESTAURANT_CHEF: 'restaurant_chef',
  SOUS_CHEF: 'sous_chef',
  TECHNOLOGIST: 'technologist',
  VIEWER: 'viewer',
}

export const SOURCE_TYPES = {
  JSON: 'json',
  EXCEL: 'excel',
  CSV: 'csv',
  PDF: 'pdf',
}

export const uploadStatusLabels = {
  uploaded: 'Загружено',
  parsing: 'Распознаётся',
  parsed: 'Распознано',
  needs_mapping: 'Нужно сопоставить колонки',
  imported: 'Импортировано',
  error: 'Ошибка',
}

export const repositoryContract = {
  dishes: ['list', 'createVersion', 'linkVersion', 'getHistory'],
  tasks: ['list', 'create', 'submit', 'updateStatus'],
  uploads: ['list', 'create', 'parse', 'import'],
  storage: ['putObject', 'getSignedUrl'],
  auth: ['getCurrentUser', 'hasRole'],
}

export function detectSourceType(fileName = '') {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return SOURCE_TYPES.PDF
  if (ext === 'csv') return SOURCE_TYPES.CSV
  if (ext === 'xls' || ext === 'xlsx') return SOURCE_TYPES.EXCEL
  return SOURCE_TYPES.JSON
}

export function buildVersionRecord(dish, source = {}) {
  return {
    versionId: `${dish.id || normalizeDishName(dish.name)}_${source.createdAt || Date.now()}`,
    dishId: dish.id,
    restaurant: dish.restaurant,
    version: source.version || 'v1.0',
    sourceType: source.sourceType || dish.sourceType || SOURCE_TYPES.JSON,
    sourceFile: source.sourceFile || dish.sourceFile || 'dishes.json',
    pdfDocuments: dish.pdfDocuments || [],
    excelDocuments: dish.excelDocuments || [],
    changedAt: source.createdAt || dish.date || new Date().toISOString(),
    responsible: source.responsible || 'Бренд-шеф',
    payload: dish,
  }
}

export function buildDishVersions(group, uploads = []) {
  const uploadVersions = uploads
    .filter(upload => normalizeDishName(upload.detectedDishName || upload.file?.name) === group.key)
    .map(upload => ({
      versionId: upload.id,
      dishId: group.key,
      restaurant: upload.restaurant,
      version: upload.version || 'v1.1',
      sourceType: upload.sourceType,
      sourceFile: upload.file?.name,
      pdfDocuments: upload.sourceType === SOURCE_TYPES.PDF ? [upload.file] : [],
      excelDocuments: upload.sourceType === SOURCE_TYPES.EXCEL || upload.sourceType === SOURCE_TYPES.CSV ? [upload.file] : [],
      changedAt: upload.createdAt,
      responsible: upload.responsible || 'Ручная загрузка',
      payload: upload.extractedDish || null,
    }))

  return [
    ...group.versions.map(dish => buildVersionRecord(dish)),
    ...uploadVersions,
  ].sort((a, b) => String(b.changedAt).localeCompare(String(a.changedAt)))
}

export function simulateUploadParsing({ file, mode, restaurant, dishes = [] }) {
  const sourceType = detectSourceType(file?.name)
  const baseName = file?.name?.replace(/\.[^.]+$/u, '') || 'Новая ТТК'
  const normalized = normalizeDishName(baseName)
  const matched = dishes.filter(dish => normalizeDishName(dish.name) === normalized || dish.code === baseName).length
  const found = mode === 'table' ? Math.max(20, Math.min(186, Math.round((file?.size || 4096) / 2048))) : 1
  const conflicts = matched > 1 ? Math.min(3, matched - 1) : 0
  const fresh = Math.max(0, found - matched)

  return {
    sourceType,
    detectedDishName: baseName,
    restaurant,
    parseSummary: { found, matched, newItems: fresh, conflicts },
    previewRows: mode === 'table'
      ? Array.from({ length: 20 }, (_, i) => `Строка ${i + 1}: ${baseName || 'Блюдо'} · колонка ${i + 1}`)
      : [`PDF: ${baseName}`, 'Текст будет извлечён PDF-парсером', 'Ингредиенты и технология будут выделены автоматически'],
    extractedDish: {
      id: `upload_${normalized || Date.now()}`,
      restaurant,
      code: '',
      name: baseName,
      category: 'Прочее',
      station: 'Горячий цех',
      output: 0,
      ingredients: [],
      semifinished: [],
      technology: '',
      photos: [],
      sourceType,
      sourceFile: file?.name,
      raw: null,
    },
  }
}

export function calculateNetworkAnalytics({ dishes = [], tasks = [], uploads = [], manualLinks = [], referenceRestaurant = 'Петровка' }) {
  const groups = buildDishGroups(dishes, manualLinks)
  const comparisonRows = groups.flatMap(group => getComparisonRows({ group, referenceRestaurant, tasks }))
  const withDifferences = groups.filter(group => getComparisonRows({ group, referenceRestaurant, tasks }).some(row => row.status === APPROVAL_STATUS.HAS_DIFFERENCES || row.status === 'no_data')).length
  const withoutPhotos = dishes.filter(dish => (dish.photos?.length || 0) === 0).length
  const withoutTechnology = dishes.filter(dish => !dish.technology).length
  const withoutPdf = dishes.filter(dish => (dish.pdfDocuments?.length || 0) === 0 && dish.sourceType !== SOURCE_TYPES.PDF).length
  const waitingReview = tasks.filter(task => task.status === APPROVAL_STATUS.SUBMITTED || task.status === APPROVAL_STATUS.IN_REVIEW).length
  const approved = tasks.filter(task => task.status === APPROVAL_STATUS.APPROVED).length
  const closed = tasks.filter(task => task.status === APPROVAL_STATUS.CLOSED).length

  const restaurantRating = NETWORK_RESTAURANTS.map(restaurant => {
    const rows = comparisonRows.filter(row => row.restaurant === restaurant)
    const ok = rows.filter(row => row.status === 'reference' || row.status === APPROVAL_STATUS.APPROVED || row.diffs?.length === 0).length
    return { restaurant, score: rows.length ? Math.round(ok / rows.length * 100) : 0 }
  })

  const problematicDishes = groups
    .map(group => ({ group, diffCount: getComparisonRows({ group, referenceRestaurant, tasks }).reduce((sum, row) => sum + (row.diffs?.length || 0), 0) }))
    .filter(item => item.diffCount > 0)
    .sort((a, b) => b.diffCount - a.diffCount)
    .slice(0, 5)

  const latestChanges = [
    ...tasks.map(task => ({ at: task.updatedAt || task.createdAt, text: `${task.dishName}: ${task.restaurant} · ${task.status}` })),
    ...uploads.map(upload => ({ at: upload.createdAt, text: `Загрузка ${upload.file?.name} · ${upload.restaurant}` })),
  ].sort((a, b) => String(b.at).localeCompare(String(a.at))).slice(0, 6)

  return {
    totalDishes: groups.length,
    restaurants: NETWORK_RESTAURANTS.length,
    withDifferences,
    tasks: tasks.length,
    waitingReview,
    withoutPhotos,
    withoutTechnology,
    withoutPdf,
    approved,
    closed,
    restaurantRating,
    problematicDishes,
    problematicRestaurants: restaurantRating.filter(item => item.score < 95).sort((a, b) => a.score - b.score).slice(0, 5),
    latestChanges,
    averageFixTimeDays: tasks.length ? Math.max(1, Math.round(tasks.reduce((sum, task) => {
      const start = new Date(task.createdAt).getTime()
      const end = new Date(task.updatedAt || task.createdAt).getTime()
      return sum + Math.max(0, end - start)
    }, 0) / tasks.length / 86400000)) : 0,
  }
}

export const restaurantProfiles = {
  Петровка: { city: 'Москва', responsible: 'Анна Петрова · бренд-шеф', chef: 'шеф-повар Петровки' },
  Ростов: { city: 'Ростов-на-Дону', responsible: 'Иван Ростовцев · шеф-повар', chef: 'су-шеф Ростов' },
  Сочи: { city: 'Сочи', responsible: 'Мария Сочи · шеф-повар', chef: 'су-шеф Сочи' },
  Краснодар: { city: 'Краснодар', responsible: 'Алексей Кубань · шеф-повар', chef: 'су-шеф Краснодар' },
  Авиапарк: { city: 'Москва', responsible: 'Елена Авиа · шеф-повар', chef: 'су-шеф Авиапарк' },
}

export function getRestaurantStatus(metrics) {
  if (!metrics.dishesCount) return { id: 'no_data', label: 'Нет данных', color: '#94a3b8', bg: '#f8fafc', icon: '⚪' }
  if (metrics.overdueTasks > 0 || metrics.differencesCount > Math.max(10, metrics.dishesCount * 0.2)) return { id: 'critical', label: 'Много ошибок', color: '#dc2626', bg: '#fef2f2', icon: '🔴' }
  if (metrics.activeTasks > 0 || metrics.differencesCount > 0 || metrics.withoutPhotos > 0 || metrics.withoutPdf > 0) return { id: 'attention', label: 'Есть задачи', color: '#d97706', bg: '#fffbeb', icon: '🟡' }
  return { id: 'ok', label: 'Всё в порядке', color: '#16a34a', bg: '#f0fdf4', icon: '🟢' }
}

export function buildRestaurantCrmCards({ dishes = [], tasks = [], uploads = [], referenceRestaurant = 'Петровка', manualLinks = [] }) {
  const groups = buildDishGroups(dishes, manualLinks)
  const now = Date.now()

  return NETWORK_RESTAURANTS.map(restaurant => {
    const restaurantDishes = dishes.filter(dish => dish.restaurant === restaurant)
    const restaurantTasks = tasks.filter(task => task.restaurant === restaurant)
    const activeTasks = restaurantTasks.filter(task => ![APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.CLOSED].includes(task.status)).length
    const overdueTasks = restaurantTasks.filter(task => task.dueDate && new Date(task.dueDate).getTime() < now && ![APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.CLOSED].includes(task.status)).length
    const confirmed = restaurantTasks.filter(task => [APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.CLOSED].includes(task.status)).length
    const withoutPhotos = restaurantDishes.filter(dish => (dish.photos?.length || 0) === 0).length
    const withoutPdf = restaurantDishes.filter(dish => (dish.pdfDocuments?.length || 0) === 0 && dish.sourceType !== SOURCE_TYPES.PDF).length
    const withoutTechnology = restaurantDishes.filter(dish => !dish.technology).length
    const differencesCount = groups.filter(group => {
      const rows = getComparisonRows({ group, referenceRestaurant, tasks })
      const row = rows.find(item => item.restaurant === restaurant)
      return row && (row.status === 'no_data' || row.status === APPROVAL_STATUS.HAS_DIFFERENCES)
    }).length
    const lastUpload = uploads.filter(upload => upload.restaurant === restaurant).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0]
    const readinessBase = restaurantDishes.length || groups.length || 1
    const penalty = differencesCount + withoutPhotos * 0.35 + withoutPdf * 0.25 + overdueTasks * 4 + activeTasks * 0.5
    const readiness = restaurantDishes.length ? Math.max(0, Math.min(100, Math.round(100 - penalty / readinessBase * 100))) : 0
    const metrics = {
      restaurant,
      ...restaurantProfiles[restaurant],
      dishes: restaurantDishes,
      dishesCount: restaurantDishes.length,
      confirmedTtk: confirmed,
      differencesCount,
      withoutPhotos,
      withoutPdf,
      withoutTechnology,
      activeTasks,
      overdueTasks,
      readiness,
      lastUploadDate: lastUpload?.createdAt || null,
      lastUpload,
      tasks: restaurantTasks,
      uploads: uploads.filter(upload => upload.restaurant === restaurant),
    }
    return { ...metrics, status: getRestaurantStatus(metrics) }
  })
}

export function sortRestaurants(cards, sortBy) {
  const sorted = [...cards]
  const getTime = card => card.lastUploadDate ? new Date(card.lastUploadDate).getTime() : 0
  const sorters = {
    readiness: (a, b) => b.readiness - a.readiness,
    errors: (a, b) => b.differencesCount - a.differencesCount,
    overdue: (a, b) => b.overdueTasks - a.overdueTasks,
    tasks: (a, b) => b.activeTasks - a.activeTasks,
    lastUpload: (a, b) => getTime(b) - getTime(a),
  }
  return sorted.sort(sorters[sortBy] || sorters.readiness)
}
