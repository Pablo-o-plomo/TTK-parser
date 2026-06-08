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
  approved: '#0f766e',
}

const TYPE_LABELS = {
  product: 'Товар',
  semifinished: 'П/Ф',
  sauce: 'Соус',
  prep: 'Заготовка',
  nomenclature: 'Номенклатура',
}

const TYPE_BADGE = {
  product: { label: 'Товар', bg: 'transparent', color: '#6b7280' },
  semifinished: { label: 'П/Ф', bg: 'transparent', color: '#6b7280' },
  sauce: { label: 'Соус', bg: 'transparent', color: '#6b7280' },
  prep: { label: 'Заготовка', bg: 'transparent', color: '#6b7280' },
  nomenclature: { label: 'Номенклатура', bg: 'transparent', color: '#6b7280' },
}

const SECTION = {
  background: '#fff',
  border: '1px solid #ece8df',
  borderRadius: 22,
  padding: 22,
  boxShadow: '0 12px 36px rgba(15,23,42,.06)',
}

const FIELD = { display: 'flex', flexDirection: 'column', gap: 7 }

const INPUT = {
  ...SEL_ST,
  width: '100%',
  boxSizing: 'border-box',
  cursor: 'text',
  borderRadius: 14,
  borderColor: '#e5e1d8',
  background: '#fff',
}

const TEXTAREA = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 120,
  border: '1px solid #e5e1d8',
  borderRadius: 16,
  padding: 14,
  fontSize: 14,
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.6,
  background: '#fff',
}

const PRIMARY = {
  ...SEL_ST,
  background: '#16332b',
  borderColor: '#16332b',
  color: '#fff',
  fontWeight: 900,
  padding: '11px 18px',
  borderRadius: 999,
}


const FOLDER_STORAGE_KEY = 'academy_reference_ttk_folders_v1'
const DEFAULT_FOLDER_ID = 'all'
const UNGROUPED_FOLDER_ID = 'ungrouped'

const FOLDER_BUTTON = {
  ...SEL_ST,
  width: '100%',
  justifyContent: 'space-between',
  textAlign: 'left',
  borderRadius: 14,
  padding: '10px 12px',
}

function canUseLocalStorage() {
  return typeof localStorage !== 'undefined'
}

