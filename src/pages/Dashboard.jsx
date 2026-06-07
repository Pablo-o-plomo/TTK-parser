import { useMemo } from 'react'
import { Pill } from '../components/ui.jsx'
import { CAT_ICONS, STA_ICONS, REST_COLOR } from '../constants.js'
import { APPROVAL_STATUS } from '../domain/workflow.js'

function buildStats(dishes) {
  return dishes.reduce((acc, dish) => {
    acc.restaurants[dish.restaurant] = (acc.restaurants[dish.restaurant] || 0) + 1

    if (!acc.categories[dish.category]) acc.categories[dish.category] = { total: 0, errors: 0 }
    acc.categories[dish.category].total += 1
    if (dish.hasErrors) acc.categories[dish.category].errors += 1

    if (!acc.stations[dish.station]) acc.stations[dish.station] = { total: 0, errors: 0 }
    acc.stations[dish.station].total += 1
    if (dish.hasErrors) acc.stations[dish.station].errors += 1

    if (dish.hasErrors) acc.withErrors += 1
    if (dish.isShared) acc.sharedDishes += 1
    if (!acc.names.has(dish.name)) acc.names.add(dish.name)
    return acc
  }, { restaurants: {}, categories: {}, stations: {}, withErrors: 0, sharedDishes: 0, names: new Set() })
}

export default function Dashboard({ dishes, pf, tasks = [], go }) {
  const stats = useMemo(() => buildStats(dishes), [dishes])
  const topCats = Object.entries(stats.categories).sort((a,b) => b[1].total - a[1].total).slice(0, 9)
  const stations = Object.entries(stats.stations).sort((a,b) => b[1].total - a[1].total)
  const cleanTTK = dishes.length - stats.withErrors
  const waitingTasks = tasks.filter(task => task.status === APPROVAL_STATUS.WAITING_SUBMISSION).length
  const reviewTasks = tasks.filter(task => task.status === APPROVAL_STATUS.SUBMITTED || task.status === APPROVAL_STATUS.IN_REVIEW).length
  const approvedTasks = tasks.filter(task => task.status === APPROVAL_STATUS.APPROVED).length
  const closedTasks = tasks.filter(task => task.status === APPROVAL_STATUS.CLOSED).length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:22 }}>

      {/* Hero */}
      <div style={{ background:'linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)', borderRadius:18, padding:'32px 36px', color:'#fff', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-40, right:-30, width:220, height:220, background:'radial-gradient(circle,#6366f1,transparent 70%)', opacity:.25 }} />
        <div style={{ position:'absolute', bottom:-30, left:80, width:160, height:160, background:'radial-gradient(circle,#0891b2,transparent 70%)', opacity:.2 }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:9, letterSpacing:3, color:'#6366f1', textTransform:'uppercase', fontWeight:700, marginBottom:10 }}>База знаний ресторанной сети</div>
          <h2 style={{ margin:'0 0 10px', fontSize:30, fontWeight:900, letterSpacing:-1 }}>Академия Клёво</h2>
          <p style={{ margin:'0 0 22px', color:'#94a3b8', fontSize:13.5, maxWidth:520, lineHeight:1.6 }}>
            Единая платформа стандартизации рецептур, аудита технологических карт и контроля качества. База {dishes.length} ТТК по выбранным ресторанам.
          </p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
            {Object.entries(stats.restaurants).map(([r, cnt]) => (
              <div key={r} style={{ background:'rgba(255,255,255,.08)', borderRadius:10, padding:'10px 16px', border:`1px solid ${(REST_COLOR[r] || '#6366f1')}44` }}>
                <div style={{ fontSize:20, fontWeight:800, color:REST_COLOR[r] || '#6366f1' }}>{cnt}</div>
                <div style={{ fontSize:11, color:'#94a3b8' }}>ТТК · {r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stat pills */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:10 }}>
        <Pill icon="📋" v={dishes.length}      label="Всего ТТК"         color="#6366f1" />
        <Pill icon="🔖" v={stats.names.size}  label="Уникальных блюд"   color="#0891b2" />
        <Pill icon="✅" v={cleanTTK}           label="Чистых ТТК"        color="#16a34a" />
        <Pill icon="⚠️" v={stats.withErrors}  label="Требуют проверки"  color="#ef4444" />
        <Pill icon="↔️" v={stats.sharedDishes} label="Кросс-сеть"       color="#7c3aed" />
        <Pill icon="📨" v={tasks.length}        label="Заданий отправлено" color="#d97706" />
        <Pill icon="⏳" v={waitingTasks}        label="Ждём ответ"        color="#d97706" />
        <Pill icon="🔎" v={reviewTasks}         label="На проверке"       color="#7c3aed" />
        <Pill icon="✅" v={approvedTasks}       label="Подтверждено"      color="#16a34a" />
        <Pill icon="🏁" v={closedTasks}         label="Закрыто по сети"   color="#0f766e" />
        <Pill icon="📦" v={pf.length}          label="Наим. п/ф"         color="#d97706" />
      </div>

      {/* Two-column */}
      <div style={{ display:'grid', gridTemplateColumns:'3fr 2fr', gap:16 }}>
        <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:'20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:14 }}>📂 По категориям</div>
          {topCats.map(([cat, v]) => (
            <div key={cat} style={{ marginBottom:9 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12, color:'#374151' }}>{CAT_ICONS[cat] || '🍴'} {cat}</span>
                <span style={{ fontSize:11, color:'#9ca3af' }}>{v.total} · <span style={{ color:'#ef4444' }}>⚠{v.errors}</span></span>
              </div>
              <div style={{ background:'#f3f4f6', borderRadius:4, height:7, overflow:'hidden' }}>
                <div style={{
                  height:'100%',
                  background:`linear-gradient(90deg,#6366f1 ${((v.total-v.errors)/v.total*100).toFixed(0)}%,#ef4444 0%)`,
                  width:`${Math.min((v.total / Math.max(dishes.length, 1) * 260), 100).toFixed(0)}%`,
                }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:14, padding:'20px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:14 }}>🔥 По станциям</div>
          {stations.map(([sta, v]) => (
            <div key={sta} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #f5f5f5' }}>
              <div style={{ fontSize:17, width:22 }}>{STA_ICONS[sta] || '🏷️'}</div>
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
            { l:'Сверка ТТК',     i:'⚖️', s:'comparison', c:'#6366f1' },
            { l:'Проверка заданий', i:'🔎', s:'review',      c:'#7c3aed' },
            { l:'Загрузить ТТК',   i:'📤', s:'uploads',     c:'#0891b2' },
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
