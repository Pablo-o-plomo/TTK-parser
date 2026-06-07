import { useState, useMemo } from 'react'
import { Tag, Pill, SEL_ST } from '../components/ui.jsx'
import { Ico } from '../components/icons.jsx'
import { REST_COLOR, REST_BG, SUMMARY } from '../constants.js'

export default function PF({ pf }) {
  const [q, setQ]       = useState('')
  const [restF, setRestF] = useState('all')

  const filtered = useMemo(() => {
    let r = pf
    if (q)            r = r.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
    if (restF !== 'all') r = r.filter(p => p.rests.includes(restF))
    return r
  }, [pf, q, restF])

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
        <Pill icon="📦" v={pf.length}       label="Наименований п/ф"    color="#7c3aed" />
        <Pill icon="🔗" v={SUMMARY.withPF}  label="ТТК используют п/ф" color="#0891b2" />
        <Pill icon="📋" v={SUMMARY.totalTTK} label="Всего ТТК в базе"  color="#6366f1" />
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:14 }}>
        <div style={{ position:'relative', flex:1 }}>
          <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }}>{Ico.search}</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск п/ф..."
            style={{ width:'100%', boxSizing:'border-box', paddingLeft:32, paddingRight:12, paddingTop:9, paddingBottom:9, border:'1.5px solid #e5e7eb', borderRadius:10, fontSize:12.5, outline:'none' }} />
        </div>
        <select value={restF} onChange={e => setRestF(e.target.value)} style={SEL_ST}>
          <option value="all">Все рестораны</option>
          {['РОСТОВ','САХАЛИН','СОЧИ'].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div style={{ fontSize:12, color:'#9ca3af', marginBottom:12 }}>Показано: {filtered.length}</div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.slice(0, 300).map((p, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:10, padding:'11px 15px', border:'1px solid #e8ecf0', display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ fontSize:18 }}>📦</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:'#7c3aed', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
              <div style={{ fontSize:10.5, color:'#9ca3af', marginTop:2 }}>
                Используется в {p.count} блюд · {p.rests.join(', ')}
              </div>
            </div>
            <div style={{ display:'flex', gap:5, flexShrink:0 }}>
              {p.rests.map(r => <Tag key={r} color={REST_COLOR[r]} bg={REST_BG[r]} xs>{r}</Tag>)}
              <Tag color="#7c3aed" bg="#f5f3ff" xs>×{p.count}</Tag>
            </div>
          </div>
        ))}
        {filtered.length > 300 && <div style={{ textAlign:'center', color:'#9ca3af', fontSize:12, padding:12 }}>… ещё {filtered.length - 300}</div>}
      </div>
    </div>
  )
}
