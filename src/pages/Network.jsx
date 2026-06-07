import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { CAT_ICONS, STA_ICONS } from '../constants.js'
import { APPROVAL_STATUS, NETWORK_RESTAURANTS, STATUS_COLORS, STATUS_LABELS, compareDishVersions, dishMatchKey } from '../domain/workflow.js'
import { buildRestaurantCrmCards, sortRestaurants } from '../services/standardsService.js'

const cardGrid = { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }
const primary = { ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900 }

function TaskLinkModal({ task, onClose }) {
  if (!task) return null
  const url = `${window.location.origin}/task/${task.id}`
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.55)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ maxWidth:560, width:'100%', background:'#fff', borderRadius:18, padding:24, boxShadow:'0 24px 80px rgba(0,0,0,.25)' }}>
        <div style={{ fontSize:38 }}>✅</div>
        <h2 style={{ margin:'6px 0 8px', color:'#0f172a' }}>Задание создано</h2>
        <div style={{ fontSize:13, color:'#64748b', marginBottom:10 }}>Передайте ссылку шефу ресторана:</div>
        <a href={url} target="_blank" rel="noreferrer" style={{ display:'block', padding:12, borderRadius:10, background:'#f8fafc', border:'1px solid #e5e7eb', color:'#2563eb', fontWeight:800, wordBreak:'break-all' }}>{url}</a>
        <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:14 }}>
          <button onClick={() => navigator.clipboard?.writeText(url)} style={primary}>Скопировать ссылку</button>
          <button onClick={onClose} style={SEL_ST}>Закрыть</button>
        </div>
      </div>
    </div>
  )
}

function RestaurantCard({ card, onOpen }) {
  return (
    <div style={{ background:'#fff', border:`1.5px solid ${card.status.color}33`, borderRadius:16, padding:18, boxShadow:'0 8px 28px rgba(15,23,42,.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:10 }}>
        <div>
          <h3 style={{ margin:'0 0 4px', fontSize:21, color:'#0f172a' }}>{card.restaurant}</h3>
          <div style={{ color:'#64748b', fontSize:13 }}>{card.city || 'Город не указан'}</div>
        </div>
        <Tag color={card.status.color} bg={card.status.bg}>{card.status.icon} {card.status.label}</Tag>
      </div>
      <div style={{ margin:'14px 0', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ fontSize:32, fontWeight:900, color:card.status.color }}>{card.readiness}%</div>
        <div style={{ flex:1, height:10, borderRadius:999, background:'#f1f5f9', overflow:'hidden' }}><div style={{ width:`${card.readiness}%`, height:'100%', background:card.status.color }} /></div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, color:'#334155' }}>
        <Metric label="Блюд" value={card.dishesCount} />
        <Metric label="Подтверждено" value={card.confirmedTtk} />
        <Metric label="Расхождения" value={card.differencesCount} danger />
        <Metric label="Без фото" value={card.withoutPhotos} />
        <Metric label="Без PDF" value={card.withoutPdf} />
        <Metric label="Активные задания" value={card.activeTasks} />
        <Metric label="Просрочено" value={card.overdueTasks} danger />
        <Metric label="Без технологии" value={card.withoutTechnology} />
      </div>
      <div style={{ marginTop:12, fontSize:11, color:'#64748b', lineHeight:1.6 }}>
        <div>Последняя загрузка: {card.lastUploadDate ? new Date(card.lastUploadDate).toLocaleDateString('ru-RU') : 'нет загрузок'}</div>
        <div>Ответственный: {card.responsible || 'не назначен'}</div>
      </div>
      <button onClick={() => onOpen(card.restaurant)} style={{ ...primary, width:'100%', marginTop:14 }}>Открыть ресторан</button>
    </div>
  )
}

function Metric({ label, value, danger }) {
  return <div style={{ background:'#f8fafc', borderRadius:10, padding:'8px 10px' }}><div style={{ fontSize:10, color:'#64748b', fontWeight:800 }}>{label}</div><div style={{ fontSize:18, fontWeight:900, color:danger && value ? '#dc2626' : '#0f172a' }}>{value}</div></div>
}

function buildTree(dishes) {
  return dishes.reduce((acc, dish) => {
    const cat = dish.category || 'Прочее'
    const station = dish.station || 'Без цеха'
    acc[cat] ||= {}
    acc[cat][station] ||= []
    acc[cat][station].push(dish)
    return acc
  }, {})
}

