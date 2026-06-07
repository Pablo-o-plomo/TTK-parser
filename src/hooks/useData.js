import { useState, useEffect } from 'react'

const DATASETS = [
  { url: '/data/dishes.json', restaurant: 'Ростов', required: true },
  { url: '/data/petrovka_ttk.json', restaurant: 'Петровка', required: false },
]

const RESTAURANT_ALIASES = {
  'ростов': 'Ростов',
  'рос': 'Ростов',
  'петровка': 'Петровка',
  'petrovka': 'Петровка',
  'сахалин': 'Сахалин',
  'сочи': 'Сочи',
}

function asText(value, fallback = '') {
  if (value === null || value === undefined) return fallback
  return String(value).trim() || fallback
}

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '')
}

function normalizeRestaurant(value, fallback = 'Ростов') {
  const raw = asText(value, fallback)
  return RESTAURANT_ALIASES[raw.toLowerCase()] || raw
}

function splitList(value) {
  if (Array.isArray(value)) return value.map(item => asText(item)).filter(Boolean)
  if (typeof value !== 'string' || !value.trim()) return []
  return value.split(/[|;,\n]/).map(item => item.trim()).filter(Boolean)
}

function pickExtraFields(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return {}

  const entries = [
    ['description', firstDefined(row.description, row.desc, row.подача, row.описание, row.presentation)],
    ['technology', firstDefined(row.technology, row.tech, row.технология, row.cooking, row.process)],
    ['ingredients', firstDefined(row.ingredients, row.ингредиенты, row.components, row.componentsRaw, row.состав)],
    ['photos', firstDefined(row.photos, row.photo, row.images, row.фото)],
    ['source', firstDefined(row.source, row.file, row.источник)],
  ]

  return Object.fromEntries(entries.filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

export function normalizeDish(row, fallbackRestaurant = 'Ростов', index = 0) {
  if (Array.isArray(row)) {
    const [id, restaurant, name, ttk, date, category, station, output, errorBits = 0, isShared = 0, hasErrorsRaw = 0, pfCount = 0, pfRaw = '', qcG = null] = row
    const pfList = splitList(pfRaw)
    const rest = normalizeRestaurant(restaurant, fallbackRestaurant)

    return {
      id: asText(id, `${rest}_${ttk || index}`),
      restaurant: rest,
      name: asText(name, 'Без названия'),
      ttk: asText(ttk),
      ttk_num: asText(ttk),
      date: asText(date),
      category: asText(category, 'Прочее'),
      station: asText(station, 'Горячий цех'),
      output: Number(output) || 0,
      errorBits: Number(errorBits) || 0,
      hasErrors: Boolean(Number(hasErrorsRaw) || Number(errorBits)),
      isShared: Boolean(Number(isShared)),
      pfCount: Number(pfCount) || pfList.length,
      pfList,
      qcG: qcG === null || qcG === '' ? null : Number(qcG),
      components: pfList,
      extras: {},
      raw: row,
    }
  }

  if (!row || typeof row !== 'object') {
    return normalizeDish([], fallbackRestaurant, index)
  }

  const restaurant = normalizeRestaurant(firstDefined(row.restaurant, row.rest, row.city, row.branch, row.place), fallbackRestaurant)
  const ttk = asText(firstDefined(row.ttk, row.ttk_num, row.code, row.number, row.id), `${index + 1}`)
  const componentsRaw = firstDefined(row.components, row.componentsRaw, row.ingredients, row.ингредиенты, row.pfRaw, row.pf)
  const components = splitList(componentsRaw)
  const pfList = splitList(firstDefined(row.pfList, row.pfRaw, row.semifinished, row.пф))
  const errorBits = Number(firstDefined(row.errorBits, row.errors, row.error_bits, 0)) || 0
  const hasErrors = Boolean(firstDefined(row.hasErrors, row.has_errors, row.invalid, false)) || errorBits > 0

  return {
    id: asText(firstDefined(row.id, row.uuid, row.key), `${restaurant}_${ttk}_${index}`),
    restaurant,
    name: asText(firstDefined(row.name, row.title, row.dish, row.dishName, row.блюдо, row.название), 'Без названия'),
    ttk,
    ttk_num: ttk,
    date: asText(firstDefined(row.date, row.updatedAt, row.updated_at, row.дата)),
    category: asText(firstDefined(row.category, row.group, row.section, row.категория), 'Прочее'),
    station: asText(firstDefined(row.station, row.shop, row.department, row.станция, row.цех), 'Горячий цех'),
    output: Number(firstDefined(row.output, row.portion, row.yield, row.выход, 0)) || 0,
    errorBits,
    hasErrors,
    isShared: Boolean(firstDefined(row.isShared, row.shared, row.crossNetwork, false)),
    pfCount: Number(firstDefined(row.pfCount, row.pf_count, 0)) || pfList.length,
    pfList,
    qcG: firstDefined(row.qcG, row.weight, row.вес, null) === null ? null : Number(firstDefined(row.qcG, row.weight, row.вес, null)),
    components,
    extras: pickExtraFields(row),
    raw: row,
  }
}

async function fetchDataset({ url, required, restaurant }) {
  const response = await fetch(url)
  if (!response.ok) {
    if (required) throw new Error(`Не найден ${url}: ${response.status}`)
    return []
  }

  const data = await response.json()
  const rows = Array.isArray(data) ? data : firstDefined(data?.dishes, data?.items, data?.data, [])
  return Array.isArray(rows) ? rows.map((row, index) => normalizeDish(row, restaurant, index)) : []
}

export function useData() {
  const [dishes, setDishes] = useState([])
  const [pf, setPf] = useState([])
  const [disc, setDisc] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      Promise.all(DATASETS.map(fetchDataset)).then(parts => parts.flat()),
      fetch('/data/pf.json').then(r => {
        if (!r.ok) throw new Error(`Не найден pf.json: ${r.status}`)
        return r.json()
      }),
      fetch('/data/discrepancies.json').then(r => {
        if (!r.ok) throw new Error(`Не найден discrepancies.json: ${r.status}`)
        return r.json()
      }),
    ])
      .then(([dishData, pfData, discData]) => {
        setDishes(dishData)
        setPf(Array.isArray(pfData) ? pfData : [])
        setDisc(Array.isArray(discData) ? discData : [])
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return { dishes, pf, disc, loading, error }
}

// Совместимость со старым именем хука
export const useIndex = useData
