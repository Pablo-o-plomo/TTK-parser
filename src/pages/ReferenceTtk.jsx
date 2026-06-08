import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { createEmptyReferenceTtk } from '../storage/referenceTtkStore.js'
import { SEMIFINISHED_TYPE_LABELS } from '../storage/semifinishedStore.js'
import { SYSTEM_UNGROUPED_GROUP_ID as UNGROUPED_GROUP_ID } from '../storage/ttkGroupsStore.js'

const STATUS_LABELS = { draft: 'Черновик', in_progress: 'В работе', standard: 'Эталон' }
const STATUS_COLORS = { draft: '#64748b', in_progress: '#d97706', standard: '#16a34a' }
const ITEM_TYPE_LABELS = { product: 'Товар', ...SEMIFINISHED_TYPE_LABELS }
const DETAIL_TYPES = ['semifinished', 'sauce', 'prep']
const EMPTY_ROW = { id: '', qty: '', itemId: '', itemType: '', name: '', semifinished: '', description: '' }
const SECTION = { background:'#fff', border:'1px solid rgba(15,23,42,.08)', borderRadius:20, padding:18, boxShadow:'0 18px 60px rgba(15,23,42,.05)' }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const TEXTAREA = { width:'100%', boxSizing:'border-box', minHeight:96, border:'1.5px solid #e5e7eb', borderRadius:14, padding:12, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }
const PRIMARY = { ...SEL_ST, background:'#111827', borderColor:'#111827', color:'#fff', fontWeight:900, padding:'11px 16px' }
const SOFT = { ...SEL_ST, borderColor:'rgba(15,23,42,.08)', background:'rgba(255,255,255,.8)' }

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('ru-RU') : '—'
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
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
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
}

