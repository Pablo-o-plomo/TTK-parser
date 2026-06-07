import { useState } from 'react'
import { ErrorScreen, Tag, SEL_ST } from '../components/ui.jsx'
import { REQUIRED_MATERIALS, STATUS_COLORS, STATUS_LABELS } from '../domain/workflow.js'

function readFile(file) {
  return new Promise(resolve => {
    if (!file) return resolve('')
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })
}

function UploadField({ label, accept, onChange, preview }) {
  return (
    <div style={{ border:'1px solid #e5e7eb', borderRadius:12, padding:12, background:'#fff' }}>
      <div style={{ fontSize:11, fontWeight:800, color:'#475569', marginBottom:8 }}>{label}</div>
      <input type="file" accept={accept} onChange={async e => onChange(await readFile(e.target.files?.[0]))} style={{ fontSize:12 }} />
      {preview && (preview.startsWith('data:image') ? <img src={preview} alt={label} style={{ display:'block', marginTop:10, maxWidth:'100%', maxHeight:160, borderRadius:10 }} /> : <div style={{ fontSize:11, color:'#64748b', marginTop:8, wordBreak:'break-word' }}>Файл загружен</div>)}
    </div>
  )
}

export default function TaskSubmission({ task, submitTask }) {
  const [form, setForm] = useState({ dishPhoto:'', pfPhoto:'', updatedTtkFile:'', actualOutput:'', restaurantComment:'', updatedTtkText:'' })
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
          <p style={{ color:'#64748b', fontSize:14 }}>Статус задания изменён на “На проверке”. Бренд-шеф увидит отправленные фото, выход, комментарии и ТТК в кабинете проверки.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f8fafc', padding:24 }}>
      <form onSubmit={submit} style={{ maxWidth:900, margin:'0 auto', display:'flex', flexDirection:'column', gap:14 }}>
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
          <div style={{ fontSize:13, fontWeight:900, color:'#0f172a', marginBottom:8 }}>Что нужно проверить</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>{task.checks?.map(check => <Tag key={check} xs color="#d97706">{check}</Tag>)}</div>
          <div style={{ fontSize:13, fontWeight:900, color:'#0f172a', marginBottom:8 }}>Комментарий бренд-шефа</div>
          <div style={{ background:'#f8fafc', borderRadius:10, padding:12, fontSize:13, color:'#334155' }}>{task.comment || '—'}</div>
          <div style={{ fontSize:13, fontWeight:900, color:'#0f172a', margin:'14px 0 8px' }}>Требуемые материалы</div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {REQUIRED_MATERIALS.filter(item => task.requiredMaterials?.includes(item.id)).map(item => <Tag key={item.id} xs color="#7c3aed">{item.label}</Tag>)}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>
          <UploadField label="Фото готового блюда" accept="image/*" preview={form.dishPhoto} onChange={value => update('dishPhoto', value)} />
          <UploadField label="Фото полуфабриката" accept="image/*" preview={form.pfPhoto} onChange={value => update('pfPhoto', value)} />
          <UploadField label="Фото/файл обновлённой ТТК" accept="image/*,.pdf,.txt" preview={form.updatedTtkFile} onChange={value => update('updatedTtkFile', value)} />
        </div>

        <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18, display:'grid', gridTemplateColumns:'220px 1fr', gap:12 }}>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', marginBottom:6 }}>Фактический выход</label>
            <input value={form.actualOutput} onChange={e => update('actualOutput', e.target.value)} placeholder="Например: 250 г" style={{ ...SEL_ST, width:'100%', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', marginBottom:6 }}>Комментарий ресторана</label>
            <textarea value={form.restaurantComment} onChange={e => update('restaurantComment', e.target.value)} rows={4} placeholder="Опишите фактические отличия, замену ингредиентов или проблему" style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid #e5e7eb', borderRadius:10, padding:10, fontSize:12 }} />
          </div>
          <div style={{ gridColumn:'1 / -1' }}>
            <label style={{ display:'block', fontSize:11, fontWeight:800, color:'#475569', marginBottom:6 }}>Текст обновлённой ТТК, если файл не приложен</label>
            <textarea value={form.updatedTtkText} onChange={e => update('updatedTtkText', e.target.value)} rows={5} style={{ width:'100%', boxSizing:'border-box', border:'1.5px solid #e5e7eb', borderRadius:10, padding:10, fontSize:12 }} />
          </div>
        </div>

        <button type="submit" style={{ ...SEL_ST, background:'#6366f1', color:'#fff', borderColor:'#6366f1', fontWeight:900, padding:'12px 16px' }}>Отправить бренд-шефу</button>
      </form>
    </div>
  )
}
