import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'academy_printable_reference_ttk_v1'
const LEGACY_STORAGE_KEY = 'academy_reference_ttk_v1'

const EMPTY_ROW = { qty: '', name: '', semifinished: '', description: '' }

function isBrowserStorageAvailable() {
  return typeof localStorage !== 'undefined'
}

function parseItems(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeReferenceTtk) : []
  } catch {
    return []
  }
}

function readItems() {
  if (!isBrowserStorageAvailable()) return []
  const current = localStorage.getItem(STORAGE_KEY)
  if (current) return parseItems(current)

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacy) return parseItems(legacy)

  return []
}

function writeItems(items) {
  if (!isBrowserStorageAvailable()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function makeReferenceTtkId() {
  return `ttk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyReferenceTtk() {
  const now = new Date().toISOString()
  return {
    id: makeReferenceTtkId(),
    title: '',
    output: '',
    rows: [{ ...EMPTY_ROW }],
    photo: null,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeRows(item) {
  if (Array.isArray(item?.rows)) {
    return item.rows.map(row => ({
      qty: row.qty || '',
      name: row.name || '',
      semifinished: row.semifinished || '',
      description: row.description || '',
    }))
  }

  if (Array.isArray(item?.ingredients) && item.ingredients.length > 0) {
    return item.ingredients.map(row => ({
      qty: row.portionNetto || row.netto || row.brutto || '',
      name: row.name || '',
      semifinished: row.unit || '',
      description: row.comment || '',
    }))
  }

  if (Array.isArray(item?.semifinished) && item.semifinished.length > 0) {
    return item.semifinished.map(row => ({
      qty: row.quantity || '',
      name: row.name || '',
      semifinished: row.comment || '',
      description: '',
    }))
  }

  return [{ ...EMPTY_ROW }]
}

export function normalizeReferenceTtk(item = {}) {
  const now = new Date().toISOString()
  return {
    id: item.id || makeReferenceTtkId(),
    title: item.title || item.name || '',
    output: item.output || '',
    rows: normalizeRows(item),
    photo: item.photo || item.photos?.main || null,
    status: item.status || 'draft',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

export function useReferenceTtkStore() {
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

  const saveTtk = useCallback(ttk => {
    const now = new Date().toISOString()
    const normalized = normalizeReferenceTtk(ttk)
    const clean = {
      ...normalized,
      updatedAt: now,
      rows: normalized.rows.filter(row => row.qty || row.name || row.semifinished || row.description),
    }

    if (clean.rows.length === 0) clean.rows = [{ ...EMPTY_ROW }]

    persist(current => {
      const exists = current.some(item => item.id === clean.id)
      return exists
        ? current.map(item => item.id === clean.id ? clean : item)
        : [{ ...clean, createdAt: clean.createdAt || now }, ...current]
    })

    return clean
  }, [persist])

  const deleteTtk = useCallback(id => {
    persist(current => current.filter(item => item.id !== id))
  }, [persist])

  const duplicateTtk = useCallback(id => {
    const source = readItems().find(item => item.id === id)
    if (!source) return null

    const now = new Date().toISOString()
    const copy = {
      ...source,
      id: makeReferenceTtkId(),
      title: `${source.title || 'ТТК'} — копия`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }

    persist(current => [copy, ...current])
    return copy
  }, [persist])

  return { items, saveTtk, deleteTtk, duplicateTtk }
}