function makePrintableHtml(ttk) {
  const rowsHtml = (ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map(row => `<tr><td>${escapeHtml(row.qty)}</td><td>${escapeHtml(row.name)}</td><td>${escapeHtml(row.semifinished)}</td><td>${escapeHtml(row.description)}</td></tr>`).join('')
  const photoHtml = ttk.photo?.dataUrl ? `<img class="dish-photo" src="${ttk.photo.dataUrl}" alt="${escapeHtml(ttk.title)}">` : '<div class="photo-placeholder">Фото блюда</div>'
  return `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(ttk.title || 'Эталонная ТТК')}</title><style>@page{size:A4;margin:12mm}body{margin:0;background:white;font-family:Arial,sans-serif;color:#111827}.no-print{display:none!important}.print-page{width:210mm;min-height:297mm;padding:12mm;page-break-after:always}h1{text-align:center;margin:0 0 8mm;text-transform:uppercase;font-size:22px}.meta{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:6mm}.meta div,.box{border:1px solid #111827;padding:5px;font-size:11px}table{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed}th,td{border:1px solid #111827;padding:5px;vertical-align:top;word-break:break-word}th{background:#f3f4f6;text-transform:uppercase;font-size:9px}.dish-photo,.photo-placeholder{width:100%;height:70mm;border:1px solid #111827;object-fit:cover;display:flex;align-items:center;justify-content:center;color:#6b7280;margin:6mm 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:4px}.text{white-space:pre-wrap;line-height:1.25}</style></head><body><main class="print-page"><h1>${escapeHtml(ttk.title || 'Название блюда')}</h1><div class="meta"><div><b>Код</b><br>${escapeHtml(ttk.ttkCode || '—')}</div><div><b>Категория</b><br>${escapeHtml(ttk.category || '—')}</div><div><b>Цех</b><br>${escapeHtml(ttk.station || '—')}</div><div><b>Выход</b><br>${escapeHtml(ttk.output || '—')}</div></div><table><thead><tr><th style="width:16%">Кол-во</th><th style="width:24%">Наименование</th><th style="width:30%">П/Ф</th><th style="width:30%">Описание</th></tr></thead><tbody>${rowsHtml}</tbody></table>${photoHtml}<div class="grid"><section class="box"><b>Описание</b><div class="text">${escapeHtml(ttk.description || '—')}</div></section><section class="box"><b>Способ приготовления</b><div class="text">${escapeHtml(ttk.cookingMethod || '—')}</div></section><section class="box"><b>Оформление</b><div class="text">${escapeHtml(ttk.plating || '—')}</div></section><section class="box"><b>Контроль качества</b><div class="text">${escapeHtml(ttk.qualityControl || '—')}</div></section></div><section class="box"><b>Типичные ошибки</b><div class="text">${escapeHtml(ttk.typicalMistakes || '—')}</div></section></main><script>window.print()</script></body></html>`
}

export function openPrintableTtk(ttk) {
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(makePrintableHtml(ttk))
  win.document.close()
}

function StatusTag({ status }) {
  return <Tag color={STATUS_COLORS[status] || '#64748b'}>{STATUS_LABELS[status] || status}</Tag>
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

function FileInput({ label, accept, value, onChange }) {
  return <Field label={label}><input type="file" accept={accept} onChange={async e => onChange(await fileToPayload(e.target.files?.[0]))} />{value?.name && <span style={{ fontSize:11, color:'#64748b' }}>{value.name}</span>}</Field>
}

function getChildren(groups, parentId) {
  return groups.filter(group => group.parentId === parentId).sort((a, b) => Number(a.order) - Number(b.order) || a.title.localeCompare(b.title))
}

function getDescendantIds(groups, parentId) {
  const children = getChildren(groups, parentId)
  return children.flatMap(child => [child.id, ...getDescendantIds(groups, child.id)])
}

function countGroupCards(groups, cards, groupId) {
  if (groupId === 'all') return cards.length
  const ids = new Set([groupId, ...getDescendantIds(groups, groupId)])
  return cards.filter(card => ids.has(card.groupId || UNGROUPED_GROUP_ID)).length
}

function matchesSearch(card, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    card.title,
    card.description,
    card.cookingMethod,
    card.plating,
    card.qualityControl,
    card.typicalMistakes,
    ...(card.rows || []).flatMap(row => [row.name, row.semifinished, row.description]),
  ].join(' ').toLowerCase()
  return haystack.includes(needle)
}

function ConfirmDeleteModal({ title, details, onCancel, onConfirm }) {
  const [value, setValue] = useState('')
  const canDelete = value === 'УДАЛИТЬ'
  return <div style={MODAL_BACKDROP}><div style={MODAL}><h2 style={{ marginTop:0 }}>{title}</h2><p style={{ color:'#64748b', lineHeight:1.6, whiteSpace:'pre-wrap' }}>{details}</p><Field label="Для подтверждения введите УДАЛИТЬ"><input value={value} onChange={e => setValue(e.target.value)} style={INPUT} autoFocus /></Field><div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}><button onClick={onCancel} style={SOFT}>Отмена</button><button disabled={!canDelete} onClick={onConfirm} style={{ ...PRIMARY, background: canDelete ? '#dc2626' : '#fecaca', borderColor: canDelete ? '#dc2626' : '#fecaca', cursor: canDelete ? 'pointer' : 'not-allowed' }}>Удалить</button></div></div></div>
}

function GroupTreeNode({ group, groups, cards, selectedGroupId, onSelect, actions, level = 0, onContext, draggedGroupId, setDraggedGroupId }) {
  const children = getChildren(groups, group.id)
  const count = countGroupCards(groups, cards, group.id)
  const active = selectedGroupId === group.id
  return <div>
    <div
      draggable={!group.system}
      onDragStart={() => !group.system && setDraggedGroupId(group.id)}
      onDragEnd={() => setDraggedGroupId(null)}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); if (draggedGroupId && draggedGroupId !== group.id) actions.moveGroup(draggedGroupId, group.system ? null : group.id) }}
      onContextMenu={e => { e.preventDefault(); onContext(e, group) }}
      style={{ ...TREE_ROW, paddingLeft:10 + level * 16, background: active ? '#111827' : 'transparent', color: active ? '#fff' : '#334155' }}
    >
      <button onClick={() => children.length && actions.toggleExpanded(group.id)} style={TREE_TOGGLE}>{children.length ? (group.expanded ? '⌄' : '›') : '·'}</button>
      <button onClick={() => onSelect(group.id)} style={{ ...TREE_LABEL, color:'inherit' }}>{group.title}</button>
      <span style={{ ...COUNT_BADGE, background: active ? 'rgba(255,255,255,.16)' : '#f1f5f9', color: active ? '#fff' : '#64748b' }}>{count}</span>
    </div>
    {group.expanded && children.map(child => <GroupTreeNode key={child.id} group={child} groups={groups} cards={cards} selectedGroupId={selectedGroupId} onSelect={onSelect} actions={actions} level={level + 1} onContext={onContext} draggedGroupId={draggedGroupId} setDraggedGroupId={setDraggedGroupId} />)}
  </div>
}

