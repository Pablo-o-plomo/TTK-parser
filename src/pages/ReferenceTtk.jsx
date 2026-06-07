import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { createEmptyReferenceTtk } from '../hooks/useReferenceTtk.js'
import { NOMENCLATURE_TYPE_LABELS } from '../hooks/useNomenclature.js'

const STATUS_LABELS = { draft: 'Черновик', in_progress: 'В работе', standard: 'Эталон', approved: 'Эталон' }
const STATUS_COLORS = { draft: '#64748b', in_progress: '#d97706', standard: '#16a34a', approved: '#16a34a' }
const SECTION = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18 }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const TEXTAREA = { width:'100%', boxSizing:'border-box', minHeight:100, border:'1.5px solid #e5e7eb', borderRadius:12, padding:12, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }
const PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }
const EMPTY_ROW = { qty: '', name: '', semifinished: '', description: '', itemId: '', itemType: '' }
const DETAIL_TYPES = ['semifinished', 'sauce', 'prep']

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
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

function makePrintableHtml(ttk) {
  const rowsHtml = (ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map(row => `<tr><td>${escapeHtml(row.qty)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.semifinished)}</td><td>${escapeHtml(row.description)}</td></tr>`).join('')
  const photoHtml = ttk.photos?.main?.dataUrl ? `<img class="dish-photo" src="${ttk.photos.main.dataUrl}" alt="${escapeHtml(ttk.title)}">` : '<div class="photo-placeholder">Фото блюда</div>'
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(ttk.title || 'Эталонная ТТК')}</title><style>@page{size:A4;margin:8mm}*{box-sizing:border-box}body{margin:0;background:#fff;font-family:Arial,Helvetica,sans-serif;color:#111827}.page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:9mm;display:flex;flex-direction:column;gap:5mm}h1{margin:0;text-align:center;font-size:20px;line-height:1.1;text-transform:uppercase}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;font-size:10px}.meta div,.box{border:1px solid #111827;padding:4px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10.5px;line-height:1.2}th,td{border:1px solid #111827;padding:4px 5px;vertical-align:top;word-break:break-word}th{background:#f3f4f6;text-align:center;text-transform:uppercase;font-size:9px}.text{font-size:10px;line-height:1.25;white-space:pre-wrap}.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}.dish-photo{width:100%;height:58mm;object-fit:cover;border:1px solid #111827;display:block}.photo-placeholder{height:58mm;border:1px dashed #9ca3af;display:flex;align-items:center;justify-content:center;color:#6b7280}@media print{body{background:#fff}.page{margin:0;width:auto;min-height:0}}</style></head><body><main class="page"><h1>${escapeHtml(ttk.title || 'Название блюда')}</h1><div class="meta"><div><b>Код</b><br>${escapeHtml(ttk.ttkCode || '—')}</div><div><b>Категория</b><br>${escapeHtml(ttk.category || '—')}</div><div><b>Цех</b><br>${escapeHtml(ttk.station || '—')}</div><div><b>Выход</b><br>${escapeHtml(ttk.output || '—')}</div></div>${photoHtml}<table><thead><tr><th style="width:16%">Кол-во</th><th style="width:24%">Наименование</th><th style="width:30%">П/Ф</th><th style="width:30%">Описание</th></tr></thead><tbody>${rowsHtml}</tbody></table><div class="grid"><section class="box"><b>Описание</b><div class="text">${escapeHtml(ttk.description || '—')}</div></section><section class="box"><b>Способ приготовления</b><div class="text">${escapeHtml(ttk.cookingMethod || '—')}</div></section><section class="box"><b>Оформление и подача</b><div class="text">${escapeHtml(ttk.plating || '—')}</div></section><section class="box"><b>Контроль качества</b><div class="text">${escapeHtml(ttk.qualityControl || '—')}</div></section></div><section class="box"><b>Типичные ошибки</b><div class="text">${escapeHtml(ttk.typicalMistakes || '—')}</div></section></main></body></html>`
}

function TtkStatus({ status }) {
  return <Tag color={STATUS_COLORS[status] || '#64748b'}>{STATUS_LABELS[status] || status}</Tag>
}

function Photo({ file, label }) {
  return <div style={{ background:'#f8fafc', border:'1px dashed #cbd5e1', borderRadius:14, minHeight:150, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>{file?.dataUrl ? <img src={file.dataUrl} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ color:'#94a3b8', fontSize:13 }}>{label}</span>}</div>
}

export function ReferenceTtkList({ items, onOpen, onEdit, onCreate, onDownload }) {
  return <div style={{ display:'flex', flexDirection:'column', gap:16 }}><div style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}><div><h1 style={{ margin:'0 0 6px', fontSize:28, color:'#0f172a' }}>🍽 Эталонные ТТК</h1><div style={{ color:'#64748b', fontSize:14 }}>Цифровая библиотека эталонных технологических карт сети.</div></div><button onClick={onCreate} style={PRIMARY}>Создать ТТК</button></div>{items.length === 0 ? <div style={{ ...SECTION, textAlign:'center', padding:44 }}><div style={{ fontSize:46 }}>🍽</div><h2 style={{ margin:'8px 0', color:'#0f172a' }}>Пока нет эталонных ТТК</h2><p style={{ color:'#64748b' }}>Создайте первую карту стандарта: компоненты, фото, описание и технология.</p><button onClick={onCreate} style={PRIMARY}>Создать первую ТТК</button></div> : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>{items.map(item => <div key={item.id} style={{ ...SECTION, padding:0, overflow:'hidden' }}><div style={{ height:180, background:'#f8fafc' }}><Photo file={item.photos?.main} label="Фото блюда" /></div><div style={{ padding:16 }}><div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}><h3 style={{ margin:'0 0 6px', fontSize:18, color:'#0f172a' }}>{item.title || 'Без названия'}</h3><TtkStatus status={item.status} /></div><div style={{ color:'#64748b', fontSize:12, lineHeight:1.7 }}>Код: {item.ttkCode || '—'} · Выход: {item.output || '—'}<br />{item.category || 'Категория не указана'} · {item.station || 'Цех не указан'}<br />Обновлено: {formatDate(item.updatedAt)}</div><div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}><button onClick={() => onOpen(item)} style={SEL_ST}>Открыть</button><button onClick={() => onEdit(item)} style={SEL_ST}>Редактировать</button><button onClick={() => onDownload(item)} style={SEL_ST}>Скачать JSON</button></div></div></div>)}</div>}</div>
}

