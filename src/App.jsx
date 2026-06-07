import { useMemo, useState } from 'react'
import { Tag } from './components/ui.jsx'
import { createEmptyReferenceTtk, useReferenceTtkStore } from './storage/referenceTtkStore.js'
import { useProductsStore } from './storage/productsStore.js'
import { useSemifinishedStore } from './storage/semifinishedStore.js'
import { makeBackup, normalizeBackup } from './storage/backupStore.js'
import { ReferenceTtkForm, ReferenceTtkList, ReferenceTtkView, openPrintableTtk } from './pages/ReferenceTtk.jsx'
import { CatalogPage } from './pages/Catalogs.jsx'

const NAV_ITEMS = [
  { id: 'products', label: '📦 Товары' },
  { id: 'semifinished', label: '🥣 Полуфабрикаты' },
  { id: 'ttk', label: '🍽 Эталонные ТТК' },
  { id: 'settings', label: '⚙️ Настройки' },
]

function downloadJson(name, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

function Settings({ products, semifinished, referenceTtks, onRestore, onClear }) {
  const [message, setMessage] = useState('')
  const backup = makeBackup({ products, semifinished, referenceTtks })

  async function importBackup(file) {
    if (!file) return
    try {
      const parsed = JSON.parse(await readFileAsText(file))
      onRestore(normalizeBackup(parsed))
      setMessage('База восстановлена из JSON')
    } catch {
      setMessage('Не удалось восстановить базу. Проверьте JSON-файл резервной копии.')
    }
  }

  return (
    <div style={{ display:'grid', gap:16, maxWidth:920 }}>
      <section style={CARD}>
        <h1 style={{ margin:'0 0 8px' }}>⚙️ Настройки</h1>
        <p style={{ color:'#64748b', lineHeight:1.6 }}>
          “База знаний ТТК” — автономный интерфейс для создания, хранения, редактирования, печати и экспорта эталонных технологических карт. Backend, Supabase, CRM и задания не используются.
        </p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Tag color="#6366f1" bg="#eef2ff">localStorage</Tag>
          <Tag color="#16a34a" bg="#f0fdf4">Печать A4</Tag>
          <Tag color="#d97706" bg="#fffbeb">Резервная копия JSON</Tag>
        </div>
      </section>
      <section style={CARD}>
        <h2 style={{ marginTop:0 }}>Резервное копирование</h2>
        <p style={{ color:'#64748b' }}>Экспорт включает products, semifinished, referenceTtks, exportedAt и version. Импорт полностью восстанавливает базу.</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => downloadJson('klevo-ttk-backup.json', backup)} style={BTN}>Скачать всю базу JSON</button>
          <label style={BTN}>Загрузить базу JSON<input type="file" accept=".json,application/json" onChange={e => importBackup(e.target.files?.[0])} style={{ display:'none' }} /></label>
          <button onClick={onClear} style={{ ...BTN, color:'#dc2626', borderColor:'#fecaca' }}>Очистить базу</button>
        </div>
        {message && <div style={{ marginTop:12, color:'#475569' }}>{message}</div>}
      </section>
    </div>
  )
}