function GroupContextMenu({ context, onClose, actions, onDeleteRequest }) {
  if (!context) return null
  const { x, y, group } = context
  const canEdit = !group.system
  const askTitle = (label, initial = '') => window.prompt(label, initial)?.trim()
  return <div style={{ ...CONTEXT_MENU, left:x, top:y }} onMouseLeave={onClose}>
    <button style={CONTEXT_BTN} onClick={() => { actions.createGroup(null, askTitle('Название группы', 'Новая группа') || 'Новая группа'); onClose() }}>Создать группу</button>
    <button style={CONTEXT_BTN} onClick={() => { actions.createGroup(group.id, askTitle('Название подгруппы', 'Новая подгруппа') || 'Новая подгруппа'); onClose() }}>Создать подгруппу</button>
    <button disabled={!canEdit} style={CONTEXT_BTN} onClick={() => { const title = askTitle('Новое название', group.title); if (title) actions.updateGroup(group.id, { title }); onClose() }}>Переименовать</button>
    <button disabled={!canEdit} style={CONTEXT_BTN} onClick={() => { const target = askTitle('ID родительской группы или пусто для корня', group.parentId || ''); actions.moveGroup(group.id, target || null); onClose() }}>Переместить</button>
    <button disabled={!canEdit} style={CONTEXT_BTN} onClick={() => { actions.duplicateGroup(group.id); onClose() }}>Дублировать</button>
    <button disabled={!canEdit} style={{ ...CONTEXT_BTN, color:'#dc2626' }} onClick={() => { onDeleteRequest(group); onClose() }}>Удалить</button>
  </div>
}

function TtkCard({ item, onOpen, onEdit, onPrint, onDeleteRequest, onMove, selectedGroupId }) {
  return <article
    draggable
    onDragStart={e => e.dataTransfer.setData('ttkId', item.id)}
    onDragOver={e => e.preventDefault()}
    onDrop={e => { const draggedId = e.dataTransfer.getData('ttkId'); if (draggedId && draggedId !== item.id) onMove(draggedId, selectedGroupId, item.order - 0.5) }}
    style={CARD_STYLE}
  >
    <button onClick={() => onOpen(item)} style={CARD_IMAGE_BTN}>{item.photo?.dataUrl ? <img src={item.photo.dataUrl} alt={item.title} style={CARD_IMAGE} /> : <div style={CARD_PLACEHOLDER}>Фото</div>}</button>
    <div style={{ padding:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', gap:8, alignItems:'flex-start' }}><h3 style={{ margin:'0 0 8px', fontSize:17, lineHeight:1.25 }}>{item.title || 'Без названия'}</h3><StatusTag status={item.status} /></div>
      <div style={{ color:'#64748b', fontSize:12, lineHeight:1.7 }}>Выход: {item.output || '—'}<br />{item.category || 'Категория не указана'} · {formatDate(item.updatedAt)}</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:14 }}><button onClick={() => onOpen(item)} style={SOFT}>Открыть</button><button onClick={() => onEdit(item)} style={SOFT}>Редактировать</button><button onClick={() => onPrint(item)} style={SOFT}>Печать</button><button onClick={() => onDeleteRequest(item)} style={{ ...SOFT, color:'#dc2626' }}>Удалить</button></div>
    </div>
  </article>
}