function makeFolderId() {
  return `folder_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeFolderState(rawState = {}) {
  const folders = Array.isArray(rawState.folders)
    ? rawState.folders
        .filter(folder => folder?.id && folder?.name)
        .map(folder => ({ id: String(folder.id), name: String(folder.name) }))
    : []

  const itemFolders = rawState.itemFolders && typeof rawState.itemFolders === 'object'
    ? Object.fromEntries(
        Object.entries(rawState.itemFolders)
          .filter(([, folderId]) => folders.some(folder => folder.id === folderId))
          .map(([itemId, folderId]) => [String(itemId), String(folderId)]),
      )
    : {}

  return { folders, itemFolders }
}

function readFolderState() {
  if (!canUseLocalStorage()) return { folders: [], itemFolders: {} }

  try {
    return normalizeFolderState(JSON.parse(localStorage.getItem(FOLDER_STORAGE_KEY) || '{}'))
  } catch {
    return { folders: [], itemFolders: {} }
  }
}

function writeFolderState(state) {
  if (!canUseLocalStorage()) return
  localStorage.setItem(FOLDER_STORAGE_KEY, JSON.stringify(normalizeFolderState(state)))
}

const EMPTY_ROW = { name: '', type: 'product', qty: '', semifinished: '', description: '' }

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU')
}

function fileToPayload(file) {
  return new Promise(resolve => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result })
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
    id: row.id || '',
    name: row.name || row.title || '',
    type: row.type || row.source || (row.semifinished ? 'semifinished' : 'product'),
    qty: row.qty || row.quantity || row.amount || '',
    quantity: row.quantity || row.qty || row.amount || '',
  }
}

function normalizeTtk(ttk = {}) {
  const rows = (ttk.rows?.length ? ttk.rows : ttk.ingredients?.length ? ttk.ingredients : [EMPTY_ROW]).map(normalizeRow)
  const image = typeof ttk.image === 'string' ? ttk.image : ttk.image?.dataUrl || ttk.photo?.dataUrl || ''
  const description = ttk.description || ttk.dishDescription || ttk.menuDescription || ttk.descriptionText || ''
  const cookingMethod = ttk.cookingMethod || ttk.technology || ttk.preparationMethod || ttk.method || ''
  const dishStandard = ttk.dishStandard || ttk.standard || ttk.qualityStandard || ''
  const dishware = ttk.dishware || ttk.plate || ttk.dishwareName || ''
  const yieldValue = ttk.yield || ttk.output || ''

  return {
    ...ttk,
    image,
    photo: ttk.photo || (image ? { dataUrl: image } : null),
    yield: yieldValue,
    output: yieldValue,
    assemblyTime: ttk.assemblyTime || ttk.time || '',
    category: ttk.category || '',
    dishware,
    plate: dishware,
    description,
    dishDescription: description,
    cookingMethod,
    technology: cookingMethod,
    dishStandard,
    standard: dishStandard,
    serving: ttk.serving || ttk.presentation || '',
    rows,
    ingredients: rows.map(row => ({
      id: row.id || '',
      name: row.name || '',
      type: row.type || 'product',
      quantity: row.quantity || row.qty || '',
    })),
  }
}

function getTypeBadge(type) {
  return TYPE_BADGE[type] || TYPE_BADGE.nomenclature
}

function textOrDash(value) {
  return value && String(value).trim() ? value : '—'
}

function hasText(value) {
  return Boolean(String(value || '').trim())
}

function normalizeAssemblyTime(value) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^\d+([.,]\d+)?$/.test(text)) return `${text} мин`
  return text
}

function getFilledRows(rows = []) {
  return rows
    .map(normalizeRow)
    .filter(row => hasText(row.name))
}

function makeAiDishPayload(ttk) {
  const normalized = normalizeTtk(ttk)

  return {
    title: normalized.title || '',
    yield: normalized.yield || '',
    assemblyTime: normalized.assemblyTime || normalized.time || '',
    category: normalized.category || '',
    dishware: normalized.dishware || '',
    ingredients: getFilledRows(normalized.ingredients).map(row => ({
      name: row.name,
      type: getTypeBadge(row.type).label,
      quantity: row.qty || '',
    })),
  }
}

function extractJsonObject(value) {
  if (!value) return null
  if (typeof value === 'object') return value

  const text = String(value).trim()
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function normalizeAiResponse(payload) {
  const parsed = extractJsonObject(payload?.output_text || payload?.text || payload)
  const candidate = parsed?.description || parsed?.cookingMethod || parsed?.dishStandard || parsed?.serving
    ? parsed
    : extractJsonObject(parsed?.choices?.[0]?.message?.content || parsed?.output?.[0]?.content?.[0]?.text)

  if (!candidate) return null

  const result = {
    description: String(candidate.description || '').trim(),
    cookingMethod: String(candidate.cookingMethod || '').trim(),
    dishStandard: String(candidate.dishStandard || '').trim(),
    serving: String(candidate.serving || '').trim(),
  }

  return result.description && result.cookingMethod && result.dishStandard && result.serving ? result : null
}

function getAiErrorMessage(error) {
  if (error?.message === 'AI_BACKEND_REQUIRED') return 'AI требует backend endpoint /api/generate-ttk'
  if (error?.message === 'OPENAI_API_KEY_MISSING') return 'OPENAI_API_KEY не настроен. Добавьте ключ в переменные окружения Railway.'
  if (error?.message === 'INVALID_AI_RESPONSE') return 'AI вернул некорректный ответ'
  if (error?.message === 'EMPTY_INGREDIENTS') return 'Добавьте состав блюда перед генерацией'
  return 'Не удалось заполнить ТТК с AI'
}

async function generateTtkWithAI(ttkData) {
  const response = await fetch('/api/generate-ttk', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ttkData),
  })

  if (response.status === 404) throw new Error('AI_BACKEND_REQUIRED')

  let payload = null
  try {
    payload = await response.json()
  } catch {
    throw new Error('AI_BACKEND_REQUIRED')
  }

  if (!response.ok) {
    const message = payload?.error || payload?.message || ''
    if (message.includes('OPENAI_API_KEY') || payload?.code === 'OPENAI_API_KEY_MISSING') {
      throw new Error('OPENAI_API_KEY_MISSING')
    }
    if (message.includes('состав блюда')) throw new Error('EMPTY_INGREDIENTS')
    if (message.includes('некорректный ответ')) throw new Error('INVALID_AI_RESPONSE')
    throw new Error('AI_REQUEST_FAILED')
  }

  const result = normalizeAiResponse(payload)
  if (!result) throw new Error('INVALID_AI_RESPONSE')

  return result
}


function makePrintableHtml(sourceTtk) {
  const ttk = normalizeTtk(sourceTtk)
  const rows = ttk.rows?.length ? ttk.rows : [EMPTY_ROW]

  const rowsHtml = rows.map(row => {
    const cleanRow = normalizeRow(row)
    const badge = getTypeBadge(cleanRow.type)

    return `
      <tr>
        <td>${escapeHtml(cleanRow.name)}</td>
        <td class="muted">${escapeHtml(badge.label)}</td>
        <td class="qty">${escapeHtml(cleanRow.qty)}</td>
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
  @page{size:A4;margin:0}
  *{box-sizing:border-box}
  body{margin:0;background:#f4efe7;font-family:Inter,Manrope,Arial,Helvetica,sans-serif;color:#1f2937}
  .page{width:210mm;height:297mm;margin:0 auto;background:#faf8f5;padding:8mm;display:flex;flex-direction:column;position:relative;overflow:hidden}
  .page:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 10% 12%,rgba(22,51,43,.06),transparent 25%),radial-gradient(circle at 88% 4%,rgba(185,145,80,.08),transparent 22%);pointer-events:none}
  .content{position:relative;z-index:1;display:flex;flex-direction:column;gap:3mm;height:100%}
  .kicker{font-size:8.5px;letter-spacing:.2em;text-transform:uppercase;color:#7a6f62;font-weight:800;text-align:center;line-height:1.1}
  h1{margin:0;text-align:center;font-size:22px;line-height:1.05;color:#16332b;letter-spacing:-.03em;font-weight:900}
  .photo-wrap{width:100%;height:60mm;overflow:hidden;border-radius:18px;box-shadow:0 10px 28px rgba(31,41,55,.12);background:#eee7dc;flex:0 0 auto}
  .dish-photo{width:100%;height:100%;object-fit:cover;display:block}
  .photo-placeholder{height:100%;display:flex;align-items:center;justify-content:center;color:#8b8174;font-size:14px;background:#eee7dc}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;flex:0 0 auto}
  .meta-card{background:#fff;border:1px solid #ece8df;border-radius:12px;padding:7px 8px;box-shadow:0 3px 10px rgba(31,41,55,.035);min-width:0}
  .meta-label{font-size:8px;text-transform:uppercase;letter-spacing:.1em;color:#8b8174;font-weight:800;margin-bottom:2px;line-height:1.1}
  .meta-value{font-size:11px;line-height:1.2;color:#1f2937;font-weight:900;word-break:break-word}
  .main-grid{display:grid;grid-template-columns:.92fr 1.08fr;gap:7px;align-items:start;min-height:0}
  .left-stack{display:flex;flex-direction:column;gap:7px;min-height:0}
  .bottom-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;align-items:start;min-height:0}
  .block{background:#fff;border:1px solid #ece8df;border-radius:14px;padding:8px 9px;box-shadow:0 5px 14px rgba(31,41,55,.035);min-width:0;break-inside:avoid}
  h2{margin:0 0 5px;font-size:12px;line-height:1.15;color:#16332b;letter-spacing:-.01em}
  .text{font-size:10.5px;line-height:1.38;color:#374151;white-space:pre-wrap}
  table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px;line-height:1.22}
  th{padding:5px 6px;background:#f8f6f2;border-bottom:1px solid #ebe7de;text-align:left;font-size:8px;text-transform:uppercase;letter-spacing:.06em;color:#8b8174}
  td{padding:5px 6px;border-bottom:1px solid #f0ede6;vertical-align:middle;word-break:break-word;color:#1f2937}
  th:nth-child(1),td:nth-child(1){width:58%;font-weight:800}
  th:nth-child(2),td:nth-child(2){width:18%;text-align:center}
  th:nth-child(3),td:nth-child(3){width:24%;text-align:center}
  .muted{color:#6b7280;font-weight:600}
  .qty{font-weight:900}
  @media print{body{background:#fff}.page{margin:0;width:210mm;height:297mm;box-shadow:none}}
</style>
</head>
<body>
<main class="page">
  <div class="content">
    <div class="kicker">Клёво · стандарт блюда</div>
    <h1>${escapeHtml(ttk.title || 'Название блюда')}</h1>
    <div class="photo-wrap">${photoHtml}</div>

    <div class="meta">
      <div class="meta-card"><div class="meta-label">Выход</div><div class="meta-value">${escapeHtml(ttk.yield || ttk.output || '—')}</div></div>
      <div class="meta-card"><div class="meta-label">Сборка</div><div class="meta-value">${escapeHtml(ttk.assemblyTime || ttk.time || '—')}</div></div>
      <div class="meta-card"><div class="meta-label">Категория</div><div class="meta-value">${escapeHtml(ttk.category || '—')}</div></div>
      <div class="meta-card"><div class="meta-label">Посуда</div><div class="meta-value">${escapeHtml(ttk.dishware || ttk.plate || '—')}</div></div>
    </div>

    <div class="main-grid">
      <div class="left-stack">
        <section class="block">
          <h2>Описание блюда</h2>
          <div class="text">${escapeHtml(textOrDash(ttk.dishDescription))}</div>
        </section>

        <section class="block">
          <h2>Способ приготовления</h2>
          <div class="text">${escapeHtml(textOrDash(ttk.technology))}</div>
        </section>
      </div>

      <section class="block">
        <h2>Состав блюда</h2>
        <table>
          <thead><tr><th>Наименование</th><th>Тип</th><th>Кол-во</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </section>
    </div>

    <div class="bottom-grid">
      <section class="block">
        <h2>Стандарт блюда</h2>
        <div class="text">${escapeHtml(textOrDash(ttk.dishStandard || ttk.standard))}</div>
      </section>

      <section class="block">
        <h2>Подача</h2>
        <div class="text">${escapeHtml(textOrDash(ttk.serving))}</div>
      </section>
    </div>
  </div>
</main>
</body>
</html>`
}

function TtkStatus({ status }) {
  return <Tag color={STATUS_COLORS[status] || '#64748b'}>{STATUS_LABELS[status] || status}</Tag>
}

function Photo({ file, label, large = false }) {
  return (
    <div style={{
      background: '#f3efe7',
      border: '1px dashed #d8d0c3',
      borderRadius: large ? 24 : 18,
      minHeight: large ? 260 : 150,
      height: large ? 320 : '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {file?.dataUrl ? (
        <img src={file.dataUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: '#8b8174', fontSize: 13 }}>{label}</span>
      )}
    </div>
  )
}

export function ReferenceTtkList({ items, onOpen, onEdit, onCreate, onDownload }) {
  const [folderState, setFolderState] = useState(readFolderState)
  const [selectedFolderId, setSelectedFolderId] = useState(DEFAULT_FOLDER_ID)

  const folderCounts = useMemo(() => {
    return items.reduce((counts, item) => {
      const folderId = folderState.itemFolders[item.id] || UNGROUPED_FOLDER_ID
      counts[folderId] = (counts[folderId] || 0) + 1
      return counts
    }, { [DEFAULT_FOLDER_ID]: items.length, [UNGROUPED_FOLDER_ID]: 0 })
  }, [items, folderState.itemFolders])

  const visibleItems = useMemo(() => {
    if (selectedFolderId === DEFAULT_FOLDER_ID) return items

    return items.filter(item => {
      const folderId = folderState.itemFolders[item.id] || UNGROUPED_FOLDER_ID
      return folderId === selectedFolderId
    })
  }, [items, folderState.itemFolders, selectedFolderId])

  function saveFolderState(updater) {
    setFolderState(current => {
      const next = normalizeFolderState(typeof updater === 'function' ? updater(current) : updater)
      writeFolderState(next)
      return next
    })
  }

  function createFolder() {
    const name = window.prompt('Название папки для карточек ТТК')?.trim()
    if (!name) return

    const folder = { id: makeFolderId(), name }
    saveFolderState(current => ({ ...current, folders: [...current.folders, folder] }))
    setSelectedFolderId(folder.id)
  }

  function renameFolder(folder) {
    const name = window.prompt('Новое название папки', folder.name)?.trim()
    if (!name || name === folder.name) return

    saveFolderState(current => ({
      ...current,
      folders: current.folders.map(item => item.id === folder.id ? { ...item, name } : item),
    }))
  }

  function deleteFolder(folder) {
    if (!window.confirm(`Удалить папку «${folder.name}»? Карточки останутся в разделе «Без папки».`)) return

    saveFolderState(current => ({
      folders: current.folders.filter(item => item.id !== folder.id),
      itemFolders: Object.fromEntries(
        Object.entries(current.itemFolders).filter(([, folderId]) => folderId !== folder.id),
      ),
    }))

    if (selectedFolderId === folder.id) setSelectedFolderId(DEFAULT_FOLDER_ID)
  }

  function setItemFolder(itemId, folderId) {
    saveFolderState(current => {
      const itemFolders = { ...current.itemFolders }

      if (!folderId) {
        delete itemFolders[itemId]
      } else {
        itemFolders[itemId] = folderId
      }

      return { ...current, itemFolders }
    })
  }

  function FolderButton({ id, name, count }) {
    const active = selectedFolderId === id

    return (
      <button
        type="button"
        onClick={() => setSelectedFolderId(id)}
        style={{
          ...FOLDER_BUTTON,
          background: active ? '#16332b' : '#fff',
          borderColor: active ? '#16332b' : '#e5e1d8',
          color: active ? '#fff' : '#334155',
          fontWeight: active ? 900 : 800,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
        <span style={{ color: active ? 'rgba(255,255,255,.78)' : '#94a3b8', fontSize: 12 }}>{count || 0}</span>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ ...SECTION, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: '#faf8f5' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 32, color: '#16332b', letterSpacing: '-.03em' }}>Карточки блюд</h1>
          <div style={{ color: '#6b7280', fontSize: 14 }}>Премиальные карточки A4 для кухни: фото, состав, способ приготовления, стандарт блюда и подача.</div>
        </div>
        <button onClick={onCreate} style={PRIMARY}>Создать карточку</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px minmax(0,1fr)', gap: 18, alignItems: 'start' }}>
        <aside style={{ ...SECTION, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              <h2 style={{ margin: 0, color: '#16332b', fontSize: 18 }}>Папки</h2>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>Группировка эталонных ТТК</div>
            </div>
            <button type="button" onClick={createFolder} style={{ ...SEL_ST, borderRadius: 999, fontWeight: 900 }}>+</button>
          </div>

          <FolderButton id={DEFAULT_FOLDER_ID} name="Все карточки" count={folderCounts[DEFAULT_FOLDER_ID]} />
          <FolderButton id={UNGROUPED_FOLDER_ID} name="Без папки" count={folderCounts[UNGROUPED_FOLDER_ID]} />

          {folderState.folders.length > 0 && <div style={{ height: 1, background: '#f0ede6', margin: '2px 0' }} />}

          {folderState.folders.map(folder => (
            <div key={folder.id} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto auto', gap: 6, alignItems: 'center' }}>
              <FolderButton id={folder.id} name={folder.name} count={folderCounts[folder.id]} />
              <button type="button" onClick={() => renameFolder(folder)} title="Переименовать папку" style={{ ...SEL_ST, padding: '9px 10px' }}>✎</button>
              <button type="button" onClick={() => deleteFolder(folder)} title="Удалить папку" style={{ ...SEL_ST, padding: '9px 10px', color: '#dc2626', borderColor: '#fecaca' }}>×</button>
            </div>
          ))}

          {folderState.folders.length === 0 && (
            <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5, padding: '4px 2px' }}>
              Создайте папки для меню, цехов или категорий блюд — карточки можно будет разложить через список.
            </div>
          )}
        </aside>

        <div style={{ minWidth: 0 }}>
          {items.length === 0 ? (
            <div style={{ ...SECTION, textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 46 }}>📄</div>
              <h2 style={{ margin: '8px 0', color: '#16332b' }}>Пока нет карточек блюд</h2>
              <p style={{ color: '#64748b' }}>Создайте первую карточку: название, фото, состав блюда, способ приготовления и подача.</p>
              <button onClick={onCreate} style={PRIMARY}>Создать первую карточку</button>
            </div>
          ) : visibleItems.length === 0 ? (
            <div style={{ ...SECTION, textAlign: 'center', padding: 42 }}>
              <div style={{ fontSize: 40 }}>🗂️</div>
              <h2 style={{ margin: '8px 0', color: '#16332b' }}>В этой папке пока пусто</h2>
              <p style={{ color: '#64748b' }}>Назначьте папку на карточке или выберите другой раздел слева.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 18 }}>
              {visibleItems.map(rawItem => {
                const item = normalizeTtk(rawItem)
                const itemFolderId = folderState.itemFolders[item.id] || ''

                return (
                  <div key={item.id} style={{ ...SECTION, padding: 0, overflow: 'hidden', transition: '.25s' }}>
                    <div style={{ height: 190, background: '#f3efe7' }}>
                      <Photo file={item.photo} label="Фото блюда" />
                    </div>
                    <div style={{ padding: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: 19, color: '#16332b', letterSpacing: '-.02em' }}>{item.title || 'Без названия'}</h3>
                        <TtkStatus status={item.status} />
                      </div>
                      <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.7 }}>
                        Выход: {item.output || '—'}<br />
                        Строк: {item.rows?.length || 0} · обновлено {formatDate(item.updatedAt)}
                      </div>
                      <label style={{ ...FIELD, marginTop: 12 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>Папка</span>
                        <select value={itemFolderId} onChange={e => setItemFolder(item.id, e.target.value)} style={{ ...SEL_ST, width: '100%', borderRadius: 14 }}>
                          <option value="">Без папки</option>
                          {folderState.folders.map(folder => (
                            <option key={folder.id} value={folder.id}>{folder.name}</option>
                          ))}
                        </select>
                      </label>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14 }}>
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
      </div>
    </div>
  )
}

function FileInput({ label, accept, value, onChange }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{label}</span>
      <input type="file" accept={accept} onChange={async e => onChange(await fileToPayload(e.target.files?.[0]))} style={{ fontSize: 12 }} />
      {value?.name && <span style={{ fontSize: 11, color: '#64748b' }}>Загружено: {value.name}</span>}
    </label>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{label}</span>
      <input value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={INPUT} />
    </label>
  )
}

function TextAreaField({ label, value, onChange, placeholder, minHeight }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{label}</span>
      <textarea value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ ...TEXTAREA, minHeight: minHeight || TEXTAREA.minHeight }} />
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
  const [aiStatus, setAiStatus] = useState('idle')
  const [aiMessage, setAiMessage] = useState('')
  const [showAiReplaceConfirm, setShowAiReplaceConfirm] = useState(false)

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

  function hasFilledAiTextBlocks() {
    return hasText(form.description) || hasText(form.cookingMethod) || hasText(form.dishStandard) || hasText(form.serving)
  }

  async function fillTextBlocksWithAi() {
    const dish = makeAiDishPayload(form)

    if (dish.ingredients.length === 0) {
      setAiStatus('error')
      setAiMessage('Добавьте состав блюда перед генерацией')
      return
    }

    setAiStatus('loading')
    setAiMessage('')
    setShowAiReplaceConfirm(false)

    try {
      const aiText = await generateTtkWithAI(dish)
      if (!aiText) throw new Error('INVALID_AI_RESPONSE')

      setForm(current => ({
        ...current,
        description: aiText.description,
        cookingMethod: aiText.cookingMethod,
        dishStandard: aiText.dishStandard,
        serving: aiText.serving,
      }))
      setAiStatus('success')
      setAiMessage('Текстовые блоки заполнены. Их можно отредактировать вручную.')
    } catch (error) {
      setAiStatus('error')
      setAiMessage(getAiErrorMessage(error))
    }
  }

  function handleAiFillClick() {
    setAiMessage('')

    if (hasFilledAiTextBlocks()) {
      setShowAiReplaceConfirm(true)
      return
    }

    fillTextBlocksWithAi()
  }

  function saveForm() {
    onSave({
      ...form,
      assemblyTime: normalizeAssemblyTime(form.assemblyTime || form.time || ''),
    })
  }

  return (
    <form onSubmit={e => { e.preventDefault(); saveForm() }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ ...SECTION, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: '#faf8f5' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 25, color: '#16332b', letterSpacing: '-.03em' }}>Создать карточку блюда</h1>
          <div style={{ color: '#64748b', fontSize: 14 }}>Фото, состав блюда, описание, способ приготовления, стандарт блюда и подача. Без брутто/нетто.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleAiFillClick} disabled={aiStatus === 'loading'} style={{ ...PRIMARY, opacity: aiStatus === 'loading' ? .72 : 1 }}>
            {aiStatus === 'loading' ? 'Заполняю…' : '✨ Заполнить с AI'}
          </button>
          <button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button>
          <button type="submit" style={PRIMARY}>Сохранить</button>
        </div>
      </div>

      {(showAiReplaceConfirm || aiMessage) && (
        <section style={{
          ...SECTION,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 12,
          borderColor: showAiReplaceConfirm ? '#fde68a' : aiStatus === 'error' ? '#fecaca' : '#bbf7d0',
          background: showAiReplaceConfirm ? '#fffbeb' : aiStatus === 'error' ? '#fef2f2' : '#f0fdf4',
        }}>
          <div style={{ color: showAiReplaceConfirm ? '#92400e' : aiStatus === 'error' ? '#b91c1c' : '#166534', fontWeight: 800 }}>
            {showAiReplaceConfirm ? 'Текстовые блоки уже заполнены. Заменить их текстом от AI?' : aiMessage}
          </div>
          {showAiReplaceConfirm && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={fillTextBlocksWithAi} style={PRIMARY}>Заменить</button>
              <button type="button" onClick={() => setShowAiReplaceConfirm(false)} style={SEL_ST}>Отмена</button>
            </div>
          )}
        </section>
      )}

      <section style={SECTION}>
        <h2 style={{ marginTop: 0, color: '#16332b' }}>Основное</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 180px', gap: 12 }}>
          <TextField label="Название блюда" value={form.title} onChange={v => update('title', v)} />
          <TextField label="Выход" value={form.yield} onChange={v => update('yield', v)} placeholder="287 г" />
          <TextField label="Время сборки" value={form.assemblyTime || form.time || ''} onChange={v => update('assemblyTime', v)} placeholder="8 мин" />
          <TextField label="Категория" value={form.category} onChange={v => update('category', v)} placeholder="Салаты" />
          <TextField label="Посуда" value={form.dishware} onChange={v => update('dishware', v)} placeholder="Тарелка 28 см" />
          <label style={FIELD}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Статус</span>
            <select value={form.status} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width: '100%' }}>
              <option value="draft">Черновик</option>
              <option value="approved">Готова к печати</option>
            </select>
          </label>
        </div>
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop: 0, color: '#16332b' }}>Фото блюда</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,460px) 1fr', gap: 18, alignItems: 'center' }}>
          <Photo file={form.photo} label="Большое фото подачи блюда" large />
          <FileInput label="Загрузить фото блюда" accept="image/*" value={form.photo} onChange={v => update('photo', v)} />
        </div>
      </section>

      <section style={SECTION}>
        <TextAreaField
          label="Описание блюда"
          value={form.description}
          onChange={v => update('description', v)}
          minHeight={90}
          placeholder="Краткое гастрономическое описание для официанта и повара: вкус, текстура, акценты блюда."
        />
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

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', color: '#16332b' }}>Состав блюда</h2>
            <div style={{ color: '#64748b', fontSize: 13 }}>Три колонки: наименование, тип и количество. Типы не выделяем яркими цветами.</div>
          </div>
          <button type="button" onClick={() => update('rows', [...(form.rows || []), { ...EMPTY_ROW }])} style={PRIMARY}>Добавить строку</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Наименование', 'Тип', 'Кол-во', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: 10, background: '#f8f6f2', borderBottom: '1px solid #ebe7de', color: '#6b7280' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(form.rows || []).map((row, index) => {
                const cleanRow = normalizeRow(row)
                const item = nomenclatureByName.get(cleanRow.name?.trim().toLowerCase())
                const unit = item?.unit || 'г'

                return (
                  <tr key={index}>
                    <td style={{ ...TD, width: '55%' }}>
                      <input
                        list="nomenclature-options"
                        placeholder="Киноа отварная п/ф"
                        value={cleanRow.name}
                        onChange={e => selectNomenclature(index, e.target.value)}
                        style={INPUT}
                      />
                      {cleanRow.name && !nomenclatureByName.has(cleanRow.name.trim().toLowerCase()) && (
                        <button type="button" onClick={() => addRowToNomenclature(cleanRow)} style={{ ...SEL_ST, marginTop: 6, fontSize: 11 }}>
                          Добавить в номенклатуру
                        </button>
                      )}
                    </td>
                    <td style={{ ...TD, width: '18%' }}>
                      <select value={cleanRow.type} onChange={e => updateRow(index, 'type', e.target.value)} style={{ ...SEL_ST, width: '100%', color: '#6b7280', fontWeight: 700 }}>
                        <option value="product">Товар</option>
                        <option value="semifinished">П/Ф</option>
                        <option value="sauce">Соус</option>
                        <option value="prep">Заготовка</option>
                      </select>
                    </td>
                    <td style={{ ...TD, width: '20%' }}>
                      <input
                        placeholder={`80 ${unit}`}
                        value={cleanRow.qty}
                        onChange={e => updateRow(index, 'qty', e.target.value)}
                        style={INPUT}
                      />
                    </td>
                    <td style={{ ...TD, width: '7%' }}>
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
        <h2 style={{ marginTop: 0, color: '#16332b' }}>Способ приготовления</h2>
        <TextAreaField
          label="Текст для повара"
          value={form.cookingMethod}
          onChange={v => update('cookingMethod', v)}
          placeholder="1. Подготовить ингредиенты согласно рецептуре.\n2. Собрать блюдо в нужной последовательности.\n3. Проверить внешний вид, текстуру и температуру подачи."
        />
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop: 0, color: '#16332b' }}>Стандарт блюда</h2>
        <TextAreaField
          label="Критические точки"
          value={form.dishStandard}
          onChange={v => update('dishStandard', v)}
          placeholder="• Текстура должна соответствовать стандарту.\n• Зелень свежая, без потемнения.\n• Соус не должен растекаться по борту тарелки.\n• Блюдо подаётся сразу после приготовления."
        />
      </section>

      <section style={SECTION}>
        <h2 style={{ marginTop: 0, color: '#16332b' }}>Подача</h2>
        <TextAreaField
          label="Финальная сервировка"
          value={form.serving}
          onChange={v => update('serving', v)}
          placeholder="Описание расположения ингредиентов, декора, посуды и финального внешнего вида блюда."
        />
      </section>
    </form>
  )
}

const TD = { padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top' }

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ ...SECTION, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', background: '#faf8f5' }}>
        <div>
          <button onClick={onBack} style={{ ...SEL_ST, marginBottom: 12 }}>← Карточки блюд</button>
          <div><TtkStatus status={ttk.status} /></div>
          <h1 style={{ margin: '10px 0 6px', fontSize: 25, color: '#16332b', letterSpacing: '-.03em' }}>{ttk.title || 'Без названия'}</h1>
          <div style={{ color: '#64748b' }}>
            Выход: {ttk.yield || ttk.output || '—'} · сборка: {ttk.assemblyTime || ttk.time || '—'} · строк: {ttk.rows?.length || 0} · обновлено {formatDate(ttk.updatedAt)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button onClick={onEdit} style={PRIMARY}>Редактировать</button>
          <button onClick={printTtk} style={SEL_ST}>Скачать / Печать</button>
          <button onClick={downloadJson} style={SEL_ST}>Скачать JSON</button>
          <button onClick={onDuplicate} style={SEL_ST}>Дублировать</button>
          <button onClick={onDelete} style={{ ...SEL_ST, color: '#dc2626', borderColor: '#fecaca' }}>Удалить</button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', overflow: 'auto', padding: '16px 0 32px' }}>
        <PrintablePage ttk={ttk} />
      </div>
    </div>
  )
}

function PrintablePage({ ttk: rawTtk }) {
  const ttk = normalizeTtk(rawTtk)

  return (
    <article style={PRINT_PAGE}>
      <div style={PRINT_BG_1} />
      <div style={PRINT_BG_2} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '4mm' }}>
        <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: '#7a6f62', fontWeight: 800 }}>
          Клёво · стандарт блюда
        </div>

        <h1 style={PRINT_TITLE}>{ttk.title || 'Название блюда'}</h1>

        <div style={PRINT_PHOTO_WRAP}>
          {ttk.photo?.dataUrl ? (
            <img src={ttk.photo.dataUrl} alt={ttk.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b8174', background: '#eee7dc', fontSize: 18 }}>
              Фото блюда
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          <MetaCard label="Выход" value={ttk.yield || ttk.output || '—'} />
          <MetaCard label="Сборка" value={ttk.assemblyTime || ttk.time || '—'} />
          <MetaCard label="Категория" value={ttk.category || '—'} />
          <MetaCard label="Посуда" value={ttk.dishware || ttk.plate || '—'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '.95fr 1.05fr', gap: 12, alignItems: 'start' }}>
          <PrintBlock title="Описание блюда">
            <div style={PRINT_TEXT}>{textOrDash(ttk.description || ttk.dishDescription)}</div>
          </PrintBlock>

          <PrintBlock title="Состав блюда">
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 11, lineHeight: 1.3 }}>
              <thead>
                <tr>
                  <th style={{ ...PRINT_TH, width: '58%' }}>Наименование</th>
                  <th style={{ ...PRINT_TH, width: '18%', textAlign: 'center' }}>Тип</th>
                  <th style={{ ...PRINT_TH, width: '24%', textAlign: 'center' }}>Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {(ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map((row, index) => {
                  const cleanRow = normalizeRow(row)
                  const badge = getTypeBadge(cleanRow.type)

                  return (
                    <tr key={index}>
                      <td style={{ ...PRINT_TD, fontWeight: 800 }}>{cleanRow.name}</td>
                      <td style={{ ...PRINT_TD, textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>{badge.label}</td>
                      <td style={{ ...PRINT_TD, textAlign: 'center', fontWeight: 900 }}>{cleanRow.qty}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </PrintBlock>

          <div style={{ gridColumn: '1 / -1' }}>
            <PrintBlock title="Способ приготовления">
              <div style={PRINT_TEXT}>{textOrDash(ttk.cookingMethod || ttk.technology)}</div>
            </PrintBlock>
          </div>

          <PrintBlock title="Стандарт блюда">
            <div style={PRINT_TEXT}>{textOrDash(ttk.dishStandard || ttk.standard)}</div>
          </PrintBlock>

          <PrintBlock title="Подача">
            <div style={PRINT_TEXT}>{textOrDash(ttk.serving)}</div>
          </PrintBlock>
        </div>
      </div>
    </article>
  )
}

function MetaCard({ label, value }) {
  return (
    <div style={META_BOX}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em', color: '#8b8174', fontWeight: 800, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1f2937', fontWeight: 900 }}>{value}</div>
    </div>
  )
}

function PrintBlock({ title, children }) {
  return (
    <section style={PRINT_BLOCK}>
      <h2 style={PRINT_H2}>{title}</h2>
      {children}
    </section>
  )
}

const PRINT_PAGE = {
  width: '210mm',
  minHeight: '297mm',
  background: '#faf8f5',
  boxShadow: '0 24px 70px rgba(15,23,42,.16)',
  padding: '10mm',
  display: 'flex',
  flexDirection: 'column',
  gap: '4mm',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'Inter, Manrope, Arial, sans-serif',
}

const PRINT_BG_1 = {
  position: 'absolute',
  width: 260,
  height: 260,
  borderRadius: 999,
  background: 'rgba(22,51,43,.055)',
  top: -80,
  left: -80,
}

const PRINT_BG_2 = {
  position: 'absolute',
  width: 280,
  height: 280,
  borderRadius: 999,
  background: 'rgba(185,145,80,.08)',
  top: -100,
  right: -120,
}

const PRINT_TITLE = {
  margin: 0,
  textAlign: 'center',
  fontSize: 25,
  lineHeight: 1.08,
  color: '#16332b',
  letterSpacing: '-.03em',
  fontWeight: 900,
}

const PRINT_PHOTO_WRAP = {
  width: '100%',
  height: '78mm',
  border: 'none',
  borderRadius: 24,
  overflow: 'hidden',
  boxShadow: '0 16px 42px rgba(31,41,55,.14)',
  background: '#eee7dc',
}

const META_BOX = {
  background: '#ffffff',
  border: '1px solid #ece8df',
  borderRadius: 16,
  padding: '10px 12px',
  boxShadow: '0 4px 14px rgba(31,41,55,.04)',
  minWidth: 0,
}

const PRINT_BLOCK = {
  background: '#fff',
  border: '1px solid #ece8df',
  borderRadius: 20,
  padding: 10,
  boxShadow: '0 8px 24px rgba(31,41,55,.045)',
}

const PRINT_H2 = {
  margin: '0 0 12px',
  fontSize: 14,
  fontWeight: 800,
  color: '#16332b',
  letterSpacing: '-.01em',
  textTransform: 'none',
}

const PRINT_TH = {
  padding: '9px 8px',
  background: '#f8f6f2',
  borderBottom: '1px solid #ebe7de',
  border: 'none',
  textAlign: 'left',
  fontSize: 10,
  color: '#8b8174',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
}

const PRINT_TD = {
  padding: '10px 8px',
  borderBottom: '1px solid #f0ede6',
  borderLeft: 'none',
  borderRight: 'none',
  borderTop: 'none',
  verticalAlign: 'middle',
  wordBreak: 'break-word',
  fontSize: 11,
  color: '#1f2937',
}

const PRINT_TEXT = {
  fontSize: 11.5,
  lineHeight: 1.65,
  color: '#374151',
  whiteSpace: 'pre-wrap',
}

