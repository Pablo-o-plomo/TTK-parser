import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { createEmptyReferenceTtk } from '../hooks/useReferenceTtk.js'
import { NOMENCLATURE_TYPE_LABELS } from '../hooks/useNomenclature.js'

const STATUS_LABELS = {
  draft: 'Черновик',
  approved: 'Готова к печати',
}

const STATUS_COLORS = {
  draft: '#64748b',
  approved: '#16a34a',
}

const TYPE_LABELS = {
  product: 'Товар',
  semifinished: 'П/Ф',
  sauce: 'Соус',
  prep: 'Заготовка',
  nomenclature: 'Номенклатура',
}

const TYPE_BADGE = {
  product: { label: 'Товар', bg:'#eff6ff', color:'#2563eb' },
  semifinished: { label: 'П/Ф', bg:'#f0fdf4', color:'#16a34a' },
  sauce: { label: 'Соус', bg:'#fffbeb', color:'#d97706' },
  prep: { label: 'Заготовка', bg:'#faf5ff', color:'#9333ea' },
  nomenclature: { label: 'Номенклатура', bg:'#f8fafc', color:'#475569' },
}

const SECTION = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18 }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const TEXTAREA = {
  width:'100%',
  boxSizing:'border-box',
  minHeight:120,
  border:'1.5px solid #e5e7eb',
  borderRadius:12,
  padding:12,
  fontSize:13,
  outline:'none',
  resize:'vertical',
  fontFamily:'inherit',
  lineHeight:1.45,
}
const PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }
const EMPTY_ROW = { name: '', type: 'product', qty: '', semifinished: '', description: '' }

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU')
}

function fileToPayload(file) {
  return new Promise(resolve => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = () => resolve({ name:file.name, type:file.type, size:file.size, dataUrl:reader.result })
    reader.readAsDataURL(file)
  })
}

