import { useCallback, useEffect, useState } from 'react'

export const NOMENCLATURE_STORAGE_KEY = 'klevo_nomenclature'

export const NOMENCLATURE_TYPES = [
  'Товар',
  'Полуфабрикат',
  'Блюдо',
  'Соус',
  'Заготовка',
  'Декор',
]

function nowIso() {
  return new Date().toISOString()
}

export function makeNomenclatureId() {
  return `nom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyNomenclatureItem() {
  const now = nowIso()
  return {
    id: makeNomenclatureId(),
    name: '',
    type: 'Товар',
    category: '',
    unit: 'г',
    description: '',
    composition: '',
    cookingMethod: '',
    output: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeNomenclatureItem(item = {}) {
  const now = nowIso()
  return {
    id: item.id || makeNomenclatureId(),
    name: item.name || '',
    type: NOMENCLATURE_TYPES.includes(item.type) ? item.type : 'Товар',
    category: item.category || '',
    unit: item.unit || 'г',
    description: item.description || '',
    composition: item.composition || '',
    cookingMethod: item.cookingMethod || '',
    output: item.output || '',
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
      const byName = new Map(current.map(item => [item.name.trim().toLowerCase(), item]))
      normalized.forEach(item => {
        const key = item.name.trim().toLowerCase()
        if (!key) return
        byName.set(key, byName.has(key) ? { ...byName.get(key), ...item, id: byName.get(key).id, updatedAt: now } : item)
      })
      return Array.from(byName.values())
    })
    return normalized.length
  }, [persist])

  return { items, saveItem, deleteItem, importItems }
}
