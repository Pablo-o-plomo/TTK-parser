import { useCallback, useEffect, useState } from 'react'

export const NOMENCLATURE_STORAGE_KEY = 'klevo_nomenclature'

export const NOMENCLATURE_TYPES = ['product', 'semifinished', 'sauce', 'prep', 'decor', 'dish']

export const NOMENCLATURE_TYPE_LABELS = {
  product: 'Товар',
  semifinished: 'Полуфабрикат',
  sauce: 'Соус',
  prep: 'Заготовка',
  decor: 'Декор',
  dish: 'Блюдо',
}

export const PRODUCT_FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'product', label: 'Товары' },
]

export const SEMIFINISHED_FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'semifinished', label: 'Полуфабрикаты' },
  { value: 'sauce', label: 'Соусы' },
  { value: 'prep', label: 'Заготовки' },
]

const TYPE_ALIASES = {
  product: 'product', товар: 'product', товары: 'product',
  semifinished: 'semifinished', полуфабрикат: 'semifinished', полуфабрикаты: 'semifinished',
  sauce: 'sauce', соус: 'sauce', соусы: 'sauce',
  prep: 'prep', заготовка: 'prep', заготовки: 'prep',
  decor: 'decor', декор: 'decor',
  dish: 'dish', блюдо: 'dish', блюда: 'dish',
}

function nowIso() {
  return new Date().toISOString()
}

function normalizeNomenclatureType(type) {
  const key = String(type || '').trim().toLowerCase()
  return TYPE_ALIASES[key] || 'product'
}

export function makeNomenclatureId() {
  return `nom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyNomenclatureItem(type = 'product') {
  const now = nowIso()
  return {
    id: makeNomenclatureId(),
    name: '',
    type: normalizeNomenclatureType(type),
    category: '',
    categoryPath: '',
    unit: 'г',
    comment: '',
    description: '',
    composition: '',
    cookingMethod: '',
    output: '',
    photo: null,
    files: [],
    status: 'draft',
    ingredients: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeNomenclatureItem(item = {}) {
  const now = nowIso()
  return {
    id: item.id || makeNomenclatureId(),
    name: item.name || item.title || '',
    type: normalizeNomenclatureType(item.type),
    category: item.category || '',
    categoryPath: item.categoryPath || '',
    unit: item.unit || 'г',
    comment: item.comment || item.description || '',
    description: item.description || item.comment || '',
    composition: item.composition || '',
    cookingMethod: item.cookingMethod || '',
    output: item.output || '',
    photo: item.photo || null,
    files: Array.isArray(item.files) ? item.files : [],
    status: item.status || 'draft',
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

function readItems() {
  try {
    const raw = localStorage.getItem(NOMENCLATURE_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeNomenclatureItem) : []
  } catch {
    return []
  }
}

function writeItems(items) {
  localStorage.setItem(NOMENCLATURE_STORAGE_KEY, JSON.stringify(items))
}

export function useNomenclatureStore() {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(readItems())
  }, [])

  const persist = useCallback(updater => {
    setItems(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeItems(next)
      return next
    })
  }, [])

  const saveItem = useCallback(item => {
    const now = nowIso()
    const clean = { ...normalizeNomenclatureItem(item), updatedAt: now }
    persist(current => {
      const exists = current.some(row => row.id === clean.id)
      return exists
        ? current.map(row => row.id === clean.id ? clean : row)
        : [{ ...clean, createdAt: clean.createdAt || now }, ...current]
    })
    return clean
  }, [persist])

  const deleteItem = useCallback(id => {
    persist(current => current.filter(item => item.id !== id))
  }, [persist])

  const importItems = useCallback(imported => {
    const now = nowIso()
    const normalized = imported.map(item => normalizeNomenclatureItem({ ...item, id: item.id || makeNomenclatureId(), createdAt: item.createdAt || now, updatedAt: now }))
    persist(current => {
      const byName = new Map(current.map(item => [`${item.type}:${item.name.trim().toLowerCase()}`, item]))
      normalized.forEach(item => {
        const key = `${item.type}:${item.name.trim().toLowerCase()}`
        if (!item.name.trim()) return
        byName.set(key, byName.has(key) ? { ...byName.get(key), ...item, id: byName.get(key).id, updatedAt: now } : item)
      })
      return Array.from(byName.values())
    })
    return normalized.filter(item => item.name.trim()).length
  }, [persist])

  const replaceItems = useCallback(nextItems => {
    const normalized = Array.isArray(nextItems) ? nextItems.map(normalizeNomenclatureItem) : []
    persist(normalized)
  }, [persist])

  return { items, saveItem, deleteItem, importItems, replaceItems }
}
