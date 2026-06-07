import { useMemo, useState } from 'react'
import { Tag } from './components/ui.jsx'
import { BookIcon, ClipIcon, GraduationIcon } from './components/icons.jsx'
import { createEmptyReferenceTtk, useReferenceTtkStore } from './hooks/useReferenceTtk.js'
import { ReferenceTtkForm, ReferenceTtkList, ReferenceTtkView } from './pages/ReferenceTtk.jsx'

const NAV_ITEMS = [
  { id: 'list', label: 'Эталонные ТТК', icon: BookIcon },
  { id: 'create', label: 'Создать ТТК', icon: ClipIcon },
  { id: 'settings', label: 'Настройки', icon: GraduationIcon },
]

function SafeIcon({ icon: Icon }) {
  return typeof Icon === 'function' ? <Icon /> : null
}

function downloadJson(item) {
  const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${item.title || 'reference-ttk'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function Settings() {
  return (
    <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:24, maxWidth:760 }}>
      <h1 style={{ margin:'0 0 8px', color:'#0f172a' }}>Настройки</h1>
      <p style={{ color:'#64748b', lineHeight:1.6 }}>
        Данные коротких эталонных ТТК временно хранятся в localStorage браузера. Заполните название, выход, строки таблицы, добавьте фото блюда и распечатайте одну страницу A4.
      </p>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
        <Tag color="#6366f1" bg="#eef2ff">Одна ТТК = одна страница</Tag>
        <Tag color="#16a34a" bg="#f0fdf4">Без CRM и заданий</Tag>
        <Tag color="#d97706" bg="#fffbeb">Печать / PDF через браузер</Tag>
      </div>
    </div>
  )
}

export default function App() {
  const [section, setSection] = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const { items, saveTtk, deleteTtk, duplicateTtk } = useReferenceTtkStore()

  const selected = useMemo(() => items.find(item => item.id === selectedId), [items, selectedId])
  const pageTitle = NAV_ITEMS.find(item => item.id === section)?.label || 'Эталонные ТТК'

  function openItem(item) {
    setSelectedId(item.id)
    setEditing(null)
    setSection('view')
  }

  function editItem(item) {
    setEditing(item)
    setSection('create')
  }

  function createItem() {
    setEditing(createEmptyReferenceTtk())
    setSection('create')
  }

  function handleSave(form) {
    const saved = saveTtk(form)
    setSelectedId(saved.id)
    setEditing(null)
    setSection('view')
  }

  function handleDuplicate() {
    const copy = duplicateTtk(selected?.id)
    if (copy) openItem(copy)
  }

  function handleDelete() {
    if (!selected) return
    deleteTtk(selected.id)
    setSelectedId(null)
    setSection('list')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <aside style={{ width:236, background:'#0f172a', color:'#fff', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize:22, fontWeight:900, letterSpacing:-.5 }}>Академия Клёво</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:6, lineHeight:1.5 }}>Короткая печатная ТТК A4</div>
        </div>
        <nav style={{ padding:10, flex:1 }}>
          {NAV_ITEMS.map(item => {
            const active = section === item.id || (item.id === 'list' && section === 'view')
            return (
              <button key={item.id} onClick={() => item.id === 'create' ? createItem() : setSection(item.id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', borderRadius:10,
                border:'none', cursor:'pointer', marginBottom:4, textAlign:'left', background:active ? '#6366f1' : 'transparent',
                color:active ? '#fff' : '#cbd5e1', fontWeight:active ? 800 : 600, fontSize:13,
              }}>
                <SafeIcon icon={item.icon} />
                {item.label}
              </button>
            )
          })}
        </nav>
        <div style={{ padding:16, borderTop:'1px solid rgba(255,255,255,.08)', color:'#64748b', fontSize:11, lineHeight:1.6 }}>
          {items.length} эталонных ТТК<br />localStorage · без backend
        </div>
      </aside>

      <main style={{ flex:1, minWidth:0 }}>
        <header style={{ position:'sticky', top:0, zIndex:50, background:'#fff', borderBottom:'1px solid #e8ecf0', padding:'16px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:17, fontWeight:900, color:'#0f172a' }}>{section === 'view' ? selected?.title || 'Карточка ТТК' : pageTitle}</div>
          <Tag color="#6366f1" bg="#eef2ff">Создал → заполнил строки → добавил фото → распечатал</Tag>
        </header>
        <div style={{ padding:28 }}>
          {section === 'list' && <ReferenceTtkList items={items} onOpen={openItem} onEdit={editItem} onCreate={createItem} onDownload={downloadJson} />}
          {section === 'create' && <ReferenceTtkForm initial={editing} onCancel={() => setSection('list')} onSave={handleSave} />}
          {section === 'view' && selected && <ReferenceTtkView ttk={selected} onBack={() => setSection('list')} onEdit={() => editItem(selected)} onDuplicate={handleDuplicate} onDelete={handleDelete} />}
          {section === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  )
}