function RestaurantDetail({ card, referenceRestaurant, dishes, tasks, uploads, createTask, onBack }) {
  const [tab, setTab] = useState('overview')
  const [selectedDish, setSelectedDish] = useState(card.dishes[0] || null)
  const [taskLink, setTaskLink] = useState(null)
  const tree = useMemo(() => buildTree(card.dishes), [card.dishes])
  const referenceDish = selectedDish ? dishes.find(dish => dish.restaurant === referenceRestaurant && dishMatchKey(dish) === dishMatchKey(selectedDish)) : null
  const diffs = selectedDish && referenceDish ? compareDishVersions(referenceDish, selectedDish) : []
  const restaurantTasks = tasks.filter(task => task.restaurant === card.restaurant)
  const restaurantUploads = uploads.filter(upload => upload.restaurant === card.restaurant)

  function createDishTask(dish) {
    const task = createTask({
      restaurant: card.restaurant,
      dishKey: dishMatchKey(dish),
      dishId: dish.id,
      dishName: dish.name,
      referenceDish,
      checks: diffs.length ? diffs.map(diff => diff.label) : ['Проверить ТТК ресторана'],
      comment: `Проверить стандарты блюда “${dish.name}” относительно эталона ${referenceRestaurant}`,
      dueDate: '',
    })
    setTaskLink(task)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <TaskLinkModal task={taskLink} onClose={() => setTaskLink(null)} />
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:18, display:'flex', justifyContent:'space-between', gap:12 }}>
        <div>
          <button onClick={onBack} style={{ ...SEL_ST, marginBottom:10 }}>← Сеть ресторанов</button>
          <h2 style={{ margin:'0 0 4px', fontSize:28 }}>{card.restaurant}</h2>
          <div style={{ color:'#64748b', fontSize:13 }}>{card.city} · Ответственный: {card.responsible}</div>
        </div>
        <div style={{ textAlign:'right' }}><Tag color={card.status.color} bg={card.status.bg}>{card.status.icon} {card.status.label}</Tag><div style={{ fontSize:32, fontWeight:900, color:card.status.color, marginTop:8 }}>{card.readiness}%</div></div>
      </div>
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, overflow:'hidden' }}>
        <div style={{ display:'flex', overflowX:'auto', borderBottom:'1px solid #e5e7eb' }}>{[
          ['overview','Обзор'], ['dishes','Блюда'], ['ttk','ТТК'], ['photos','Фото'], ['pf','Полуфабрикаты'], ['tasks','Задания'], ['diffs','Расхождения'], ['uploads','Загрузки'], ['history','История'], ['people','Ответственные'],
        ].map(([id, label]) => <button key={id} onClick={() => setTab(id)} style={{ padding:'11px 14px', border:'none', background:'transparent', borderBottom:`3px solid ${tab === id ? '#6366f1' : 'transparent'}`, color:tab === id ? '#4f46e5' : '#64748b', fontWeight:900, cursor:'pointer' }}>{label}</button>)}</div>
        <div style={{ padding:18 }}>
          {tab === 'overview' && <Overview card={card} referenceRestaurant={referenceRestaurant} />}
          {tab === 'dishes' && <DishTree tree={tree} selectedDish={selectedDish} setSelectedDish={dish => { setSelectedDish(dish); setTab('ttk') }} />}
          {tab === 'ttk' && <RestaurantDishCard dish={selectedDish} referenceDish={referenceDish} diffs={diffs} restaurant={card.restaurant} referenceRestaurant={referenceRestaurant} onCreateTask={createDishTask} />}
          {tab === 'photos' && <PhotoPanel dishes={card.dishes} />}
          {tab === 'pf' && <PfPanel dishes={card.dishes} />}
          {tab === 'tasks' && <TasksTable tasks={restaurantTasks} />}
          {tab === 'diffs' && <DiffPanel dish={selectedDish} referenceDish={referenceDish} diffs={diffs} />}
          {tab === 'uploads' && <UploadsTable uploads={restaurantUploads} />}
          {tab === 'history' && <History tasks={restaurantTasks} uploads={restaurantUploads} />}
          {tab === 'people' && <People card={card} />}
        </div>
      </div>
    </div>
  )
}

