import { useCallback, useEffect, useState } from 'react'

export const TTK_GROUPS_STORAGE_KEY = 'klevo_ttk_groups'
export const SYSTEM_UNGROUPED_GROUP_ID = 'ungrouped'

const nowIso = () => new Date().toISOString()
const makeGroupId = () => `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

const DEFAULT_GROUPS = [
  { id: 'salads', parentId: null, title: '🥗 Салаты', order: 10, expanded: true },
  { id: 'warm-salads', parentId: 'salads', title: 'Тёплые салаты', order: 11, expanded: true },
  { id: 'cold-salads', parentId: 'salads', title: 'Холодные салаты', order: 12, expanded: true },
  { id: 'snacks', parentId: null, title: '🍤 Закуски', order: 20, expanded: true },
  { id: 'rolls', parentId: null, title: '🍣 Роллы', order: 30, expanded: true },
  { id: 'hot', parentId: null, title: '🐟 Горячие блюда', order: 40, expanded: true },
  { id: 'soups', parentId: null, title: '🍲 Супы', order: 50, expanded: true },
  { id: 'desserts', parentId: null, title: '🍰 Десерты', order: 60, expanded: true },
  { id: 'sauces', parentId: null, title: '🥫 Соусы', order: 70, expanded: true },
  { id: 'semifinished', parentId: null, title: '🥬 Полуфабрикаты', order: 80, expanded: true },
  { id: 'prep', parentId: null, title: '📦 Заготовки', order: 90, expanded: true },
]

export function createSystemUngroupedGroup() {
  const now = nowIso()
  return {
    id: SYSTEM_UNGROUPED_GROUP_ID,
    parentId: null,
    title: '📂 Без группы',
    order: 100000,
    expanded: true,
    system: true,
    createdAt: now,
    updatedAt: now,
  }
}

export function normalizeTtkGroup(item = {}) {
  const now = nowIso()
  const isSystem = item.id === SYSTEM_UNGROUPED_GROUP_ID || item.system === true
  return {
    id: item.id || makeGroupId(),
    parentId: isSystem ? null : item.parentId || null,
    title: isSystem ? '📂 Без группы' : item.title || 'Новая группа',
    order: Number.isFinite(Number(item.order)) ? Number(item.order) : Date.now(),
    expanded: item.expanded !== false,
    system: isSystem,
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

function seedGroups() {
  const now = nowIso()
  return [
    ...DEFAULT_GROUPS.map(group => normalizeTtkGroup({ ...group, createdAt: now, updatedAt: now })),
    createSystemUngroupedGroup(),
  ]
}

function ensureSystemGroup(items) {
  const normalized = (Array.isArray(items) ? items : []).map(normalizeTtkGroup)
  return normalized.some(item => item.id === SYSTEM_UNGROUPED_GROUP_ID)
    ? normalized.map(item => item.id === SYSTEM_UNGROUPED_GROUP_ID ? createSystemUngroupedGroup() : item)
    : [...normalized, createSystemUngroupedGroup()]
}

function readGroups() {
  try {
    const raw = localStorage.getItem(TTK_GROUPS_STORAGE_KEY)
    if (!raw) return seedGroups()
    const parsed = JSON.parse(raw)
    return ensureSystemGroup(parsed)
  } catch {
    return seedGroups()
  }
}

function writeGroups(items) {
  localStorage.setItem(TTK_GROUPS_STORAGE_KEY, JSON.stringify(ensureSystemGroup(items)))
}

function wouldCreateCycle(groups, groupId, parentId) {
  if (!parentId || groupId === parentId) return groupId === parentId
  let current = groups.find(group => group.id === parentId)
  while (current) {
    if (current.parentId === groupId) return true
    current = groups.find(group => group.id === current.parentId)
  }
  return false
}

export function useTtkGroupsStore() {
  const [items, setItems] = useState([])

  useEffect(() => setItems(readGroups()), [])

  const persist = useCallback(updater => {
    setItems(current => {
      const next = ensureSystemGroup(typeof updater === 'function' ? updater(current) : updater)
      writeGroups(next)
      return next
    })
  }, [])

  const createGroup = useCallback((parentId = null, title = 'Новая группа') => {
    const now = nowIso()
    const group = normalizeTtkGroup({ id: makeGroupId(), parentId, title, order: Date.now(), expanded: true, createdAt: now, updatedAt: now })
    persist(current => [...current, group])
    return group
  }, [persist])

  const updateGroup = useCallback((id, patch) => {
    persist(current => current.map(group => {
      if (group.id !== id || group.system) return group
      const nextParentId = patch.parentId !== undefined ? patch.parentId : group.parentId
      return normalizeTtkGroup({ ...group, ...patch, parentId: wouldCreateCycle(current, id, nextParentId) ? group.parentId : nextParentId, updatedAt: nowIso() })
    }))
  }, [persist])

  const toggleExpanded = useCallback(id => {
    persist(current => current.map(group => group.id === id ? { ...group, expanded: !group.expanded, updatedAt: nowIso() } : group))
  }, [persist])

  const moveGroup = useCallback((id, parentId = null, order = Date.now()) => {
    updateGroup(id, { parentId, order })
  }, [updateGroup])

  const duplicateGroup = useCallback(id => {
    const source = items.find(group => group.id === id)
    if (!source || source.system) return null
    return createGroup(source.parentId, `${source.title} — копия`)
  }, [createGroup, items])

  const deleteGroup = useCallback(id => {
    const target = items.find(group => group.id === id)
    if (!target || target.system) return null
    persist(current => current
      .filter(group => group.id !== id)
      .map(group => group.parentId === id ? { ...group, parentId: SYSTEM_UNGROUPED_GROUP_ID, updatedAt: nowIso() } : group))
    return SYSTEM_UNGROUPED_GROUP_ID
  }, [items, persist])

  const replaceItems = useCallback(nextItems => persist(nextItems), [persist])

  return { items, createGroup, updateGroup, toggleExpanded, moveGroup, duplicateGroup, deleteGroup, replaceItems }
}
