import { useEffect, useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { createEmptyReferenceTtk } from '../storage/referenceTtkStore.js'
import { SEMIFINISHED_TYPE_LABELS } from '../storage/semifinishedStore.js'

const STATUS_LABELS = { draft: 'Черновик', in_progress: 'В работе', standard: 'Эталон' }
const STATUS_COLORS = { draft: '#64748b', in_progress: '#d97706', standard: '#16a34a' }
const ITEM_TYPE_LABELS = { product: 'Товар', ...SEMIFINISHED_TYPE_LABELS }
const DETAIL_TYPES = ['semifinished', 'sauce', 'prep']
const EMPTY_ROW = { id: '', qty: '', itemId: '', itemType: '', name: '', semifinished: '', description: '' }
const SECTION = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18 }
const FIELD = { display:'flex', flexDirection:'column', gap:6 }
const INPUT = { ...SEL_ST, width:'100%', boxSizing:'border-box', cursor:'text' }
const TEXTAREA = { width:'100%', boxSizing:'border-box', minHeight:96, border:'1.5px solid #e5e7eb', borderRadius:12, padding:12, fontSize:13, outline:'none', resize:'vertical', fontFamily:'inherit' }
const PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString('ru-RU') : '—'
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

const REFERENCE_GROUPS_KEY = 'referenceTtkGroups'
const REFERENCE_ITEMS_KEY = 'academy_printable_reference_ttk_v1'
const LEGACY_REFERENCE_ITEMS_KEY = 'academy_reference_ttk_v1'
const SYSTEM_ALL_ID = 'system_all'
const SYSTEM_UNGROUPED_ID = 'system_ungrouped'
const DEFAULT_GROUP_TITLES = ['🥗 Салаты', '🍤 Закуски', '🍣 Роллы', '🐟 Горячие блюда', '🍲 Супы', '🍰 Десерты', '🥫 Соусы', '🥬 Полуфабрикаты', '📦 Заготовки']
const GROUP_SHELL = { background:'#fff', border:'1px solid #eef1f4', borderRadius:20, padding:16, boxShadow:'0 18px 45px rgba(15,23,42,.04)' }
const SOFT_BUTTON = { ...SEL_ST, borderColor:'#e8ecf0', background:'#fff', color:'#334155', padding:'8px 10px' }
const TINY_BUTTON = { ...SEL_ST, borderColor:'#edf0f3', background:'#fff', color:'#64748b', padding:'5px 7px', fontSize:11 }

function nowStamp() {
  return new Date().toISOString()
}

