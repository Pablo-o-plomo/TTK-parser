import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { createEmptyReferenceTtk } from '../hooks/useReferenceTtk.js'

const STATUS_LABELS = {
  draft: 'Черновик',
  in_progress: 'В работе',
  approved: 'Эталон утверждён',
}

const STATUS_COLORS = {
  draft: '#64748b',
  in_progress: '#d97706',
  approved: '#16a34a',
}

const SECTION = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18 }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const TEXTAREA = { width:'100%', boxSizing:'border-box', minHeight:130, border:'1.5px solid #e5e7eb', borderRadius:12, padding:12, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }
const PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }

function today() {
  return new Date().toISOString().slice(0, 10)
}

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

function makeHtml(ttk) {
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${ttk.title}</title><style>body{font-family:Arial,sans-serif;max-width:980px;margin:40px auto;color:#0f172a;line-height:1.55}h1{font-size:32px}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.box{border:1px solid #e5e7eb;border-radius:12px;padding:14px;margin:14px 0}.tag{display:inline-block;background:#eef2ff;color:#4f46e5;border-radius:999px;padding:4px 10px;font-weight:700;font-size:12px}table{width:100%;border-collapse:collapse}td,th{border:1px solid #e5e7eb;padding:8px;text-align:left}img{max-width:100%;border-radius:16px}</style></head><body><span class="tag">${STATUS_LABELS[ttk.status] || ttk.status}</span><h1>${ttk.title}</h1>${ttk.photos?.main?.dataUrl ? `<img src="${ttk.photos.main.dataUrl}" alt="${ttk.title}">` : ''}<div class="meta"><div class="box"><b>Код</b><br>${ttk.ttkCode || '—'}</div><div class="box"><b>Ресторан</b><br>${ttk.restaurant || '—'}</div><div class="box"><b>Категория</b><br>${ttk.category || '—'}</div><div class="box"><b>Цех</b><br>${ttk.station || '—'}</div><div class="box"><b>Выход</b><br>${ttk.output || '—'}</div><div class="box"><b>Дата</b><br>${ttk.date || '—'}</div></div><section class="box"><h2>Описание</h2><p>${ttk.description || '—'}</p></section><section class="box"><h2>Состав</h2>${ingredientsTable(ttk)}</section><section class="box"><h2>Полуфабрикаты</h2>${semifinishedTable(ttk)}</section><section class="box"><h2>Способ приготовления</h2><p>${ttk.cookingMethod || '—'}</p></section><section class="box"><h2>Оформление и подача</h2><p>${ttk.plating || '—'}</p></section><section class="box"><h2>Контроль качества</h2><p>${ttk.qualityControl || '—'}</p></section><section class="box"><h2>Типичные ошибки</h2><p>${ttk.typicalMistakes || '—'}</p></section></body></html>`
}

function ingredientsTable(ttk) {
  const rows = ttk.ingredients || []
  if (!rows.length) return '<p>Ингредиенты не заполнены</p>'
  return `<table><thead><tr><th>№</th><th>Наименование</th><th>Ед.</th><th>Брутто</th><th>Нетто</th><th>Готовый продукт</th><th>Нетто на порцию</th></tr></thead><tbody>${rows.map((row, i) => `<tr><td>${i + 1}</td><td>${row.name || ''}</td><td>${row.unit || ''}</td><td>${row.brutto || ''}</td><td>${row.netto || ''}</td><td>${row.readyWeight || ''}</td><td>${row.portionNetto || ''}</td></tr>`).join('')}</tbody></table>`
}

function semifinishedTable(ttk) {
  const rows = ttk.semifinished || []
  if (!rows.length) return '<p>Полуфабрикаты не заполнены</p>'
  return `<table><thead><tr><th>Название</th><th>Количество</th><th>Комментарий</th></tr></thead><tbody>${rows.map(row => `<tr><td>${row.name || ''}</td><td>${row.quantity || ''}</td><td>${row.comment || ''}</td></tr>`).join('')}</tbody></table>`
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
          <div style={{ color:'#64748b', fontSize:14 }}>Простой конструктор: создал → заполнил → загрузил фото → сохранил → скачал.</div>
        </div>
        <button onClick={onCreate} style={PRIMARY}>Создать ТТК</button>
      </div>

      {items.length === 0 ? (
        <div style={{ ...SECTION, textAlign:'center', padding:44 }}>
          <div style={{ fontSize:46 }}>📋</div>
          <h2 style={{ margin:'8px 0', color:'#0f172a' }}>Пока нет эталонных ТТК</h2>
          <p style={{ color:'#64748b' }}>Создайте первую карточку и вручную вставьте тексты, подготовленные ChatGPT после анализа PDF/XLSX.</p>
          <button onClick={onCreate} style={PRIMARY}>Создать первую ТТК</button>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
          {items.map(item => (
            <div key={item.id} style={{ ...SECTION, padding:0, overflow:'hidden' }}>
              <div style={{ height:170, background:'#f8fafc' }}><Photo file={item.photos?.main} label="Фото блюда" /></div>
              <div style={{ padding:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}>
                  <h3 style={{ margin:'0 0 6px', fontSize:18, color:'#0f172a' }}>{item.title || 'Без названия'}</h3>
                  <TtkStatus status={item.status} />
                </div>
                <div style={{ color:'#64748b', fontSize:12, lineHeight:1.7 }}>
                  {item.category || 'Категория не указана'} · {item.station || 'Цех не указан'}<br />
                  Обновлено: {formatDate(item.updatedAt || item.date)}
                </div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}>
                  <button onClick={() => onOpen(item)} style={SEL_ST}>Открыть</button>
                  <button onClick={() => onEdit(item)} style={SEL_ST}>Редактировать</button>
                  <button onClick={() => onDownload(item)} style={SEL_ST}>Скачать</button>
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

function TextField({ label, value, onChange, type = 'text' }) {
  return <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span><input type={type} value={value || ''} onChange={e => onChange(e.target.value)} style={INPUT} /></label>
}

function TextAreaField({ label, value, onChange }) {
  return <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span><textarea value={value || ''} onChange={e => onChange(e.target.value)} style={TEXTAREA} /></label>
}

export function ReferenceTtkForm({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(() => initial || createEmptyReferenceTtk())

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }
  function updatePhoto(field, value) {
    setForm(current => ({ ...current, photos: { ...current.photos, [field]: value } }))
  }
  function updateFile(field, value) {
    setForm(current => ({ ...current, files: { ...current.files, [field]: value } }))
  }
  function updateSemi(index, field, value) {
    setForm(current => ({ ...current, semifinished: current.semifinished.map((row, i) => i === index ? { ...row, [field]: value } : row) }))
  }
  function updateIngredient(index, field, value) {
    setForm(current => ({ ...current, ingredients: current.ingredients.map((row, i) => i === index ? { ...row, [field]: value } : row) }))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28 }}>Создать эталонную ТТК</h1>
          <div style={{ color:'#64748b', fontSize:14 }}>Вставьте готовые тексты после анализа исходной PDF/XLSX в ChatGPT.</div>
        </div>
        <div style={{ display:'flex', gap:8 }}><button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button><button type="submit" style={PRIMARY}>Сохранить ТТК</button></div>
      </div>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Основная информация</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))', gap:12 }}>
          <TextField label="Название блюда" value={form.title} onChange={v => update('title', v)} />
          <TextField label="Код ТТК" value={form.ttkCode} onChange={v => update('ttkCode', v)} />
          <TextField label="Ресторан-эталон" value={form.restaurant} onChange={v => update('restaurant', v)} />
          <TextField label="Категория" value={form.category} onChange={v => update('category', v)} />
          <TextField label="Цех" value={form.station} onChange={v => update('station', v)} />
          <TextField label="Выход" value={form.output} onChange={v => update('output', v)} />
          <TextField label="Дата" type="date" value={form.date || today()} onChange={v => update('date', v)} />
          <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>Статус</span><select value={form.status} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width:'100%' }}><option value="draft">Черновик</option><option value="in_progress">В работе</option><option value="approved">Эталон утверждён</option></select></label>
        </div>
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Фото</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
          <FileInput label="Главное фото блюда" accept="image/*" value={form.photos.main} onChange={v => updatePhoto('main', v)} />
          <FileInput label="Фото подачи" accept="image/*" value={form.photos.plating} onChange={v => updatePhoto('plating', v)} />
          <FileInput label="Фото сверху" accept="image/*" value={form.photos.top} onChange={v => updatePhoto('top', v)} />
          <FileInput label="Фото полуфабрикатов" accept="image/*" value={form.photos.semifinished} onChange={v => updatePhoto('semifinished', v)} />
        </div>
      </section>

      <section style={SECTION}><TextAreaField label="Краткое описание блюда" value={form.description} onChange={v => update('description', v)} /></section>
      <section style={SECTION}><TextAreaField label="Пошаговая технология приготовления" value={form.cookingMethod} onChange={v => update('cookingMethod', v)} /></section>
      <section style={SECTION}><TextAreaField label="Оформление и подача" value={form.plating} onChange={v => update('plating', v)} /></section>
      <section style={SECTION}><TextAreaField label="Контроль качества" value={form.qualityControl} onChange={v => update('qualityControl', v)} /></section>
      <section style={SECTION}><TextAreaField label="Типичные ошибки" value={form.typicalMistakes} onChange={v => update('typicalMistakes', v)} /></section>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Полуфабрикаты</h2>
        {(form.semifinished || []).map((row, index) => (
          <div key={index} style={{ display:'grid', gridTemplateColumns:'1fr 140px 1fr auto', gap:8, marginBottom:8 }}>
            <input placeholder="Название" value={row.name} onChange={e => updateSemi(index, 'name', e.target.value)} style={INPUT} />
            <input placeholder="Количество" value={row.quantity} onChange={e => updateSemi(index, 'quantity', e.target.value)} style={INPUT} />
            <input placeholder="Комментарий" value={row.comment} onChange={e => updateSemi(index, 'comment', e.target.value)} style={INPUT} />
            <button type="button" onClick={() => update('semifinished', form.semifinished.filter((_, i) => i !== index))} style={SEL_ST}>Удалить</button>
          </div>
        ))}
        <button type="button" onClick={() => update('semifinished', [...(form.semifinished || []), { name:'', quantity:'', comment:'' }])} style={SEL_ST}>+ Добавить полуфабрикат</button>
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Состав / ингредиенты</h2>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr>{['№','Наименование','Ед. изм.','Брутто','Нетто','Вес готового продукта','Вес нетто на 1 порцию',''].map(h => <th key={h} style={{ textAlign:'left', padding:8, background:'#f8fafc', border:'1px solid #e5e7eb' }}>{h}</th>)}</tr></thead>
            <tbody>{(form.ingredients || []).map((row, index) => <tr key={index}>{[
              index + 1,
              <input value={row.name} onChange={e => updateIngredient(index, 'name', e.target.value)} style={INPUT} />,
              <input value={row.unit} onChange={e => updateIngredient(index, 'unit', e.target.value)} style={INPUT} />,
              <input value={row.brutto} onChange={e => updateIngredient(index, 'brutto', e.target.value)} style={INPUT} />,
              <input value={row.netto} onChange={e => updateIngredient(index, 'netto', e.target.value)} style={INPUT} />,
              <input value={row.readyWeight} onChange={e => updateIngredient(index, 'readyWeight', e.target.value)} style={INPUT} />,
              <input value={row.portionNetto} onChange={e => updateIngredient(index, 'portionNetto', e.target.value)} style={INPUT} />,
              <button type="button" onClick={() => update('ingredients', form.ingredients.filter((_, i) => i !== index))} style={SEL_ST}>×</button>,
            ].map((cell, i) => <td key={i} style={{ padding:6, border:'1px solid #e5e7eb' }}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
        <button type="button" onClick={() => update('ingredients', [...(form.ingredients || []), { name:'', unit:'', brutto:'', netto:'', readyWeight:'', portionNetto:'' }])} style={{ ...SEL_ST, marginTop:10 }}>+ Добавить ингредиент</button>
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop:0 }}>Файлы</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>
          <FileInput label="PDF исходной ТТК" accept="application/pdf,.pdf" value={form.files.pdf} onChange={v => updateFile('pdf', v)} />
          <FileInput label="XLSX исходной ТТК" accept=".xlsx,.xls" value={form.files.xlsx} onChange={v => updateFile('xlsx', v)} />
        </div>
      </section>
    </form>
  )
}

export function ReferenceTtkView({ ttk, onBack, onEdit, onDuplicate, onDelete }) {
  const html = useMemo(() => makeHtml(ttk), [ttk])
  if (!ttk) return null
  function downloadJson() { downloadBlob(`${ttk.title || 'ttk'}.json`, JSON.stringify(ttk, null, 2), 'application/json') }
  function downloadHtml() { downloadBlob(`${ttk.title || 'ttk'}.html`, html, 'text/html') }
  function printPdf() {
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ ...SECTION, display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start' }}>
        <div>
          <button onClick={onBack} style={{ ...SEL_ST, marginBottom:12 }}>← Эталонные ТТК</button>
          <div><TtkStatus status={ttk.status} /></div>
          <h1 style={{ margin:'10px 0 6px', fontSize:34, color:'#0f172a' }}>{ttk.title || 'Без названия'}</h1>
          <div style={{ color:'#64748b' }}>Код {ttk.ttkCode || '—'} · {ttk.restaurant || '—'} · обновлено {formatDate(ttk.updatedAt || ttk.date)}</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
          <button onClick={onEdit} style={PRIMARY}>Редактировать</button>
          <button onClick={downloadHtml} style={SEL_ST}>Скачать ТТК (HTML)</button>
          <button onClick={printPdf} style={SEL_ST}>Печать / сохранить PDF</button>
          <button onClick={downloadJson} style={SEL_ST}>Скачать JSON</button>
          <button onClick={onDuplicate} style={SEL_ST}>Дублировать</button>
          <button onClick={onDelete} style={{ ...SEL_ST, color:'#dc2626', borderColor:'#fecaca' }}>Удалить</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'minmax(260px,380px) 1fr', gap:16 }}>
        <div style={SECTION}><Photo file={ttk.photos?.main} label="Главное фото блюда" /></div>
        <section style={SECTION}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
            <Metric label="Категория" value={ttk.category || '—'} />
            <Metric label="Цех" value={ttk.station || '—'} />
            <Metric label="Выход" value={ttk.output || '—'} />
            <Metric label="Дата" value={ttk.date || '—'} />
          </div>
          <Block title="Краткое описание блюда" text={ttk.description} />
        </section>
      </div>

      <section style={SECTION}><h2>Фото</h2><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12 }}><Photo file={ttk.photos?.plating} label="Фото подачи" /><Photo file={ttk.photos?.top} label="Фото сверху" /><Photo file={ttk.photos?.semifinished} label="Фото полуфабрикатов" /></div></section>
      <section style={SECTION}><h2>Состав</h2><IngredientsView rows={ttk.ingredients} /></section>
      <section style={SECTION}><h2>Полуфабрикаты</h2><SemifinishedView rows={ttk.semifinished} /></section>
      <section style={SECTION}><Block title="Способ приготовления" text={ttk.cookingMethod} /></section>
      <section style={SECTION}><Block title="Оформление и подача" text={ttk.plating} /></section>
      <section style={SECTION}><Block title="Контроль качества" text={ttk.qualityControl} /></section>
      <section style={SECTION}><Block title="Типичные ошибки" text={ttk.typicalMistakes} /></section>
      <section style={SECTION}><h2>Прикреплённые файлы</h2><div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{ttk.files?.pdf ? <a href={ttk.files.pdf.dataUrl} download={ttk.files.pdf.name} style={{ color:'#2563eb' }}>📄 {ttk.files.pdf.name}</a> : <span style={{ color:'#94a3b8' }}>PDF не загружен</span>}{ttk.files?.xlsx ? <a href={ttk.files.xlsx.dataUrl} download={ttk.files.xlsx.name} style={{ color:'#2563eb' }}>📊 {ttk.files.xlsx.name}</a> : <span style={{ color:'#94a3b8' }}>XLSX не загружен</span>}</div></section>
    </div>
  )
}