export function ReferenceTtkList({ items, groups = [], groupActions, onOpen, onEdit, onCreate, onDelete, onPrint, onMoveTtk }) {
  const [selectedGroupId, setSelectedGroupId] = useState('all')
  const [query, setQuery] = useState('')
  const [context, setContext] = useState(null)
  const [deleteCard, setDeleteCard] = useState(null)
  const [deleteGroup, setDeleteGroup] = useState(null)
  const [draggedGroupId, setDraggedGroupId] = useState(null)

  const rootGroups = useMemo(() => getChildren(groups, null), [groups])
  const visibleItems = useMemo(() => {
    const sorted = [...items].sort((a, b) => Number(a.order) - Number(b.order) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
    if (query.trim()) return sorted.filter(item => matchesSearch(item, query))
    if (selectedGroupId === 'all') return sorted
    const ids = new Set([selectedGroupId, ...getDescendantIds(groups, selectedGroupId)])
    return sorted.filter(item => ids.has(item.groupId || UNGROUPED_GROUP_ID))
  }, [groups, items, query, selectedGroupId])

  function confirmGroupDelete() {
    if (!deleteGroup) return
    ;[deleteGroup.id, ...getDescendantIds(groups, deleteGroup.id)].forEach(groupId => onMoveTtk(null, groupId, null, { moveGroupCardsToUngrouped: true }))
    groupActions.deleteGroup(deleteGroup.id)
    setDeleteGroup(null)
    setSelectedGroupId('all')
  }

  return (
    <div style={KB_LAYOUT}>
      <aside style={KB_SIDEBAR}>
        <div style={{ marginBottom:18 }}><h2 style={{ margin:'0 0 6px', fontSize:18 }}>База знаний</h2><p style={{ margin:0, color:'#94a3b8', fontSize:12 }}>Древовидная структура эталонных карт</p></div>
        <button onClick={() => setSelectedGroupId('all')} style={{ ...TREE_ROW, width:'100%', background:selectedGroupId === 'all' ? '#111827' : '#fff', color:selectedGroupId === 'all' ? '#fff' : '#334155' }}><span>📚 Все карточки</span><span style={{ ...COUNT_BADGE, marginLeft:'auto' }}>{items.length}</span></button>
        <div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); if (draggedGroupId) groupActions.moveGroup(draggedGroupId, null) }}>
          {rootGroups.map(group => <GroupTreeNode key={group.id} group={group} groups={groups} cards={items} selectedGroupId={selectedGroupId} onSelect={setSelectedGroupId} actions={groupActions} onContext={(e, g) => setContext({ x:e.clientX, y:e.clientY, group:g })} draggedGroupId={draggedGroupId} setDraggedGroupId={setDraggedGroupId} />)}
        </div>
        <button onClick={() => groupActions.createGroup(null, 'Новая группа')} style={{ ...PRIMARY, width:'100%', marginTop:16 }}>+ Создать группу</button>
      </aside>
      <main style={{ minWidth:0 }}>
        <section style={{ ...SECTION, marginBottom:16, background:'rgba(255,255,255,.86)', backdropFilter:'blur(16px)' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:16, marginBottom:14 }}><div><h1 style={{ margin:'0 0 6px', fontSize:30 }}>🍽 Эталонные ТТК</h1><div style={{ color:'#64748b' }}>Современная древовидная база знаний для 1000+ технологических карт.</div></div><button onClick={onCreate} style={PRIMARY}>Создать ТТК</button></div>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Глобальный поиск по названию, описанию, ингредиентам и технологии" style={{ ...INPUT, padding:14, borderRadius:18, background:'#f8fafc' }} />
        </section>
        <section onDragOver={e => e.preventDefault()} onDrop={e => { const ttkId = e.dataTransfer.getData('ttkId'); if (ttkId && selectedGroupId !== 'all') onMoveTtk(ttkId, selectedGroupId, Date.now()) }}>
          {visibleItems.length === 0 ? <div style={{ ...SECTION, textAlign:'center', padding:56, color:'#94a3b8' }}>В этой группе пока нет карточек</div> : <div style={GRID_STYLE}>{visibleItems.map(item => <TtkCard key={item.id} item={item} selectedGroupId={selectedGroupId} onOpen={onOpen} onEdit={onEdit} onPrint={onPrint} onDeleteRequest={setDeleteCard} onMove={(id, groupId, order) => onMoveTtk(id, groupId === 'all' ? (items.find(card => card.id === id)?.groupId || UNGROUPED_GROUP_ID) : groupId, order)} />)}</div>}
        </section>
      </main>
      <GroupContextMenu context={context} onClose={() => setContext(null)} actions={groupActions} onDeleteRequest={setDeleteGroup} />
      {deleteCard && <ConfirmDeleteModal title="Удалить карточку ТТК?" details="Карточка будет удалена только после подтверждения. Это действие нельзя отменить." onCancel={() => setDeleteCard(null)} onConfirm={() => { onDelete(deleteCard.id); setDeleteCard(null) }} />}
      {deleteGroup && <ConfirmDeleteModal title="Вы действительно хотите удалить группу?" details="Карточки не будут удалены.\nОни автоматически будут перенесены в системную группу «Без группы»." onCancel={() => setDeleteGroup(null)} onConfirm={confirmGroupDelete} />}
    </div>
  )
}

