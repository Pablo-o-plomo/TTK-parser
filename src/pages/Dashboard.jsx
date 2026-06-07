import { Pill, Tag } from '../components/ui.jsx'
import { SUMMARY, CAT_STATS, CAT_ICONS, STA_STATS, STA_ICONS, REST_COLOR, REST_BG } from '../constants.js'

export default function Dashboard({ dishes, pf, go }) {
  const topCats = Object.entries(CAT_STATS).sort((a,b) => b[1].total - a[1].total).slice(0, 9)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)', borderRadius:18, padding:'32px 36px', color:'#fff', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-30, width:220, height:220, background:'radial-gradient(circle,#6366f1,transparent 70%)', opacity:.25 }} />
        <div style={{ position:'absolute', bottom:-30, left:80, width:160, height:160, background:'radial-gradient(circle,#0891b2,transparent 70%)', opacity:.2 }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:9, letterSpacing:3, color:'#6366f1', textTransform:'uppercase', fontWeight:700, marginBottom:10 }}>База знаний ресторанной сети</div>
          <h2 style={{ margin:'0 0 10px', fontSize:30, fontWeight:900, letterSpacing:-1 }}>Академия Клёво</h2>
          <p style={{ margin:'0 0 22px', color:'#94a3b8', fontSize:13.5, maxWidth:480, lineHeight:1.6 }}>
            Единая платформа стандартизации рецептур, аудита технологических карт и контроля качества. База {SUMMARY.totalTTK} ТТК по трём ресторанам.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {Object.entries(SUMMARY.restaurants).map(([r, cnt]) => (
              <div key={r} style={{ background:'rgba(255,255,255,.08)', borderRadius:10, padding:'10px 16px', border:`1px solid ${REST_COLOR[r]}44` }}>
                <div style={{ fontSize:20, fontWeight:800, color:REST_COLOR[r] }}>{cnt}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>ТТК · {r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
        <Pill icon="📋" v={SUMMARY.totalTTK}     label="Всего ТТК"         color="#6366f1" />
        <Pill icon="🔖" v={SUMMARY.uniqueDishes} label="Уникальных блюд"   color="#0891b2" />
        <Pill icon="✅" v={SUMMARY.cleanTTK}     label="Чистых ТТК"        color="#16a34a" />
        <Pill icon="⚠️" v={SUMMARY.withErrors}   label="Требуют проверки"  color="#ef4444" />
        <Pill icon="↔️" v={SUMMARY.sharedDishes} label="Кросс-сеть"        color="#7c3aed" />
        <Pill icon="📦" v={pf.length}            label="Наим. п/ф"          color="#d97706" />
      </div>

      {/* Two-column */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16 }}>
        <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:'20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:14 }}>📂 По категориям</div>
          {topCats.map(([cat, v]) => (
            <div key={cat} style={{ marginBottom:9 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, color:'#374151' }}>{CAT_ICONS[cat]} {cat}</span>
                <span style={{ fontSize:11, color:'#9ca3af' }}>{v.total} · <span style={{ color:'#ef4444' }}>⚠{v.errors}</span></span>
              </div>
              <div style={{ background:'#f3f4f6', borderRadius:4, height:7, overflow:'hidden' }}>
                <div style={{
                  height:'100%',
                  background:`linear-gradient(90deg,#6366f1 ${((v.total-v.errors)/v.total*100).toFixed(0)}%,#ef4444 0%)`,
                  width:`${Math.min((v.total/SUMMARY.totalTTK*100*3), 100).toFixed(0)}%`,
                }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:'20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:14 }}>🔥 По станциям</div>
          {Object.entries(STA_STATS).map(([sta, v]) => (
            <div key={sta} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #f5f5f5' }}>
              <div style={{ fontSize:17, width:22 }}>{STA_ICONS[sta]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, fontWeight:600, color:'#374151' }}>{sta}</div>
                {v.errors > 0 && <div style={{ fontSize:10, color:'#ef4444' }}>⚠ {v.errors} с ошибками</div>}
              </div>
              <div style={{ fontSize:15, fontWeight:800, color:'#6366f1' }}>{v.total}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:'20px' }}>
        <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:14 }}>🚀 Перейти в раздел</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(185px,1fr))', gap:9 }}>
          {[
            { l:'Все ТТК',        i:'📋', s:'dishes',      c:'#6366f1' },
            { l:'Аудит ошибок',   i:'⚠️', s:'audit',       c:'#ef4444' },
            { l:'Список п/ф',     i:'📦', s:'pf',          c:'#7c3aed' },
            { l:'Станции',        i:'🔥', s:'stations',    c:'#0891b2' },
            { l:'Фото-эталоны',   i:'📸', s:'photos',      c:'#d97706' },
            { l:'Аттестация',     i:'🎓', s:'attestation', c:'#16a34a' },
          ].map(a => (
            <button key={a.l} onClick={() => go(a.s)} style={{
              display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
              borderRadius:10, border:`1.5px solid ${a.c}22`, background:`${a.c}09`,
              color:a.c, cursor:'pointer', fontSize:12, fontWeight:600, transition:'all .12s',
            }}
            onMouseEnter={e => e.currentTarget.style.background=`${a.c}18`}
            onMouseLeave={e => e.currentTarget.style.background=`${a.c}09`}
            >
              <span style={{ fontSize:18 }}>{a.i}</span> {a.l}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
