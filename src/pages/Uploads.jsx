import { useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { NETWORK_RESTAURANTS } from '../domain/workflow.js'
import { simulateUploadParsing, uploadStatusLabels } from '../services/standardsService.js'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const TYPES = { dishes:'Блюда', pf:'Полуфабрикаты', full:'Полная выгрузка' }

function formatSize(size) { return `${(size / 1024 / 1024).toFixed(2)} MB` }
function readFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null)
    if (file.size > MAX_FILE_SIZE) return reject(new Error(`Файл больше 10 MB: ${formatSize(file.size)}`))
    const reader = new FileReader()
    reader.onload = () => resolve({ name:file.name, type:file.type, size:file.size, dataUrl:reader.result })
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsDataURL(file)
  })
}

const columns = ['название блюда', 'код', 'категория', 'цех', 'выход', 'полуфабрикаты', 'ингредиенты', 'технология']

export default function Uploads({ uploads = [], addUpload, dishes = [] }) {
  const [mode, setMode] = useState('table')
  const [restaurant, setRestaurant] = useState('Петровка')
  const [uploadType, setUploadType] = useState('dishes')
  const [comment, setComment] = useState('')
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [last, setLast] = useState(null)

  async function handleFile(selected) {
    setError('')
    try {
      const ext = selected?.name.split('.').pop()?.toLowerCase()
      const ok = mode === 'pdf' ? ext === 'pdf' : ['xlsx','xls','csv'].includes(ext)
      if (!ok) throw new Error(mode === 'pdf' ? 'Нужен PDF-файл' : 'Нужен XLSX/XLS/CSV-файл')
      setFile(await readFile(selected))
    } catch (err) { setError(err.message) }
  }

  async function chooseFile(e) {
    await handleFile(e.target.files?.[0])
  }

  function submit(e) {
    e.preventDefault()
    if (!file) return setError('Выберите файл')
    const parsed = simulateUploadParsing({ file, mode, restaurant, dishes })
    const record = addUpload({ mode, restaurant, uploadType, comment, file, mapping: mode === 'table' ? columns : [], ...parsed })
    setLast(record)
    setFile(null)
    setComment('')
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}>
        <h2 style={{ margin:'0 0 8px', fontSize:22, color:'#0f172a' }}>Загрузки ТТК</h2>
        <div style={{ color:'#64748b', fontSize:13 }}>Перетащите файл в форму или выберите вручную. Архитектура готова к реальному Excel/PDF-парсеру и Supabase Storage.</div>
      </div>
      <form onSubmit={submit} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]) }} style={{ background:'#fff', border:'1px dashed #cbd5e1', borderRadius:14, padding:18, display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:12, alignItems:'end' }}>
        <div><label style={{ fontSize:11, fontWeight:900, color:'#475569' }}>Режим</label><select value={mode} onChange={e => { setMode(e.target.value); setFile(null) }} style={{ ...SEL_ST, width:'100%', marginTop:6 }}><option value="table">Таблица XLSX/XLS/CSV</option><option value="pdf">PDF</option></select></div>
        <div><label style={{ fontSize:11, fontWeight:900, color:'#475569' }}>Ресторан</label><select value={restaurant} onChange={e => setRestaurant(e.target.value)} style={{ ...SEL_ST, width:'100%', marginTop:6 }}>{NETWORK_RESTAURANTS.map(item => <option key={item} value={item}>{item}</option>)}</select></div>
        {mode === 'table' && <div><label style={{ fontSize:11, fontWeight:900, color:'#475569' }}>Тип загрузки</label><select value={uploadType} onChange={e => setUploadType(e.target.value)} style={{ ...SEL_ST, width:'100%', marginTop:6 }}>{Object.entries(TYPES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></div>}
        <div><label style={{ fontSize:11, fontWeight:900, color:'#475569' }}>Файл</label><input type="file" accept={mode === 'pdf' ? '.pdf,application/pdf' : '.xlsx,.xls,.csv'} onChange={chooseFile} style={{ display:'block', marginTop:8, fontSize:12 }} />{file && <div style={{ fontSize:11, color:'#64748b', marginTop:6 }}>{file.name} · {formatSize(file.size)}</div>}</div>
        {mode === 'pdf' && <div><label style={{ fontSize:11, fontWeight:900, color:'#475569' }}>Комментарий</label><input value={comment} onChange={e => setComment(e.target.value)} style={{ ...SEL_ST, width:'100%', marginTop:6, boxSizing:'border-box' }} /></div>}
        <button type="submit" style={{ ...SEL_ST, background:'#6366f1', borderColor:'#6366f1', color:'#fff', fontWeight:900 }}>Загрузить ТТК</button>
        {error && <div style={{ gridColumn:'1 / -1', color:'#ef4444', fontSize:12 }}>{error}</div>}
      </form>
      {last && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:14, padding:14, color:'#166534' }}>Файл “{last.file.name}” загружен. Найдено {last.parseSummary?.found || 0} блюд · совпало {last.parseSummary?.matched || 0} · новых {last.parseSummary?.newItems || 0} · конфликтов {last.parseSummary?.conflicts || 0}. Статус: {uploadStatusLabels[last.status]}.</div>}
      {last?.mode === 'table' && <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:18 }}><div style={{ fontWeight:900, marginBottom:8 }}>Превью первых 20 строк и сопоставление колонок</div><div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}><div>{last.previewRows.map(row => <div key={row} style={{ fontSize:12, color:'#64748b', padding:'4px 0', borderBottom:'1px solid #f1f5f9' }}>{row}</div>)}</div><div>{columns.map(col => <label key={col} style={{ display:'block', fontSize:12, marginBottom:8 }}>{col}<select style={{ ...SEL_ST, width:'100%', marginTop:4 }}><option>Колонка ожидает парсер</option></select></label>)}</div></div></div>}
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, overflow:'hidden' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}><thead style={{ background:'#f8fafc' }}><tr>{['Дата','Ресторан','Тип','Файл','Статус','Действие'].map(h => <th key={h} style={{ textAlign:'left', padding:12 }}>{h}</th>)}</tr></thead><tbody>{uploads.map(item => <tr key={item.id} style={{ borderTop:'1px solid #eef2f7' }}><td style={{ padding:12 }}>{new Date(item.createdAt).toLocaleString('ru-RU')}</td><td style={{ padding:12 }}>{item.restaurant}</td><td style={{ padding:12 }}>{item.mode === 'pdf' ? 'PDF' : TYPES[item.uploadType]}</td><td style={{ padding:12 }}>{item.file.name}</td><td style={{ padding:12 }}><Tag color="#7c3aed">{uploadStatusLabels[item.status]}</Tag></td><td style={{ padding:12 }}><a href={item.file.dataUrl} download={item.file.name} style={{ color:'#2563eb' }}>Скачать</a></td></tr>)}</tbody></table>{uploads.length === 0 && <div style={{ padding:18, color:'#94a3b8' }}>Загрузок пока нет.</div>}</div>
    </div>
  )
}
