import { useState, useMemo, useCallback, useEffect } from 'react'
import { Tag, TogBtn, PgBtn, SEL_ST } from '../components/ui.jsx'
import { Ico } from '../components/icons.jsx'
import DishModal from '../components/DishModal.jsx'
import { REST_COLOR, REST_BG, CAT_ICONS, STA_ICONS } from '../constants.js'

const PAGE_SIZE = 60

function DishCard({ d, onClick }) {
  return (
    <div onClick={() => onClick(d)} style={{
      background:'#fff', borderRadius:12, padding:'13px 15px',
      border:`1px solid ${d.hasErrors ? '#fecaca' : '#e8ecf0'}`,
      cursor:'pointer', transition:'all .13s', position:'relative', overflow:'hidden',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,.09)'; e.currentTarget.style.transform='translateY(-1px)' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none' }}
    >
      {d.hasErrors && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'linear-gradient(90deg,#ef4444,#f97316)' }} />}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, marginBottom:7 }}>
        <div style={{ fontSize:12.5, fontWeight:700, color:'#0f172a', lineHeight:1.3, flex:1 }}>{d.name}</div>
        {d.hasErrors && <span style={{ color:'#ef4444', flexShrink:0 }}>{Ico.warn}</span>}
      </div>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:7 }}>
        <Tag color={REST_COLOR[d.restaurant] || '#6366f1'} bg={REST_BG[d.restaurant] || '#eef2ff'} xs>{d.restaurant}</Tag>
        <Tag color="#374151" bg="#f3f4f6" xs>{CAT_ICONS[d.category] || '🍴'} {d.category}</Tag>
        <Tag color="#0891b2" bg="#e0f2fe" xs>{STA_ICONS[d.station] || '🏷️'} {d.station}</Tag>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:10.5, color:'#9ca3af' }}>№{d.ttk} · {d.date}</div>
        <div style={{ fontSize:10.5 }}>
          {d.pfCount > 0 && <span style={{ color:'#7c3aed', marginRight:6 }}>📦{d.pfCount}</span>}
          {d.isShared && <span style={{ color:'#7c3aed', marginRight:6 }}>↔</span>}
          <span style={{ color: d.hasErrors ? '#ef4444' : '#16a34a', fontWeight:600 }}>
            {d.hasErrors ? '⚠ ошибка' : '✓ чистая'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function Dishes({ dishes, selectedRestaurant = 'all' }) {
  const [q, setQ]               = useState('')
  const [cat, setCat]           = useState('all')
  const [rest, setRest]         = useState('all')
  const [sta, setSta]           = useState('all')
  const [errOnly, setErrOnly]   = useState(false)
  const [sharedOnly, setShared] = useState(false)
  const [page, setPage]         = useState(0)
  const [modal, setModal]       = useState(null)
  const reset = useCallback(() => setPage(0), [])

  useEffect(() => {
    setRest('all')
    setPage(0)
  }, [selectedRestaurant])

  const optionStats = useMemo(() => {
    const stats = { restaurants: {}, categories: {}, stations: {} }
    dishes.forEach(d => {
      stats.restaurants[d.restaurant] = (stats.restaurants[d.restaurant] || 0) + 1
      stats.categories[d.category] = (stats.categories[d.category] || 0) + 1
      stats.stations[d.station] = (stats.stations[d.station] || 0) + 1
    })
    return stats
  }, [dishes])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    let r = dishes
    if (query) {
      r = r.filter(d =>
        d.name.toLowerCase().includes(query) ||
        d.ttk.toLowerCase().includes(query) ||
        d.restaurant.toLowerCase().includes(query)
      )
    }
    if (cat !== 'all')  r = r.filter(d => d.category === cat)
    if (rest !== 'all') r = r.filter(d => d.restaurant === rest)
    if (sta !== 'all')  r = r.filter(d => d.station === sta)
    if (errOnly)     r = r.filter(d => d.hasErrors)
    if (sharedOnly)  r = r.filter(d => d.isShared)
    return r
  }, [dishes, q, cat, rest, sta, errOnly, sharedOnly])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div>
      {modal && <DishModal dish={modal} onClose={() => setModal(null)} />}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
        <div style={{ position:'relative', flex:'1 1 220px' }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}>{Ico.search}</span>
          <input value={q} onChange={e => { setQ(e.target.value); reset() }}
            placeholder="Поиск по названию или ТТК №..."
            style={{ width:'100%', boxSizing:'border-box', paddingLeft:32, paddingRight:12, paddingTop:9, paddingBottom:9, border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:12.5, outline:'none' }} />
        </div>
        <select value={cat} onChange={e => { setCat(e.target.value); reset() }} style={SEL_ST}>
          <option value="all">Все категории</option>
          {Object.entries(optionStats.categories).sort((a,b) => b[1] - a[1]).map(([c, total]) =>
            <option key={c} value={c}>{CAT_ICONS[c] || '🍴'} {c} ({total})</option>)}
        </select>
        <select value={rest} onChange={e => { setRest(e.target.value); reset() }} style={SEL_ST}>
          <option value="all">Все рестораны</option>
          {Object.entries(optionStats.restaurants).sort((a,b) => b[1] - a[1]).map(([r, total]) => <option key={r} value={r}>{r} ({total})</option>)}
        </select>
        <select value={sta} onChange={e => { setSta(e.target.value); reset() }} style={SEL_ST}>
          <option value="all">Все станции</option>
          {Object.entries(optionStats.stations).sort((a,b) => b[1] - a[1]).map(([s, total]) => <option key={s} value={s}>{STA_ICONS[s] || '🏷️'} {s} ({total})</option>)}
        </select>
        <TogBtn active={errOnly} onClick={() => { setErrOnly(v => !v); reset() }} color="#ef4444">⚠ Ошибки</TogBtn>
        <TogBtn active={sharedOnly} onClick={() => { setShared(v => !v); reset() }} color="#7c3aed">↔ Кросс-сеть</TogBtn>
      </div>
      <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>
        {selectedRestaurant === 'all' ? 'Все рестораны' : selectedRestaurant}: <strong style={{ color:'#374151' }}>{filtered.length}</strong> из {dishes.length} ТТК
        {totalPages > 1 && ` · стр. ${page + 1} / ${totalPages}`}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:10 }}>
        {paged.map(d => <DishCard key={`${d.restaurant}-${d.id}`} d={d} onClick={setModal} />)}
      </div>
      {totalPages > 1 && (
        <div style={{ display:'flex', justifyContent:'center', gap:6, marginTop:20, flexWrap:'wrap' }}>
          <PgBtn onClick={() => setPage(p => Math.max(0,p-1))} dis={page===0}>← Назад</PgBtn>
          {Array.from({length:Math.min(7,totalPages)},(_,i)=>{
            const t = Math.min(Math.max(page-3,0)+i, totalPages-1)
            return <PgBtn key={t} active={t===page} onClick={() => setPage(t)}>{t+1}</PgBtn>
          })}
          <PgBtn onClick={() => setPage(p => Math.min(totalPages-1,p+1))} dis={page===totalPages-1}>Вперёд →</PgBtn>
        </div>
      )}
    </div>
  )
}
