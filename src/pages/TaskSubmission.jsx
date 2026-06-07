import { useState } from 'react'
import { ErrorScreen, Tag, SEL_ST } from '../components/ui.jsx'
import { REQUIRED_MATERIALS, STATUS_COLORS, STATUS_LABELS } from '../domain/workflow.js'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const PDF_TYPES = ['application/pdf']
const XLS_TYPES = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel']

function formatSize(size) {
  return `${(size / 1024 / 1024).toFixed(2)} MB`
}

function fileToPayload(file, allowedTypes) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null)
    if (file.size > MAX_FILE_SIZE) return reject(new Error(`Файл больше 10 MB: ${formatSize(file.size)}`))
    if (!allowedTypes.includes(file.type)) return reject(new Error('Недопустимый формат файла'))
    const reader = new FileReader()
    reader.onload = () => resolve({ name:file.name, type:file.type, size:file.size, dataUrl:reader.result })
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

function UploadField({ label, accept, allowedTypes, onChange, file }) {
  const [error, setError] = useState('')
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#fff' }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#475569', marginBottom:8 }}>{label}</div>
      <input type="file" accept={accept} onChange={async e => {
        setError('')
        try { onChange(await fileToPayload(e.target.files?.[0], allowedTypes)) }
        catch (err) { setError(err.message) }
      }} style={{ fontSize:12 }} />
      {error && <div style={{ color:'#ef4444', fontSize:11, marginTop:6 }}>{error}</div>}
      {file && (
        <div style={{ marginTop:10 }}>
          {file.type?.startsWith('image/') ? <img src={file.dataUrl} alt={label} style={{ maxWidth:'100%', maxHeight:160, borderRadius:10 }} /> : <FileCard file={file} />}
        </div>
      )}
    </div>
  )
}

function FileCard({ file }) {
  if (!file) return null
  return <div style={{ background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:10, padding:10, fontSize:12, color:'#334155' }}>📎 <strong>{file.name}</strong><div style={{ color:'#64748b', fontSize:11 }}>{file.type} · {formatSize(file.size)}</div></div>
}

function ReferenceBlock({ dish }) {
  if (!dish) return null
  return (
    <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}>
      <div style={{ fontSize:13, fontWeight:900, color:'#0f172a', marginBottom:10 }}>Эталонные данные для сравнения</div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:8, fontSize:12 }}>
        <div><b>Ресторан:</b> {dish.restaurant}</div>
        <div><b>Код:</b> {dish.code || '—'}</div>
        <div><b>Категория:</b> {dish.category || '—'}</div>
        <div><b>Цех:</b> {dish.station || '—'}</div>
        <div><b>Выход:</b> {dish.output ? `${dish.output} г` : '—'}</div>
        <div><b>ПФ:</b> {dish.components?.length || 0}</div>
      </div>
    </div>
  )
}

export default function TaskSubmission({ task, submitTask }) {
  const [form, setForm] = useState({ dishPhoto:null, pfPhoto:null, pdfTtk:null, xlsxTtk:null, actualOutput:'', restaurantComment:'' })
  const [sent, setSent] = useState(false)

  if (!task) return <ErrorScreen msg="Задание не найдено" />

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function submit(e) {
    e.preventDefault()
    submitTask(task.id, form)
    setSent(true)
  }

  if (sent) {
    return (
      <div style={{ minHeight:'100vh', background:'#f8fafc', padding:24 }}>
        <div style={{ maxWidth:760, margin:'0 auto', background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:24 }}>
          <div style={{ fontSize:40 }}>✅</div>
          <h1 style={{ margin:'8px 0', color:'#0f172a' }}>Материалы отправлены</h1>
          <p style={{ color:'#64748b', fontSize:14 }}>Статус задания изменён на “На проверке”. Бренд-шеф увидит фото, файлы, выход и комментарии в кабинете проверки.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', padding:24 }}>
      <form onSubmit={submit} style={{ maxWidth:960, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'#0f172a', color:'#fff', borderRadius:18, padding:24 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:10 }}>
            <Tag color="#fff" bg="rgba(255,255,255,.15)">{task.restaurant}</Tag>
            <Tag color="#fff" bg={`${STATUS_COLORS[task.status] || '#64748b'}66`}>{STATUS_LABELS[task.status] || task.status}</Tag>
            {task.dueDate && <Tag color="#fff" bg="rgba(217,119,6,.45)">Срок: {task.dueDate}</Tag>}
          </div>
          <h1 style={{ margin:'0 0 8px', fontSize:26 }}>Задание на проработку ТТК</h1>
          <div style={{ color:'#cbd5e1', fontSize:14 }}>{task.dishName}</div>
        </div>

        <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div><div style={{ fontSize:13, fontWeight:900, color:'#0f172a', marginBottom:8 }}>Что нужно сделать</div><div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{task.checks?.map(check => <Tag key={check} xs color="#d97706">{check}</Tag>)}</div></div>
            <div><div style={{ fontSize:13, fontWeight:900, color:'#0f172a', marginBottom:8 }}>Комментарий бренд-шефа</div><div style={{ background:'#f8fafc', borderRadius:10, padding:12, fontSize:13, color:'#334155' }}>{task.comment || '—'}</div></div>
          </div>
          <div style={{ fontSize:13, fontWeight:900, color:'#0f172a', margin:'14px 0 8px' }}>Требуемые материалы</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>{REQUIRED_MATERIALS.filter(item => task.requiredMaterials?.includes(item.id)).map(item => <Tag key={item.id} xs color="#7c3aed">{item.label}</Tag>)}</div>
        </div>

        <ReferenceBlock dish={task.referenceDish} />

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:12 }}>
          <UploadField label="Фото готового блюда (jpg/png/webp)" accept="image/jpeg,image/png,image/webp" allowedTypes={IMAGE_TYPES} file={form.dishPhoto} onChange={value => update('dishPhoto', value)} />
          <UploadField label="Фото полуфабриката (jpg/png/webp)" accept="image/jpeg,image/png,image/webp" allowedTypes={IMAGE_TYPES} file={form.pfPhoto} onChange={value => update('pfPhoto', value)} />
          <UploadField label="Файл ТТК PDF" accept="application/pdf,.pdf" allowedTypes={PDF_TYPES} file={form.pdfTtk} onChange={value => update('pdfTtk', value)} />
          <UploadField label="Файл ТТК XLSX/XLS" accept=".xlsx,.xls" allowedTypes={XLS_TYPES} file={form.xlsxTtk} onChange={value => update('xlsxTtk', value)} />
        </div>

        <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18, display:'grid', gridTemplateColumns:'220px 1fr', gap:12 }}>
          <div><label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', marginBottom:6 }}>Фактический выход</label><input value={form.actualOutput} onChange={e => update('actualOutput', e.target.value)} placeholder="Например: 250 г" style={{ ...SEL_ST, width:'100%', boxSizing:'border-box' }} /></div>
          <div><label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', marginBottom:6 }}>Комментарий шеф-повара ресторана</label><textarea value={form.restaurantComment} onChange={e => update('restaurantComment', e.target.value)} rows={4} placeholder="Опишите фактические отличия" style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid #e5e7eb', borderRadius:10, padding:10, fontSize:12 }} /></div>
        </div>

        <button type="submit" style={{ ...SEL_ST, background:'#6366f1', color:'#fff', borderColor:'#6366f1', fontWeight:900, padding:'13px 16px', fontSize:14 }}>Отправить на проверку</button>
      </form>
    </div>
  )
}
