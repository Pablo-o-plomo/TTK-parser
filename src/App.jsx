import { useMemo, useState } from 'react'
import { Tag } from './components/ui.jsx'
import { BookIcon, BowlIcon, ClipIcon, GraduationIcon } from './components/icons.jsx'
import { createEmptyReferenceTtk, useReferenceTtkStore } from './storage/referenceTtkStore.js'
import { useProductsStore } from './storage/productsStore.js'
import { useSemifinishedStore } from './storage/semifinishedStore.js'
import { makeBackup, normalizeBackup } from './storage/backupStore.js'
import { ReferenceTtkForm, ReferenceTtkList, ReferenceTtkView } from './pages/ReferenceTtk.jsx'
import { CatalogPage } from './pages/Catalogs.jsx'

const NAV_ITEMS = [
  { id: 'products', label: '📦 Товары', icon: ClipIcon },
  { id: 'semifinished', label: '🥣 Полуфабрикаты', icon: BowlIcon },
  { id: 'ttk', label: '🍽 Эталонные ТТК', icon: BookIcon },
  { id: 'settings', label: '⚙ Настройки', icon: GraduationIcon },
]

function SafeIcon({ icon: Icon }) {
  return typeof Icon === 'function' ? <Icon /> : null
}

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
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:920 }}>
      <section style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:24 }}>
        <h1 style={{ margin:'0 0 8px', color:'#0f172a' }}>Настройки</h1>
        <p style={{ color:'#64748b', lineHeight:1.6 }}>
          КЛЁВО — цифровая библиотека эталонных технологических карт. Здесь нет CRM, аудита, заданий и сравнения ресторанов — только товары, полуфабрикаты и эталонные ТТК.
        </p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:12 }}>
          <Tag color="#6366f1" bg="#eef2ff">localStorage</Tag>
          <Tag color="#16a34a" bg="#f0fdf4">Печать A4</Tag>
          <Tag color="#d97706" bg="#fffbeb">Резервная копия JSON</Tag>
        </div>
      </section>
      <section style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:16, padding:24 }}>
        <h2 style={{ marginTop:0 }}>Резервное копирование</h2>
        <p style={{ color:'#64748b' }}>Экспортируйте всю базу в один JSON-файл и импортируйте его для полного восстановления товаров, полуфабрикатов и эталонных ТТК.</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={() => downloadJson('klevo-ttk-backup.json', backup)} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #cbd5e1', background:'#fff', cursor:'pointer', fontWeight:800 }}>Скачать всю базу JSON</button>
          <label style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #cbd5e1', background:'#fff', cursor:'pointer', fontWeight:800 }}>Загрузить базу JSON<input type="file" accept=".json,application/json" onChange={e => importBackup(e.target.files?.[0])} style={{ display:'none' }} /></label>
        <button onClick={onClear} style={{ padding:'10px 14px', borderRadius:10, border:'1px solid #fecaca', color:'#dc2626', background:'#fff', cursor:'pointer', fontWeight:800 }}>Очистить базу</button></div>
        {message && <div style={{ marginTop:12, color:'#475569' }}>{message}</div>}
      </section>
    </div>
  )
}