function Overview({ card, referenceRestaurant }) {
  return <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12 }}>
    <Metric label="Готовность стандартов" value={`${card.readiness}%`} />
    <Metric label="Блюд всего" value={card.dishesCount} />
    <Metric label="Подтверждено" value={card.confirmedTtk} />
    <Metric label="Есть расхождения" value={card.differencesCount} danger />
    <Metric label="Без фото" value={card.withoutPhotos} />
    <Metric label="Без PDF" value={card.withoutPdf} />
    <Metric label="Без технологии" value={card.withoutTechnology} />
    <Metric label="Заданий открыто" value={card.activeTasks} />
    <Metric label="Просрочено" value={card.overdueTasks} danger />
    <div style={{ gridColumn:'1 / -1', color:'#64748b', fontSize:13 }}>Эталон для сравнения: <b>{referenceRestaurant}</b></div>
  </div>
}

function DishTree({ tree, selectedDish, setSelectedDish }) {
  return <div style={{ display:'flex', flexDirection:'column', gap:12 }}>{Object.entries(tree).map(([cat, stations]) => <div key={cat}><div style={{ fontWeight:900, color:'#0f172a', marginBottom:6 }}>{CAT_ICONS[cat] || '🍴'} {cat}</div>{Object.entries(stations).map(([station, dishes]) => <div key={station} style={{ margin:'0 0 8px 18px' }}><div style={{ fontSize:13, fontWeight:800, color:'#475569', marginBottom:5 }}>{STA_ICONS[station] || '🏷️'} {station}</div><div style={{ display:'flex', flexDirection:'column', gap:4 }}>{dishes.map(dish => <button key={dish.id} onClick={() => setSelectedDish(dish)} style={{ textAlign:'left', border:'none', background:selectedDish?.id === dish.id ? '#eef2ff' : 'transparent', borderRadius:8, padding:'6px 8px', cursor:'pointer', color:'#334155' }}>{dish.name}</button>)}</div></div>)}</div>)}</div>
}

function RestaurantDishCard({ dish, referenceDish, diffs, restaurant, referenceRestaurant, onCreateTask }) {
  if (!dish) return <div style={{ color:'#94a3b8' }}>В ресторане пока нет блюд.</div>
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
    <div style={{ background:'#f8fafc', borderRadius:12, padding:16 }}><h3 style={{ margin:'0 0 8px' }}>{dish.name}</h3><div style={{ fontSize:13, lineHeight:1.9 }}>Ресторан: <b>{restaurant}</b><br />Код: {dish.code || '—'}<br />Категория: {dish.category}<br />Цех: {dish.station}<br />Выход: {dish.output || '—'}<br />Дата: {dish.date || '—'}</div><button onClick={() => onCreateTask(dish)} style={{ ...primary, marginTop:12 }}>Создать задание</button></div>
    <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:12, padding:16 }}><h3 style={{ margin:'0 0 8px' }}>{restaurant} vs {referenceRestaurant}</h3>{referenceDish ? (diffs.length ? <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{diffs.map(diff => <Tag key={diff.field} color={diff.severity === 'critical' ? '#dc2626' : '#d97706'}>{diff.label}</Tag>)}</div> : <Tag color="#16a34a">Совпадает с эталоном</Tag>) : <Tag color="#64748b">Эталонной версии пока нет</Tag>}</div>
  </div>
}

function PhotoPanel({ dishes }) {
  const without = dishes.filter(dish => (dish.photos?.length || 0) === 0)
  return <div><h3 style={{ marginTop:0 }}>Фотоэталоны</h3><div style={{ color:'#64748b', marginBottom:10 }}>Без фото: {without.length}</div>{without.slice(0, 30).map(dish => <div key={dish.id} style={{ padding:'7px 0', borderBottom:'1px solid #f1f5f9' }}>{dish.name}</div>)}</div>
}

function PfPanel({ dishes }) {
  const items = Array.from(new Set(dishes.flatMap(dish => dish.components || []))).filter(Boolean)
  return <div><h3 style={{ marginTop:0 }}>Полуфабрикаты ресторана</h3>{items.length ? items.map(item => <Tag key={item} color="#7c3aed" bg="#f5f3ff" style={{ margin:4 }}>{item}</Tag>) : <div style={{ color:'#94a3b8' }}>ПФ не указаны</div>}</div>
}

