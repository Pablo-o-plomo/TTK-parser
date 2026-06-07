import { useMemo, useState } from 'react'
import { Tag, TogBtn, SEL_ST } from '../components/ui.jsx'
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

const CELL_BG = {
  ok: '#f0fdf4',
  warning: '#fffbeb',
  critical: '#fef2f2',
  missing: '#f8fafc',
}

function rowTone(row) {
  if (row.status === 'reference' || row.status === APPROVAL_STATUS.APPROVED || row.status === APPROVAL_STATUS.CLOSED) return 'ok'
  if (row.missing) return 'missing'
  if (row.criticalCount > 0) return 'critical'
  if (row.warningCount > 0) return 'warning'
  return 'ok'
}

function statusText(row) {
  if (row.status === 'reference') return 'Эталон'
  if (row.status === 'no_data') return 'Нет данных'
  return STATUS_LABELS[row.task?.status || row.status] || 'Новая'
}

function TaskForm({ group, row, onCreate, onCancel }) {
  const defaultChecks = row.diffs.map(diff => diff.label)
  const [checks, setChecks] = useState(defaultChecks)
  const [comment, setComment] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [materials, setMaterials] = useState(REQUIRED_MATERIALS.map(item => item.id))

  const toggle = (value, setter) => setter(current => current.includes(value) ? current.filter(item => item !== value) : [...current, value])

  return (
    <div style={{ marginTop:10, padding:14, border:'1px solid #e5e7eb', borderRadius:12, background:'#fff' }}>
      <div style={{ fontSize:13, fontWeight:800, color:'#0f172a', marginBottom:10 }}>Задание для {row.restaurant}</div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6 }}>Что проверить</div>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {Object.values(FIELD_LABELS).map(label => (
              <label key={label} style={{ fontSize:12, color:'#334155' }}>
                <input type="checkbox" checked={checks.includes(label)} onChange={() => toggle(label, setChecks)} /> {label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6 }}>Срок выполнения</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} style={{ ...SEL_ST, width:'100%', boxSizing:'border-box', marginBottom:10 }} />
          <label style={{ display:'block', fontSize:11, fontWeight:700, color:'#64748b', marginBottom:6 }}>Комментарий бренд-шефа</label>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={5} placeholder="Опишите, что нужно сверить и какие материалы приложить" style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid #e5e7eb', borderRadius:10, padding:10, fontSize:12, resize:'vertical' }} />
          <div style={{ fontSize:11, fontWeight:700, color:'#64748b', margin:'10px 0 6px' }}>Требуемые материалы</div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {REQUIRED_MATERIALS.map(item => (
              <label key={item.id} style={{ fontSize:12, color:'#334155' }}>
                <input type="checkbox" checked={materials.includes(item.id)} onChange={() => toggle(item.id, setMaterials)} /> {item.label}
              </label>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:12 }}>
        <button onClick={onCancel} style={{ ...SEL_ST, background:'#fff' }}>Отмена</button>
        <button onClick={() => onCreate({
          restaurant: row.restaurant,
          dishKey: group.key,
          dishId: row.version?.id,
          dishName: group.name,
          checks,
          comment,
          dueDate,
          requiredMaterials: materials,
        })} style={{ ...SEL_ST, borderColor:'#6366f1', background:'#6366f1', color:'#fff', fontWeight:800 }}>Создать и получить ссылку</button>
      </div>
    </div>
  )
}