function Field({ label, children }) { return <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span>{children}</label> }
function TextField({ label, value, onChange, type = 'text' }) { return <Field label={label}><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} style={INPUT} /></Field> }
function TextAreaField({ label, value, onChange }) { return <Field label={label}><textarea value={value || ''} onChange={e => onChange(e.target.value)} style={TEXTAREA} /></Field> }
function FileInput({ label, accept, value, onChange }) { return <Field label={label}><input type="file" accept={accept} onChange={async e => onChange(await fileToPayload(e.target.files?.[0]))} />{value?.name && <span style={{ color:'#64748b', fontSize:11 }}>{value.name}</span>}</Field> }

export function ReferenceTtkForm({ initial, nomenclature = [], onCancel, onSave }) {
  const [form, setForm] = useState(() => initial || createEmptyReferenceTtk())
  const searchableItems = useMemo(() => nomenclature.filter(item => ['product', 'semifinished', 'sauce', 'prep'].includes(item.type)), [nomenclature])
  const byName = useMemo(() => new Map(searchableItems.map(item => [item.name.trim().toLowerCase(), item])), [searchableItems])
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const updatePhoto = (field, value) => setForm(current => ({ ...current, photos:{ ...current.photos, [field]: value } }))
  const updateFile = (field, value) => setForm(current => ({ ...current, files:{ ...current.files, [field]: value } }))
  const updateRow = (index, field, value) => setForm(current => ({ ...current, rows: current.rows.map((row, i) => i === index ? { ...row, [field]: value } : row) }))
  function selectItem(index, name) {
    const item = byName.get(name.trim().toLowerCase())
    if (!item) return updateRow(index, 'name', name)
    const fillDetails = DETAIL_TYPES.includes(item.type)
    setForm(current => ({ ...current, rows: current.rows.map((row, i) => i === index ? { ...row, name:item.name, itemId:item.id, itemType:item.type, semifinished: fillDetails ? item.composition : row.semifinished, description: fillDetails ? item.cookingMethod : row.description } : row) }))
  }
  return <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display:'flex', flexDirection:'column', gap:16 }}><section style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center' }}><div><h1 style={{ margin:'0 0 6px', fontSize:28 }}>Создать эталонную ТТК</h1><div style={{ color:'#64748b', fontSize:14 }}>Выбирайте товары и полуфабрикаты из справочников, тексты вставляйте после анализа PDF/XLSX.</div></div><div style={{ display:'flex', gap:8 }}><button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button><button type="submit" style={PRIMARY}>Сохранить</button></div></section><section style={SECTION}><h2 style={{ marginTop:0 }}>Основная информация</h2><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12 }}><TextField label="Название блюда" value={form.title} onChange={v => update('title', v)} /><TextField label="Код ТТК" value={form.ttkCode} onChange={v => update('ttkCode', v)} /><TextField label="Категория" value={form.category} onChange={v => update('category', v)} /><TextField label="Цех" value={form.station} onChange={v => update('station', v)} /><TextField label="Выход" value={form.output} onChange={v => update('output', v)} /><Field label="Статус"><select value={form.status} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width:'100%' }}><option value="draft">Черновик</option><option value="in_progress">В работе</option><option value="standard">Эталон</option></select></Field></div></section><section style={SECTION}><h2 style={{ marginTop:0 }}>Фото</h2><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}><FileInput label="Главное фото блюда" accept="image/*" value={form.photos?.main} onChange={v => updatePhoto('main', v)} /><FileInput label="Фото подачи" accept="image/*" value={form.photos?.plating} onChange={v => updatePhoto('plating', v)} /><FileInput label="Фото сверху" accept="image/*" value={form.photos?.top} onChange={v => updatePhoto('top', v)} /><FileInput label="Фото полуфабрикатов" accept="image/*" value={form.photos?.semifinished} onChange={v => updatePhoto('semifinished', v)} /></div></section><section style={SECTION}><datalist id="ttk-nomenclature-options">{searchableItems.map(item => <option key={item.id} value={item.name}>{NOMENCLATURE_TYPE_LABELS[item.type]} · {item.unit}</option>)}</datalist><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:12 }}><div><h2 style={{ margin:'0 0 4px' }}>Таблица компонентов</h2><div style={{ color:'#64748b', fontSize:13 }}>Товар подставляет только название. Полуфабрикат/соус/заготовка подставляют состав и способ приготовления.</div></div><button type="button" onClick={() => update('rows', [...(form.rows || []), { ...EMPTY_ROW }])} style={PRIMARY}>Добавить строку</button></div><div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}><thead><tr>{['Кол-во','Наименование','П/Ф','Описание',''].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{(form.rows || []).map((row, index) => <tr key={index}><td style={TD}><input placeholder={byName.get(row.name?.trim().toLowerCase())?.unit ? `100 ${byName.get(row.name.trim().toLowerCase()).unit}` : '100 г'} value={row.qty} onChange={e => updateRow(index, 'qty', e.target.value)} style={INPUT} /></td><td style={TD}><input list="ttk-nomenclature-options" value={row.name} onChange={e => selectItem(index, e.target.value)} style={INPUT} />{row.itemType && <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>{NOMENCLATURE_TYPE_LABELS[row.itemType]}</div>}</td><td style={TD}><textarea value={row.semifinished} onChange={e => updateRow(index, 'semifinished', e.target.value)} style={AREA_IN_TABLE} /></td><td style={TD}><textarea value={row.description} onChange={e => updateRow(index, 'description', e.target.value)} style={AREA_IN_TABLE} /></td><td style={TD}><button type="button" onClick={() => update('rows', form.rows.filter((_, i) => i !== index))} style={SEL_ST}>×</button></td></tr>)}</tbody></table></div></section><section style={SECTION}><TextAreaField label="Описание блюда" value={form.description} onChange={v => update('description', v)} /></section><section style={SECTION}><TextAreaField label="Способ приготовления" value={form.cookingMethod} onChange={v => update('cookingMethod', v)} /></section><section style={SECTION}><TextAreaField label="Оформление и подача" value={form.plating} onChange={v => update('plating', v)} /></section><section style={SECTION}><TextAreaField label="Контроль качества" value={form.qualityControl} onChange={v => update('qualityControl', v)} /></section><section style={SECTION}><TextAreaField label="Типичные ошибки" value={form.typicalMistakes} onChange={v => update('typicalMistakes', v)} /></section><section style={SECTION}><h2 style={{ marginTop:0 }}>Файлы</h2><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}><FileInput label="PDF ТТК" accept="application/pdf,.pdf" value={form.files?.pdf} onChange={v => updateFile('pdf', v)} /><FileInput label="XLSX ТТК" accept=".xlsx,.xls" value={form.files?.xlsx} onChange={v => updateFile('xlsx', v)} /></div></section></form>
}

