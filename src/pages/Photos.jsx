import { useState, useMemo } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { REST_COLOR, REST_BG, CAT_ICONS, CAT_STATS, PHOTO_SLOTS, SUMMARY } from '../constants.js'

export default function Photos({ dishes }) {
  const [catF, setCatF]   = useState('all')
  const [restF, setRestF] = useState('all')
  const filtered = useMemo(() => {
    let r = dishes
    if (catF !== 'all')  r = r.filter(d => d.category === catF)
    if (restF !== 'all') r = r.filter(d => d.restaurant === restF)
    return r
  }, [dishes, catF, restF])

  return (
    <div>
      <div style={{ background:'linear-gradient(135deg,#fef2f2,#fff7ed)', border:'1px solid #fecaca', borderRadius:14, padding:'18px 22px', marginBottom:20 }}>
        <div style={{ fontSize:13, fontWeight:800, color:'#991b1b', marginBottom:12 }}>📸 Статус фото-базы сети</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[['Нужно фото', SUMMARY.totalTTK, '#ef4444'],['Загружено', 0, '#16a34a'],['На проверке', 0, '#d97706'],['Утверждено', 0, '#0891b2']].map(([l,v,c]) => (
            <div key={l} style={{ background:'#fff', borderRadius:8, padding:'12px', textAlign:'center', border:'1px solid #fecaca' }}>
              <div style={{ fontSize:22, fontWeight:800, color:c }}>{v}</div>
              <div style={{ fontSize:10, color:'#9ca3af', marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background:'#f0f9ff', border:'1px solid #bae6fd', borderRadius:12, padding:'14px 18px', marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#0369a1', marginBottom:8 }}>📋 Требования к фото-съёмке</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
          {PHOTO_SLOTS.map(s => (
            <div key={s.id} style={{ background:'#fff', borderRadius:8, padding:'10px', textAlign:'center', border:'1px solid #bae6fd' }}>
              <div style={{ fontSize:20 }}>{s.icon}</div>
              <div style={{ fontSize:10, fontWeight:700, color:'#0369a1', marginTop:4 }}>Фото {s.id}</div>
              <div style={{ fontSize:10, color:'#64748b', marginTop:2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
        <select value={catF} onChange={e => setCatF(e.target.value)} style={SEL_ST}>
          <option value="all">Все категории</option>
          {Object.entries(CAT_STATS).sort((a,b)=>b[1].total-a[1].total).map(([c])=><option key={c} value={c}>{CAT_ICONS[c]} {c}</option>)}
        </select>
        <select value={restF} onChange={e => setRestF(e.target.value)} style={SEL_ST}>
          <option value="all">Все рестораны</option>
          {['РОСТОВ','САХАЛИН','СОЧИ'].map(r=><option key={r} value={r}>{r}</option>)}
        </select>
        <div style={{ marginLeft:'auto', fontSize:12, color:'#9ca3af' }}>Показано: {filtered.length} блюд</div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:10 }}>
        {filtered.slice(0, 120).map(d => (
          <div key={d.id} style={{ background:'#fff', borderRadius:12, border:'1px solid #e8ecf0', overflow:'hidden' }}>
            <div style={{ background:'#f3f4f6', height:90, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:5, borderBottom:'1px solid #e8ecf0' }}>
              <div style={{ fontSize:28 }}>📷</div>
              <div style={{ fontSize:9.5, color:'#9ca3af' }}>5 ракурсов · нет фото</div>
            </div>
            <div style={{ padding:'9px 11px' }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:'#0f172a', marginBottom:5, lineHeight:1.25, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{d.name}</div>
              <div style={{ display:'flex', gap:4, marginBottom:6 }}>
                <Tag color={REST_COLOR[d.restaurant]} bg={REST_BG[d.restaurant]} xs>{d.restaurant}</Tag>
                <Tag color="#374151" bg="#f3f4f6" xs>{CAT_ICONS[d.category]}</Tag>
              </div>
              <div style={{ display:'flex', gap:3 }}>
                {PHOTO_SLOTS.map(s => (
                  <div key={s.id} title={s.desc} style={{ flex:1, height:18, background:'#f3f4f6', borderRadius:3, border:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9 }}>
                    {s.icon}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {filtered.length > 120 && <div style={{ padding:'20px', fontSize:12, color:'#9ca3af', textAlign:'center', gridColumn:'1/-1' }}>… ещё {filtered.length - 120} блюд</div>}
      </div>
    </div>
  )
}
