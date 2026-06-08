import { useCallback, useEffect, useState } from 'react'

export const SEMIFINISHED_STORAGE_KEY = 'klevo_semifinished'
export const SEMIFINISHED_TYPE_LABELS = { semifinished: 'Полуфабрикат', sauce: 'Соус', prep: 'Заготовка' }
export const SEMIFINISHED_FILTERS = [
  { value: 'all', label: 'Все' },
  { value: 'semifinished', label: 'Полуфабрикаты' },
  { value: 'sauce', label: 'Соусы' },
  { value: 'prep', label: 'Заготовки' },
]

const TYPE_ALIASES = {
  semifinished: 'semifinished', полуфабрикат: 'semifinished', полуфабрикаты: 'semifinished',
  sauce: 'sauce', соус: 'sauce', соусы: 'sauce',
  prep: 'prep', заготовка: 'prep', заготовки: 'prep',
}

const nowIso = () => new Date().toISOString()
const makeSemifinishedId = () => `semi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
const normalizeType = type => TYPE_ALIASES[String(type || '').trim().toLowerCase()] || 'semifinished'

function readItems() {
  try {
    const raw = localStorage.getItem(SEMIFINISHED_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeSemifinished) : []
  } catch {
    return []
  }
}

function writeItems(items) {
  localStorage.setItem(SEMIFINISHED_STORAGE_KEY, JSON.stringify(items))
}

export function createEmptySemifinished(type = 'semifinished') {
  const now = nowIso()
  return {
    id: makeSemifinishedId(),
    name: '',
    type: normalizeType(type),
    photo: null,
    output: '',
    composition: '',
    cookingMethod: '',
    files: [],
    status: 'draft',
    ingredients: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeSemifinished(item = {}) {
  const now = nowIso()
  return {
    id: item.id || makeSemifinishedId(),
    name: item.name || item.title || '',
    type: normalizeType(item.type),
    photo: item.photo || null,
    output: item.output || '',
    composition: item.composition || '',
    cookingMethod: item.cookingMethod || '',
    files: Array.isArray(item.files) ? item.files : [],
    status: item.status || 'draft',
    ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

export function useSemifinishedStore() {
  const [items, setItems] = useState([])

  useEffect(() => setItems(readItems()), [])

  const persist = useCallback(updater => {
    setItems(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeItems(next)
      return next
    })
  }, [])

  const saveItem = useCallback(item => {
    const now = nowIso()
    const clean = { ...normalizeSemifinished(item), updatedAt: now }
    persist(current => current.some(row => row.id === clean.id)
      ? current.map(row => row.id === clean.id ? clean : row)
      : [{ ...clean, createdAt: clean.createdAt || now }, ...current])
    return clean
  }, [persist])

  const deleteItem = useCallback(id => persist(current => current.filter(item => item.id !== id)), [persist])

  const importItems = useCallback(rows => {
    const normalized = (Array.isArray(rows) ? rows : []).map(normalizeSemifinished).filter(item => item.name.trim())
    persist(current => {
      const byName = new Map(current.map(item => [item.name.trim().toLowerCase(), item]))
      normalized.forEach(item => {
        const key = item.name.trim().toLowerCase()
        byName.set(key, byName.has(key) ? { ...byName.get(key), ...item, id: byName.get(key).id, updatedAt: nowIso() } : item)
      })
      return Array.from(byName.values())
    })
    return normalized.length
  }, [persist])

  const replaceItems = useCallback(nextItems => persist((Array.isArray(nextItems) ? nextItems : []).map(normalizeSemifinished)), [persist])

  return { items, saveItem, deleteItem, importItems, replaceItems }
}
