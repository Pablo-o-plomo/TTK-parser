import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'academy_printable_reference_ttk_v1'
const LEGACY_STORAGE_KEY = 'academy_reference_ttk_v1'
const API_URL = '/api/reference-ttk'

const EMPTY_INGREDIENT = { id: '', name: '', type: 'product', quantity: '' }

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

function readLocalItems() {
  if (!isBrowserStorageAvailable()) return []

  const current = localStorage.getItem(STORAGE_KEY)
  if (current) return parseItems(current)

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacy) return parseItems(legacy)

  return []
}

function writeLocalFallback(items) {
  if (!isBrowserStorageAvailable()) return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (error) {
    console.warn('Local fallback save failed.', error)
  }
}

async function readServerItems() {
  try {
    const response = await fetch(API_URL)

    if (!response.ok) {
      throw new Error(`Server read failed: ${response.status}`)
    }

    const parsed = await response.json()
    return Array.isArray(parsed) ? parsed.map(normalizeReferenceTtk) : []
  } catch (error) {
    console.warn('Failed to read TTK from server. Using localStorage fallback.', error)
    return readLocalItems()
  }
}

async function writeServerItems(items) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(items),
  })

  if (!response.ok) {
    throw new Error(`Server save failed: ${response.status}`)
  }
}

async function loadItemsWithMigration() {
  const serverItems = await readServerItems()

  if (serverItems.length > 0) {
    return serverItems
  }

  const localItems = readLocalItems()

  if (localItems.length > 0) {
    try {
      await writeServerItems(localItems)
      console.log('TTK migrated from localStorage to server storage')
      return localItems
    } catch (error) {
      console.warn('Failed to migrate TTK to server. Using localStorage fallback.', error)
      return localItems
    }
  }

  return []
}

export function makeReferenceTtkId() {
  return `ttk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function makeIngredientId() {
  return `ing_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyReferenceTtk() {
  const now = new Date().toISOString()
  return {
    id: makeReferenceTtkId(),
    title: '',
    image: '',
    yield: '',
    assemblyTime: '',
    category: '',
    dishware: '',
    status: 'draft',
    description: '',
    ingredients: [{ ...EMPTY_INGREDIENT, id: makeIngredientId() }],
    cookingMethod: '',
    dishStandard: '',
    serving: '',
    createdAt: now,
    updatedAt: now,
  }
}

function normalizeIngredient(row = {}) {
  return {
    id: row.id || makeIngredientId(),
    name: row.name || row.title || '',
    type: row.type || row.source || (row.semifinished ? 'semifinished' : 'product'),
    quantity: row.quantity || row.qty || row.amount || row.portionNetto || row.netto || row.brutto || '',
  }
}

function normalizeIngredients(item) {
  if (Array.isArray(item?.ingredients) && item.ingredients.length > 0) {
    return item.ingredients.map(normalizeIngredient)
  }

  if (Array.isArray(item?.rows) && item.rows.length > 0) {
    return item.rows.map(normalizeIngredient)
  }

  if (Array.isArray(item?.semifinished) && item.semifinished.length > 0) {
    return item.semifinished.map(row => normalizeIngredient({
      name: row.name || '',
      quantity: row.quantity || '',
      type: 'semifinished',
    }))
  }

  return [{ ...EMPTY_INGREDIENT, id: makeIngredientId() }]
}

export function normalizeReferenceTtk(item = {}) {
  const now = new Date().toISOString()

  return {
    id: item.id || makeReferenceTtkId(),
    title: item.title || item.name || '',
    image: item.image || item.photo?.dataUrl || item.photos?.main?.dataUrl || '',
    yield: item.yield || item.output || '',
    assemblyTime: item.assemblyTime || item.time || item.cookTime || '',
    category: item.category || '',
    dishware: item.dishware || item.plate || item.dishwareName || '',
    status: item.status || 'draft',
    description: item.description || item.dishDescription || item.menuDescription || item.descriptionText || '',
    ingredients: normalizeIngredients(item),
    cookingMethod: item.cookingMethod || item.technology || item.preparationMethod || item.method || '',
    dishStandard: item.dishStandard || item.standard || item.qualityStandard || '',
    serving: item.serving || item.plating || item.serve || item.presentation || '',
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

export function useReferenceTtkStore() {
  const [items, setItems] = useState([])

  useEffect(() => {
    let cancelled = false

    loadItemsWithMigration().then(loadedItems => {
      if (!cancelled) {
        setItems(loadedItems)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  const persist = useCallback(updater => {
    setItems(current => {
      const next = typeof updater === 'function' ? updater(current) : updater

      writeServerItems(next).catch(error => {
        console.warn('Failed to save TTK to server. Saving local fallback.', error)
        writeLocalFallback(next)
      })

      return next
    })
  }, [])

  const saveTtk = useCallback(ttk => {
    const now = new Date().toISOString()
    const normalized = normalizeReferenceTtk(ttk)

    const clean = {
      ...normalized,
      updatedAt: now,
      ingredients: normalized.ingredients.filter(row => row.quantity || row.name),
    }

    if (clean.ingredients.length === 0) {
      clean.ingredients = [{ ...EMPTY_INGREDIENT, id: makeIngredientId() }]
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
    const source = items.find(item => item.id === id)
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
  }, [items, persist])

  return { items, saveTtk, deleteTtk, duplicateTtk }
}