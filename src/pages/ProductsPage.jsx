import { useMemo, useState } from 'react'
import { SEL_ST } from '../components/ui.jsx'
import { createEmptyProduct } from '../hooks/useProducts.js'

const SECTION = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18 }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const TEXTAREA = { width:'100%', boxSizing:'border-box', minHeight:80, border:'1.5px solid #e5e7eb', borderRadius:12, padding:12, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }
const PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }
const TH = { textAlign:'left', padding:10, background:'#f8fafc', border:'1px solid #e5e7eb', color:'#475569', fontSize:11, textTransform:'uppercase' }
const TD = { padding:10, border:'1px solid #e5e7eb', verticalAlign:'top' }

function parseCsv(text) {
  const rows = []
  let current = ''
  let row = []
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(current.trim())
      current = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(current.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      current = ''
    } else {
      current += char
    }
  }

  row.push(current.trim())
  if (row.some(Boolean)) rows.push(row)

  if (rows.length < 2) return []
  const headers = rows[0].map(header => header.trim())
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])))
}

async function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

function parseJsonImport(text) {
  const parsed = JSON.parse(text)
  if (Array.isArray(parsed)) return parsed
  if (Array.isArray(parsed.items)) return parsed.items
  if (Array.isArray(parsed.products)) return parsed.products
  if (Array.isArray(parsed.nomenclature)) return parsed.nomenclature
  return []
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function categorySegments(item) {
  const source = item.categoryPath || item.category || 'Без группы'
  return String(source).split('/').map(part => part.trim()).filter(Boolean)
}

function buildCategoryTree(items) {
  const root = {}

  items.forEach(item => {
    let node = root
    categorySegments(item).forEach(segment => {
      if (!node[segment]) node[segment] = {}
      node = node[segment]
    })
  })

  return root
}

function flattenTree(tree, depth = 0) {
  return Object.entries(tree).flatMap(([name, children]) => [
    { name, depth },
    ...flattenTree(children, depth + 1),
  ])
}

function Field({ label, children }) {
  return <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span>{children}</label>
}

function TextField({ label, value, onChange }) {
  return <Field label={label}><input value={value || ''} onChange={e => onChange(e.target.value)} style={INPUT} /></Field>
}

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || createEmptyProduct())

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ ...SECTION, display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>
          <h2 style={{ margin:'0 0 4px' }}>{initial ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <div style={{ color:'#64748b', fontSize:13 }}>Товар — это сырьё: рыба, овощи, соусы поставщика, специи, упаковка.</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button>
          <button type="submit" style={PRIMARY}>Сохранить</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:12 }}>
        <TextField label="Наименование" value={form.name} onChange={v => update('name', v)} />
        <TextField label="Ед. изм." value={form.unit} onChange={v => update('unit', v)} />
        <TextField label="Категория" value={form.category} onChange={v => update('category', v)} />
        <TextField label="Древо группы / путь категории" value={form.categoryPath} onChange={v => update('categoryPath', v)} />
      </div>

      <Field label="Комментарий">
        <textarea value={form.comment || ''} onChange={e => update('comment', e.target.value)} style={TEXTAREA} />
      </Field>
    </form>
  )
}