export default function Comparison({ dishes, tasks, manualLinks, addManualLink, createTask, referenceRestaurant, setReferenceRestaurant }) {
  const [q, setQ] = useState('')
  const [restaurantFilter, setRestaurantFilter] = useState('all')
  const [category, setCategory] = useState('all')
  const [station, setStation] = useState('all')
  const [status, setStatus] = useState('all')
  const [onlyDiffs, setOnlyDiffs] = useState(false)
  const [onlyNoPhotos, setOnlyNoPhotos] = useState(false)
  const [onlyUnapproved, setOnlyUnapproved] = useState(false)
  const [selectedKey, setSelectedKey] = useState('')
  const [taskRow, setTaskRow] = useState(null)
  const [lastTask, setLastTask] = useState(null)
  const [linkRestaurant, setLinkRestaurant] = useState('Ростов')
  const [linkDishId, setLinkDishId] = useState('')

  const groups = useMemo(() => buildDishGroups(dishes, manualLinks), [dishes, manualLinks])
  const categories = useMemo(() => Array.from(new Set(dishes.map(dish => dish.category))).sort((a, b) => a.localeCompare(b, 'ru')), [dishes])
  const stations = useMemo(() => Array.from(new Set(dishes.map(dish => dish.station))).sort((a, b) => a.localeCompare(b, 'ru')), [dishes])

  const filteredGroups = useMemo(() => groups.filter(group => {
    const rows = getComparisonRows({ group, referenceRestaurant, tasks })
    const query = q.trim().toLowerCase()
    const matchesQuery = !query || group.name.toLowerCase().includes(query) || group.versions.some(version => version.code.includes(query))
    const matchesRestaurant = restaurantFilter === 'all' || group.versions.some(version => version.restaurant === restaurantFilter)
    const matchesCategory = category === 'all' || group.versions.some(version => version.category === category)
    const matchesStation = station === 'all' || group.versions.some(version => version.station === station)
    const matchesDiffs = !onlyDiffs || rows.some(row => row.status === APPROVAL_STATUS.HAS_DIFFERENCES || row.status === 'no_data')
    const matchesNoPhotos = !onlyNoPhotos || rows.some(row => row.version && (row.version.photos?.length || 0) === 0)
    const matchesUnapproved = !onlyUnapproved || rows.some(row => !['reference', APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.CLOSED].includes(row.status))
    const matchesStatus = status === 'all' || rows.some(row => row.task?.status === status || row.status === status)
    return matchesQuery && matchesRestaurant && matchesCategory && matchesStation && matchesDiffs && matchesNoPhotos && matchesUnapproved && matchesStatus
  }), [groups, q, restaurantFilter, category, station, onlyDiffs, onlyNoPhotos, onlyUnapproved, status, referenceRestaurant, tasks])

  const selectedGroup = filteredGroups.find(group => group.key === selectedKey) || filteredGroups[0]
  const rows = selectedGroup ? getComparisonRows({ group: selectedGroup, referenceRestaurant, tasks }) : []
  const networkClosed = rows.length > 0 && rows.every(row => ['reference', APPROVAL_STATUS.APPROVED, APPROVAL_STATUS.CLOSED].includes(row.status))
  const linkCandidates = dishes.filter(dish => dish.restaurant === linkRestaurant)

  function handleCreateTask(payload) {
    const task = createTask(payload)
    setLastTask(task)
    setTaskRow(null)
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'minmax(280px,360px) 1fr', gap:16 }}>
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:16, position:'sticky', top:82, alignSelf:'start', maxHeight:'calc(100vh - 110px)', overflow:'auto' }}>
        <div style={{ fontSize:16, fontWeight:900, color:'#0f172a', marginBottom:4 }}>Сверка ТТК сети</div>
        <div style={{ fontSize:12, color:'#64748b', lineHeight:1.5, marginBottom:12 }}>Выберите эталонный ресторан и блюдо, чтобы сравнить версии по всей сети.</div>
        <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', marginBottom:5 }}>Эталонный ресторан</label>
        <select value={referenceRestaurant} onChange={e => setReferenceRestaurant(e.target.value)} style={{ ...SEL_ST, width:'100%', marginBottom:10 }}>
          {NETWORK_RESTAURANTS.map(restaurant => <option key={restaurant} value={restaurant}>{restaurant}</option>)}
        </select>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск блюда или кода" style={{ ...SEL_ST, width:'100%', boxSizing:'border-box', marginBottom:8 }} />
        <select value={restaurantFilter} onChange={e => setRestaurantFilter(e.target.value)} style={{ ...SEL_ST, width:'100%', marginBottom:8 }}>
          <option value="all">Все рестораны</option>
          {NETWORK_RESTAURANTS.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...SEL_ST, width:'100%', marginBottom:8 }}>
          <option value="all">Все категории</option>
          {categories.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={station} onChange={e => setStation(e.target.value)} style={{ ...SEL_ST, width:'100%', marginBottom:8 }}>
          <option value="all">Все цеха</option>
          {stations.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...SEL_ST, width:'100%', marginBottom:8 }}>
          <option value="all">Все статусы</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          <option value="no_data">Нет данных</option>
        </select>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          <TogBtn active={onlyDiffs} onClick={() => setOnlyDiffs(v => !v)} color="#ef4444">С расхождениями</TogBtn>
          <TogBtn active={onlyNoPhotos} onClick={() => setOnlyNoPhotos(v => !v)} color="#d97706">Без фото</TogBtn>
          <TogBtn active={onlyUnapproved} onClick={() => setOnlyUnapproved(v => !v)} color="#7c3aed">Без подтверждения</TogBtn>
        </div>

        <div style={{ marginTop:12, display:'flex', flexDirection:'column', gap:6 }}>
          {filteredGroups.slice(0, 120).map(group => (
            <button key={group.key} onClick={() => setSelectedKey(group.key)} style={{ textAlign:'left', border:`1px solid ${selectedGroup?.key === group.key ? '#6366f1' : '#e5e7eb'}`, background:selectedGroup?.key === group.key ? '#eef2ff' : '#fff', borderRadius:10, padding:'9px 10px', cursor:'pointer' }}>
              <div style={{ fontSize:12, fontWeight:800, color:'#0f172a' }}>{group.name}</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{group.versions.map(v => v.restaurant).join(' · ')}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {selectedGroup ? (
          <>
            <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start' }}>
                <div>
                  <div style={{ fontSize:11, color:'#64748b', fontWeight:800, textTransform:'uppercase', letterSpacing:.6 }}>Блюдо</div>
                  <h2 style={{ margin:'4px 0 8px', fontSize:22, color:'#0f172a' }}>{selectedGroup.name}</h2>
                  <Tag color={REST_COLOR[referenceRestaurant] || '#6366f1'} bg={REST_BG[referenceRestaurant] || '#eef2ff'}>Эталон: {referenceRestaurant}</Tag>
                  {networkClosed && <Tag color="#0f766e" bg="#ccfbf1">Закрыто по сети</Tag>}
                </div>
                {lastTask && <Tag color="#7c3aed" bg="#f5f3ff">Ссылка: /tasks/{lastTask.id}</Tag>}
              </div>
            </div>

            <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
                <thead style={{ background:'#f8fafc' }}>
                  <tr>
                    <th style={{ textAlign:'left', padding:12 }}>Ресторан</th>
                    <th style={{ textAlign:'left', padding:12 }}>Статус</th>
                    <th style={{ textAlign:'left', padding:12 }}>Версия ТТК</th>
                    <th style={{ textAlign:'left', padding:12 }}>Расхождения</th>
                    <th style={{ textAlign:'right', padding:12 }}>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.restaurant} style={{ background:CELL_BG[rowTone(row)], borderTop:'1px solid #eef2f7' }}>
                      <td style={{ padding:12, fontWeight:800, color:'#0f172a' }}>{row.restaurant}</td>
                      <td style={{ padding:12 }}><Tag color={row.status === 'no_data' ? '#64748b' : STATUS_COLORS[row.task?.status || row.status] || '#16a34a'}>{statusText(row)}</Tag></td>
                      <td style={{ padding:12, color:'#334155' }}>
                        {row.version ? <>{CAT_ICONS[row.version.category] || '🍴'} {row.version.category} · {STA_ICONS[row.version.station] || '🏷️'} {row.version.station} · выход {row.version.output || '—'}</> : 'Нет ТТК'}
                      </td>
                      <td style={{ padding:12 }}>
                        {row.diffs.length === 0 ? <span style={{ color:'#16a34a', fontWeight:800 }}>Совпадает</span> : (
                          <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                            {row.diffs.slice(0, 6).map(diff => <Tag key={diff.field} xs color={diff.severity === 'critical' ? '#dc2626' : diff.severity === 'missing' ? '#64748b' : '#d97706'}>{diff.label}</Tag>)}
                            {row.diffs.length > 6 && <Tag xs color="#64748b">+{row.diffs.length}</Tag>}
                          </div>
                        )}
                      </td>
                      <td style={{ padding:12, textAlign:'right' }}>
                        {row.status !== 'reference' && row.status !== APPROVAL_STATUS.APPROVED && row.status !== APPROVAL_STATUS.CLOSED && (
                          <button onClick={() => setTaskRow(row.restaurant === taskRow ? null : row.restaurant)} style={{ ...SEL_ST, borderColor:'#d97706', color:'#d97706', fontWeight:800 }}>Отправить на проработку</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {taskRow && <TaskForm group={selectedGroup} row={rows.find(row => row.restaurant === taskRow)} onCreate={handleCreateTask} onCancel={() => setTaskRow(null)} />}
            </div>

            <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:16 }}>
              <div style={{ fontSize:14, fontWeight:900, color:'#0f172a', marginBottom:8 }}>Ручная привязка блюда</div>
              <div style={{ display:'grid', gridTemplateColumns:'160px 1fr auto', gap:8 }}>
                <select value={linkRestaurant} onChange={e => { setLinkRestaurant(e.target.value); setLinkDishId('') }} style={SEL_ST}>
                  {NETWORK_RESTAURANTS.map(item => <option key={item} value={item}>{item}</option>)}
                </select>
                <select value={linkDishId} onChange={e => setLinkDishId(e.target.value)} style={SEL_ST}>
                  <option value="">Выберите блюдо для привязки к “{selectedGroup.name}”</option>
                  {linkCandidates.map(dish => <option key={dish.id} value={dish.id}>{dish.name}</option>)}
                </select>
                <button disabled={!linkDishId} onClick={() => addManualLink({ restaurant: linkRestaurant, dishId: linkDishId, targetKey: selectedGroup.key, createdAt: new Date().toISOString() })} style={{ ...SEL_ST, background:'#0f172a', color:'#fff', opacity:linkDishId ? 1 : .45 }}>Связать</button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:24, color:'#64748b' }}>Нет блюд для сравнения.</div>
        )}
      </div>
    </div>
  )
}
