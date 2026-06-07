import { useCallback, useEffect, useState } from 'react'

export const PRODUCTS_STORAGE_KEY = 'klevo_products'

const nowIso = () => new Date().toISOString()
const makeProductId = () => `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

function readProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeProduct) : []
  } catch {
    return []
  }
}

function writeProducts(items) {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(items))
}

export function createEmptyProduct() {
  const now = nowIso()
  return { id: makeProductId(), name: '', unit: 'г', category: '', comment: '', createdAt: now, updatedAt: now }
}

export function normalizeProduct(item = {}) {
  const now = nowIso()
  return {
    id: item.id || makeProductId(),
    name: item.name || item.title || '',
    unit: item.unit || 'г',
    category: item.category || '',
    comment: item.comment || item.description || '',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

export function useProductsStore() {
  const [items, setItems] = useState([])

  useEffect(() => setItems(readProducts()), [])

  const persist = useCallback(updater => {
    setItems(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeProducts(next)
      return next
    })
  }, [])

  const saveItem = useCallback(item => {
    const now = nowIso()
    const clean = { ...normalizeProduct(item), updatedAt: now }
    persist(current => current.some(row => row.id === clean.id)
      ? current.map(row => row.id === clean.id ? clean : row)
      : [{ ...clean, createdAt: clean.createdAt || now }, ...current])
    return clean
  }, [persist])

  const deleteItem = useCallback(id => persist(current => current.filter(item => item.id !== id)), [persist])

  const importItems = useCallback(rows => {
    const normalized = (Array.isArray(rows) ? rows : []).map(normalizeProduct).filter(item => item.name.trim())
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

  const replaceItems = useCallback(nextItems => persist((Array.isArray(nextItems) ? nextItems : []).map(normalizeProduct)), [persist])

  return { items, saveItem, deleteItem, importItems, replaceItems }
}