export function ProductsPage({ items, onSave, onDelete, onImport }) {
  const [query, setQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const tree = useMemo(() => buildCategoryTree(items), [items])
  const groups = useMemo(() => flattenTree(tree), [tree])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return items.filter(item => {
      const haystack = [item.name, item.category, item.categoryPath, item.unit, item.comment].join(' ').toLowerCase()
      const groupSource = item.categoryPath || item.category || 'Без группы'
      const matchesGroup = selectedGroup === 'all' || groupSource.includes(selectedGroup)
      return matchesGroup && (!needle || haystack.includes(needle))
    })
  }, [items, query, selectedGroup])

  function startCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function handleSave(form) {
    onSave(form)
    setShowForm(false)
    setEditing(null)
    setMessage('Товар сохранён')
  }

  async function handleImport(file) {
    if (!file) return

    try {
      const text = await fileToText(file)
      const rows = file.name.toLowerCase().endsWith('.json') ? parseJsonImport(text) : parseCsv(text)
      const count = onImport(rows)
      setMessage(`Импортировано товаров: ${count}`)
    } catch {
      setMessage('Не удалось импортировать файл. Используйте JSON или CSV.')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <section style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28, color:'#0f172a' }}>📦 Товары</h1>
          <div style={{ color:'#64748b', fontSize:14 }}>Отдельный справочник сырья. Не смешивается с полуфабрикатами.</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <label style={SEL_ST}>Импорт товаров<input type="file" accept=".json,.csv,application/json,text/csv" onChange={e => handleImport(e.target.files?.[0])} style={{ display:'none' }} /></label>
          <button type="button" onClick={() => downloadJson('klevo_products.json', items)} style={SEL_ST}>Экспорт JSON</button>
          <button type="button" onClick={startCreate} style={PRIMARY}>Добавить товар</button>
        </div>
      </section>

      <section style={{ ...SECTION, display:'grid', gridTemplateColumns:'260px 1fr', gap:14 }}>
        <aside style={{ borderRight:'1px solid #e5e7eb', paddingRight:14 }}>
          <div style={{ fontSize:13, fontWeight:900, marginBottom:10 }}>Древо групп</div>
          <button type="button" onClick={() => setSelectedGroup('all')} style={{ ...GROUP_BTN, background:selectedGroup === 'all' ? '#eef2ff' : 'transparent', color:selectedGroup === 'all' ? '#4338ca' : '#475569' }}>Все товары</button>
          {groups.map(group => (
            <button key={`${group.depth}-${group.name}`} type="button" onClick={() => setSelectedGroup(group.name)} style={{ ...GROUP_BTN, paddingLeft:10 + group.depth * 16, background:selectedGroup === group.name ? '#eef2ff' : 'transparent', color:selectedGroup === group.name ? '#4338ca' : '#475569' }}>
              {group.name}
            </button>
          ))}
        </aside>

        <div>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск товара" style={INPUT} />
        </div>
      </section>

      {message && <div style={{ ...SECTION, padding:12, color:'#475569' }}>{message}</div>}
      {showForm && <ProductForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null) }} />}

      <section style={SECTION}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin:0 }}>Товары ({filtered.length})</h2>
          <div style={{ color:'#64748b', fontSize:12 }}>localStorage key: <b>klevo_products</b></div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', color:'#94a3b8', padding:34 }}>Товары не найдены. Импортируйте CSV/JSON или добавьте вручную.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>{['Наименование', 'Ед.', 'Категория', 'Древо группы', 'Комментарий', ''].map(header => <th key={header} style={TH}>{header}</th>)}</tr>
              </thead>
              <tbody>{filtered.map(item => (
                <tr key={item.id}>
                  <td style={{ ...TD, fontWeight:900, color:'#0f172a' }}>{item.name || 'Без названия'}</td>
                  <td style={TD}>{item.unit || '—'}</td>
                  <td style={TD}>{item.category || '—'}</td>
                  <td style={TD}>{item.categoryPath || '—'}</td>
                  <td style={TD}>{item.comment || '—'}</td>
                  <td style={{ ...TD, whiteSpace:'nowrap' }}>
                    <button onClick={() => { setEditing(item); setShowForm(true) }} style={SEL_ST}>Редактировать</button>{' '}
                    <button onClick={() => onDelete(item.id)} style={{ ...SEL_ST, color:'#dc2626', borderColor:'#fecaca' }}>Удалить</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

const GROUP_BTN = {
  display:'block',
  width:'100%',
  textAlign:'left',
  border:'none',
  borderRadius:8,
  padding:'8px 10px',
  cursor:'pointer',
  fontWeight:700,
  marginBottom:2,
}