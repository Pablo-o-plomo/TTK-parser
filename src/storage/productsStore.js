import { useCallback, useEffect, useState } from 'react'

export const PRODUCTS_STORAGE_KEY = 'klevo_products'

function nowIso() { return new Date().toISOString() }
function makeId() { return `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
function readJson(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : [] } catch { return [] } }
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

export function createEmptyProduct() {
  const now = nowIso()
  return { id: makeId(), name:'', unit:'г', category:'', comment:'', createdAt:now, updatedAt:now }
}

export function normalizeProduct(item = {}) {
  const now = nowIso()
  return {
    id: item.id || makeId(),
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
  useEffect(() => { setItems(readJson(PRODUCTS_STORAGE_KEY).map(normalizeProduct)) }, [])
  const persist = useCallback(updater => setItems(current => { const next = typeof updater === 'function' ? updater(current) : updater; writeJson(PRODUCTS_STORAGE_KEY, next); return next }), [])
  const saveItem = useCallback(item => {
    const now = nowIso()
    const clean = { ...normalizeProduct(item), updatedAt: now }
    persist(current => current.some(row => row.id === clean.id) ? current.map(row => row.id === clean.id ? clean : row) : [{ ...clean, createdAt: clean.createdAt || now }, ...current])
    return clean
  }, [persist])
  const deleteItem = useCallback(id => persist(current => current.filter(item => item.id !== id)), [persist])
  const importItems = useCallback(rows => {
    const normalized = (Array.isArray(rows) ? rows : []).map(normalizeProduct).filter(item => item.name.trim())
    persist(current => {
      const byName = new Map(current.map(item => [item.name.trim().toLowerCase(), item]))
      normalized.forEach(item => byName.set(item.name.trim().toLowerCase(), byName.has(item.name.trim().toLowerCase()) ? { ...byName.get(item.name.trim().toLowerCase()), ...item, id: byName.get(item.name.trim().toLowerCase()).id, updatedAt: nowIso() } : item))
      return Array.from(byName.values())
    })
    return normalized.length
  }, [persist])
  const replaceItems = useCallback(nextItems => persist((Array.isArray(nextItems) ? nextItems : []).map(normalizeProduct)), [persist])
  return { items, saveItem, deleteItem, importItems, replaceItems }
}
