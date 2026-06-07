import { useMemo, useState } from 'react'
import { NOMENCLATURE_TYPES, createEmptyNomenclatureItem } from '../hooks/useNomenclature.js'
import { Tag, SEL_ST } from '../components/ui.jsx'

const SECTION = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18 }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const TEXTAREA = { width:'100%', boxSizing:'border-box', minHeight:84, border:'1.5px solid #e5e7eb', borderRadius:12, padding:12, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }
const PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }

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
  if (Array.isArray(parsed.nomenclature)) return parsed.nomenclature
  return []
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

function NomenclatureForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || createEmptyNomenclatureItem())

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ ...SECTION, display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
        <div>
          <h2 style={{ margin:'0 0 4px' }}>{initial ? 'Редактировать позицию' : 'Добавить позицию'}</h2>
          <div style={{ color:'#64748b', fontSize:13 }}>Позиции используются для автозаполнения строк эталонной ТТК.</div>
        </div>
        <div style={{ display:'flex', gap:8 }}><button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button><button type="submit" style={PRIMARY}>Сохранить</button></div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:12 }}>
        <TextField label="Название" value={form.name} onChange={v => update('name', v)} />
        <Field label="Тип"><select value={form.type} onChange={e => update('type', e.target.value)} style={{ ...SEL_ST, width:'100%' }}>{NOMENCLATURE_TYPES.map(type => <option key={type}>{type}</option>)}</select></Field>
        <TextField label="Категория" value={form.category} onChange={v => update('category', v)} />
        <TextField label="Путь категории" value={form.categoryPath} onChange={v => update('categoryPath', v)} />
        <TextField label="Ед. изм." value={form.unit} onChange={v => update('unit', v)} />
        <TextField label="Выход" value={form.output} onChange={v => update('output', v)} />
      </div>

      <TextAreaField label="Состав / ПФ" value={form.composition} onChange={v => update('composition', v)} />
      <TextAreaField label="Описание" value={form.description} onChange={v => update('description', v)} />
      <TextAreaField label="Технология приготовления" value={form.cookingMethod} onChange={v => update('cookingMethod', v)} />
    </form>
  )
}

export function NomenclaturePage({ items, onSave, onDelete, onImport }) {
  const [query, setQuery] = useState('')
  const [type, setType] = useState('all')
  const [editing, setEditing] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter(item => {
      const matchesType = type === 'all' || item.type === type
      const haystack = [item.name, item.type, item.category, item.categoryPath, item.unit, item.description, item.composition].join(' ').toLowerCase()
      return matchesType && (!needle || haystack.includes(needle))
    })
  }, [items, query, type])

  function startCreate() {
    setEditing(null)
    setShowForm(true)
  }

  function handleSave(form) {
    onSave(form)
    setShowForm(false)
    setEditing(null)
    setMessage('Позиция сохранена')
  }

  async function handleImport(file) {
    if (!file) return
    try {
      const text = await fileToText(file)
      const rows = file.name.toLowerCase().endsWith('.json') ? parseJsonImport(text) : parseCsv(text)
      const count = onImport(rows)
      setMessage(`Импортировано позиций: ${count}`)
    } catch {
      setMessage('Не удалось импортировать файл. Проверьте JSON формат и поля name,type,category,categoryPath,unit,description,composition,cookingMethod,output.')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <section style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28, color:'#0f172a' }}>Номенклатура</h1>
          <div style={{ color:'#64748b', fontSize:14 }}>Справочник товаров, полуфабрикатов, соусов и заготовок для быстрого заполнения ТТК. JSON: id, name, type, category, categoryPath, unit, description, composition, cookingMethod, output.</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <label style={SEL_ST}>Импорт JSON<input type="file" accept=".json,application/json" onChange={e => handleImport(e.target.files?.[0])} style={{ display:'none' }} /></label>
          <button onClick={startCreate} style={PRIMARY}>Добавить позицию</button>
        </div>
      </section>

      <section style={{ ...SECTION, display:'grid', gridTemplateColumns:'1fr 220px', gap:12 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по названию, категории, описанию" style={INPUT} />
        <select value={type} onChange={e => setType(e.target.value)} style={{ ...SEL_ST, width:'100%' }}>
          <option value="all">Все типы</option>
          {NOMENCLATURE_TYPES.map(itemType => <option key={itemType} value={itemType}>{itemType}</option>)}
        </select>
      </section>

      {message && <div style={{ ...SECTION, padding:12, color:'#475569' }}>{message}</div>}
      {showForm && <NomenclatureForm initial={editing} onSave={handleSave} onCancel={() => { setShowForm(false); setEditing(null) }} />}

      <section style={SECTION}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <h2 style={{ margin:0 }}>Позиции ({filtered.length})</h2>
          <div style={{ color:'#64748b', fontSize:12 }}>localStorage key: <b>klevo_nomenclature</b></div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', color:'#94a3b8', padding:34 }}>Позиции не найдены. Добавьте вручную или импортируйте CSV/JSON.</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead><tr>{['Название','Тип','Категория','Путь категории','Ед. изм.','Краткое описание',''].map(header => <th key={header} style={TH}>{header}</th>)}</tr></thead>
              <tbody>{filtered.map(item => <tr key={item.id}>
                <td style={{ ...TD, fontWeight:900, color:'#0f172a' }}>{item.name || 'Без названия'}</td>
                <td style={TD}><Tag color="#4f46e5" bg="#eef2ff">{item.type}</Tag></td>
                <td style={TD}>{item.category || '—'}</td>
                <td style={TD}>{item.categoryPath || '—'}</td>
                <td style={TD}>{item.unit || '—'}</td>
                <td style={TD}>{item.description || item.composition || '—'}</td>
                <td style={{ ...TD, whiteSpace:'nowrap' }}><button onClick={() => { setEditing(item); setShowForm(true) }} style={SEL_ST}>Редактировать</button> <button onClick={() => onDelete(item.id)} style={{ ...SEL_ST, color:'#dc2626', borderColor:'#fecaca' }}>Удалить</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

const TH = { textAlign:'left', padding:10, background:'#f8fafc', border:'1px solid #e5e7eb', color:'#475569', fontSize:11, textTransform:'uppercase' }
const TD = { padding:10, border:'1px solid #e5e7eb', verticalAlign:'top' }