export default function App() {
  const [section, setSection] = useState('ttk')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const { items: referenceTtks, saveTtk, deleteTtk, duplicateTtk, replaceItems: replaceReferenceTtks } = useReferenceTtkStore()
  const { items: products, saveItem: saveProduct, deleteItem: deleteProduct, importItems: importProducts, replaceItems: replaceProducts } = useProductsStore()
  const { items: semifinished, saveItem: saveSemifinished, deleteItem: deleteSemifinished, importItems: importSemifinished, replaceItems: replaceSemifinished } = useSemifinishedStore()
  const nomenclature = useMemo(() => [...products.map(item => ({ ...item, type: 'product' })), ...semifinished], [products, semifinished])
  const selected = useMemo(() => referenceTtks.find(item => item.id === selectedId), [referenceTtks, selectedId])
  const pageTitle = NAV_ITEMS.find(item => item.id === section)?.label || '🍽 Эталонные ТТК'

  function openTtk(item) {
    setSelectedId(item.id)
    setEditing(null)
    setSection('ttk-view')
  }

  function createTtk() {
    setEditing(createEmptyReferenceTtk())
    setSection('ttk-create')
  }

  function saveReferenceTtk(form) {
    const saved = saveTtk(form)
    setSelectedId(saved.id)
    setEditing(null)
    setSection('ttk-view')
  }

  function restoreBackup(payload) {
    replaceProducts(payload.products)
    replaceSemifinished(payload.semifinished)
    replaceReferenceTtks(payload.referenceTtks)
    setSelectedId(null)
    setEditing(null)
    setSection('ttk')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <aside style={{ width:240, background:'#0f172a', color:'#fff', display:'flex', flexDirection:'column' }}>
        <div style={{ padding:22, borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize:22, fontWeight:900 }}>📚 База знаний ТТК</div>
          <div style={{ marginTop:6, color:'#94a3b8', fontSize:12 }}>КЛЁВО · эталонные карты</div>
        </div>
        <nav style={{ padding:10, flex:1 }}>
          {NAV_ITEMS.map(item => {
            const active = section === item.id || (item.id === 'ttk' && ['ttk-view', 'ttk-create'].includes(section))
            return <button key={item.id} onClick={() => setSection(item.id)} style={{ ...NAV_BTN, background: active ? '#6366f1' : 'transparent', color: active ? '#fff' : '#cbd5e1', fontWeight: active ? 800 : 600 }}>{item.label}</button>
          })}
        </nav>
        <div style={{ padding:16, borderTop:'1px solid rgba(255,255,255,.08)', color:'#94a3b8', fontSize:12, lineHeight:1.7 }}>
          {products.length} товаров<br />{semifinished.length} полуфабрикатов<br />{referenceTtks.length} эталонных ТТК
        </div>
      </aside>
      <main style={{ flex:1, minWidth:0 }}>
        <header style={{ position:'sticky', top:0, zIndex:10, background:'#fff', borderBottom:'1px solid #e8ecf0', padding:'16px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:18, fontWeight:900 }}>{section === 'ttk-view' ? selected?.title || 'Карточка ТТК' : pageTitle}</div>
          <Tag color="#6366f1" bg="#eef2ff">Импорт → Создание ТТК → Печать</Tag>
        </header>
        <div style={{ padding:28 }}>
          {section === 'products' && <CatalogPage mode="products" items={products} products={products} onSave={saveProduct} onDelete={deleteProduct} onImport={importProducts} />}
          {section === 'semifinished' && <CatalogPage mode="semifinished" items={semifinished} products={products} onSave={saveSemifinished} onDelete={deleteSemifinished} onImport={importSemifinished} />}
          {section === 'ttk' && <ReferenceTtkList items={referenceTtks} onOpen={openTtk} onEdit={item => { setEditing(item); setSection('ttk-create') }} onCreate={createTtk} onDelete={deleteTtk} onPrint={openPrintableTtk} />}
          {section === 'ttk-create' && <ReferenceTtkForm initial={editing} nomenclature={nomenclature} onCancel={() => setSection('ttk')} onSave={saveReferenceTtk} />}
          {section === 'ttk-view' && selected && <ReferenceTtkView ttk={selected} onBack={() => setSection('ttk')} onEdit={() => { setEditing(selected); setSection('ttk-create') }} onDuplicate={() => openTtk(duplicateTtk(selected.id))} onDelete={() => { deleteTtk(selected.id); setSection('ttk') }} />}
          {section === 'settings' && <Settings products={products} semifinished={semifinished} referenceTtks={referenceTtks} onRestore={restoreBackup} onClear={() => restoreBackup({ products: [], semifinished: [], referenceTtks: [] })} />}
        </div>
      </main>
    </div>
  )
}

const CARD = { background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:24 }
const BTN = { padding:'10px 14px', borderRadius:10, border:'1px solid #cbd5e1', background:'#fff', cursor:'pointer', fontWeight:800 }
const NAV_BTN = { width:'100%', display:'block', padding:'12px 14px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:4, textAlign:'left', fontSize:14 }
