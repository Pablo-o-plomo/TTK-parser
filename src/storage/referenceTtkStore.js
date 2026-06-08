import { useCallback, useEffect, useState } from 'react'
import { SYSTEM_UNGROUPED_GROUP_ID } from './ttkGroupsStore.js'

export const REFERENCE_TTK_STORAGE_KEY = 'klevo_reference_ttks'

const EMPTY_ROW = { id: '', qty: '', itemId: '', itemType: '', name: '', semifinished: '', description: '' }
const nowIso = () => new Date().toISOString()
const makeTtkId = () => `ttk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
const makeRowId = () => `row_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

function readItems() {
  try {
    const raw = localStorage.getItem(REFERENCE_TTK_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeReferenceTtk) : []
  } catch {
    return []
  }
}

function writeItems(items) {
  localStorage.setItem(REFERENCE_TTK_STORAGE_KEY, JSON.stringify(items))
}

export function createEmptyReferenceTtk() {
  const now = nowIso()
  return {
    id: makeTtkId(),
    title: '',
    ttkCode: '',
    category: '',
    station: '',
    output: '',
    status: 'draft',
    photo: null,
    description: '',
    cookingMethod: '',
    plating: '',
    qualityControl: '',
    typicalMistakes: '',
    rows: [{ ...EMPTY_ROW, id: makeRowId() }],
    files: { pdf: null, xlsx: null },
    groupId: SYSTEM_UNGROUPED_GROUP_ID,
    order: Date.now(),
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [{ ...EMPTY_ROW, id: makeRowId() }]
  return rows.map(row => ({
    id: row.id || makeRowId(),
    qty: row.qty || '',
    itemId: row.itemId || '',
    itemType: row.itemType || '',
    name: row.name || '',
    semifinished: row.semifinished || '',
    description: row.description || '',
  }))
}

export function normalizeReferenceTtk(item = {}) {
  const now = nowIso()
  return {
    id: item.id || makeTtkId(),
    title: item.title || item.name || '',
    ttkCode: item.ttkCode || item.code || '',
    category: item.category || '',
    station: item.station || '',
    output: item.output || '',
    status: item.status || 'draft',
    photo: item.photo || item.photos?.main || null,
    description: item.description || '',
    cookingMethod: item.cookingMethod || item.technology || '',
    plating: item.plating || '',
    qualityControl: item.qualityControl || '',
    typicalMistakes: item.typicalMistakes || '',
    rows: normalizeRows(item.rows),
    files: { pdf: item.files?.pdf || null, xlsx: item.files?.xlsx || null },
    groupId: item.groupId || SYSTEM_UNGROUPED_GROUP_ID,
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : Date.now(),
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

export function useReferenceTtkStore() {
  const [items, setItems] = useState([])

  useEffect(() => setItems(readItems()), [])

  const persist = useCallback(updater => {
    setItems(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeItems(next)
      return next
    })
  }, [])

  const saveTtk = useCallback(ttk => {
    const now = nowIso()
    const normalized = normalizeReferenceTtk(ttk)
    const clean = {
      ...normalized,
      updatedAt: now,
      rows: normalized.rows.filter(row => row.qty || row.name || row.semifinished || row.description),
    }
    if (clean.rows.length === 0) clean.rows = [{ ...EMPTY_ROW, id: makeRowId() }]
    persist(current => current.some(item => item.id === clean.id)
      ? current.map(item => item.id === clean.id ? clean : item)
      : [{ ...clean, createdAt: clean.createdAt || now }, ...current])
    return clean
  }, [persist])

  const deleteTtk = useCallback(id => persist(current => current.filter(item => item.id !== id)), [persist])

  const updateTtkPlacement = useCallback((id, patch = {}) => {
    persist(current => current.map(item => item.id === id ? normalizeReferenceTtk({ ...item, ...patch, updatedAt: nowIso() }) : item))
  }, [persist])

  const moveTtksFromGroup = useCallback((groupId, nextGroupId = SYSTEM_UNGROUPED_GROUP_ID) => {
    persist(current => current.map(item => item.groupId === groupId ? normalizeReferenceTtk({ ...item, groupId: nextGroupId, updatedAt: nowIso() }) : item))
  }, [persist])

  const duplicateTtk = useCallback(id => {
    const source = items.find(item => item.id === id)
    if (!source) return null
    const now = nowIso()
    const copy = { ...source, id: makeTtkId(), title: `${source.title || 'ТТК'} — копия`, status: 'draft', createdAt: now, updatedAt: now }
    persist(current => [copy, ...current])
    return copy
  }, [items, persist])

  const replaceItems = useCallback(nextItems => persist((Array.isArray(nextItems) ? nextItems : []).map(normalizeReferenceTtk)), [persist])

  return { items, saveTtk, deleteTtk, updateTtkPlacement, moveTtksFromGroup, duplicateTtk, replaceItems }
}