export function ReferenceTtkView({ ttk, onBack, onEdit, onDuplicate, onDelete }) {
  const html = useMemo(() => makePrintableHtml(ttk), [ttk])
  if (!ttk) return null
  const printTtk = () => { const win = window.open('', '_blank'); win.document.write(html); win.document.close(); win.focus(); win.print() }
  const downloadJson = () => downloadBlob(`${ttk.title || 'reference-ttk'}.json`, JSON.stringify(ttk, null, 2), 'application/json')
  return <div style={{ display:'flex', flexDirection:'column', gap:16 }}><section style={{ ...SECTION, display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}><div><button onClick={onBack} style={{ ...SEL_ST, marginBottom:12 }}>← Эталонные ТТК</button><div><TtkStatus status={ttk.status} /></div><h1 style={{ margin:'10px 0 6px', fontSize:28, color:'#0f172a' }}>{ttk.title || 'Без названия'}</h1><div style={{ color:'#64748b' }}>Код: {ttk.ttkCode || '—'} · Выход: {ttk.output || '—'} · обновлено {formatDate(ttk.updatedAt)}</div></div><div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}><button onClick={onEdit} style={PRIMARY}>Редактировать</button><button onClick={printTtk} style={SEL_ST}>Скачать ТТК / Печать</button><button onClick={downloadJson} style={SEL_ST}>Скачать JSON</button><button onClick={onDuplicate} style={SEL_ST}>Дублировать</button><button onClick={onDelete} style={{ ...SEL_ST, color:'#dc2626', borderColor:'#fecaca' }}>Удалить</button></div></section><div style={{ display:'flex', justifyContent:'center', overflow:'auto', padding:'16px 0 32px' }}><PrintablePage ttk={ttk} /></div></div>
}

