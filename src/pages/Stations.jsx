import { useState, useMemo } from 'react'
import { Tag } from '../components/ui.jsx'
import { REST_COLOR, REST_BG, CAT_ICONS, STA_ICONS, STA_STATS } from '../constants.js'

export default function Stations({ dishes }) {
  const [sel, setSel] = useState('Горячий цех')
  const staDishes = useMemo(() => dishes.filter(d => d.station === sel), [dishes, sel])
  const catBreak = useMemo(() => {
    const m = {}
    staDishes.forEach(d => { m[d.category] = (m[d.category] || 0) + 1 })
    return Object.entries(m).sort((a,b) => b[1] - a[1])
  }, [staDishes])

  return (
    <div>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:20 }}>
        {Object.entries(STA_STATS).map(([s, v]) => (
          <button key={s} onClick={() => setSel(s)} style={{
            padding:'10px 16px', borderRadius:10,
            border:`2px solid ${sel===s ? '#0891b2' : '#e5e7eb'}`,
            background: sel===s ? '#e0f2fe' : '#fff', cursor:'pointer',
            fontSize:12, fontWeight: sel===s ? 700 : 500,
            color: sel===s ? '#0369a1' : '#374151', transition:'all .12s',
          }}>
            {STA_ICONS[s]} {s} <span style={{ opacity:.6 }}>({v.total})</span>
            {v.errors > 0 && <span style={{ color:'#ef4444', marginLeft:4 }}>⚠{v.errors}</span>}
          </button>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          ['Всего ТТК',   staDishes.length,                        '#0891b2'],
          ['С ошибками',  staDishes.filter(d=>d.hasErrors).length, '#ef4444'],
          ['С п/ф',       staDishes.filter(d=>d.pfCount>0).length, '#7c3aed'],
          ['Кросс-сеть',  staDishes.filter(d=>d.isShared).length,  '#6366f1'],
        ].map(([l,v,c]) => (
          <div key={l} style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'14px', textAlign:'center' }}>
            <div style={{ fontSize:26, fontWeight:800, color:c }}>{v}</div>
            <div style={{ fontSize:10.5, color:'#9ca3af' }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10 }}>Блюда на станции</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:7 }}>
            {staDishes.slice(0, 100).map(d => (
              <div key={d.id} style={{ background:'#fff', borderRadius:8, padding:'9px 12px', border:`1px solid ${d.hasErrors ? '#fecaca' : '#e8ecf0'}`, fontSize:11.5 }}>
                <div style={{ fontWeight:700, color:'#0f172a', marginBottom:4, lineHeight:1.25 }}>{d.name}</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  <Tag color={REST_COLOR[d.restaurant]} bg={REST_BG[d.restaurant]} xs>{d.restaurant}</Tag>
                  {d.hasErrors && <Tag color="#ef4444" bg="#fef2f2" xs>⚠</Tag>}
                  {d.pfCount > 0 && <Tag color="#7c3aed" bg="#f5f3ff" xs>📦{d.pfCount}</Tag>}
                </div>
              </div>
            ))}
            {staDishes.length > 100 && <div style={{ padding:'10px', fontSize:11, color:'#9ca3af' }}>… ещё {staDishes.length - 100} блюд</div>}
          </div>
        </div>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:10 }}>По категориям</div>
          {catBreak.map(([c, cnt]) => (
            <div key={c} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
              <div style={{ fontSize:16 }}>{CAT_ICONS[c]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'#374151', fontWeight:600 }}>{c}</div>
                <div style={{ background:'#f0f0f0', borderRadius:4, height:5, marginTop:3, overflow:'hidden' }}>
                  <div style={{ height:'100%', background:'#0891b2', width:`${(cnt/staDishes.length*100).toFixed(0)}%` }} />
                </div>
              </div>
              <div style={{ fontSize:11, fontWeight:700, color:'#0891b2' }}>{cnt}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
