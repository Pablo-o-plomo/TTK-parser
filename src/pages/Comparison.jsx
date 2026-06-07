import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { REST_BG, REST_COLOR, CAT_ICONS, STA_ICONS } from '../constants.js'
import {
  APPROVAL_STATUS,
  FIELD_LABELS,
  NETWORK_RESTAURANTS,
  REQUIRED_MATERIALS,
  STATUS_COLORS,
  STATUS_LABELS,
  buildDishGroups,
  getComparisonRows,
} from '../domain/workflow.js'

const TAB_ST = active => ({
  padding:'10px 14px', border:'none', borderBottom:`3px solid ${active ? '#6366f1' : 'transparent'}`,
  background:'transparent', color:active ? '#4f46e5' : '#64748b', fontWeight:800, cursor:'pointer', fontSize:13,
})

const BTN_PRIMARY = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900, padding:'11px 16px' }

function emptyText(text = 'Данных пока нет') {
  return <span style={{ color:'#94a3b8', fontStyle:'italic' }}>{text}</span>
}

function statusText(row) {
  if (row.status === 'reference') return 'Эталон'
  if (row.status === 'no_data') return 'Нет данных'
  return STATUS_LABELS[row.task?.status || row.status] || 'Новая'
}

function diffLabels(row) {
  if (row.missing) return ['Нет данных ресторана']
  const labels = []
  if (row.diffs.some(d => d.field === 'output')) labels.push('Выход отличается')
  if (row.diffs.some(d => d.field === 'photos')) labels.push('Нет фото')
  if (row.diffs.some(d => d.field === 'technology')) labels.push('Нет технологии')
  if (row.diffs.some(d => d.field === 'components' || d.field === 'componentsCount')) labels.push('Разные ПФ')
  row.diffs.forEach(diff => { if (!labels.includes(diff.label) && labels.length < 6) labels.push(diff.label) })
  return labels
}

function TtkCard({ dish, title = 'Эталонная ТТК' }) {
  if (!dish) {
    return <div style={{ padding:18, background:'#f8fafc', borderRadius:12, color:'#94a3b8' }}>Данных пока нет</div>
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div>
        <div style={{ fontSize:11, fontWeight:900, color:'#64748b', textTransform:'uppercase', letterSpacing:.7 }}>{title}</div>
        <h2 style={{ margin:'4px 0 8px', fontSize:24, color:'#0f172a' }}>{dish.name}</h2>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <Tag color={REST_COLOR[dish.restaurant] || '#6366f1'} bg={REST_BG[dish.restaurant] || '#eef2ff'}>{dish.restaurant}</Tag>
          <Tag color="#334155" bg="#f1f5f9">Код: {dish.code || '—'}</Tag>
          <Tag color="#16a34a" bg="#f0fdf4">{STATUS_LABELS[dish.approvalStatus] || 'Новая'}</Tag>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
        {[
          ['Категория', `${CAT_ICONS[dish.category] || '🍴'} ${dish.category || '—'}`],
          ['Цех', `${STA_ICONS[dish.station] || '🏷️'} ${dish.station || '—'}`],
          ['Выход', dish.output ? `${dish.output} г/ед.` : '—'],
          ['Дата обновления', dish.date || '—'],
        ].map(([label, value]) => (
          <div key={label} style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:10, padding:12 }}>
            <div style={{ fontSize:10, color:'#64748b', fontWeight:800, textTransform:'uppercase' }}>{label}</div>
            <div style={{ fontSize:14, color:'#0f172a', fontWeight:800, marginTop:4 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <InfoList title="Полуфабрикаты" items={dish.components} empty="Полуфабрикаты не указаны" />
        <InfoList title="Ингредиенты" items={dish.ingredients} empty="Ингредиенты не загружены" />
      </div>

      <div style={{ background:'#fffbeb', border:'1px dashed #fbbf24', borderRadius:12, padding:14 }}>
        <div style={{ fontSize:12, fontWeight:900, color:'#92400e', marginBottom:6 }}>Технология приготовления</div>
        <div style={{ fontSize:13, color:'#92400e', whiteSpace:'pre-wrap', lineHeight:1.5 }}>{dish.technology || 'Технология не загружена'}</div>
      </div>
    </div>
  )
}

function InfoList({ title, items = [], empty }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:14 }}>
      <div style={{ fontSize:12, fontWeight:900, color:'#334155', marginBottom:8 }}>{title}</div>
      {items?.length ? <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{items.map((item, i) => <Tag key={`${item}-${i}`} xs color="#0891b2">{item}</Tag>)}</div> : emptyText(empty)}
    </div>
  )
}