function TasksTable({ tasks }) {
  return <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}><thead><tr>{['Блюдо','Задача','Статус','Срок','Действие'].map(h => <th key={h} style={{ textAlign:'left', padding:10, background:'#f8fafc' }}>{h}</th>)}</tr></thead><tbody>{tasks.map(task => <tr key={task.id} style={{ borderTop:'1px solid #eef2f7' }}><td style={{ padding:10 }}>{task.dishName}</td><td style={{ padding:10 }}>{task.checks?.[0] || 'Проверка ТТК'}</td><td style={{ padding:10 }}><Tag color={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Tag></td><td style={{ padding:10 }}>{task.dueDate || '—'}</td><td style={{ padding:10 }}><a href={`/task/${task.id}`} target="_blank" rel="noreferrer" style={{ color:'#2563eb' }}>Открыть</a></td></tr>)}</tbody></table>
}

function DiffPanel({ dish, referenceDish, diffs }) {
  if (!dish) return <div style={{ color:'#94a3b8' }}>Выберите блюдо.</div>
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}><div style={{ background:'#f0fdf4', borderRadius:12, padding:14 }}><b>Эталон</b><br />{referenceDish?.name || 'Нет данных'}<br />Выход: {referenceDish?.output || '—'}<br />ПФ: {referenceDish?.components?.length || 0}</div><div style={{ background:'#fffbeb', borderRadius:12, padding:14 }}><b>{dish.restaurant}</b><br />{dish.name}<br />Выход: {dish.output || '—'}<br />ПФ: {dish.components?.length || 0}<div style={{ marginTop:10 }}>{diffs.map(diff => <Tag key={diff.field} color={diff.severity === 'critical' ? '#dc2626' : '#d97706'}>{diff.label}</Tag>)}</div></div></div>
}

function UploadsTable({ uploads }) {
  return uploads.length ? uploads.map(upload => <div key={upload.id} style={{ padding:10, borderBottom:'1px solid #eef2f7' }}>{new Date(upload.createdAt).toLocaleString('ru-RU')} · {upload.file?.name} · {upload.status}</div>) : <div style={{ color:'#94a3b8' }}>Загрузок пока нет.</div>
}

function History({ tasks, uploads }) {
  const events = [...tasks.map(t => ({ at:t.updatedAt || t.createdAt, text:`Задание: ${t.dishName} · ${t.status}` })), ...uploads.map(u => ({ at:u.createdAt, text:`Загрузка: ${u.file?.name}` }))].sort((a,b)=>String(b.at).localeCompare(String(a.at)))
  return events.length ? events.map((event, i) => <div key={i} style={{ padding:8, borderBottom:'1px solid #eef2f7' }}>{new Date(event.at).toLocaleString('ru-RU')} — {event.text}</div>) : <div style={{ color:'#94a3b8' }}>История пока пуста.</div>
}

function People({ card }) {
  return <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:12 }}><Metric label="Ответственный" value={card.responsible || '—'} /><Metric label="Шеф / су-шеф" value={card.chef || '—'} /><Metric label="Роль" value="Ресторан отвечает за фото, PDF и фактический выход" /></div>
}

export default function Network({ dishes, tasks, uploads, referenceRestaurant, createTask }) {
  const [sortBy, setSortBy] = useState('readiness')
  const [openedRestaurant, setOpenedRestaurant] = useState('')
  const cards = useMemo(() => sortRestaurants(buildRestaurantCrmCards({ dishes, tasks, uploads, referenceRestaurant }), sortBy), [dishes, tasks, uploads, referenceRestaurant, sortBy])
  const opened = cards.find(card => card.restaurant === openedRestaurant)

  if (opened) return <RestaurantDetail card={opened} referenceRestaurant={referenceRestaurant} dishes={dishes} tasks={tasks} uploads={uploads} createTask={createTask} onBack={() => setOpenedRestaurant('')} />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:20, display:'flex', justifyContent:'space-between', gap:12, alignItems:'center' }}>
        <div><h1 style={{ margin:'0 0 6px', fontSize:28 }}>CRM стандартов сети</h1><div style={{ color:'#64748b' }}>Откройте проблемный ресторан → блюдо → создайте задание → проверьте результат.</div></div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={SEL_ST}>
          <option value="readiness">По готовности</option>
          <option value="errors">По количеству ошибок</option>
          <option value="overdue">По просрочкам</option>
          <option value="tasks">По количеству заданий</option>
          <option value="lastUpload">По дате последней загрузки</option>
        </select>
      </div>
      <div style={cardGrid}>{cards.map(card => <RestaurantCard key={card.restaurant} card={card} onOpen={setOpenedRestaurant} />)}</div>
    </div>
  )
}
