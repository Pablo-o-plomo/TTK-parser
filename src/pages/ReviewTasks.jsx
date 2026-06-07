import { useMemo, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { APPROVAL_STATUS, REQUIRED_MATERIALS, STATUS_COLORS, STATUS_LABELS } from '../domain/workflow.js'

function formatSize(size) { return size ? `${(size / 1024 / 1024).toFixed(2)} MB` : '' }

function MaterialPreview({ label, file, value }) {
  if (!file && !value) return null
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:10, padding:10, background:'#fff' }}>
      <div style={{ fontSize:10, color:'#64748b', fontWeight:800, marginBottom:6 }}>{label}</div>
      {file?.type?.startsWith('image/') ? <img src={file.dataUrl} alt={label} style={{ width:'100%', maxHeight:150, objectFit:'cover', borderRadius:8 }} /> : file ? <div style={{ fontSize:12, color:'#334155' }}>📎 <strong>{file.name}</strong><div style={{ color:'#64748b', fontSize:11 }}>{file.type} · {formatSize(file.size)}</div></div> : <div style={{ fontSize:12, color:'#334155' }}>{value}</div>}
    </div>
  )
}

function TaskDetails({ task, updateTaskStatus }) {
  const [revisionComment, setRevisionComment] = useState('')
  const submission = task.submission || {}
  return (
    <div style={{ marginTop:12, borderTop:'1px solid #f1f5f9', paddingTop:14, display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
        <div style={{ background:'#f8fafc', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:13, fontWeight:900, color:'#0f172a', marginBottom:8 }}>Эталонная ТТК</div>
          {task.referenceDish ? <div style={{ fontSize:12, color:'#334155', lineHeight:1.8 }}>
            <b>{task.referenceDish.name}</b><br />Код: {task.referenceDish.code || '—'}<br />Категория: {task.referenceDish.category || '—'}<br />Цех: {task.referenceDish.station || '—'}<br />Выход: {task.referenceDish.output || '—'}<br />ПФ: {task.referenceDish.components?.length || 0}
          </div> : <div style={{ color:'#94a3b8', fontSize:12 }}>Эталонные данные не сохранены</div>}
        </div>
        <div style={{ background:'#f8fafc', borderRadius:12, padding:14 }}>
          <div style={{ fontSize:13, fontWeight:900, color:'#0f172a', marginBottom:8 }}>Ответ ресторана</div>
          <div style={{ fontSize:12, color:'#334155', lineHeight:1.8 }}>Фактический выход: <b>{submission.actualOutput || '—'}</b><br />Комментарий: {submission.restaurantComment || '—'}<br />Отправлено: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString('ru-RU') : '—'}</div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:8 }}>
        <MaterialPreview label="Фото блюда" file={submission.dishPhoto} />
        <MaterialPreview label="Фото П/Ф" file={submission.pfPhoto} />
        <MaterialPreview label="PDF ТТК" file={submission.pdfTtk} />
        <MaterialPreview label="XLSX/XLS ТТК" file={submission.xlsxTtk} />
      </div>
      <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <button onClick={() => updateTaskStatus(task.id, APPROVAL_STATUS.APPROVED, 'Подтверждено бренд-шефом')} style={{ ...SEL_ST, background:'#16a34a', borderColor:'#16a34a', color:'#fff', fontWeight:800 }}>Подтвердить</button>
        <input value={revisionComment} onChange={e => setRevisionComment(e.target.value)} placeholder="Комментарий для доработки обязателен" style={{ ...SEL_ST, minWidth:260 }} />
        <button disabled={!revisionComment.trim()} onClick={() => updateTaskStatus(task.id, APPROVAL_STATUS.NEEDS_REVISION, revisionComment)} style={{ ...SEL_ST, background:'#ef4444', borderColor:'#ef4444', color:'#fff', fontWeight:800, opacity:revisionComment.trim() ? 1 : .45 }}>Вернуть на доработку</button>
        <button onClick={() => updateTaskStatus(task.id, APPROVAL_STATUS.CLOSED, 'Блюдо закрыто')} style={{ ...SEL_ST, background:'#0f766e', borderColor:'#0f766e', color:'#fff', fontWeight:800 }}>Закрыть</button>
      </div>
    </div>
  )
}

export default function ReviewTasks({ tasks, updateTaskStatus }) {
  const [restaurant, setRestaurant] = useState('all')
  const [status, setStatus] = useState('all')
  const [openedId, setOpenedId] = useState('')
  const restaurants = useMemo(() => Array.from(new Set(tasks.map(task => task.restaurant))).sort((a, b) => a.localeCompare(b, 'ru')), [tasks])
  const filtered = tasks.filter(task => (restaurant === 'all' || task.restaurant === restaurant) && (status === 'all' || task.status === status))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}>
        <h2 style={{ margin:'0 0 8px', fontSize:22, color:'#0f172a' }}>Проверка заданий</h2>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <select value={restaurant} onChange={e => setRestaurant(e.target.value)} style={SEL_ST}><option value="all">Все рестораны</option>{restaurants.map(item => <option key={item} value={item}>{item}</option>)}</select>
          <select value={status} onChange={e => setStatus(e.target.value)} style={SEL_ST}><option value="all">Все статусы</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </div>
      </div>
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead style={{ background:'#f8fafc' }}><tr>{['Блюдо','Ресторан','Статус','Срок','Материалы','Действие'].map(h => <th key={h} style={{ textAlign:'left', padding:12 }}>{h}</th>)}</tr></thead>
          <tbody>{filtered.map(task => <tr key={task.id} style={{ borderTop:'1px solid #eef2f7' }}><td style={{ padding:12, fontWeight:900 }}>{task.dishName}</td><td style={{ padding:12 }}>{task.restaurant}</td><td style={{ padding:12 }}><Tag color={STATUS_COLORS[task.status] || '#64748b'}>{STATUS_LABELS[task.status] || task.status}</Tag></td><td style={{ padding:12 }}>{task.dueDate || '—'}</td><td style={{ padding:12 }}>{task.submission ? 'Загружены' : 'Ожидаем'}</td><td style={{ padding:12 }}><button onClick={() => setOpenedId(openedId === task.id ? '' : task.id)} style={SEL_ST}>{openedId === task.id ? 'Скрыть' : 'Открыть'}</button></td></tr>)}</tbody>
        </table>
        {filtered.length === 0 && <div style={{ padding:18, color:'#94a3b8' }}>Заданий пока нет.</div>}
      </div>
      {filtered.filter(task => task.id === openedId).map(task => <div key={task.id} style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}><div style={{ display:'flex', gap:6, flexWrap:'wrap' }}><Tag color="#6366f1">{task.restaurant}</Tag><Tag color={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Tag>{REQUIRED_MATERIALS.filter(item => task.requiredMaterials?.includes(item.id)).map(item => <Tag key={item.id} xs color="#7c3aed">{item.label}</Tag>)}</div><TaskDetails task={task} updateTaskStatus={updateTaskStatus} /></div>)}
    </div>
  )
}