function FileGallery({ dish }) {
  const photos = [...(dish?.photos || []), ...(dish?.pfPhotos || [])]
  if (!photos.length) return <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:18 }}>{emptyText('Фото пока не загружены')}</div>
  return <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>{photos.map((src, i) => <a key={i} href={src} target="_blank" rel="noreferrer" style={{ color:'#2563eb', fontSize:12, wordBreak:'break-word', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>{src}</a>)}</div>
}

function TaskCreatedModal({ task, onClose }) {
  const url = `${window.location.origin}/task/${task.id}`
  const [copied, setCopied] = useState(false)
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:560, background:'#fff', borderRadius:18, padding:24, boxShadow:'0 24px 80px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize:38 }}>✅</div>
        <h2 style={{ margin:'8px 0', color:'#0f172a' }}>Задание создано</h2>
        <div style={{ fontSize:13, color:'#64748b', marginBottom:12 }}>Ссылка для ресторана:</div>
        <a href={url} target="_blank" rel="noreferrer" style={{ display:'block', background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:10, padding:12, color:'#2563eb', wordBreak:'break-all', fontWeight:800 }}>{url}</a>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:16 }}>
          <button onClick={() => { navigator.clipboard?.writeText(url); setCopied(true) }} style={BTN_PRIMARY}>{copied ? 'Скопировано' : 'Скопировать ссылку'}</button>
          <button onClick={onClose} style={{ ...SEL_ST, padding:'11px 16px' }}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}

function CreateTaskPanel({ group, row, referenceDish, onCreate }) {
  const [comment, setComment] = useState('')
  const [dueDate, setDueDate] = useState('')
  const checks = diffLabels(row)
  return (
    <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:14, padding:16 }}>
      <div style={{ fontSize:15, fontWeight:900, color:'#92400e', marginBottom:10 }}>Создать задание для {row.restaurant}</div>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>{checks.map(item => <Tag key={item} xs color="#d97706">{item}</Tag>)}</div>
      <div style={{ display:'grid', gridTemplateColumns:'180px 1fr auto', gap:8, alignItems:'start' }}>
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={SEL_ST} />
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} placeholder="Комментарий бренд-шефа" style={{ border:'1.5px solid #e5e7eb', borderRadius:10, padding:10, fontSize:12 }} />
        <button onClick={() => onCreate({
          restaurant: row.restaurant,
          dishKey: group.key,
          dishId: row.version?.id,
          dishName: group.name,
          referenceDish,
          checks,
          comment,
          dueDate,
          requiredMaterials: REQUIRED_MATERIALS.map(item => item.id),
        })} style={BTN_PRIMARY}>Создать задание</button>
      </div>
    </div>
  )
}

