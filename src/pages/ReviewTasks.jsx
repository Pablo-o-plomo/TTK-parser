import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { APPROVAL_STATUS, REQUIRED_MATERIALS, STATUS_COLORS, STATUS_LABELS } from '../domain/workflow.js'

function MaterialPreview({ label, value }) {
  if (!value) return null
  const isImage = typeof value === 'string' && value.startsWith('data:image')
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'#fff' }}>
      <div style={{ fontSize:10, color:'#64748b', fontWeight:800, marginBottom:6 }}>{label}</div>
      {isImage ? <img src={value} alt={label} style={{ width:'100%', maxHeight:120, objectFit:'cover', borderRadius:8 }} /> : <div style={{ fontSize:11, color:'#334155', wordBreak:'break-word' }}>{value}</div>}
    </div>
  )
}

export default function ReviewTasks({ tasks, updateTaskStatus }) {
  const [restaurant, setRestaurant] = useState('all')
  const [status, setStatus] = useState('all')
  const [revisionComments, setRevisionComments] = useState({})

  const restaurants = useMemo(() => Array.from(new Set(tasks.map(task => task.restaurant))).sort((a, b) => a.localeCompare(b, 'ru')), [tasks])
  const filtered = tasks.filter(task =>
    (restaurant === 'all' || task.restaurant === restaurant) &&
    (status === 'all' || task.status === status)
  )

  function requireRevision(task) {
    const comment = (revisionComments[task.id] || '').trim()
    if (!comment) return
    updateTaskStatus(task.id, APPROVAL_STATUS.NEEDS_REVISION, comment)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}>
        <h2 style={{ margin:'0 0 8px', fontSize:22, color:'#0f172a' }}>Проверка заданий</h2>
        <div style={{ fontSize:12, color:'#64748b', marginBottom:14 }}>Кабинет бренд-шефа: активные задания, загруженные материалы, подтверждение или возврат на доработку.</div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={restaurant} onChange={e => setRestaurant(e.target.value)} style={SEL_ST}>
            <option value="all">Все рестораны</option>
            {restaurants.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} style={SEL_ST}>
            <option value="all">Все статусы</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 && <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:20, color:'#64748b' }}>Заданий пока нет.</div>}

      {filtered.map(task => (
        <div key={task.id} style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', gap:12, alignItems:'flex-start' }}>
            <div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
                <Tag color="#6366f1">{task.restaurant}</Tag>
                <Tag color={STATUS_COLORS[task.status] || '#64748b'}>{STATUS_LABELS[task.status] || task.status}</Tag>
                {task.dueDate && <Tag color="#d97706">Срок: {task.dueDate}</Tag>}
              </div>
              <div style={{ fontSize:17, fontWeight:900, color:'#0f172a' }}>{task.dishName}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>Создано: {new Date(task.createdAt).toLocaleString('ru-RU')} · Ссылка: /tasks/{task.id}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14 }}>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#475569', marginBottom:6 }}>Что проверить</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>{task.checks?.map(check => <Tag key={check} xs color="#d97706">{check}</Tag>)}</div>
              <div style={{ fontSize:11, fontWeight:800, color:'#475569', margin:'12px 0 6px' }}>Комментарий бренд-шефа</div>
              <div style={{ fontSize:12, color:'#334155', background:'#f8fafc', borderRadius:10, padding:10 }}>{task.comment || '—'}</div>
              <div style={{ fontSize:11, fontWeight:800, color:'#475569', margin:'12px 0 6px' }}>Требуемые материалы</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {REQUIRED_MATERIALS.filter(item => task.requiredMaterials?.includes(item.id)).map(item => <Tag key={item.id} xs color="#7c3aed">{item.label}</Tag>)}
              </div>
            </div>
            <div>
              <div style={{ fontSize:11, fontWeight:800, color:'#475569', marginBottom:6 }}>Материалы ресторана</div>
              {task.submission ? (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
                  <MaterialPreview label="Фото блюда" value={task.submission.dishPhoto} />
                  <MaterialPreview label="Фото П/Ф" value={task.submission.pfPhoto} />
                  <MaterialPreview label="ТТК" value={task.submission.updatedTtkFile || task.submission.updatedTtkText} />
                  <MaterialPreview label="Фактический выход" value={task.submission.actualOutput} />
                  <MaterialPreview label="Комментарий" value={task.submission.restaurantComment} />
                </div>
              ) : <div style={{ fontSize:12, color:'#94a3b8', background:'#f8fafc', borderRadius:10, padding:14 }}>Ресторан ещё не отправил материалы.</div>}
            </div>
          </div>

          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginTop:14, borderTop:'1px solid #f1f5f9', paddingTop:14 }}>
            <button onClick={() => updateTaskStatus(task.id, APPROVAL_STATUS.APPROVED, 'Подтверждено бренд-шефом')} style={{ ...SEL_ST, background:'#16a34a', borderColor:'#16a34a', color:'#fff', fontWeight:800 }}>Подтвердить</button>
            <input value={revisionComments[task.id] || ''} onChange={e => setRevisionComments(current => ({ ...current, [task.id]: e.target.value }))} placeholder="Комментарий для доработки" style={{ ...SEL_ST, minWidth:220 }} />
            <button disabled={!(revisionComments[task.id] || '').trim()} onClick={() => requireRevision(task)} style={{ ...SEL_ST, background:'#ef4444', borderColor:'#ef4444', color:'#fff', fontWeight:800, opacity:(revisionComments[task.id] || '').trim() ? 1 : .45 }}>Вернуть на доработку</button>
            <button onClick={() => updateTaskStatus(task.id, APPROVAL_STATUS.CLOSED, 'Блюдо закрыто')} style={{ ...SEL_ST, background:'#0f766e', borderColor:'#0f766e', color:'#fff', fontWeight:800 }}>Закрыть блюдо</button>
          </div>
        </div>
      ))}
    </div>
  )
}