export default function App() {
  const [section, setSection] = useState('ttk')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const { items, saveTtk, deleteTtk, duplicateTtk, replaceItems: replaceTtkItems } = useReferenceTtkStore()
  const { items: products, saveItem: saveProduct, deleteItem: deleteProduct, importItems: importProducts, replaceItems: replaceProducts } = useProductsStore()
  const { items: semifinished, saveItem: saveSemifinished, deleteItem: deleteSemifinished, importItems: importSemifinished, replaceItems: replaceSemifinished } = useSemifinishedStore()
  const nomenclature = useMemo(() => [...products.map(item => ({ ...item, type: 'product' })), ...semifinished], [products, semifinished])

  const selected = useMemo(() => items.find(item => item.id === selectedId), [items, selectedId])
  const pageTitle = NAV_ITEMS.find(item => item.id === section)?.label || '🍽 Эталонные ТТК'

  function openItem(item) {
    setSelectedId(item.id)
    setEditing(null)
    setSection('ttk-view')
  }

  function editItem(item) {
    setEditing(item)
    setSection('ttk-create')
  }

  function createItem() {
    setEditing(createEmptyReferenceTtk())
    setSection('ttk-create')
  }

  function handleSave(form) {
    const saved = saveTtk(form)
    setSelectedId(saved.id)
    setEditing(null)
    setSection('ttk-view')
  }

  function handleDuplicate() {
    const copy = duplicateTtk(selected?.id)
    if (copy) openItem(copy)
  }

  function handleDelete() {
    if (!selected) return
    deleteTtk(selected.id)
    setSelectedId(null)
    setSection('ttk')
  }

  function restoreBackup(payload) {
    replaceTtkItems(payload.referenceTtks)
    replaceProducts(payload.products)
    replaceSemifinished(payload.semifinished)
    setSelectedId(null)
    setEditing(null)
    setSection('ttk')
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>
      <aside style={{ width:236, background:'#0f172a', color:'#fff', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'24px 20px', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize:22, fontWeight:900, letterSpacing:-.5 }}>КЛЁВО</div>
          <div style={{ fontSize:11, color:'#94a3b8', marginTop:6, lineHeight:1.5 }}>Конструктор эталонных ТТК</div>
        </div>
        <nav style={{ padding:10, flex:1 }}>
          {NAV_ITEMS.map(item => {
            const active = section === item.id || (item.id === 'ttk' && ['ttk-view', 'ttk-create'].includes(section))
            return (
              <button key={item.id} onClick={() => setSection(item.id)} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'11px 12px', borderRadius:10, border:'none', cursor:'pointer', marginBottom:4, textAlign:'left', background:active ? '#6366f1' : 'transparent', color:active ? '#fff' : '#cbd5e1', fontWeight:active ? 800 : 600, fontSize:13 }}>
                <SafeIcon icon={item.icon} />{item.label}
              </button>
            )
          })}
        </nav>
        <div style={{ padding:16, borderTop:'1px solid rgba(255,255,255,.08)', color:'#64748b', fontSize:11, lineHeight:1.6 }}>
          {items.length} эталонных ТТК<br />{products.length} товаров<br />{semifinished.length} полуфабрикатов
        </div>
      </aside>

      <main style={{ flex:1, minWidth:0 }}>
        <header style={{ position:'sticky', top:0, zIndex:50, background:'#fff', borderBottom:'1px solid #e8ecf0', padding:'16px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ fontSize:17, fontWeight:900, color:'#0f172a' }}>{section === 'ttk-view' ? selected?.title || 'Карточка ТТК' : pageTitle}</div>
          <Tag color="#6366f1" bg="#eef2ff">Импорт справочников → ТТК → Фото → Печать</Tag>
        </header>
        <div style={{ padding:28 }}>
          {section === 'products' && <CatalogPage mode="products" items={products} products={products} onSave={saveProduct} onDelete={deleteProduct} onImport={importProducts} />}
          {section === 'semifinished' && <CatalogPage mode="semifinished" items={semifinished} products={products} onSave={saveSemifinished} onDelete={deleteSemifinished} onImport={importSemifinished} />}
          {section === 'ttk' && <ReferenceTtkList items={items} onOpen={openItem} onEdit={editItem} onCreate={createItem} onDownload={item => downloadJson(`${item.title || 'reference-ttk'}.json`, item)} />}
          {section === 'ttk-create' && <ReferenceTtkForm initial={editing} nomenclature={nomenclature} onCancel={() => setSection('ttk')} onSave={handleSave} />}
          {section === 'ttk-view' && selected && <ReferenceTtkView ttk={selected} onBack={() => setSection('ttk')} onEdit={() => editItem(selected)} onDuplicate={handleDuplicate} onDelete={handleDelete} />}
          {section === 'settings' && <Settings products={products} semifinished={semifinished} referenceTtks={items} onRestore={restoreBackup} onClear={() => restoreBackup({ products: [], semifinished: [], referenceTtks: [] })} />}
        </div>
      </main>
    </div>
  )
}
