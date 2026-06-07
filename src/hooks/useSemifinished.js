import { useCallback, useEffect, useState } from 'react'

export const SEMIFINISHED_STORAGE_KEY = 'klevo_semifinished'

export const SEMIFINISHED_STATUS_LABELS = {
  draft: 'Черновик',
  active: 'Активный',
  archived: 'Архив',
}

function nowIso() {
  return new Date().toISOString()
}

export function makeSemifinishedId() {
  return `pf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptySemifinished() {
  const now = nowIso()

  return {
    id: makeSemifinishedId(),
    name: '',
    unit: 'г',
    category: '',
    categoryPath: '',
    output: '',
    composition: '',
    cookingMethod: '',
    description: '',
    status: 'active',
    photo: null,
    files: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeSemifinished(item = {}) {
  const now = nowIso()

  return {
    id: item.id || makeSemifinishedId(),
    name: item.name || item['Наименование'] || item.title || '',
    unit: item.unit || item['Ед. изм.'] || item['Ед изм'] || 'г',
    category: item.category || item['Категория'] || item.group || '',
    categoryPath: item.categoryPath || item['Путь категории'] || item['Группа'] || item.category || '',
    output: item.output || item['Выход'] || '',
    composition: item.composition || item['Состав'] || item.semifinished || '',
    cookingMethod: item.cookingMethod || item['Способ приготовления'] || item['Технология'] || '',
    description: item.description || item['Описание'] || '',
    status: item.status || 'active',
    photo: item.photo || null,
    files: Array.isArray(item.files) ? item.files : [],
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

function readSemifinished() {
  try {
    const raw = localStorage.getItem(SEMIFINISHED_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeSemifinished) : []
  } catch {
    return []
  }
}

function writeSemifinished(items) {
  localStorage.setItem(SEMIFINISHED_STORAGE_KEY, JSON.stringify(items))
}

export function useSemifinishedStore() {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(readSemifinished())
  }, [])

  const persist = useCallback(updater => {
    setItems(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeSemifinished(next)
      return next
    })
  }, [])

  const saveItem = useCallback(item => {
    const now = nowIso()
    const clean = { ...normalizeSemifinished(item), updatedAt: now }

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
    const normalized = imported.map(item => normalizeSemifinished({
      ...item,
      id: item.id || makeSemifinishedId(),
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