export function ReferenceTtkForm({ initial, nomenclature = [], groups = [], onCancel, onSave }) {
  const [form, setForm] = useState(() => initial || createEmptyReferenceTtk())
  const searchItems = useMemo(() => nomenclature.filter(item => ['product', 'semifinished', 'sauce', 'prep'].includes(item.type)), [nomenclature])
  const byName = useMemo(() => new Map(searchItems.map(item => [item.name.trim().toLowerCase(), item])), [searchItems])
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }))
  const updateRow = (index, field, value) => update('rows', form.rows.map((row, i) => i === index ? { ...row, [field]: value } : row))
  const updateFile = (field, value) => update('files', { ...form.files, [field]: value })

  function selectItem(index, name) {
    const item = byName.get(name.trim().toLowerCase())
    if (!item) return updateRow(index, 'name', name)
    const isSemi = DETAIL_TYPES.includes(item.type)
    update('rows', form.rows.map((row, i) => i === index ? { ...row, itemId: item.id, itemType: item.type, name: item.name, semifinished: isSemi ? item.composition : row.semifinished, description: isSemi ? item.cookingMethod : row.description } : row))
  }

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form) }} style={{ display:'grid', gap:16 }}>
      <section style={SECTION}><h2 style={{ marginTop:0 }}>Основное</h2><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12 }}><TextField label="Название блюда" value={form.title} onChange={v => update('title', v)} /><TextField label="Код ТТК" value={form.ttkCode} onChange={v => update('ttkCode', v)} /><TextField label="Категория" value={form.category} onChange={v => update('category', v)} /><TextField label="Цех" value={form.station} onChange={v => update('station', v)} /><TextField label="Выход" value={form.output} onChange={v => update('output', v)} /><Field label="Статус"><select value={form.status} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width:'100%' }}><option value="draft">Черновик</option><option value="in_progress">В работе</option><option value="standard">Эталон</option></select></Field><Field label="Группа"><select value={form.groupId || UNGROUPED_GROUP_ID} onChange={e => update('groupId', e.target.value)} style={{ ...SEL_ST, width:'100%' }}>{groups.map(group => <option key={group.id} value={group.id}>{group.title}</option>)}</select></Field></div></section>
      <section style={SECTION}><h2 style={{ marginTop:0 }}>Фото</h2><FileInput label="Главное фото блюда" accept="image/*" value={form.photo} onChange={v => update('photo', v)} /></section>
      <section style={SECTION}><datalist id="ttk-items">{searchItems.map(item => <option key={`${item.type}-${item.id}`} value={item.name}>{ITEM_TYPE_LABELS[item.type]} · {item.unit || item.output}</option>)}</datalist><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}><h2 style={{ margin:0 }}>Таблица компонентов</h2><button type="button" onClick={() => update('rows', [...form.rows, { ...EMPTY_ROW, id: makeId('row') }])} style={PRIMARY}>Добавить строку</button></div><div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}><thead><tr>{['Кол-во','Наименование','П/Ф','Описание',''].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{form.rows.map((row, index) => <tr key={row.id || index}><td style={TD}><input value={row.qty} onChange={e => updateRow(index, 'qty', e.target.value)} style={INPUT} /></td><td style={TD}><input list="ttk-items" value={row.name} onChange={e => selectItem(index, e.target.value)} style={INPUT} />{row.itemType && <div style={{ color:'#64748b', fontSize:11 }}>{ITEM_TYPE_LABELS[row.itemType]}</div>}</td><td style={TD}><textarea value={row.semifinished} onChange={e => updateRow(index, 'semifinished', e.target.value)} style={AREA} /></td><td style={TD}><textarea value={row.description} onChange={e => updateRow(index, 'description', e.target.value)} style={AREA} /></td><td style={TD}><button type="button" onClick={() => update('rows', form.rows.filter((_, i) => i !== index))} style={SOFT}>×</button></td></tr>)}</tbody></table></div></section>
      <section style={SECTION}><TextAreaField label="Краткое описание блюда" value={form.description} onChange={v => update('description', v)} /></section><section style={SECTION}><TextAreaField label="Способ приготовления" value={form.cookingMethod} onChange={v => update('cookingMethod', v)} /></section><section style={SECTION}><TextAreaField label="Оформление и подача" value={form.plating} onChange={v => update('plating', v)} /></section><section style={SECTION}><TextAreaField label="Контроль качества" value={form.qualityControl} onChange={v => update('qualityControl', v)} /></section><section style={SECTION}><TextAreaField label="Типичные ошибки" value={form.typicalMistakes} onChange={v => update('typicalMistakes', v)} /></section>
      <section style={SECTION}><h2 style={{ marginTop:0 }}>Файлы</h2><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}><FileInput label="PDF" accept="application/pdf,.pdf" value={form.files?.pdf} onChange={v => updateFile('pdf', v)} /><FileInput label="XLSX" accept=".xlsx,.xls" value={form.files?.xlsx} onChange={v => updateFile('xlsx', v)} /></div></section>
      <div style={{ display:'flex', gap:8 }}><button type="submit" style={PRIMARY}>Сохранить</button><button type="button" onClick={onCancel} style={SOFT}>Отмена</button></div>
    </form>
  )
}

