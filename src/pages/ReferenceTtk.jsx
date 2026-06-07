import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { createEmptyReferenceTtk } from '../hooks/useReferenceTtk.js'

const STATUS_LABELS = {
  draft: 'Черновик',
  approved: 'Готова к печати',
}

const STATUS_COLORS = {
  draft: '#64748b',
  approved: '#16a34a',
}

const SECTION = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18 }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }
const EMPTY_ROW = { qty: '', name: '', semifinished: '', description: '' }

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

function makePrintableHtml(ttk) {
  const rows = ttk.rows?.length ? ttk.rows : [EMPTY_ROW]
  const rowsHtml = rows.map(row => `<tr><td>${escapeHtml(row.qty)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.semifinished)}</td><td>${escapeHtml(row.description)}</td></tr>`).join('')
  const photoHtml = ttk.photo?.dataUrl ? `<img class="dish-photo" src="${ttk.photo.dataUrl}" alt="${escapeHtml(ttk.title)}">` : '<div class="photo-placeholder">Фото блюда</div>'

  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(ttk.title || 'Эталонная ТТК')}</title><style>
    @page{size:A4;margin:10mm}
    *{box-sizing:border-box}
    body{margin:0;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;color:#111827}
    .page{width:210mm;min-height:297mm;margin:0 auto;background:#fff;padding:13mm 12mm 12mm;display:flex;flex-direction:column;gap:8mm}
    h1{margin:0;text-align:center;font-size:23px;line-height:1.15;text-transform:uppercase;letter-spacing:.02em}
    table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12px;line-height:1.25}
    th,td{border:1.5px solid #111827;padding:6px 7px;vertical-align:top;word-break:break-word}
    th{background:#f3f4f6;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:.03em}
    th:nth-child(1),td:nth-child(1){width:18%;text-align:center;font-weight:700}
    th:nth-child(2),td:nth-child(2){width:25%;font-weight:700}
    th:nth-child(3),td:nth-child(3){width:29%}
    th:nth-child(4),td:nth-child(4){width:28%}
    .output{font-size:17px;font-weight:800;border:1.5px solid #111827;padding:8px 10px;width:max-content;min-width:190px}
    .photo-wrap{margin-top:auto}
    .dish-photo{width:100%;height:112mm;object-fit:cover;border:1.5px solid #111827;display:block}
    .photo-placeholder{height:112mm;border:1.5px dashed #9ca3af;display:flex;align-items:center;justify-content:center;color:#6b7280;font-size:18px;background:#f9fafb}
    .meta{display:flex;justify-content:space-between;align-items:flex-end;gap:12px}
    .date{font-size:11px;color:#6b7280}
    @media print{body{background:#fff}.page{margin:0;width:auto;min-height:0;box-shadow:none}.no-print{display:none!important}}
  </style></head><body><main class="page"><h1>${escapeHtml(ttk.title || 'Название блюда')}</h1><table><thead><tr><th>Кол-во</th><th>Наименование</th><th>П/ф</th><th>Описание</th></tr></thead><tbody>${rowsHtml}</tbody></table><div class="meta"><div class="output">Выход: ${escapeHtml(ttk.output || '—')}</div><div class="date">Обновлено: ${escapeHtml(formatDate(ttk.updatedAt))}</div></div><div class="photo-wrap">${photoHtml}</div></main></body></html>`
}

function TtkStatus({ status }) {
  return <Tag color={STATUS_COLORS[status] || '#64748b'}>{STATUS_LABELS[status] || status}</Tag>
}

function Photo({ file, label }) {
  return (
    <div style={{ background:'#f8fafc', border:'1px dashed #cbd5e1', borderRadius:14, minHeight:150, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
      {file?.dataUrl ? <img src={file.dataUrl} alt={label} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <span style={{ color:'#94a3b8', fontSize:13 }}>{label}</span>}
    </div>
  )
}

export function ReferenceTtkList({ items, onOpen, onEdit, onCreate, onDownload }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28, color:'#0f172a' }}>Эталонные ТТК</h1>
          <div style={{ color:'#64748b', fontSize:14 }}>Короткие печатные карты A4 для повара: строки, выход и фото подачи.</div>
        </div>
        <button onClick={onCreate} style={PRIMARY}>Создать ТТК</button>
      </div>

      {items.length === 0 ? (
        <div style={{ ...SECTION, textAlign:'center', padding:44 }}>
          <div style={{ fontSize:46 }}>📄</div>
          <h2 style={{ margin:'8px 0', color:'#0f172a' }}>Пока нет печатных эталонных ТТК</h2>
          <p style={{ color:'#64748b' }}>Создайте короткую карту: название, выход, строки таблицы и одно большое фото блюда.</p>
          <button onClick={onCreate} style={PRIMARY}>Создать первую ТТК</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {items.map(item => (
            <div key={item.id} style={{ ...SECTION, padding:0, overflow:'hidden' }}>
              <div style={{ height:180, background:'#f8fafc' }}><Photo file={item.photo} label="Фото блюда" /></div>
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
          ))}
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

function TextField({ label, value, onChange }) {
  return <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span><input value={value || ''} onChange={e => onChange(e.target.value)} style={INPUT} /></label>
}

export function ReferenceTtkForm({ initial, nomenclature = [], onSaveNomenclatureItem, onCancel, onSave }) {
  const [form, setForm] = useState(() => initial || createEmptyReferenceTtk())
  const nomenclatureByName = useMemo(() => new Map(nomenclature.map(item => [item.name.trim().toLowerCase(), item])), [nomenclature])

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function updateRow(index, field, value) {
    setForm(current => ({ ...current, rows: current.rows.map((row, i) => i === index ? { ...row, [field]: value } : row) }))
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
        name: item.name,
        semifinished: item.type === 'Полуфабрикат' || item.composition ? item.composition : row.semifinished,
        description: item.cookingMethod || item.description || row.description,
      } : row),
    }))
  }

  function addRowToNomenclature(row) {
    if (!row.name?.trim() || !onSaveNomenclatureItem) return
    const unit = row.qty?.replace(/[0-9.,\s]/g, '').trim() || 'г'
    onSaveNomenclatureItem({
      name: row.name.trim(),
      type: row.semifinished ? 'Полуфабрикат' : 'Товар',
      category: '',
      unit,
      description: row.description || '',
      composition: row.semifinished || '',
      cookingMethod: row.description || '',
      output: row.qty || '',
    })
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28 }}>Создать короткую эталонную ТТК</h1>
          <div style={{ color:'#64748b', fontSize:14 }}>Одна ТТК = одна печатная страница A4: название, таблица, выход и фото.</div>
        </div>
        <div style={{ display:'flex', gap:8 }}><button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button><button type="submit" style={PRIMARY}>Сохранить</button></div>
      </div>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Основное</h2>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 180px', gap:12 }}>
          <TextField label="Название блюда" value={form.title} onChange={v => update('title', v)} />
          <TextField label="Выход" value={form.output} onChange={v => update('output', v)} />
          <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>Статус</span><select value={form.status} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width:'100%' }}><option value="draft">Черновик</option><option value="approved">Готова к печати</option></select></label>
        </div>
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Фото блюда</h2>
        <div style={{ display:'grid', gridTemplateColumns:'minmax(240px,360px) 1fr', gap:16, alignItems:'center' }}>
          <Photo file={form.photo} label="Большое фото подачи блюда" />
          <FileInput label="Загрузить фото блюда" accept="image/*" value={form.photo} onChange={v => update('photo', v)} />
        </div>
      </section>

      <section style={SECTION}>
        <datalist id="nomenclature-options">{nomenclature.map(item => <option key={item.id} value={item.name}>{item.type} · {item.unit}</option>)}</datalist>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, marginBottom:12 }}>
          <div>
            <h2 style={{ margin:'0 0 4px' }}>Строки ТТК</h2>
            <div style={{ color:'#64748b', fontSize:13 }}>Заполните компактную таблицу для повара: количество, элемент, состав п/ф и короткое действие.</div>
          </div>
          <button type="button" onClick={() => update('rows', [...(form.rows || []), { ...EMPTY_ROW }])} style={PRIMARY}>Добавить строку</button>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>{['Кол-во','Наименование','П/ф состав','Описание',''].map(h => <th key={h} style={{ textAlign:'left', padding:8, background:'#f8fafc', border:'1px solid #e5e7eb' }}>{h}</th>)}</tr></thead>
            <tbody>{(form.rows || []).map((row, index) => <tr key={index}>
              <td style={TD}><input placeholder={nomenclatureByName.get(row.name?.trim().toLowerCase())?.unit ? `100 ${nomenclatureByName.get(row.name.trim().toLowerCase()).unit}` : '100 г'} value={row.qty} onChange={e => updateRow(index, 'qty', e.target.value)} style={INPUT} /></td>
              <td style={TD}>
                <input list="nomenclature-options" placeholder="Брауни п/ф" value={row.name} onChange={e => selectNomenclature(index, e.target.value)} style={INPUT} />
                {row.name && !nomenclatureByName.has(row.name.trim().toLowerCase()) && <button type="button" onClick={() => addRowToNomenclature(row)} style={{ ...SEL_ST, marginTop:6, fontSize:11 }}>Добавить в номенклатуру</button>}
              </td>
              <td style={TD}><textarea placeholder="яйцо, сахар, шоколад..." value={row.semifinished} onChange={e => updateRow(index, 'semifinished', e.target.value)} style={AREA_IN_TABLE} /></td>
              <td style={TD}><textarea placeholder="Замешать, выпекать..." value={row.description} onChange={e => updateRow(index, 'description', e.target.value)} style={AREA_IN_TABLE} /></td>
              <td style={TD}><button type="button" onClick={() => update('rows', form.rows.filter((_, i) => i !== index))} style={SEL_ST}>×</button></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </form>
  )
}

const TD = { padding:6, border:'1px solid #e5e7eb', verticalAlign:'top' }
const AREA_IN_TABLE = { ...INPUT, minHeight:68, resize:'vertical', fontFamily:'inherit', lineHeight:1.35 }

export function ReferenceTtkView({ ttk, onBack, onEdit, onDuplicate, onDelete }) {
  const html = useMemo(() => makePrintableHtml(ttk), [ttk])
  if (!ttk) return null

  function downloadJson() {
    downloadBlob(`${ttk.title || 'short-reference-ttk'}.json`, JSON.stringify(ttk, null, 2), 'application/json')
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
          <button onClick={onBack} style={{ ...SEL_ST, marginBottom:12 }}>← Эталонные ТТК</button>
          <div><TtkStatus status={ttk.status} /></div>
          <h1 style={{ margin:'10px 0 6px', fontSize:28, color:'#0f172a' }}>{ttk.title || 'Без названия'}</h1>
          <div style={{ color:'#64748b' }}>Выход: {ttk.output || '—'} · строк: {ttk.rows?.length || 0} · обновлено {formatDate(ttk.updatedAt)}</div>
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

function PrintablePage({ ttk }) {
  return (
    <article style={{ width:'210mm', minHeight:'297mm', background:'#fff', boxShadow:'0 24px 70px rgba(15,23,42,.16)', padding:'13mm 12mm 12mm', display:'flex', flexDirection:'column', gap:'8mm' }}>
      <h1 style={{ margin:0, textAlign:'center', fontSize:23, lineHeight:1.15, textTransform:'uppercase', letterSpacing:'.02em', color:'#111827' }}>{ttk.title || 'Название блюда'}</h1>
      <table style={{ width:'100%', borderCollapse:'collapse', tableLayout:'fixed', fontSize:12, lineHeight:1.25 }}>
        <thead><tr>{['Кол-во','Наименование','П/ф','Описание'].map((h, i) => <th key={h} style={{ ...PRINT_TH, width:['18%','25%','29%','28%'][i] }}>{h}</th>)}</tr></thead>
        <tbody>{(ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map((row, index) => <tr key={index}>
          <td style={{ ...PRINT_TD, textAlign:'center', fontWeight:800 }}>{row.qty}</td>
          <td style={{ ...PRINT_TD, fontWeight:800 }}>{row.name}</td>
          <td style={PRINT_TD}>{row.semifinished}</td>
          <td style={PRINT_TD}>{row.description}</td>
        </tr>)}</tbody>
      </table>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:12 }}>
        <div style={{ fontSize:17, fontWeight:900, border:'1.5px solid #111827', padding:'8px 10px', minWidth:190 }}>Выход: {ttk.output || '—'}</div>
        <div style={{ fontSize:11, color:'#6b7280' }}>Обновлено: {formatDate(ttk.updatedAt)}</div>
      </div>
      <div style={{ marginTop:'auto' }}>
        {ttk.photo?.dataUrl ? <img src={ttk.photo.dataUrl} alt={ttk.title} style={{ width:'100%', height:'112mm', objectFit:'cover', border:'1.5px solid #111827', display:'block' }} /> : <div style={{ height:'112mm', border:'1.5px dashed #9ca3af', display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280', background:'#f9fafb', fontSize:18 }}>Фото блюда</div>}
      </div>
    </article>
  )
}

const PRINT_TH = { border:'1.5px solid #111827', padding:'6px 7px', verticalAlign:'top', wordBreak:'break-word', background:'#f3f4f6', textAlign:'center', fontSize:11, textTransform:'uppercase', letterSpacing:'.03em' }
const PRINT_TD = { border:'1.5px solid #111827', padding:'6px 7px', verticalAlign:'top', wordBreak:'break-word' }
