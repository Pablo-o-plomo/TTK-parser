import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'academy_reference_ttk_v1'

const initialItems = []

function readItems() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : initialItems
}

function writeItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function makeReferenceTtkId() {
  return `ttk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyReferenceTtk() {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id: makeReferenceTtkId(),
    title: '',
    ttkCode: '',
    restaurant: 'Петровка',
    category: '',
    station: '',
    output: '',
    date: today,
    status: 'draft',
    photos: {
      main: null,
      plating: null,
      top: null,
      semifinished: null,
    },
    description: '',
    cookingMethod: '',
    plating: '',
    qualityControl: '',
    typicalMistakes: '',
    semifinished: [{ name: '', quantity: '', comment: '' }],
    ingredients: [{ name: '', unit: '', brutto: '', netto: '', readyWeight: '', portionNetto: '' }],
    files: {
      pdf: null,
      xlsx: null,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
    const clean = {
      ...ttk,
      updatedAt: now,
      semifinished: (ttk.semifinished || []).filter(row => row.name || row.quantity || row.comment),
      ingredients: (ttk.ingredients || []).filter(row => row.name || row.unit || row.brutto || row.netto || row.readyWeight || row.portionNetto),
    }
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
      title: `${source.title} — копия`,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    }
    persist(current => [copy, ...current])
    return copy
  }, [persist])

  return { items, saveTtk, deleteTtk, duplicateTtk }
}