export function ReferenceTtkView({ ttk, onBack, onEdit, onDuplicate, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  return <div style={{ display:'grid', gap:16 }}><section className="no-print" style={{ ...SECTION, display:'flex', justifyContent:'space-between', gap:12 }}><div><button onClick={onBack} style={SOFT}>← Назад</button><h1>{ttk.title || 'Без названия'}</h1><StatusTag status={ttk.status} /></div><div style={{ display:'flex', gap:8, flexWrap:'wrap' }}><button onClick={onEdit} style={PRIMARY}>Редактировать</button><button onClick={() => openPrintableTtk(ttk)} style={SOFT}>Скачать ТТК / Печать</button><button onClick={() => downloadBlob(`${ttk.title || 'ttk'}.json`, JSON.stringify(ttk, null, 2), 'application/json')} style={SOFT}>JSON</button><button onClick={onDuplicate} style={SOFT}>Дублировать</button><button onClick={() => setConfirmDelete(true)} style={{ ...SOFT, color:'#dc2626' }}>Удалить</button></div></section><PrintablePage ttk={ttk} />{confirmDelete && <ConfirmDeleteModal title="Удалить карточку ТТК?" details="Карточка будет удалена только после подтверждения. Это действие нельзя отменить." onCancel={() => setConfirmDelete(false)} onConfirm={onDelete} />}</div>
}

function PrintablePage({ ttk }) {
  return <article className="print-page" style={{ width:'210mm', minHeight:'297mm', background:'#fff', boxShadow:'0 24px 70px rgba(15,23,42,.16)', padding:'12mm', margin:'0 auto' }}><h1 style={{ textAlign:'center', textTransform:'uppercase' }}>{ttk.title || 'Название блюда'}</h1><table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}><thead><tr>{['Кол-во','Наименование','П/Ф','Описание'].map(h => <th key={h} style={PRINT_CELL}>{h}</th>)}</tr></thead><tbody>{ttk.rows.map(row => <tr key={row.id}><td style={PRINT_CELL}>{row.qty}</td><td style={PRINT_CELL}>{row.name}</td><td style={PRINT_CELL}>{row.semifinished}</td><td style={PRINT_CELL}>{row.description}</td></tr>)}</tbody></table><div style={{ margin:'10px 0', fontWeight:900 }}>Выход: {ttk.output || '—'}</div>{ttk.photo?.dataUrl && <img src={ttk.photo.dataUrl} alt={ttk.title} style={{ width:'100%', maxHeight:'70mm', objectFit:'cover', border:'1px solid #111827' }} />}<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>{[['Описание', ttk.description], ['Способ приготовления', ttk.cookingMethod], ['Оформление', ttk.plating], ['Контроль качества', ttk.qualityControl], ['Типичные ошибки', ttk.typicalMistakes]].map(([label, text]) => <section key={label} style={{ border:'1px solid #111827', padding:8 }}><b>{label}</b><div style={{ whiteSpace:'pre-wrap', fontSize:11 }}>{text || '—'}</div></section>)}</div></article>
}