export default function Comparison({ dishes, tasks, manualLinks, addManualLink, createTask, referenceRestaurant, setReferenceRestaurant }) {
  const [q, setQ] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const [tab, setTab] = useState('reference')
  const [openedVersion, setOpenedVersion] = useState(null)
  const [taskRestaurant, setTaskRestaurant] = useState('')
  const [createdTask, setCreatedTask] = useState(null)
  const [showManual, setShowManual] = useState(false)
  const [linkRestaurant, setLinkRestaurant] = useState('Ростов')
  const [linkDishId, setLinkDishId] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [onlyDiffs, setOnlyDiffs] = useState(false)

  const groups = useMemo(() => buildDishGroups(dishes, manualLinks), [dishes, manualLinks])
  const filteredGroups = useMemo(() => groups.filter(group => {
    const query = q.trim().toLowerCase()
    const rows = getComparisonRows({ group, referenceRestaurant, tasks })
    return (!query || group.name.toLowerCase().includes(query) || group.versions.some(v => v.code?.toLowerCase().includes(query))) &&
      (!onlyDiffs || rows.some(row => row.status === APPROVAL_STATUS.HAS_DIFFERENCES || row.status === 'no_data'))
  }), [groups, q, onlyDiffs, referenceRestaurant, tasks])

  const selectedGroup = filteredGroups.find(group => group.key === selectedKey) || filteredGroups[0]
  const rows = selectedGroup ? getComparisonRows({ group: selectedGroup, referenceRestaurant, tasks }) : []
  const referenceDish = selectedGroup?.versions.find(version => version.restaurant === referenceRestaurant) || selectedGroup?.versions[0]
  const currentDish = openedVersion || referenceDish
  const groupTasks = tasks.filter(task => task.dishKey === selectedGroup?.key)
  const linkCandidates = dishes.filter(dish => dish.restaurant === linkRestaurant)
  const networkClosed = rows.length > 0 && rows.every(row => ['reference', APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.CLOSED].includes(row.status))
  const rowForTask = rows.find(row => row.restaurant === taskRestaurant)

  function handleCreateTask(payload) {
    const task = createTask(payload)
    setCreatedTask(task)
    setTaskRestaurant('')
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:16 }}>
      {createdTask && <TaskCreatedModal task={createdTask} onClose={() => setCreatedTask(null)} />}
      <aside style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:16, position:'sticky', top:82, alignSelf:'start', maxHeight:'calc(100vh - 110px)', overflow:'auto' }}>
        <div style={{ fontSize:18, fontWeight:900, color:'#0f172a', marginBottom:6 }}>Сверка ТТК</div>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Найти блюдо" style={{ ...SEL_ST, width:'100%', boxSizing:'border-box', marginBottom:10 }} />
        <label style={{ display:'block', fontSize:11, fontWeight:900, color:'#475569', marginBottom:5 }}>Эталонный ресторан</label>
        <select value={referenceRestaurant} onChange={e => { setReferenceRestaurant(e.target.value); setOpenedVersion(null) }} style={{ ...SEL_ST, width:'100%', marginBottom:10 }}>
          {NETWORK_RESTAURANTS.map(restaurant => <option key={restaurant} value={restaurant}>{restaurant}</option>)}
        </select>
        <button onClick={() => setShowAdvanced(v => !v)} style={{ ...SEL_ST, width:'100%', marginBottom:8 }}>{showAdvanced ? 'Скрыть расширенные фильтры' : 'Расширенные фильтры'}</button>
        {showAdvanced && <label style={{ display:'block', fontSize:12, color:'#334155', marginBottom:10 }}><input type="checkbox" checked={onlyDiffs} onChange={e => setOnlyDiffs(e.target.checked)} /> Только с расхождениями</label>}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {filteredGroups.slice(0, 160).map(group => (
            <button key={group.key} onClick={() => { setSelectedKey(group.key); setOpenedVersion(null); setTab('reference') }} style={{ textAlign:'left', border:`1px solid ${selectedGroup?.key === group.key ? '#6366f1' : '#e5e7eb'}`, background:selectedGroup?.key === group.key ? '#eef2ff' : '#fff', borderRadius:12, padding:10, cursor:'pointer' }}>
              <div style={{ fontSize:13, fontWeight:900, color:'#0f172a' }}>{group.name}</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:3 }}>{group.versions.map(v => v.restaurant).join(' · ')}</div>
            </button>
          ))}
        </div>
      </aside>

      <main style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {!selectedGroup ? <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:24 }}>{emptyText('Выберите блюдо')}</div> : (
          <>
            <section style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
                <div>
                  <h1 style={{ margin:'0 0 8px', fontSize:26, color:'#0f172a' }}>{selectedGroup.name}</h1>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    <Tag color={REST_COLOR[referenceRestaurant] || '#6366f1'} bg={REST_BG[referenceRestaurant] || '#eef2ff'}>Эталон: {referenceRestaurant}</Tag>
                    {networkClosed && <Tag color="#0f766e" bg="#ccfbf1">Закрыто по сети</Tag>}
                  </div>
                </div>
                <button onClick={() => setTab('comparison')} style={BTN_PRIMARY}>Открыть ТТК</button>
              </div>
            </section>

            <section style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, overflow:'hidden' }}>
              <div style={{ display:'flex', borderBottom:'1px solid #e5e7eb', overflowX:'auto' }}>
                {[
                  ['reference', 'ТТК'], ['photos', 'Фото'], ['semifinished', 'Полуфабрикаты'], ['technology', 'Технология'], ['comparison', 'Версии ресторанов'], ['documents', 'PDF документы'], ['tasks', 'Задания'], ['history', 'История изменений'],
                ].map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={TAB_ST(tab === id)}>{label}</button>)}
              </div>
              <div style={{ padding:18 }}>
                {tab === 'reference' && <TtkCard dish={currentDish} title={currentDish?.restaurant === referenceRestaurant ? 'Эталонная ТТК' : `Версия ТТК: ${currentDish?.restaurant}`} />}
                {tab === 'semifinished' && <InfoList title="Полуфабрикаты" items={currentDish?.components || currentDish?.semifinished} empty="Полуфабрикаты не указаны" />}
                {tab === 'technology' && <div style={{ background:'#fffbeb', border:'1px dashed #fbbf24', borderRadius:12, padding:16, color:'#92400e', whiteSpace:'pre-wrap' }}>{currentDish?.technology || 'Технология не загружена'}</div>}

                {tab === 'comparison' && (
                  <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                      <thead style={{ background:'#f8fafc' }}><tr>{['Ресторан','Статус','Выход','Полуфабрикаты','Фото','Действие'].map(h => <th key={h} style={{ textAlign:'left', padding:12 }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {rows.map(row => {
                          const tone = row.status === 'reference' || row.status === APPROVAL_STATUS.APPROVED ? '#f0fdf4' : row.missing ? '#f8fafc' : row.criticalCount ? '#fef2f2' : '#fffbeb'
                          return (
                            <tr key={row.restaurant} style={{ background:tone, borderTop:'1px solid #e5e7eb' }}>
                              <td style={{ padding:12, fontWeight:900 }}>{row.restaurant}</td>
                              <td style={{ padding:12 }}><Tag color={row.status === 'no_data' ? '#64748b' : STATUS_COLORS[row.task?.status || row.status] || '#16a34a'}>{statusText(row)}</Tag></td>
                              <td style={{ padding:12 }}>{row.version?.output ? `${row.version.output} г` : '—'}</td>
                              <td style={{ padding:12 }}>{row.version ? `${row.version.components?.length || 0} ПФ` : '—'}</td>
                              <td style={{ padding:12 }}>{row.version ? ((row.version.photos?.length || 0) ? 'Есть' : 'Нет') : '—'}</td>
                              <td style={{ padding:12 }}>
                                {row.version && <button onClick={() => { setOpenedVersion(row.version); setTab('reference') }} style={{ ...SEL_ST, marginRight:6, fontWeight:800 }}>Открыть</button>}
                                {row.status !== 'reference' && row.status !== APPROVAL_STATUS.APPROVED && row.status !== APPROVAL_STATUS.CLOSED && <button onClick={() => setTaskRestaurant(row.restaurant)} style={BTN_PRIMARY}>Создать задание</button>}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{rows.flatMap(row => diffLabels(row).map(label => <Tag key={`${row.restaurant}-${label}`} xs color={row.missing ? '#64748b' : '#d97706'}>{row.restaurant}: {label}</Tag>))}</div>
                    {openedVersion && openedVersion !== referenceDish && (
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
                        {[['Эталон', referenceDish], [openedVersion.restaurant, openedVersion]].map(([title, dish]) => (
                          <div key={title} style={{ background:'#fff', borderRadius:10, padding:12 }}>
                            <div style={{ fontSize:12, fontWeight:900, color:'#475569', marginBottom:8 }}>{title}</div>
                            <div style={{ fontSize:13, lineHeight:1.8 }}>
                              <b>Выход:</b> {dish?.output || '—'}<br />
                              <b>ПФ:</b> {dish?.components?.length || 0}<br />
                              <b>Ингредиенты:</b> {dish?.ingredients?.length || 0}<br />
                              <b>Фото:</b> {(dish?.photos?.length || 0) ? 'Есть' : 'Нет'}<br />
                              <b>Технология:</b> {dish?.technology ? 'Есть' : 'Нет'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {rowForTask && <CreateTaskPanel group={selectedGroup} row={rowForTask} referenceDish={referenceDish} onCreate={handleCreateTask} />}
                    <button onClick={() => setShowManual(v => !v)} style={{ ...SEL_ST, alignSelf:'flex-start' }}>Связать вручную</button>
                    {showManual && (
                      <div style={{ display:'grid', gridTemplateColumns:'160px 1fr auto', gap:8, background:'#f8fafc', borderRadius:12, padding:12 }}>
                        <select value={linkRestaurant} onChange={e => { setLinkRestaurant(e.target.value); setLinkDishId('') }} style={SEL_ST}>{NETWORK_RESTAURANTS.map(item => <option key={item} value={item}>{item}</option>)}</select>
                        <select value={linkDishId} onChange={e => setLinkDishId(e.target.value)} style={SEL_ST}><option value="">Выберите блюдо для привязки</option>{linkCandidates.map(dish => <option key={dish.id} value={dish.id}>{dish.name}</option>)}</select>
                        <button disabled={!linkDishId} onClick={() => addManualLink({ restaurant: linkRestaurant, dishId: linkDishId, targetKey: selectedGroup.key, createdAt: new Date().toISOString() })} style={{ ...BTN_PRIMARY, opacity:linkDishId ? 1 : .45 }}>Связать</button>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'tasks' && <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{groupTasks.length ? groupTasks.map(task => <div key={task.id} style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}><Tag color={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Tag><strong style={{ marginLeft:8 }}>{task.restaurant}</strong><a href={`/task/${task.id}`} target="_blank" rel="noreferrer" style={{ marginLeft:12, color:'#2563eb' }}>Открыть ссылку задания</a></div>) : emptyText('Заданий по блюду пока нет')}</div>}
                {tab === 'photos' && <FileGallery dish={currentDish} />}
                {tab === 'documents' && <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{[...(currentDish?.pdfDocuments || []), ...(currentDish?.excelDocuments || [])].length ? [...(currentDish?.pdfDocuments || []), ...(currentDish?.excelDocuments || [])].map((file, i) => <a key={i} href={file.dataUrl || file} target="_blank" rel="noreferrer" style={{ color:'#2563eb', background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>{file.name || file}</a>) : emptyText('PDF/Excel документы пока не загружены')}</div>}
                {tab === 'history' && <div style={{ display:'flex', flexDirection:'column', gap:8 }}>{groupTasks.flatMap(task => task.history || []).length ? groupTasks.flatMap(task => task.history || []).map((item, i) => <div key={i} style={{ fontSize:12, color:'#334155', borderBottom:'1px solid #f1f5f9', paddingBottom:7 }}>{new Date(item.at).toLocaleString('ru-RU')} — {STATUS_LABELS[item.status] || item.status} {item.comment && `· ${item.comment}`}</div>) : emptyText('История пока пуста')}</div>}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
