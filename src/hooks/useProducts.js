import { useCallback, useEffect, useState } from 'react'

export const PRODUCTS_STORAGE_KEY = 'klevo_products'

function nowIso() {
  return new Date().toISOString()
}

export function makeProductId() {
  return `product_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyProduct() {
  const now = nowIso()

  return {
    id: makeProductId(),
    name: '',
    unit: 'г',
    category: '',
    categoryPath: '',
    comment: '',
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeProduct(item = {}) {
  const now = nowIso()

  return {
    id: item.id || makeProductId(),
    name: item.name || item['Наименование'] || item.title || '',
    unit: item.unit || item['Ед. изм.'] || item['Ед изм'] || item.measure || 'г',
    category: item.category || item['Категория'] || item.group || '',
    categoryPath: item.categoryPath || item['Путь категории'] || item['Группа'] || item.category || '',
    comment: item.comment || item['Комментарий'] || item.description || '',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

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

export function useProductsStore() {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(readProducts())
  }, [])

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
    const normalized = imported.map(item => normalizeProduct({
      ...item,
      id: item.id || makeProductId(),
      createdAt: item.createdAt || now,
      updatedAt: now,
    }))

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