function downloadBlob(name, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeRow(row = {}) {
  return {
    ...EMPTY_ROW,
    ...row,
    name: row.name || row.title || '',
    type: row.type || row.source || (row.semifinished ? 'semifinished' : 'product'),
    qty: row.qty || row.quantity || row.amount || '',
  }
}

function normalizeTtk(ttk = {}) {
  return {
    ...ttk,
    rows: (ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map(normalizeRow),
    technology: ttk.technology || ttk.cookingMethod || ttk.description || '',
    serving: ttk.serving || ttk.presentation || '',
  }
}

function getTypeBadge(type) {
  return TYPE_BADGE[type] || TYPE_BADGE.nomenclature
}

function makePrintableHtml(sourceTtk) {
  const ttk = normalizeTtk(sourceTtk)
  const rows = ttk.rows?.length ? ttk.rows : [EMPTY_ROW]

  const rowsHtml = rows.map(row => {
    const badge = getTypeBadge(row.type)

    return `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td><span class="type-badge" style="background:${badge.bg};color:${badge.color};border-color:${badge.color}">${escapeHtml(badge.label)}</span></td>
        <td>${escapeHtml(row.qty)}</td>
      </tr>
    `
  }).join('')

  const photoHtml = ttk.photo?.dataUrl
    ? `<img class="dish-photo" src="${ttk.photo.dataUrl}" alt="${escapeHtml(ttk.title)}">`
    : '<div class="photo-placeholder">Фото блюда</div>'

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${escapeHtml(ttk.title || 'Карточка блюда')}</title>
<style>
  @page{size:A4;margin:10mm}
  *{box-sizing:border-box}
  body{margin:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#111827}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:10mm 11mm;display:flex;flex-direction:column;gap:6mm}
  h1{margin:0;text-align:center;font-size:23px;line-height:1.15;text-transform:uppercase;letter-spacing:.02em}
  .photo-wrap{width:100%;height:82mm;border:1.5px solid #111827;overflow:hidden}
  .dish-photo{width:100%;height:100%;object-fit:cover;display:block}
  .photo-placeholder{height:100%;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:18px;background:#f9fafb}
  .meta{display:flex;justify-content:space-between;gap:12px;font-size:14px;font-weight:800}
  .meta span{border:1.5px solid #111827;padding:7px 10px;min-width:145px}
  h2{margin:0 0 5px;font-size:13px;text-transform:uppercase;letter-spacing:.08em}
  table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;line-height:1.25}
  th,td{border:1.5px solid #111827;padding:6px 7px;vertical-align:middle;word-break:break-word}
  th{background:#f3f4f6;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
  th:nth-child(1),td:nth-child(1){width:58%;font-weight:800}
  th:nth-child(2),td:nth-child(2){width:18%;text-align:center}
  th:nth-child(3),td:nth-child(3){width:24%;text-align:center;font-weight:800}
  .type-badge{display:inline-block;border:1px solid;border-radius:999px;padding:3px 8px;font-size:10px;font-weight:900;text-transform:uppercase}
  .text-block{border:1.5px solid #111827;padding:8px 10px;min-height:22mm;font-size:12.5px;line-height:1.45;white-space:pre-wrap}
  .date{margin-top:auto;text-align:right;font-size:10px;color:#6b7280}
  @media print{body{background:#fff}.page{margin:0;width:auto;min-height:0;box-shadow:none}}
</style>
</head>
<body>
<main class="page">
  <h1>${escapeHtml(ttk.title || 'Название блюда')}</h1>
  <div class="photo-wrap">${photoHtml}</div>
  <div class="meta">
    <span>Выход: ${escapeHtml(ttk.output || '—')}</span>
    <span>Сборка: ${escapeHtml(ttk.assemblyTime || ttk.time || '—')}</span>
  </div>

  <section>
    <h2>Состав блюда</h2>
    <table>
      <thead>
        <tr>
          <th>Наименование</th>
          <th>Тип</th>
          <th>Кол-во</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </section>

  <section>
    <h2>Технология приготовления</h2>
    <div class="text-block">${escapeHtml(ttk.technology || '—')}</div>
  </section>

  <section>
    <h2>Подача / критические точки</h2>
    <div class="text-block">${escapeHtml(ttk.serving || '—')}</div>
  </section>

  <div class="date">Обновлено: ${escapeHtml(formatDate(ttk.updatedAt))}</div>
</main>
</body>
</html>`
}

function TtkStatus({ status }) {
  return <Tag color={STATUS_COLORS[status] || '#64748b'}>{STATUS_LABELS[status] || status}</Tag>
}

function Photo({ file, label }) {
  return (
    <div style={{ background:'#f8fafc', border:'1px dashed #cbd5e1', borderRadius:14, minHeight:150, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      {file?.dataUrl ? (
        <img src={file.dataUrl} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
      ) : (
        <span style={{ color:'#94a3b8', fontSize:13 }}>{label}</span>
      )}
    </div>
  )
}

export function ReferenceTtkList({ items, onOpen, onEdit, onCreate, onDownload }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28, color:'#0f172a' }}>Карточки блюд</h1>
          <div style={{ color:'#64748b', fontSize:14 }}>Короткие печатные карточки A4 для кухни: фото, состав, технология и подача.</div>
        </div>
        <button onClick={onCreate} style={PRIMARY}>Создать карточку</button>
      </div>

      {items.length === 0 ? (
        <div style={{ ...SECTION, textAlign:'center', padding:44 }}>
          <div style={{ fontSize:46 }}>📄</div>
          <h2 style={{ margin:'8px 0', color:'#0f172a' }}>Пока нет карточек блюд</h2>
          <p style={{ color:'#64748b' }}>Создайте первую карточку: название, фото, состав блюда, технология приготовления и подача.</p>
          <button onClick={onCreate} style={PRIMARY}>Создать первую карточку</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {items.map(rawItem => {
            const item = normalizeTtk(rawItem)

            return (
              <div key={item.id} style={{ ...SECTION, padding:0, overflow:'hidden' }}>
                <div style={{ height:180, background:'#f8fafc' }}>
                  <Photo file={item.photo} label="Фото блюда" />
                </div>
                <div style={{ padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}>
                    <h3 style={{ margin:'0 0 6px', fontSize:18, color:'#0f172a' }}>{item.title || 'Без названия'}</h3>
                    <TtkStatus status={item.status} />
                  </div>
                  <div style={{ color:'#64748b', fontSize:12, lineHeight:1.7 }}>
                    Выход: {item.output || '—'}<br />
                    Строк: {item.rows?.length || 0} · обновлено {formatDate(item.updatedAt)}
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}>
                    <button onClick={() => onOpen(item)} style={SEL_ST}>Открыть</button>
                    <button onClick={() => onEdit(item)} style={SEL_ST}>Редактировать</button>
                    <button onClick={() => onDownload(item)} style={SEL_ST}>Скачать JSON</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FileInput({ label, accept, value, onChange }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span>
      <input type="file" accept={accept} onChange={async e => onChange(await fileToPayload(e.target.files?.[0]))} style={{ fontSize:12 }} />
      {value?.name && <span style={{ fontSize:11, color:'#64748b' }}>Загружено: {value.name}</span>}
    </label>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span>
      <input value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={INPUT} />
    </label>
  )
}

function TextAreaField({ label, value, onChange, placeholder }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span>
      <textarea value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={TEXTAREA} />
    </label>
  )
}

function inferType(item) {
  if (!item) return 'product'
  if (item.source === 'semifinished') return 'semifinished'
  if (item.source === 'product') return 'product'
  if (item.type) return item.type
  if (item.composition || item.cookingMethod) return 'semifinished'
  return 'product'
}

export function ReferenceTtkForm({ initial, nomenclature = [], onSaveNomenclatureItem, onCancel, onSave }) {
  const [form, setForm] = useState(() => normalizeTtk(initial || createEmptyReferenceTtk()))

  const nomenclatureByName = useMemo(() => {
    return new Map(
      nomenclature
        .filter(item => item.name || item.title)
        .map(item => [String(item.name || item.title).trim().toLowerCase(), item]),
    )
  }, [nomenclature])

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function updateRow(index, field, value) {
    setForm(current => ({
      ...current,
      rows: current.rows.map((row, i) => i === index ? { ...row, [field]: value } : row),
    }))
  }

  function selectNomenclature(index, name) {
    const item = nomenclatureByName.get(name.trim().toLowerCase())

    if (!item) {
      updateRow(index, 'name', name)
      return
    }

    setForm(current => ({
      ...current,
      rows: current.rows.map((row, i) => i === index ? {
        ...row,
        name: item.name || item.title,
        type: inferType(item),
      } : row),
    }))
  }

  function addRowToNomenclature(row) {
    if (!row.name?.trim() || !onSaveNomenclatureItem) return

    const unit = row.qty?.replace(/[0-9.,\s]/g, '').trim() || 'г'

    onSaveNomenclatureItem({
      name: row.name.trim(),
      type: row.type || 'product',
      category: '',
      unit,
      description: '',
      composition: '',
      cookingMethod: '',
      output: row.qty || '',
    })
  }

  function saveForm() {
    onSave(normalizeTtk(form))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); saveForm() }} style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28 }}>Создать карточку блюда</h1>
          <div style={{ color:'#64748b', fontSize:14 }}>Фото, состав блюда, технология приготовления и подача. Без брутто/нетто.</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button>
          <button type="submit" style={PRIMARY}>Сохранить</button>
        </div>
      </div>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Основное</h2>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 180px', gap:12 }}>
          <TextField label="Название блюда" value={form.title} onChange={v => update('title', v)} />
          <TextField label="Выход" value={form.output} onChange={v => update('output', v)} placeholder="287 г" />
          <TextField label="Время сборки" value={form.assemblyTime || form.time || ''} onChange={v => update('assemblyTime', v)} placeholder="2 мин" />
          <label style={FIELD}>
            <span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>Статус</span>
            <select value={form.status} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width:'100%' }}>
              <option value="draft">Черновик</option>
              <option value="approved">Готова к печати</option>
            </select>
          </label>
        </div>
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Фото блюда</h2>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(240px,420px) 1fr', gap:16, alignItems:'center' }}>
          <Photo file={form.photo} label="Большое фото подачи блюда" />
          <FileInput label="Загрузить фото блюда" accept="image/*" value={form.photo} onChange={v => update('photo', v)} />
        </div>
      </section>

      <section style={SECTION}>
        <datalist id="nomenclature-options">
          {nomenclature.map(item => {
            const type = inferType(item)
            const label = TYPE_LABELS[type] || NOMENCLATURE_TYPE_LABELS?.[type] || type
            return (
              <option key={item.id || item.name} value={item.name || item.title}>
                {label} · {item.unit || 'г'}
              </option>
            )
          })}
        </datalist>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:12 }}>
          <div>
            <h2 style={{ margin:'0 0 4px' }}>Состав блюда</h2>
            <div style={{ color:'#64748b', fontSize:13 }}>Только три колонки: наименование, тип и количество. Технологию вставляем отдельным текстом ниже.</div>
          </div>
          <button type="button" onClick={() => update('rows', [...(form.rows || []), { ...EMPTY_ROW }])} style={PRIMARY}>Добавить строку</button>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead>
              <tr>
                {['Наименование', 'Тип', 'Кол-во', ''].map(h => (
                  <th key={h} style={{ textAlign:'left', padding:8, background:'#f8fafc', border:'1px solid #e5e7eb' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(form.rows || []).map((row, index) => {
                const cleanRow = normalizeRow(row)
                const item = nomenclatureByName.get(cleanRow.name?.trim().toLowerCase())
                const unit = item?.unit || 'г'
                const badge = getTypeBadge(cleanRow.type)

                return (
                  <tr key={index}>
                    <td style={{ ...TD, width:'55%' }}>
                      <input
                        list="nomenclature-options"
                        placeholder="Киноа отварная п/ф"
                        value={cleanRow.name}
                        onChange={e => selectNomenclature(index, e.target.value)}
                        style={INPUT}
                      />
                      {cleanRow.name && !nomenclatureByName.has(cleanRow.name.trim().toLowerCase()) && (
                        <button type="button" onClick={() => addRowToNomenclature(cleanRow)} style={{ ...SEL_ST, marginTop:6, fontSize:11 }}>
                          Добавить в номенклатуру
                        </button>
                      )}
                    </td>
                    <td style={{ ...TD, width:'18%' }}>
                      <select value={cleanRow.type} onChange={e => updateRow(index, 'type', e.target.value)} style={{ ...SEL_ST, width:'100%', background:badge.bg, color:badge.color, fontWeight:900 }}>
                        <option value="product">Товар</option>
                        <option value="semifinished">П/Ф</option>
                        <option value="sauce">Соус</option>
                        <option value="prep">Заготовка</option>
                      </select>
                    </td>
                    <td style={{ ...TD, width:'20%' }}>
                      <input
                        placeholder={`80 ${unit}`}
                        value={cleanRow.qty}
                        onChange={e => updateRow(index, 'qty', e.target.value)}
                        style={INPUT}
                      />
                    </td>
                    <td style={{ ...TD, width:'7%' }}>
                      <button type="button" onClick={() => update('rows', form.rows.filter((_, i) => i !== index))} style={SEL_ST}>×</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Технология приготовления</h2>
        <TextAreaField
          label="Текст для повара"
          value={form.technology}
          onChange={v => update('technology', v)}
          placeholder="В салатную миску выложить киноа, добавить томаты и хрустящие баклажаны. Полить заправкой, аккуратно перемешать. Выложить на тарелку."
        />
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Подача / критические точки</h2>
        <TextAreaField
          label="Подача"
          value={form.serving}
          onChange={v => update('serving', v)}
          placeholder="Подавать сразу после приготовления. Баклажаны должны сохранить хрустящую текстуру. Соус не должен скапливаться на дне тарелки."
        />
      </section>
    </form>
  )
}

const TD = { padding:6, border:'1px solid #e5e7eb', verticalAlign:'top' }

export function ReferenceTtkView({ ttk: rawTtk, onBack, onEdit, onDuplicate, onDelete }) {
  const ttk = normalizeTtk(rawTtk)
  const html = useMemo(() => makePrintableHtml(ttk), [ttk])

  if (!ttk) return null

  function downloadJson() {
    downloadBlob(`${ttk.title || 'dish-card'}.json`, JSON.stringify(ttk, null, 2), 'application/json')
  }

  function printTtk() {
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...SECTION, display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
        <div>
          <button onClick={onBack} style={{ ...SEL_ST, marginBottom:12 }}>← Карточки блюд</button>
          <div><TtkStatus status={ttk.status} /></div>
          <h1 style={{ margin:'10px 0 6px', fontSize:28, color:'#0f172a' }}>{ttk.title || 'Без названия'}</h1>
          <div style={{ color:'#64748b' }}>
            Выход: {ttk.output || '—'} · сборка: {ttk.assemblyTime || ttk.time || '—'} · строк: {ttk.rows?.length || 0} · обновлено {formatDate(ttk.updatedAt)}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button onClick={onEdit} style={PRIMARY}>Редактировать</button>
          <button onClick={printTtk} style={SEL_ST}>Скачать / Печать</button>
          <button onClick={downloadJson} style={SEL_ST}>Скачать JSON</button>
          <button onClick={onDuplicate} style={SEL_ST}>Дублировать</button>
          <button onClick={onDelete} style={{ ...SEL_ST, color:'#dc2626', borderColor:'#fecaca' }}>Удалить</button>
        </div>
      </div>

      <div style={{ display:'flex', justifyContent:'center', overflow:'auto', padding:'16px 0 32px' }}>
        <PrintablePage ttk={ttk} />
      </div>
    </div>
  )
}

function PrintablePage({ ttk: rawTtk }) {
  const ttk = normalizeTtk(rawTtk)

  return (
    <article style={{ width:'210mm', minHeight:'297mm', background:'#fff', boxShadow:'0 24px 70px rgba(15,23,42,.16)', padding:'10mm 11mm', display:'flex', flexDirection:'column', gap:'6mm' }}>
      <h1 style={{ margin:0, textAlign:'center', fontSize:23, lineHeight:1.15, textTransform:'uppercase', letterSpacing:'.02em', color:'#111827' }}>
        {ttk.title || 'Название блюда'}
      </h1>

      <div style={{ width:'100%', height:'82mm', border:'1.5px solid #111827', overflow:'hidden' }}>
        {ttk.photo?.dataUrl ? (
          <img src={ttk.photo.dataUrl} alt={ttk.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        ) : (
          <div style={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', background:'#f9fafb', fontSize:18 }}>
            Фото блюда
          </div>
        )}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', gap:12, fontSize:14, fontWeight:900 }}>
        <div style={META_BOX}>Выход: {ttk.output || '—'}</div>
        <div style={META_BOX}>Сборка: {ttk.assemblyTime || ttk.time || '—'}</div>
      </div>

      <section>
        <h2 style={PRINT_H2}>Состав блюда</h2>
        <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', fontSize:12, lineHeight:1.25 }}>
          <thead>
            <tr>
              <th style={{ ...PRINT_TH, width:'58%' }}>Наименование</th>
              <th style={{ ...PRINT_TH, width:'18%', textAlign:'center' }}>Тип</th>
              <th style={{ ...PRINT_TH, width:'24%', textAlign:'center' }}>Кол-во</th>
            </tr>
          </thead>
          <tbody>
            {(ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map((row, index) => {
              const cleanRow = normalizeRow(row)
              const badge = getTypeBadge(cleanRow.type)

              return (
                <tr key={index}>
                  <td style={{ ...PRINT_TD, fontWeight:800 }}>{cleanRow.name}</td>
                  <td style={{ ...PRINT_TD, textAlign:'center' }}>
                    <span style={{
                      display:'inline-block',
                      border:`1px solid ${badge.color}`,
                      borderRadius:999,
                      padding:'3px 8px',
                      fontSize:10,
                      fontWeight:900,
                      textTransform:'uppercase',
                      background:badge.bg,
                      color:badge.color,
                    }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={{ ...PRINT_TD, textAlign:'center', fontWeight:900 }}>{cleanRow.qty}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      <section>
        <h2 style={PRINT_H2}>Технология приготовления</h2>
        <div style={PRINT_TEXT_BLOCK}>{ttk.technology || '—'}</div>
      </section>

      <section>
        <h2 style={PRINT_H2}>Подача / критические точки</h2>
        <div style={PRINT_TEXT_BLOCK}>{ttk.serving || '—'}</div>
      </section>

      <div style={{ marginTop:'auto', textAlign:'right', fontSize:10, color:'#6b7280' }}>
        Обновлено: {formatDate(ttk.updatedAt)}
      </div>
    </article>
  )
}

const META_BOX = {
  border:'1.5px solid #111827',
  padding:'7px 10px',
  minWidth:145,
}

const PRINT_H2 = {
  margin:'0 0 5px',
  fontSize:13,
  textTransform:'uppercase',
  letterSpacing:'.08em',
  color:'#111827',
}

const PRINT_TH = {
  border:'1.5px solid #111827',
  padding:'6px 7px',
  verticalAlign:'top',
  wordBreak:'break-word',
  background:'#f3f4f6',
  textAlign:'left',
  fontSize:11,
  textTransform:'uppercase',
  letterSpacing:'.03em',
}

const PRINT_TD = {
  border:'1.5px solid #111827',
  padding:'6px 7px',
  verticalAlign:'middle',
  wordBreak:'break-word',
}

const PRINT_TEXT_BLOCK = {
  border:'1.5px solid #111827',
  padding:'8px 10px',
  minHeight:'22mm',
  fontSize:12.5,
  lineHeight:1.45,
  whiteSpace:'pre-wrap',
}