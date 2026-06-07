import { useCallback, useEffect, useState } from 'react'

export const SEMIFINISHED_STORAGE_KEY = 'klevo_semifinished'
export const SEMIFINISHED_TYPES = ['semifinished', 'sauce', 'prep']
export const SEMIFINISHED_TYPE_LABELS = { semifinished:'Полуфабрикат', sauce:'Соус', prep:'Заготовка' }
export const SEMIFINISHED_FILTERS = [
  { value:'all', label:'Все' },
  { value:'semifinished', label:'Полуфабрикаты' },
  { value:'sauce', label:'Соусы' },
  { value:'prep', label:'Заготовки' },
]
const TYPE_ALIASES = { semifinished:'semifinished', полуфабрикат:'semifinished', полуфабрикаты:'semifinished', sauce:'sauce', соус:'sauce', соусы:'sauce', prep:'prep', заготовка:'prep', заготовки:'prep' }
function normalizeType(type) { return TYPE_ALIASES[String(type || '').trim().toLowerCase()] || 'semifinished' }
function nowIso() { return new Date().toISOString() }
function makeId() { return `semi_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }
function readJson(key) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : [] } catch { return [] } }
function writeJson(key, value) { localStorage.setItem(key, JSON.stringify(value)) }

export function createEmptySemifinished(type = 'semifinished') {
  const now = nowIso()
  return { id: makeId(), name:'', type: normalizeType(type), photo:null, output:'', composition:'', cookingMethod:'', files:[], status:'draft', ingredients:[], createdAt:now, updatedAt:now }
}
export function normalizeSemifinished(item = {}) {
  const now = nowIso()
  return { id:item.id || makeId(), name:item.name || item.title || '', type: normalizeType(item.type), photo:item.photo || null, output:item.output || '', composition:item.composition || '', cookingMethod:item.cookingMethod || '', files:Array.isArray(item.files) ? item.files : [], status:item.status || 'draft', ingredients:Array.isArray(item.ingredients) ? item.ingredients : [], createdAt:item.createdAt || now, updatedAt:item.updatedAt || now }
}
export function useSemifinishedStore() {
  const [items, setItems] = useState([])
  useEffect(() => { setItems(readJson(SEMIFINISHED_STORAGE_KEY).map(normalizeSemifinished)) }, [])
  const persist = useCallback(updater => setItems(current => { const next = typeof updater === 'function' ? updater(current) : updater; writeJson(SEMIFINISHED_STORAGE_KEY, next); return next }), [])
  const saveItem = useCallback(item => { const now = nowIso(); const clean = { ...normalizeSemifinished(item), updatedAt:now }; persist(current => current.some(row => row.id === clean.id) ? current.map(row => row.id === clean.id ? clean : row) : [{ ...clean, createdAt: clean.createdAt || now }, ...current]); return clean }, [persist])
  const deleteItem = useCallback(id => persist(current => current.filter(item => item.id !== id)), [persist])
  const importItems = useCallback(rows => { const normalized = (Array.isArray(rows) ? rows : []).map(normalizeSemifinished).filter(item => item.name.trim()); persist(current => { const byName = new Map(current.map(item => [item.name.trim().toLowerCase(), item])); normalized.forEach(item => byName.set(item.name.trim().toLowerCase(), byName.has(item.name.trim().toLowerCase()) ? { ...byName.get(item.name.trim().toLowerCase()), ...item, id: byName.get(item.name.trim().toLowerCase()).id, updatedAt: nowIso() } : item)); return Array.from(byName.values()) }); return normalized.length }, [persist])
  const replaceItems = useCallback(nextItems => persist((Array.isArray(nextItems) ? nextItems : []).map(normalizeSemifinished)), [persist])
  return { items, saveItem, deleteItem, importItems, replaceItems }
}