function PrintablePage({ ttk }) {
  return <article style={{ width:'210mm', minHeight:'297mm', background:'#fff', boxShadow:'0 24px 70px rgba(15,23,42,.16)', padding:'9mm', display:'flex', flexDirection:'column', gap:'5mm' }}><h1 style={{ margin:0, textAlign:'center', fontSize:20, lineHeight:1.1, textTransform:'uppercase' }}>{ttk.title || 'Название блюда'}</h1><div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:4, fontSize:10 }}>{[['Код',ttk.ttkCode],['Категория',ttk.category],['Цех',ttk.station],['Выход',ttk.output]].map(([label, value]) => <div key={label} style={PRINT_BOX}><b>{label}</b><br />{value || '—'}</div>)}</div>{ttk.photos?.main?.dataUrl ? <img src={ttk.photos.main.dataUrl} alt={ttk.title} style={{ width:'100%', height:'58mm', objectFit:'cover', border:'1px solid #111827' }} /> : <div style={{ height:'58mm', border:'1px dashed #9ca3af', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' }}>Фото блюда</div>}<table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', fontSize:10.5, lineHeight:1.2 }}><thead><tr>{['Кол-во','Наименование','П/Ф','Описание'].map((h, i) => <th key={h} style={{ ...PRINT_TH, width:['16%','24%','30%','30%'][i] }}>{h}</th>)}</tr></thead><tbody>{(ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map((row, index) => <tr key={index}><td style={PRINT_TD}>{row.qty}</td><td style={{ ...PRINT_TD, fontWeight:800 }}>{row.name}</td><td style={PRINT_TD}>{row.semifinished}</td><td style={PRINT_TD}>{row.description}</td></tr>)}</tbody></table><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:4 }}>{[['Описание',ttk.description],['Способ приготовления',ttk.cookingMethod],['Оформление и подача',ttk.plating],['Контроль качества',ttk.qualityControl]].map(([label, text]) => <div key={label} style={PRINT_BOX}><b>{label}</b><div style={PRINT_TEXT}>{text || '—'}</div></div>)}</div><div style={PRINT_BOX}><b>Типичные ошибки</b><div style={PRINT_TEXT}>{ttk.typicalMistakes || '—'}</div></div></article>
}

const TH = { textAlign:'left', padding:8, background:'#f8fafc', border:'1px solid #e5e7eb' }
const TD = { padding:6, border:'1px solid #e5e7eb', verticalAlign:'top' }
const AREA_IN_TABLE = { ...INPUT, minHeight:68, resize:'vertical', fontFamily:'inherit', lineHeight:1.35 }
const PRINT_BOX = { border:'1px solid #111827', padding:4 }
const PRINT_TH = { border:'1px solid #111827', padding:'4px 5px', verticalAlign:'top', wordBreak:'break-word', background:'#f3f4f6', textAlign:'center', fontSize:9, textTransform:'uppercase' }
const PRINT_TD = { border:'1px solid #111827', padding:'4px 5px', verticalAlign:'top', wordBreak:'break-word' }
const PRINT_TEXT = { fontSize:10, lineHeight:1.25, whiteSpace:'pre-wrap' }
