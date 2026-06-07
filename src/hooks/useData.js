import { useState, useEffect } from 'react'

function normalizeDish(row) {
  if (!Array.isArray(row)) return row
  const [id, restaurant, name, ttk, date, category, station, output, errorBits = 0, isShared = 0, hasErrorsRaw = 0, pfCount = 0, pfRaw = '', qcG = null] = row
  const pfList = typeof pfRaw === 'string' && pfRaw.trim()
    ? pfRaw.split(/[;,]/).map(x => x.trim()).filter(Boolean)
    : []

  return {
    id: String(id ?? `${restaurant}_${ttk}_${name}`),
    restaurant: restaurant || '—',
    name: name || 'Без названия',
    ttk: String(ttk ?? ''),
    ttk_num: String(ttk ?? ''),
    date: date || '',
    category: category || 'Прочее',
    station: station || 'Горячий цех',
    output: Number(output) || 0,
    errorBits: Number(errorBits) || 0,
    hasErrors: Boolean(Number(hasErrorsRaw) || Number(errorBits)),
    isShared: Boolean(Number(isShared)),
    pfCount: Number(pfCount) || pfList.length,
    pfList,
    qcG: qcG === null || qcG === '' ? null : Number(qcG),
    raw: row,
  }
}

export function useData() {
  const [dishes, setDishes] = useState([])
  const [pf, setPf] = useState([])
  const [disc, setDisc] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/data/dishes.json').then(r => {
        if (!r.ok) throw new Error(`Не найден dishes.json: ${r.status}`)
        return r.json()
      }),
      fetch('/data/pf.json').then(r => {
        if (!r.ok) throw new Error(`Не найден pf.json: ${r.status}`)
        return r.json()
      }),
      fetch('/data/discrepancies.json').then(r => {
        if (!r.ok) throw new Error(`Не найден discrepancies.json: ${r.status}`)
        return r.json()
      }),
    ])
      .then(([dishData, pfData, discData]) => {
        setDishes(Array.isArray(dishData) ? dishData.map(normalizeDish) : [])
        setPf(Array.isArray(pfData) ? pfData : [])
        setDisc(Array.isArray(discData) ? discData : [])
        setLoading(false)
      })
      .catch(e => {
        setError(e.message)
        setLoading(false)
      })
  }, [])

  return { dishes, pf, disc, loading, error }
}

// Совместимость со старым именем хука
export const useIndex = useData