function Metric({ label, value }) {
  return <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}><div style={{ color:'#64748b', fontSize:10, fontWeight:900, textTransform:'uppercase' }}>{label}</div><div style={{ fontSize:16, color:'#0f172a', fontWeight:900, marginTop:4 }}>{value}</div></div>
}

function Block({ title, text }) {
  return <div style={{ marginTop:14 }}><h3 style={{ margin:'0 0 8px', color:'#0f172a' }}>{title}</h3><div style={{ whiteSpace:'pre-wrap', lineHeight:1.65, color:text ? '#334155' : '#94a3b8' }}>{text || 'Не заполнено'}</div></div>
}

function IngredientsView({ rows = [] }) {
  if (!rows.length) return <div style={{ color:'#94a3b8' }}>Ингредиенты не заполнены</div>
  return <div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}><thead><tr>{['№','Наименование','Ед. изм.','Брутто','Нетто','Вес готового продукта','Вес нетто на 1 порцию'].map(h => <th key={h} style={{ textAlign:'left', padding:9, background:'#f8fafc', border:'1px solid #e5e7eb' }}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}><td style={TD}>{i + 1}</td><td style={TD}>{row.name}</td><td style={TD}>{row.unit}</td><td style={TD}>{row.brutto}</td><td style={TD}>{row.netto}</td><td style={TD}>{row.readyWeight}</td><td style={TD}>{row.portionNetto}</td></tr>)}</tbody></table></div>
}

const TD = { padding:9, border:'1px solid #e5e7eb' }

function SemifinishedView({ rows = [] }) {
  if (!rows.length) return <div style={{ color:'#94a3b8' }}>Полуфабрикаты не заполнены</div>
  return <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:8 }}>{rows.map((row, i) => <div key={i} style={{ background:'#f8fafc', borderRadius:12, padding:12 }}><div style={{ fontWeight:900 }}>{row.name}</div><div style={{ color:'#64748b', fontSize:12 }}>Количество: {row.quantity || '—'}</div><div style={{ color:'#334155', fontSize:12 }}>{row.comment}</div></div>)}</div>
}