const KB_LAYOUT = { display:'grid', gridTemplateColumns:'320px minmax(0,1fr)', gap:18, alignItems:'start' }
const KB_SIDEBAR = { position:'sticky', top:82, background:'rgba(255,255,255,.82)', border:'1px solid rgba(15,23,42,.08)', borderRadius:24, padding:16, boxShadow:'0 24px 70px rgba(15,23,42,.07)', backdropFilter:'blur(18px)' }
const TREE_ROW = { minHeight:36, display:'flex', alignItems:'center', gap:6, border:'none', borderRadius:12, padding:'6px 8px', cursor:'pointer', fontSize:13, transition:'background .16s ease, transform .16s ease' }
const TREE_TOGGLE = { border:'none', background:'transparent', color:'inherit', cursor:'pointer', width:18, padding:0 }
const TREE_LABEL = { flex:1, border:'none', background:'transparent', textAlign:'left', cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }
const COUNT_BADGE = { minWidth:24, borderRadius:999, padding:'2px 7px', textAlign:'center', fontSize:11, fontWeight:800 }
const GRID_STYLE = { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(250px,1fr))', gap:16 }
const CARD_STYLE = { background:'#fff', border:'1px solid rgba(15,23,42,.08)', borderRadius:22, overflow:'hidden', boxShadow:'0 20px 55px rgba(15,23,42,.07)', transition:'transform .18s ease, box-shadow .18s ease' }
const CARD_IMAGE_BTN = { width:'100%', height:160, padding:0, border:'none', background:'#f8fafc', cursor:'pointer', display:'block' }
const CARD_IMAGE = { width:'100%', height:'100%', objectFit:'cover', display:'block' }
const CARD_PLACEHOLDER = { height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', background:'linear-gradient(135deg,#f8fafc,#eef2ff)' }
const CONTEXT_MENU = { position:'fixed', zIndex:100, width:210, background:'#fff', border:'1px solid rgba(15,23,42,.12)', borderRadius:16, padding:6, boxShadow:'0 24px 70px rgba(15,23,42,.18)' }
const CONTEXT_BTN = { width:'100%', border:'none', background:'transparent', textAlign:'left', padding:'10px 12px', borderRadius:10, cursor:'pointer', color:'#334155' }
const MODAL_BACKDROP = { position:'fixed', inset:0, zIndex:200, background:'rgba(15,23,42,.38)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }
const MODAL = { width:'min(520px,100%)', background:'#fff', borderRadius:22, padding:22, boxShadow:'0 30px 100px rgba(15,23,42,.28)' }
const TH = { textAlign:'left', padding:8, background:'#f8fafc', border:'1px solid #e5e7eb' }
const TD = { padding:6, border:'1px solid #e5e7eb', verticalAlign:'top' }
const AREA = { ...INPUT, minHeight:64, resize:'vertical', fontFamily:'inherit' }
const PRINT_CELL = { border:'1px solid #111827', padding:6, verticalAlign:'top' }
