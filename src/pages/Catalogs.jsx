import { useMemo, useState } from 'react'
import { createEmptyProduct } from '../storage/productsStore.js'
import { SEMIFINISHED_FILTERS, SEMIFINISHED_TYPE_LABELS, createEmptySemifinished } from '../storage/semifinishedStore.js'
import { Tag, SEL_ST } from '../components/ui.jsx'

const SECTION = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18 }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const TEXTAREA = { width:'100%', boxSizing:'border-box', minHeight:84, border:'1.5px solid #e5e7eb', borderRadius:12, padding:12, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }
const PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }
const PRODUCT_FILTERS = [{ value: 'all', label: 'Все' }]

function parseCsv(text) {
  const rows = []
  let current = ''
  let row = []
  let quoted = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]
    if (char === '"' && quoted && next === '"') { current += '"'; i += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { row.push(current.trim()); current = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(current.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []; current = ''
    } else current += char
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

function parseImport(text, fileName, defaultType) {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.json')) {
    const parsed = JSON.parse(text)
    const rows = Array.isArray(parsed) ? parsed : parsed.items || parsed.nomenclature || []
    return Array.isArray(rows) ? rows.map(row => ({ type: defaultType, ...row })) : []
  }
  return parseCsv(text).map(row => ({ type: defaultType, ...row }))
}

function downloadJson(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function Field({ label, children }) {
  return <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span>{children}</label>
}

function TextField({ label, value, onChange }) {
  return <Field label={label}><input value={value || ''} onChange={e => onChange(e.target.value)} style={INPUT} /></Field>
}

function TextAreaField({ label, value, onChange }) {
  return <Field label={label}><textarea value={value || ''} onChange={e => onChange(e.target.value)} style={TEXTAREA} /></Field>
}

function fileToPayload(file) {
  return new Promise(resolve => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = () => resolve({ name:file.name, type:file.type, size:file.size, dataUrl:reader.result })
    reader.readAsDataURL(file)
  })
}

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || createEmptyProduct())
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ ...SECTION, display:'flex', flexDirection:'column', gap:12 }}>
      <h2 style={{ margin:0 }}>{initial ? 'Редактировать товар' : 'Добавить товар'}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
        <TextField label="Наименование" value={form.name} onChange={v => update('name', v)} />
        <TextField label="Ед. изм." value={form.unit} onChange={v => update('unit', v)} />
        <TextField label="Категория" value={form.category} onChange={v => update('category', v)} />
      </div>
      <TextAreaField label="Комментарий" value={form.comment || form.description} onChange={v => { update('comment', v); update('description', v) }} />
      <div style={{ display:'flex', gap:8 }}><button type="submit" style={PRIMARY}>Сохранить</button><button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button></div>
    </form>
  )
}

function SemifinishedForm({ initial, products, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || createEmptySemifinished())
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const addIngredient = product => {
    if (!product) return
    update('ingredients', [...(form.ingredients || []), { productId: product.id, name: product.name, qty:'', unit: product.unit }])
  }
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ ...SECTION, display:'flex', flexDirection:'column', gap:12 }}>
      <h2 style={{ margin:0 }}>{initial ? 'Редактировать полуфабрикат' : 'Добавить полуфабрикат'}</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
        <TextField label="Название" value={form.name} onChange={v => update('name', v)} />
        <Field label="Тип"><select value={form.type} onChange={e => update('type', e.target.value)} style={{ ...SEL_ST, width:'100%' }}><option value="semifinished">Полуфабрикат</option><option value="sauce">Соус</option><option value="prep">Заготовка</option></select></Field>
        <TextField label="Выход" value={form.output} onChange={v => update('output', v)} />
        <TextField label="Статус" value={form.status} onChange={v => update('status', v)} />
      </div>
      <Field label="Фото"><input type="file" accept="image/*" onChange={async e => update('photo', await fileToPayload(e.target.files?.[0]))} /></Field>
      <Field label="Ингредиент из товаров"><select onChange={e => { addIngredient(products.find(product => product.id === e.target.value)); e.target.value = '' }} style={{ ...SEL_ST, width:'100%' }}><option value="">Выберите товар</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} · {product.unit}</option>)}</select></Field>
      {(form.ingredients || []).length > 0 && <div style={{ display:'grid', gap:6 }}>{form.ingredients.map((row, index) => <div key={index} style={{ display:'grid', gridTemplateColumns:'1fr 100px 70px auto', gap:6 }}><input value={row.name} readOnly style={INPUT} /><input placeholder="Кол-во" value={row.qty} onChange={e => update('ingredients', form.ingredients.map((item, i) => i === index ? { ...item, qty:e.target.value } : item))} style={INPUT} /><input value={row.unit} readOnly style={INPUT} /><button type="button" onClick={() => update('ingredients', form.ingredients.filter((_, i) => i !== index))} style={SEL_ST}>×</button></div>)}</div>}
      <TextAreaField label="Состав" value={form.composition} onChange={v => update('composition', v)} />
      <TextAreaField label="Способ приготовления" value={form.cookingMethod} onChange={v => update('cookingMethod', v)} />
      <Field label="Файлы"><input type="file" multiple onChange={async e => update('files', await Promise.all(Array.from(e.target.files || []).map(fileToPayload)))} /></Field>
      <div style={{ display:'flex', gap:8 }}><button type="submit" style={PRIMARY}>Сохранить</button><button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button></div>
    </form>
  )
}