function makeGroupId() {
  return `group_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function systemGroups(now = nowStamp()) {
  return [
    { id:SYSTEM_ALL_ID, parentId:null, title:'📚 Все карточки', order:-2000, expanded:true, system:true, createdAt:now, updatedAt:now },
    { id:SYSTEM_UNGROUPED_ID, parentId:null, title:'📂 Без группы', order:2000, expanded:true, system:true, createdAt:now, updatedAt:now },
  ]
}

function normalizeGroup(group, index = 0) {
  const now = nowStamp()
  return {
    id: group.id || makeGroupId(),
    parentId: group.parentId || null,
    title: group.title || 'Новая группа',
    order: Number.isFinite(group.order) ? group.order : index,
    expanded: group.expanded !== false,
    system: Boolean(group.system),
    createdAt: group.createdAt || now,
    updatedAt: group.updatedAt || now,
  }
}

function seedGroups() {
  const now = nowStamp()
  return [
    ...systemGroups(now),
    ...DEFAULT_GROUP_TITLES.map((title, index) => ({ id:`default_${index + 1}`, parentId:null, title, order:index, expanded:true, system:false, createdAt:now, updatedAt:now })),
  ]
}

function readGroups() {
  try {
    const raw = localStorage.getItem(REFERENCE_GROUPS_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    const source = Array.isArray(parsed) && parsed.length ? parsed : seedGroups()
    const normalized = source.map(normalizeGroup)
    const byId = new Map(normalized.map(group => [group.id, group]))
    const withSystem = [...systemGroups(), ...normalized.filter(group => ![SYSTEM_ALL_ID, SYSTEM_UNGROUPED_ID].includes(group.id))]
      .map((group, index) => normalizeGroup({ ...group, parentId: group.parentId && byId.has(group.parentId) ? group.parentId : null }, index))
    localStorage.setItem(REFERENCE_GROUPS_KEY, JSON.stringify(withSystem))
    return withSystem
  } catch {
    return seedGroups()
  }
}

function writeGroups(groups) {
  localStorage.setItem(REFERENCE_GROUPS_KEY, JSON.stringify(groups))
}

function readRawReferenceItems() {
  try {
    const current = localStorage.getItem(REFERENCE_ITEMS_KEY)
    const legacy = localStorage.getItem(LEGACY_REFERENCE_ITEMS_KEY)
    const parsed = JSON.parse(current || legacy || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function patchReferenceItems(updater) {
  const raw = readRawReferenceItems()
  localStorage.setItem(REFERENCE_ITEMS_KEY, JSON.stringify(updater(raw)))
}

function mergeGroupIds(items) {
  const rawById = new Map(readRawReferenceItems().map(item => [item.id, item]))
  return items.map(item => ({ ...item, groupId: rawById.get(item.id)?.groupId || item.groupId || '' }))
}

function preserveReferenceGroupId(ttk) {
  if (!ttk?.id) return
  setTimeout(() => {
    patchReferenceItems(raw => raw.map(item => item.id === ttk.id ? { ...item, groupId: ttk.groupId || '' } : item))
  }, 0)
}

function getVisibleGroupIds(groups, selectedId) {
  if (selectedId === SYSTEM_ALL_ID) return null
  if (selectedId === SYSTEM_UNGROUPED_ID) return []
  const children = new Map()
  groups.forEach(group => children.set(group.parentId || null, [...(children.get(group.parentId || null) || []), group.id]))
  const ids = []
  const walk = id => {
    ids.push(id)
    ;(children.get(id) || []).forEach(walk)
  }
  walk(selectedId)
  return ids
}

function groupDepth(groups, id) {
  const byId = new Map(groups.map(group => [group.id, group]))
  let depth = 0
  let current = byId.get(id)
  while (current?.parentId && depth < 12) {
    depth += 1
    current = byId.get(current.parentId)
  }
  return depth
}

function GroupTreeNode({ group, groups, selectedGroupId, onSelect, onToggle, onRename, onAddChild, onMove, onReorder, onDelete }) {
  if (!group) return null
  const children = groups.filter(item => item.parentId === group.id).sort((a, b) => a.order - b.order)
  const depth = groupDepth(groups, group.id)
  const active = selectedGroupId === group.id
  return <div><div style={{ display:'flex', alignItems:'center', gap:6, margin:'3px 0', paddingLeft:depth * 14 }}><button type="button" onClick={() => children.length ? onToggle(group.id) : onSelect(group.id)} style={{ ...TINY_BUTTON, width:26, opacity:children.length ? 1 : .35 }}>{children.length ? (group.expanded ? '⌄' : '›') : '·'}</button><button type="button" onClick={() => onSelect(group.id)} style={{ ...SOFT_BUTTON, flex:1, textAlign:'left', background:active ? '#f8fafc' : '#fff', borderColor:active ? '#dbe3ea' : '#eef1f4', fontWeight:active ? 900 : 700 }}>{group.title}</button>{!group.system && <div style={{ display:'flex', gap:4, flexWrap:'wrap', justifyContent:'flex-end' }}><button type="button" onClick={() => onAddChild(group.id)} style={TINY_BUTTON}>＋</button><button type="button" onClick={() => onRename(group)} style={TINY_BUTTON}>✎</button><button type="button" onClick={() => onMove(group)} style={TINY_BUTTON}>↪</button><button type="button" onClick={() => onReorder(group.id, -1)} style={TINY_BUTTON}>↑</button><button type="button" onClick={() => onReorder(group.id, 1)} style={TINY_BUTTON}>↓</button><button type="button" onClick={() => onDelete(group)} style={{ ...TINY_BUTTON, color:'#dc2626' }}>×</button></div>}</div>{group.expanded && children.map(child => <GroupTreeNode key={child.id} group={child} groups={groups} selectedGroupId={selectedGroupId} onSelect={onSelect} onToggle={onToggle} onRename={onRename} onAddChild={onAddChild} onMove={onMove} onReorder={onReorder} onDelete={onDelete} />)}</div>
}

export function ReferenceTtkList({ items, onOpen, onEdit, onCreate, onDelete, onPrint }) {
  const [groups, setGroups] = useState(readGroups)
  const [selectedGroupId, setSelectedGroupId] = useState(SYSTEM_ALL_ID)
  const [itemsVersion, setItemsVersion] = useState(0)
  const [deleteGroup, setDeleteGroup] = useState(null)
  const [deleteText, setDeleteText] = useState('')
  const groupedItems = useMemo(() => mergeGroupIds(items), [items, itemsVersion])
  const regularGroups = groups.filter(group => !group.system)
  const rootGroups = groups.filter(group => !group.parentId && group.id !== SYSTEM_UNGROUPED_ID).sort((a, b) => a.order - b.order)
  const visibleIds = getVisibleGroupIds(groups, selectedGroupId)
  const visibleItems = visibleIds === null ? groupedItems : visibleIds.length === 0 ? groupedItems.filter(item => !item.groupId) : groupedItems.filter(item => visibleIds.includes(item.groupId))
  const selectedGroup = groups.find(group => group.id === selectedGroupId) || groups[0]

  useEffect(() => writeGroups(groups), [groups])

  function persistGroups(updater) {
    setGroups(current => {
      const next = updater(current).map(normalizeGroup)
      writeGroups(next)
      return next
    })
  }

  function createGroup(parentId = null) {
    const title = window.prompt(parentId ? 'Название подгруппы' : 'Название группы', 'Новая группа')?.trim()
    if (!title) return
    persistGroups(current => [...current, { id:makeGroupId(), parentId, title, order:Date.now(), expanded:true, system:false, createdAt:nowStamp(), updatedAt:nowStamp() }])
  }

  function renameGroup(group) {
    const title = window.prompt('Новое название группы', group.title)?.trim()
    if (!title || group.system) return
    persistGroups(current => current.map(item => item.id === group.id ? { ...item, title, updatedAt:nowStamp() } : item))
  }

  function moveGroup(group) {
    const options = regularGroups.filter(item => item.id !== group.id).map(item => `${item.id} — ${item.title}`).join('\n')
    const parentId = window.prompt(`ID новой родительской группы. Оставьте пустым для корня.\n\n${options}`, group.parentId || '')?.trim() || null
    const descendants = getVisibleGroupIds(groups, group.id)
    if (group.system || parentId === group.id || descendants.includes(parentId) || (parentId && !groups.some(item => item.id === parentId))) return
    persistGroups(current => current.map(item => item.id === group.id ? { ...item, parentId, updatedAt:nowStamp() } : item))
  }

  function reorderGroup(id, direction) {
    const target = groups.find(group => group.id === id)
    if (!target?.id || target.system) return
    const siblings = groups.filter(group => (group.parentId || null) === (target.parentId || null) && !group.system).sort((a, b) => a.order - b.order)
    const index = siblings.findIndex(group => group.id === id)
    const swap = siblings[index + direction]
    if (!swap) return
    persistGroups(current => current.map(group => group.id === target.id ? { ...group, order:swap.order, updatedAt:nowStamp() } : group.id === swap.id ? { ...group, order:target.order, updatedAt:nowStamp() } : group))
  }

  function deleteConfirmedGroup(group) {
    if (deleteText !== 'УДАЛИТЬ' || group.system) return
    const ids = getVisibleGroupIds(groups, group.id)
    patchReferenceItems(raw => raw.map(item => ids.includes(item.groupId) ? { ...item, groupId:'' } : item))
    persistGroups(current => current.filter(item => !ids.includes(item.id)))
    setSelectedGroupId(SYSTEM_UNGROUPED_ID)
    setDeleteGroup(null)
    setDeleteText('')
    setItemsVersion(version => version + 1)
  }

  function toggleGroup(id) {
    persistGroups(current => current.map(group => group.id === id ? { ...group, expanded:!group.expanded, updatedAt:nowStamp() } : group))
  }

  function moveCard(itemId, groupId) {
    patchReferenceItems(raw => raw.map(item => item.id === itemId ? { ...item, groupId } : item))
    setItemsVersion(version => version + 1)
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(260px,320px) 1fr', gap:18, alignItems:'start' }}>
      <aside style={GROUP_SHELL}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:12 }}><div><h2 style={{ margin:'0 0 4px', fontSize:18 }}>Группы</h2><div style={{ color:'#94a3b8', fontSize:12 }}>Дерево эталонных ТТК</div></div><button type="button" onClick={() => createGroup(null)} style={SOFT_BUTTON}>＋ Группа</button></div>
        <div style={{ display:'grid', gap:2 }}>{rootGroups.map(group => <GroupTreeNode key={group.id} group={group} groups={groups} selectedGroupId={selectedGroupId} onSelect={setSelectedGroupId} onToggle={toggleGroup} onRename={renameGroup} onAddChild={createGroup} onMove={moveGroup} onReorder={reorderGroup} onDelete={group => { setDeleteGroup(group); setDeleteText('') }} />)}<GroupTreeNode group={groups.find(group => group.id === SYSTEM_UNGROUPED_ID)} groups={groups} selectedGroupId={selectedGroupId} onSelect={setSelectedGroupId} onToggle={toggleGroup} onRename={renameGroup} onAddChild={createGroup} onMove={moveGroup} onReorder={reorderGroup} onDelete={group => { setDeleteGroup(group); setDeleteText('') }} /></div>
      </aside>
      <div style={{ display:'grid', gap:16 }}>
        <section style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}><div><h1 style={{ margin:'0 0 6px' }}>🍽 Эталонные ТТК</h1><div style={{ color:'#64748b' }}>{selectedGroup?.title || '📚 Все карточки'} · {visibleItems.length} карточек</div></div><button onClick={onCreate} style={PRIMARY}>Создать ТТК</button></section>
        {visibleItems.length === 0 ? <section style={{ ...SECTION, textAlign:'center', padding:42 }}>В этой группе пока нет эталонных ТТК</section> : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>{visibleItems.map(item => <article key={item.id} style={{ ...SECTION, padding:0, overflow:'hidden' }}><div style={{ height:170, background:'#f8fafc' }}>{item.photo?.dataUrl && <img src={item.photo.dataUrl} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />}</div><div style={{ padding:16 }}><div style={{ display:'flex', justifyContent:'space-between', gap:8 }}><h3 style={{ margin:'0 0 6px' }}>{item.title || 'Без названия'}</h3><StatusTag status={item.status} /></div><div style={{ color:'#64748b', fontSize:12, lineHeight:1.7 }}>Выход: {item.output || '—'}<br />{item.category || 'Категория не указана'} · {formatDate(item.updatedAt)}</div><label style={{ display:'grid', gap:6, marginTop:12, color:'#64748b', fontSize:12, fontWeight:800 }}>Группа<select value={item.groupId || ''} onChange={event => moveCard(item.id, event.target.value)} style={{ ...INPUT, cursor:'pointer' }}><option value="">📂 Без группы</option>{regularGroups.map(group => <option key={group.id} value={group.id}>{'—'.repeat(groupDepth(groups, group.id))} {group.title}</option>)}</select></label><div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}><button onClick={() => onOpen(item)} style={SEL_ST}>Открыть</button><button onClick={() => onEdit(item)} style={SEL_ST}>Редактировать</button><button onClick={() => onPrint ? onPrint(item) : openPrintableTtk(item)} style={SEL_ST}>Печать</button><button onClick={() => onDelete?.(item.id)} style={{ ...SEL_ST, color:'#dc2626' }}>Удалить</button></div></div></article>)}</div>}
      </div>
      {deleteGroup && <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.24)', display:'grid', placeItems:'center', zIndex:100 }}><section style={{ ...SECTION, width:'min(460px,calc(100vw - 32px))', boxShadow:'0 28px 80px rgba(15,23,42,.18)' }}><h2 style={{ marginTop:0 }}>Вы действительно хотите удалить группу?</h2><p style={{ color:'#64748b', lineHeight:1.7 }}>Карточки не будут удалены.<br />Они будут перенесены в &quot;Без группы&quot;.</p><p style={{ fontSize:13, color:'#475569' }}>Для подтверждения введите <b>УДАЛИТЬ</b></p><input value={deleteText} onChange={event => setDeleteText(event.target.value)} style={INPUT} autoFocus /><div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}><button type="button" onClick={() => setDeleteGroup(null)} style={SOFT_BUTTON}>Отмена</button><button type="button" disabled={deleteText !== 'УДАЛИТЬ'} onClick={() => deleteConfirmedGroup(deleteGroup)} style={{ ...PRIMARY, background:deleteText === 'УДАЛИТЬ' ? '#dc2626' : '#cbd5e1', borderColor:deleteText === 'УДАЛИТЬ' ? '#dc2626' : '#cbd5e1', cursor:deleteText === 'УДАЛИТЬ' ? 'pointer' : 'not-allowed' }}>Удалить</button></div></section></div>}
    </div>
  )
}

export function ReferenceTtkForm({ initial, nomenclature = [], onCancel, onSave }) {
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
    <form onSubmit={e => { e.preventDefault(); onSave(form); preserveReferenceGroupId(form) }} style={{ display:'grid', gap:16 }}>
      <section style={SECTION}><h2 style={{ marginTop:0 }}>Основное</h2><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12 }}><TextField label="Название блюда" value={form.title} onChange={v => update('title', v)} /><TextField label="Код ТТК" value={form.ttkCode} onChange={v => update('ttkCode', v)} /><TextField label="Категория" value={form.category} onChange={v => update('category', v)} /><TextField label="Цех" value={form.station} onChange={v => update('station', v)} /><TextField label="Выход" value={form.output} onChange={v => update('output', v)} /><Field label="Статус"><select value={form.status} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width:'100%' }}><option value="draft">Черновик</option><option value="in_progress">В работе</option><option value="standard">Эталон</option></select></Field></div></section>
      <section style={SECTION}><h2 style={{ marginTop:0 }}>Фото</h2><FileInput label="Главное фото блюда" accept="image/*" value={form.photo} onChange={v => update('photo', v)} /></section>
      <section style={SECTION}><datalist id="ttk-items">{searchItems.map(item => <option key={`${item.type}-${item.id}`} value={item.name}>{ITEM_TYPE_LABELS[item.type]} · {item.unit || item.output}</option>)}</datalist><div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}><h2 style={{ margin:0 }}>Таблица компонентов</h2><button type="button" onClick={() => update('rows', [...form.rows, { ...EMPTY_ROW, id: crypto.randomUUID?.() || String(Date.now()) }])} style={PRIMARY}>Добавить строку</button></div><div style={{ overflowX:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}><thead><tr>{['Кол-во','Наименование','П/Ф','Описание',''].map(h => <th key={h} style={TH}>{h}</th>)}</tr></thead><tbody>{form.rows.map((row, index) => <tr key={row.id || index}><td style={TD}><input value={row.qty} onChange={e => updateRow(index, 'qty', e.target.value)} style={INPUT} /></td><td style={TD}><input list="ttk-items" value={row.name} onChange={e => selectItem(index, e.target.value)} style={INPUT} />{row.itemType && <div style={{ color:'#64748b', fontSize:11 }}>{ITEM_TYPE_LABELS[row.itemType]}</div>}</td><td style={TD}><textarea value={row.semifinished} onChange={e => updateRow(index, 'semifinished', e.target.value)} style={AREA} /></td><td style={TD}><textarea value={row.description} onChange={e => updateRow(index, 'description', e.target.value)} style={AREA} /></td><td style={TD}><button type="button" onClick={() => update('rows', form.rows.filter((_, i) => i !== index))} style={SEL_ST}>×</button></td></tr>)}</tbody></table></div></section>
      <section style={SECTION}><TextAreaField label="Краткое описание блюда" value={form.description} onChange={v => update('description', v)} /></section><section style={SECTION}><TextAreaField label="Способ приготовления" value={form.cookingMethod} onChange={v => update('cookingMethod', v)} /></section><section style={SECTION}><TextAreaField label="Оформление и подача" value={form.plating} onChange={v => update('plating', v)} /></section><section style={SECTION}><TextAreaField label="Контроль качества" value={form.qualityControl} onChange={v => update('qualityControl', v)} /></section><section style={SECTION}><TextAreaField label="Типичные ошибки" value={form.typicalMistakes} onChange={v => update('typicalMistakes', v)} /></section>
      <section style={SECTION}><h2 style={{ marginTop:0 }}>Файлы</h2><div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}><FileInput label="PDF" accept="application/pdf,.pdf" value={form.files?.pdf} onChange={v => updateFile('pdf', v)} /><FileInput label="XLSX" accept=".xlsx,.xls" value={form.files?.xlsx} onChange={v => updateFile('xlsx', v)} /></div></section>
      <div style={{ display:'flex', gap:8 }}><button type="submit" style={PRIMARY}>Сохранить</button><button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button></div>
    </form>
  )
}

export function ReferenceTtkView({ ttk, onBack, onEdit, onDuplicate, onDelete }) {
  return <div style={{ display:'grid', gap:16 }}><section className="no-print" style={{ ...SECTION, display:'flex', justifyContent:'space-between', gap:12 }}><div><button onClick={onBack} style={SEL_ST}>← Назад</button><h1>{ttk.title || 'Без названия'}</h1><StatusTag status={ttk.status} /></div><div style={{ display:'flex', gap:8, flexWrap:'wrap' }}><button onClick={onEdit} style={PRIMARY}>Редактировать</button><button onClick={() => openPrintableTtk(ttk)} style={SEL_ST}>Скачать ТТК / Печать</button><button onClick={() => downloadBlob(`${ttk.title || 'ttk'}.json`, JSON.stringify(ttk, null, 2), 'application/json')} style={SEL_ST}>JSON</button><button onClick={onDuplicate} style={SEL_ST}>Дублировать</button><button onClick={onDelete} style={{ ...SEL_ST, color:'#dc2626' }}>Удалить</button></div></section><PrintablePage ttk={ttk} /></div>
}

function PrintablePage({ ttk }) {
  return <article className="print-page" style={{ width:'210mm', minHeight:'297mm', background:'#fff', boxShadow:'0 24px 70px rgba(15,23,42,.16)', padding:'12mm', margin:'0 auto' }}><h1 style={{ textAlign:'center', textTransform:'uppercase' }}>{ttk.title || 'Название блюда'}</h1><table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}><thead><tr>{['Кол-во','Наименование','П/Ф','Описание'].map(h => <th key={h} style={PRINT_CELL}>{h}</th>)}</tr></thead><tbody>{ttk.rows.map(row => <tr key={row.id}><td style={PRINT_CELL}>{row.qty}</td><td style={PRINT_CELL}>{row.name}</td><td style={PRINT_CELL}>{row.semifinished}</td><td style={PRINT_CELL}>{row.description}</td></tr>)}</tbody></table><div style={{ margin:'10px 0', fontWeight:900 }}>Выход: {ttk.output || '—'}</div>{ttk.photo?.dataUrl && <img src={ttk.photo.dataUrl} alt={ttk.title} style={{ width:'100%', maxHeight:'70mm', objectFit:'cover', border:'1px solid #111827' }} />}<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>{[['Описание', ttk.description], ['Способ приготовления', ttk.cookingMethod], ['Оформление', ttk.plating], ['Контроль качества', ttk.qualityControl], ['Типичные ошибки', ttk.typicalMistakes]].map(([label, text]) => <section key={label} style={{ border:'1px solid #111827', padding:8 }}><b>{label}</b><div style={{ whiteSpace:'pre-wrap', fontSize:11 }}>{text || '—'}</div></section>)}</div></article>
}

const TH = { textAlign:'left', padding:8, background:'#f8fafc', border:'1px solid #e5e7eb' }
const TD = { padding:6, border:'1px solid #e5e7eb', verticalAlign:'top' }
const AREA = { ...INPUT, minHeight:64, resize:'vertical', fontFamily:'inherit' }
const PRINT_CELL = { border:'1px solid #111827', padding:6, verticalAlign:'top' }