export function CatalogPage({ mode, items, products = [], onSave, onDelete, onImport }) {
  const isProducts = mode === 'products'
  const filters = isProducts ? PRODUCT_FILTERS : SEMIFINISHED_FILTERS
  const title = isProducts ? '📦 Товары' : '🥣 Полуфабрикаты'
  const subtitle = isProducts ? 'Справочник товарной номенклатуры для составления полуфабрикатов.' : 'Справочник полуфабрикатов, соусов и заготовок для эталонных ТТК.'
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter(item => {
      const matchesType = isProducts || type === 'all' || item.type === type
      const haystack = [item.name, item.category, item.categoryPath, item.unit, item.comment, item.description, item.composition, item.cookingMethod].join(' ').toLowerCase()
      return matchesType && (!needle || haystack.includes(needle))
    })
  }, [items, isProducts, query, type])

  async function handleImport(file) {
    if (!file) return
    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
      setMessage('Excel-файл выбран. На этом этапе сохраните его как CSV и импортируйте CSV, либо импортируйте JSON-резервную копию.')
      return
    }
    try {
      const rows = parseImport(await fileToText(file), file.name, isProducts ? 'product' : 'semifinished')
      const count = onImport(rows)
      setMessage(`Импортировано: ${count}`)
    } catch {
      setMessage('Не удалось импортировать файл. Используйте CSV или JSON.')
    }
  }

  function save(form) {
    onSave(form)
    setEditing(null)
    setShowForm(false)
    setMessage('Сохранено')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <section style={{ ...SECTION, display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
        <div><h1 style={{ margin:'0 0 6px', fontSize:28 }}>{title}</h1><div style={{ color:'#64748b' }}>{subtitle}</div></div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <label style={SEL_ST}>Импорт CSV<input type="file" accept=".csv,text/csv" onChange={e => handleImport(e.target.files?.[0])} style={{ display:'none' }} /></label>
          <label style={SEL_ST}>Импорт Excel<input type="file" accept=".xls,.xlsx" onChange={e => handleImport(e.target.files?.[0])} style={{ display:'none' }} /></label>
          <button onClick={() => downloadJson(`${isProducts ? 'products' : 'semifinished'}.json`, visible)} style={SEL_ST}>Экспорт</button>
          <button onClick={() => { setEditing(null); setShowForm(true) }} style={PRIMARY}>{isProducts ? 'Добавить товар' : 'Добавить полуфабрикат'}</button>
        </div>
      </section>
      <section style={{ ...SECTION, display:'grid', gridTemplateColumns:'1fr 220px', gap:12 }}><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск" style={INPUT} /><select value={type} onChange={e => setType(e.target.value)} style={{ ...SEL_ST, width:'100%' }}>{filters.map(filter => <option key={filter.value} value={filter.value}>{filter.label}</option>)}</select></section>
      {message && <section style={{ ...SECTION, padding:12 }}>{message}</section>}
      {showForm && (isProducts ? <ProductForm initial={editing} onSave={save} onCancel={() => setShowForm(false)} /> : <SemifinishedForm initial={editing} products={products} onSave={save} onCancel={() => setShowForm(false)} />)}
      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Позиции ({visible.length})</h2>
        {visible.length === 0 ? <div style={{ color:'#94a3b8', textAlign:'center', padding:28 }}>Пока нет данных</div> : <div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}><thead><tr>{(isProducts ? ['Наименование','Ед. изм.','Категория','Комментарий',''] : ['Название','Тип','Выход','Состав','Статус','']).map(header => <th key={header} style={TH}>{header}</th>)}</tr></thead><tbody>{visible.map(item => <tr key={item.id}>{isProducts ? <><td style={TD}><b>{item.name}</b></td><td style={TD}>{item.unit}</td><td style={TD}>{item.category || '—'}</td><td style={TD}>{item.comment || item.description || '—'}</td></> : <><td style={TD}><b>{item.name}</b></td><td style={TD}><Tag color="#4f46e5" bg="#eef2ff">{SEMIFINISHED_TYPE_LABELS[item.type]}</Tag></td><td style={TD}>{item.output || '—'}</td><td style={TD}>{item.composition || '—'}</td><td style={TD}>{item.status || 'draft'}</td></>}<td style={{ ...TD, whiteSpace:'nowrap' }}><button onClick={() => { setEditing(item); setShowForm(true) }} style={SEL_ST}>Редактировать</button> <button onClick={() => onDelete(item.id)} style={{ ...SEL_ST, color:'#dc2626', borderColor:'#fecaca' }}>Удалить</button></td></tr>)}</tbody></table></div>}
      </section>
    </div>
  )
}

const TH = { textAlign:'left', padding:10, background:'#f8fafc', border:'1px solid #e5e7eb', color:'#475569', fontSize:11, textTransform:'uppercase' }
const TD = { padding:10, border:'1px solid #e5e7eb', verticalAlign:'top' }
